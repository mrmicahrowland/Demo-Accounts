import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../lib/auth";

const router = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const all = await db.select().from(settingsTable);
  if (all.length === 0) {
    const [settings] = await db.insert(settingsTable).values({}).returning();
    res.json({ ...settings, siteVisitFee: parseFloat(settings.siteVisitFee), taxRate: parseFloat(settings.taxRate) });
    return;
  }
  const s = all[0];
  res.json({ ...s, siteVisitFee: parseFloat(s.siteVisitFee), taxRate: parseFloat(s.taxRate) });
});

router.patch("/settings", requireRole("admin"), async (_req, res): Promise<void> => {
  const all = await db.select().from(settingsTable);
  const body = _req.body;
  if (body.siteVisitFee) body.siteVisitFee = body.siteVisitFee.toString();
  if (body.taxRate) body.taxRate = body.taxRate.toString();
  let s;
  if (all.length === 0) {
    [s] = await db.insert(settingsTable).values(body).returning();
  } else {
    [s] = await db.update(settingsTable).set(body).where(eq(settingsTable.id, all[0].id)).returning();
  }
  res.json({ ...s, siteVisitFee: parseFloat(s.siteVisitFee), taxRate: parseFloat(s.taxRate) });
});

export default router;
