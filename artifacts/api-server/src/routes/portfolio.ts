import { Router } from "express";
import { db, portfolioTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/portfolio", async (req, res): Promise<void> => {
  const all = await db.select().from(portfolioTable).orderBy(desc(portfolioTable.createdAt));
  let filtered = all;
  if (req.query.category) filtered = filtered.filter(p => p.category === req.query.category);
  res.json(filtered);
});

router.post("/portfolio", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const { title, category, ...rest } = req.body;
  if (!title || !category) { res.status(400).json({ error: "Title and category required" }); return; }
  const [item] = await db.insert(portfolioTable).values({ title, category, ...rest }).returning();
  res.status(201).json(item);
});

router.get("/portfolio/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [item] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.patch("/portfolio/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [item] = await db.update(portfolioTable).set(req.body).where(eq(portfolioTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.delete("/portfolio/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [item] = await db.delete(portfolioTable).where(eq(portfolioTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
