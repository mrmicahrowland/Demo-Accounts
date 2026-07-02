import { Router } from "express";
import { db, faqTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireRole } from "../lib/auth";

const router = Router();

router.get("/faqs", async (req, res): Promise<void> => {
  const all = await db.select().from(faqTable).orderBy(asc(faqTable.sortOrder), asc(faqTable.createdAt));
  let filtered = all;
  if (req.query.category) filtered = filtered.filter(f => f.category === req.query.category);
  if (req.query.search) {
    const s = (req.query.search as string).toLowerCase();
    filtered = filtered.filter(f => f.question.toLowerCase().includes(s) || f.answer.toLowerCase().includes(s));
  }
  res.json(filtered);
});

router.post("/faqs", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const { question, answer, category, sortOrder } = req.body;
  if (!question || !answer || !category) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [faq] = await db.insert(faqTable).values({ question, answer, category, sortOrder: sortOrder ?? 0 }).returning();
  res.status(201).json(faq);
});

router.get("/faqs/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [faq] = await db.select().from(faqTable).where(eq(faqTable.id, id));
  if (!faq) { res.status(404).json({ error: "Not found" }); return; }
  res.json(faq);
});

router.patch("/faqs/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [faq] = await db.update(faqTable).set(req.body).where(eq(faqTable.id, id)).returning();
  if (!faq) { res.status(404).json({ error: "Not found" }); return; }
  res.json(faq);
});

router.delete("/faqs/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [faq] = await db.delete(faqTable).where(eq(faqTable.id, id)).returning();
  if (!faq) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
