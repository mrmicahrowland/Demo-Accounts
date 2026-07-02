import { Router } from "express";
import { db, newsletterTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../lib/auth";

const router = Router();

router.get("/newsletter/subscribers", requireRole("admin", "manager"), async (_req, res): Promise<void> => {
  const all = await db.select().from(newsletterTable).orderBy(desc(newsletterTable.createdAt));
  res.json(all);
});

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const { email, name } = req.body;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  try {
    const [sub] = await db.insert(newsletterTable).values({ email: email.toLowerCase(), name: name ?? null }).returning();
    res.status(201).json(sub);
  } catch {
    res.status(400).json({ error: "Already subscribed" });
  }
});

router.delete("/newsletter/subscribers/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [sub] = await db.delete(newsletterTable).where(eq(newsletterTable.id, id)).returning();
  if (!sub) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
