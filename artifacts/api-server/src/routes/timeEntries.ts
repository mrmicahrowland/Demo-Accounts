import { Router } from "express";
import { db, timeEntriesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router = Router();

async function enrichEntry(entry: typeof timeEntriesTable.$inferSelect) {
  let userName = null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, entry.userId));
  if (user) userName = `${user.firstName} ${user.lastName}`;
  return {
    ...entry,
    userName,
    hoursWorked: entry.hoursWorked ? parseFloat(entry.hoursWorked) : null,
  };
}

router.get("/time-entries", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const all = await db.select().from(timeEntriesTable).orderBy(desc(timeEntriesTable.createdAt));
  let filtered = all;
  if (req.query.jobId) filtered = filtered.filter(e => e.jobId === parseInt(req.query.jobId as string, 10));
  if (req.query.userId) filtered = filtered.filter(e => e.userId === parseInt(req.query.userId as string, 10));
  if (req.user!.role === "crew") filtered = filtered.filter(e => e.userId === req.user!.id);
  const enriched = await Promise.all(filtered.map(enrichEntry));
  res.json(enriched);
});

router.post("/time-entries", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { userId, jobId, startTime, endTime, hoursWorked, notes } = req.body;
  if (!userId || !jobId || !startTime) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [entry] = await db.insert(timeEntriesTable).values({
    userId,
    jobId,
    startTime: new Date(startTime),
    endTime: endTime ? new Date(endTime) : null,
    hoursWorked: hoursWorked?.toString() ?? null,
    notes: notes ?? null,
  }).returning();
  res.status(201).json(await enrichEntry(entry));
});

router.patch("/time-entries/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const updates: Record<string, unknown> = { ...req.body };
  if (updates.endTime) updates.endTime = new Date(updates.endTime as string);
  if (updates.hoursWorked) updates.hoursWorked = updates.hoursWorked.toString();
  const [entry] = await db.update(timeEntriesTable).set(updates).where(eq(timeEntriesTable.id, id)).returning();
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichEntry(entry));
});

export default router;
