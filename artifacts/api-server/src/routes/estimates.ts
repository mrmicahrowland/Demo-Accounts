import { Router } from "express";
import { db, estimatesTable, usersTable, invoicesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth";

import { validateFields } from "../lib/validate";
const router = Router();

let estimateCounter = 1000;

function estimateNumber() {
  return `EST-${++estimateCounter}`;
}

async function enrichEstimate(est: typeof estimatesTable.$inferSelect) {
  let clientName = null;
  let clientEmail = null;
  let clientPhone = null;
  if (est.clientId) {
    const [client] = await db.select().from(usersTable).where(eq(usersTable.id, est.clientId));
    if (client) {
      clientName = `${client.firstName} ${client.lastName}`;
      clientEmail = client.email;
      clientPhone = client.phone;
    }
  }
  return {
    ...est,
    clientName: clientName ?? `${est.firstName} ${est.lastName}`,
    clientEmail: clientEmail ?? est.email,
    clientPhone: clientPhone ?? est.phone,
    siteVisitFee: parseFloat(est.siteVisitFee),
    estimateAmount: est.estimateAmount ? parseFloat(est.estimateAmount) : null,
  };
}

router.get("/estimates", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const all = await db.select().from(estimatesTable).orderBy(desc(estimatesTable.createdAt));
  let filtered = all;
  if (req.query.status) filtered = filtered.filter(e => e.status === req.query.status);
  if (req.query.clientId) filtered = filtered.filter(e => e.clientId === parseInt(req.query.clientId as string, 10));
  // Clients only see their own
  if (req.user!.role === "client") {
    filtered = filtered.filter(e => e.clientId === req.user!.id || e.email === req.user!.email);
  }
  const enriched = await Promise.all(filtered.map(enrichEstimate));
  res.json(enriched);
});

router.post("/estimates", async (req, res): Promise<void> => {
  const { firstName, lastName, email, phone, gateType, propertyAddress, city, state, zip, description, acceptedTerms } = req.body;
  if (!firstName || !lastName || !email || !phone || !gateType || !propertyAddress || !city || !state || !zip) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  // Find existing client by email
  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  const [est] = await db.insert(estimatesTable).values({
    estimateNumber: estimateNumber(),
    clientId: existingUser?.id ?? null,
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    gateType,
    propertyAddress,
    city,
    state,
    zip,
    description: description ?? null,
    acceptedTerms: !!acceptedTerms,
  }).returning();
  const enriched = await enrichEstimate(est);
  res.status(201).json(enriched);
});

router.get("/estimates/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [est] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, id));
  if (!est) { res.status(404).json({ error: "Not found" }); return; }
  const actor = (req as AuthRequest).user!;
  if (actor.role === "client" && est.clientId !== actor.id) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(await enrichEstimate(est));
});

router.patch("/estimates/:id", requireRole("admin", "manager"), validateFields({ status:"optionalText", estimateAmount:"money", siteVisitFee:"money", notes:"optionalText", description:"optionalText", imageUrls:"stringArray", clientId:"optionalId" }), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [est] = await db.update(estimatesTable).set(req.body).where(eq(estimatesTable.id, id)).returning();
  if (!est) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichEstimate(est));
});

router.delete("/estimates/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [est] = await db.delete(estimatesTable).where(eq(estimatesTable.id, id)).returning();
  if (!est) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.patch("/estimates/:id/approve", requireRole("admin", "manager", "client"), async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [original] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, id));
  if (!original) { res.status(404).json({ error: "Not found" }); return; }
  if (req.user!.role === "client" && original.clientId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const [est] = await db.update(estimatesTable).set({ status: "approved" }).where(eq(estimatesTable.id, id)).returning();
  if (!est) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichEstimate(est));
});

router.post("/estimates/:id/convert", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [est] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, id));
  if (!est) { res.status(404).json({ error: "Not found" }); return; }

  if (!est.clientId) { res.status(409).json({ error: "Link a valid client account before conversion" }); return; }
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, est.clientId));
  if (!client || client.role !== "client") { res.status(409).json({ error: "Valid client account required" }); return; }
  const invNum = `INV-${Date.now()}`;
  const amount = est.estimateAmount ? parseFloat(est.estimateAmount) : 0;
  const [inv] = await db.insert(invoicesTable).values({
    invoiceNumber: invNum,
    clientId: est.clientId,
    estimateId: est.id,
    status: "pending",
    amount: amount.toString(),
    amountPaid: "0.00",
    lineItems: [{ description: `Gate Service - ${est.gateType}`, quantity: 1, unitPrice: amount, total: amount }],
  }).returning();

  await db.update(estimatesTable).set({ status: "converted" }).where(eq(estimatesTable.id, id));

  res.status(201).json({
    ...inv,
    clientName: `${est.firstName} ${est.lastName}`,
    amount: parseFloat(inv.amount),
    amountPaid: parseFloat(inv.amountPaid),
    lineItems: inv.lineItems,
  });
});

export default router;
