import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { hashPassword, requireAuth, requireRole, AuthRequest } from "../lib/auth";

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

router.post("/users", requireRole("admin", "manager"), async (req: AuthRequest, res): Promise<void> => {
  const { password, ...rest } = req.body;
  if (!rest.email || !password || !rest.firstName || !rest.lastName || !rest.role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    ...rest,
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
  res.json(safeUser(user));
});

router.patch("/users/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { password, ...rest } = req.body;
  const updates: Record<string, unknown> = { ...rest };
  if (password) updates.passwordHash = await hashPassword(password);
  if (rest.email) updates.email = rest.email.toLowerCase();
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
