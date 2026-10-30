import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { hashPassword, requireAuth, requireRole, AuthRequest, comparePassword } from "../lib/auth";
import { validateFields } from "../lib/validate";

const router = Router();

function safeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...safe } = user;
  return { ...safe, hourlyRate: safe.hourlyRate ? parseFloat(safe.hourlyRate) : null };
}

router.get("/users", requireRole("admin", "manager", "supervisor"), async (req: AuthRequest, res): Promise<void> => {
  let query = db.select().from(usersTable);
  const results = await query;
  let filtered = results;
  if (req.query.role) {
    filtered = filtered.filter(u => u.role === req.query.role);
  }
  if (req.query.search) {
    const s = (req.query.search as string).toLowerCase();
    filtered = filtered.filter(u =>
      u.firstName.toLowerCase().includes(s) ||
      u.lastName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s)
    );
  }
  res.json(filtered.map(safeUser));
});

router.post("/users", requireRole("admin", "manager"), validateFields({ email:"text", password:"text", firstName:"text", lastName:"text", phone:"optionalText", role:"userRole", isSupervisor:"boolean", hourlyRate:"money" }, ["email","password","firstName","lastName","role"]), async (req: AuthRequest, res): Promise<void> => {
  const { password, ...rest } = req.body;
  if (!rest.email || !password || !rest.firstName || !rest.lastName || !rest.role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rest.email)) { res.status(400).json({ error: "Invalid user credentials" }); return; }
  if (req.user!.role !== "admin" && ["admin", "manager"].includes(rest.role)) { res.status(403).json({ error: "Role assignment forbidden" }); return; }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    firstName: rest.firstName, lastName: rest.lastName, phone: rest.phone ?? null,
    role: rest.role, hourlyRate: rest.hourlyRate != null ? String(rest.hourlyRate) : null,
    email: rest.email.toLowerCase(),
    passwordHash,
    isSupervisor: rest.isSupervisor ?? false,
    isActive: true,
  }).returning();
  res.status(201).json(safeUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (!["admin","manager"].includes(req.user!.role) && req.user!.id !== id) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(safeUser(user));
});

router.patch("/users/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (req.user!.id !== id && !["admin", "manager"].includes(req.user!.role)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) { res.status(400).json({ error: "Invalid body" }); return; }
  const { password, ...rest } = req.body;
  if (password !== undefined) { res.status(403).json({ error: "Use authenticated password-change flow" }); return; }
  if (req.user!.role === "manager" && req.user!.id !== id) { res.status(403).json({ error: "Managers cannot modify other users" }); return; }
  const permitted = req.user!.role === "admin" ? ["firstName","lastName","email","phone","role","isActive","isSupervisor","hourlyRate"] : ["firstName","lastName","email","phone"];
  if (Object.keys(rest).some(key => !permitted.includes(key))) { res.status(400).json({ error: "Unauthorized update field" }); return; }
  if (rest.role && !["admin","manager","supervisor","crew","client"].includes(rest.role)) { res.status(400).json({ error: "Invalid role" }); return; }
  if (rest.email && (typeof rest.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rest.email))) { res.status(400).json({ error: "Invalid email" }); return; }
  const updates: Record<string, unknown> = {};
  for (const key of permitted) if (Object.prototype.hasOwnProperty.call(rest, key)) updates[key] = rest[key];
  if (rest.email) updates.email = rest.email.toLowerCase();
  if (rest.hourlyRate !== undefined) updates.hourlyRate = String(rest.hourlyRate);
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(safeUser(user));
});

router.delete("/users/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
});

export default router;
