import { Router } from "express";
import { db, usersTable, serviceRequestsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router = Router();
const requestTypes = ["installation", "repair", "upgrade", "maintenance", "emergency"] as const;
const optionalKeys = ["gateMaterial", "gateConfiguration", "gateLengthFeet", "gateHeightFeet", "existingOperator"] as const;
const profileKeys = ["firstName", "lastName", "phone", "address", "city", "state", "zip"] as const;
const isText = (v: unknown, max = 500) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const safe = (u: typeof usersTable.$inferSelect) => {
  const { passwordHash: _, hourlyRate: __, ...profile } = u;
  return profile;
};

router.get("/client/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(safe(user));
});

router.patch("/client/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length ||
      Object.keys(body).some(k => !(profileKeys as readonly string[]).includes(k))) {
    res.status(400).json({ error: "Unsupported profile fields" }); return;
  }
  const updates: Record<string, string | null> = {};
  for (const key of profileKeys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = body[key];
    if (value === null && !["firstName", "lastName"].includes(key)) { updates[key] = null; continue; }
    if (typeof value !== "string" || value.length > 250 ||
        (["firstName", "lastName"].includes(key) && !value.trim())) {
      res.status(400).json({ error: "Invalid " + key }); return;
    }
    updates[key] = value.trim();
  }
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id)).returning();
  if (!user) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(safe(user));
});

router.get("/client/service-requests", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db.select().from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.clientId, req.user!.id))
    .orderBy(desc(serviceRequestsTable.createdAt));
  res.json(rows);
});

router.post("/client/service-requests", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const body = req.body;
  const required = ["type", "description", "serviceAddress", "city", "state", "zip"];
  const allowed = [...required, ...optionalKeys];
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some(k => !allowed.includes(k)) ||
      !requestTypes.includes(body.type) ||
      !required.slice(1).every(k => isText(body[k], k === "description" ? 4000 : 250)) ||
      !optionalKeys.every(k => body[k] == null || (typeof body[k] === "string" && body[k].length <= 250))) {
    res.status(400).json({ error: "Invalid service request" }); return;
  }
  const [record] = await db.insert(serviceRequestsTable).values({
    clientId: req.user!.id, type: body.type, description: body.description.trim(),
    serviceAddress: body.serviceAddress.trim(), city: body.city.trim(),
    state: body.state.trim(), zip: body.zip.trim(),
    gateMaterial: body.gateMaterial ?? null, gateConfiguration: body.gateConfiguration ?? null,
    gateLengthFeet: body.gateLengthFeet ?? null, gateHeightFeet: body.gateHeightFeet ?? null,
    existingOperator: body.existingOperator ?? null,
  }).returning();
  res.status(201).json(record);
});

router.get("/client/service-requests/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [record] = await db.select().from(serviceRequestsTable)
    .where(and(eq(serviceRequestsTable.id, id), eq(serviceRequestsTable.clientId, req.user!.id)));
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

export default router;
