import { Router } from "express";
import { db, jobsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth";

const router = Router();

async function enrichJob(job: typeof jobsTable.$inferSelect) {
  let clientName = null;
  let assignedToName = null;
  if (job.clientId) {
    const [c] = await db.select().from(usersTable).where(eq(usersTable.id, job.clientId));
    if (c) clientName = `${c.firstName} ${c.lastName}`;
  }
  if (job.assignedToId) {
    const [t] = await db.select().from(usersTable).where(eq(usersTable.id, job.assignedToId));
    if (t) assignedToName = `${t.firstName} ${t.lastName}`;
  }
  return { ...job, clientName, assignedToName };
}

router.get("/jobs", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const all = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
  let filtered = all;
  if (req.query.status) filtered = filtered.filter(j => j.status === req.query.status);
  if (req.query.assignedToId) filtered = filtered.filter(j => j.assignedToId === parseInt(req.query.assignedToId as string, 10));
  if (req.query.date) filtered = filtered.filter(j => j.scheduledDate === req.query.date);
  // Crew only sees assigned jobs
  if (req.user!.role === "crew" || req.user!.role === "supervisor") {
    filtered = filtered.filter(j => j.assignedToId === req.user!.id);
  }
  // Clients only see their own
  if (req.user!.role === "client") {
    filtered = filtered.filter(j => j.clientId === req.user!.id);
  }
  const enriched = await Promise.all(filtered.map(enrichJob));
  res.json(enriched);
});

router.post("/jobs", requireRole("admin", "manager"), async (req: AuthRequest, res): Promise<void> => {
  const { title, status, ...rest } = req.body;
  if (!title) { res.status(400).json({ error: "Title required" }); return; }
  const [job] = await db.insert(jobsTable).values({
    title,
    status: status ?? "scheduled",
    priority: rest.priority ?? "medium",
    ...rest,
  }).returning();
  res.status(201).json(await enrichJob(job));
});

router.get("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  const actor = (req as AuthRequest).user!;
  if (actor.role === "client" && job.clientId !== actor.id || ["crew","supervisor"].includes(actor.role) && job.assignedToId !== actor.id) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(await enrichJob(job));
});

router.patch("/jobs/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [job] = await db.update(jobsTable).set(req.body).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichJob(job));
});

router.delete("/jobs/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [job] = await db.delete(jobsTable).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.patch("/jobs/:id/status", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, notes } = req.body;
  if (!status) { res.status(400).json({ error: "Status required" }); return; }
  const [existing] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!["admin","manager"].includes(req.user!.role) && existing.assignedToId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!["scheduled","in_progress","paused","completed","cancelled"].includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, unknown> = { status };
  if (notes) updates.notes = notes;
  if (status === "completed") updates.completedAt = new Date();
  const [job] = await db.update(jobsTable).set(updates).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichJob(job));
});

router.patch("/jobs/:id/assign", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { assignedToId, scheduledDate, scheduledTime } = req.body;
  if (!assignedToId) { res.status(400).json({ error: "assignedToId required" }); return; }
  const updates: Record<string, unknown> = { assignedToId };
  if (scheduledDate) updates.scheduledDate = scheduledDate;
  if (scheduledTime) updates.scheduledTime = scheduledTime;
  const [job] = await db.update(jobsTable).set(updates).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichJob(job));
});

export default router;
