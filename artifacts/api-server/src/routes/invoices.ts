import { Router } from "express";
import { db, invoicesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth";

const router = Router();

async function enrichInvoice(inv: typeof invoicesTable.$inferSelect) {
  let clientName = null;
  if (inv.clientId) {
    const [client] = await db.select().from(usersTable).where(eq(usersTable.id, inv.clientId));
    if (client) clientName = `${client.firstName} ${client.lastName}`;
  }
  return {
    ...inv,
    clientName,
    amount: parseFloat(inv.amount),
    amountPaid: parseFloat(inv.amountPaid),
    lineItems: inv.lineItems ?? [],
  };
}

router.get("/invoices", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const all = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt));
  let filtered = all;
  if (req.query.status) filtered = filtered.filter(i => i.status === req.query.status);
  if (req.query.clientId) filtered = filtered.filter(i => i.clientId === parseInt(req.query.clientId as string, 10));
  if (req.user!.role === "client") filtered = filtered.filter(i => i.clientId === req.user!.id);
  const enriched = await Promise.all(filtered.map(enrichInvoice));
  res.json(enriched);
});

router.post("/invoices", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const { clientId, amount, lineItems, estimateId, jobId, dueDate, notes } = req.body;
  if (!clientId || !amount) { res.status(400).json({ error: "Missing required fields" }); return; }
  const invNum = `INV-${Date.now()}`;
  const [inv] = await db.insert(invoicesTable).values({
    invoiceNumber: invNum,
    clientId,
    estimateId: estimateId ?? null,
    jobId: jobId ?? null,
    status: "pending",
    amount: amount.toString(),
    amountPaid: "0.00",
    dueDate: dueDate ?? null,
    notes: notes ?? null,
    lineItems: lineItems ?? [],
  }).returning();
  res.status(201).json(await enrichInvoice(inv));
});

router.get("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  const actor = (req as AuthRequest).user!;
  if (actor.role === "client" && inv.clientId !== actor.id) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(await enrichInvoice(inv));
});

router.patch("/invoices/:id", requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status: _status, amountPaid: _amountPaid, paidAt: _paidAt, clientId: _clientId, ...updates } = req.body;
  if (updates.amount) updates.amount = updates.amount.toString();
  if (updates.amountPaid) updates.amountPaid = updates.amountPaid.toString();
  const [inv] = await db.update(invoicesTable).set(updates).where(eq(invoicesTable.id, id)).returning();
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichInvoice(inv));
});

router.patch("/invoices/:id/pay", requireAuth, async (_req, res): Promise<void> => {
  res.status(409).json({ error: "Payment status requires verified provider webhook; direct payment marking disabled" });
});

/* Legacy unsafe direct payment route removed.
router.patch("/invoices/:id/pay", requireRole("admin", "manager", "client"), async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(invoicesTable).set({
    status: "paid",
    amountPaid: inv.amount,
    paidAt: new Date(),
  }).where(eq(invoicesTable.id, id)).returning();
  res.json(await enrichInvoice(updated));
});

*/
export default router;
