import { Router } from "express";
import { db, postsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole, requireAuth, AuthRequest } from "../lib/auth";

const router = Router();

async function enrichPost(post: typeof postsTable.$inferSelect) {
  let authorName = null;
  if (post.authorId) {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.authorId));
    if (author) authorName = `${author.firstName} ${author.lastName}`;
  }
  return { ...post, authorName };
}

router.get("/posts", async (req, res): Promise<void> => {
  const all = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt));
  let filtered = all;
  if (req.query.category) filtered = filtered.filter(p => p.category === req.query.category);
  if (req.query.published !== undefined) {
    const pub = req.query.published === "true";
    filtered = filtered.filter(p => p.published === pub);
  }
  const enriched = await Promise.all(filtered.map(enrichPost));
  res.json(enriched);
});

router.post("/posts", requireRole("admin", "manager"), async (req: AuthRequest, res): Promise<void> => {
  const { title, content, slug, ...rest } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }
  const generatedSlug = slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [post] = await db.insert(postsTable).values({
    title,
    slug: generatedSlug,
    content,
    authorId: req.user!.id,
    published: rest.published ?? false,
    publishedAt: rest.published ? new Date() : null,
    ...rest,
  }).returning();
  res.status(201).json(await enrichPost(post));
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichPost(post));
});

router.patch("/posts/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const updates = { ...req.body };
  if (updates.published && !updates.publishedAt) updates.publishedAt = new Date();
  const [post] = await db.update(postsTable).set(updates).where(eq(postsTable.id, id)).returning();
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichPost(post));
});

router.delete("/posts/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [post] = await db.delete(postsTable).where(eq(postsTable.id, id)).returning();
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
