import { Router } from "express";
import { db, jobsTable, estimatesTable, invoicesTable, usersTable, timeEntriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireRole } from "../lib/auth";

const router = Router();

router.get("/analytics/dashboard", requireRole("admin", "manager", "supervisor"), async (_req, res): Promise<void> => {
  const [jobStats] = await db.select({
    total: sql<number>`count(*)::int`,
    active: sql<number>`count(*) filter (where status = 'in_progress')::int`,
    completed: sql<number>`count(*) filter (where status = 'completed')::int`,
    scheduled: sql<number>`count(*) filter (where status = 'scheduled')::int`,
  }).from(jobsTable);

  const [estimateStats] = await db.select({
    pending: sql<number>`count(*) filter (where status = 'pending')::int`,
    approved: sql<number>`count(*) filter (where status = 'approved')::int`,
    total: sql<number>`count(*)::int`,
    converted: sql<number>`count(*) filter (where status = 'converted')::int`,
  }).from(estimatesTable);

  const [invoiceStats] = await db.select({
    totalRevenue: sql<number>`coalesce(sum(amount_paid), 0)::float`,
    pendingRevenue: sql<number>`coalesce(sum(amount) filter (where status = 'pending'), 0)::float`,
    overdue: sql<number>`count(*) filter (where status = 'overdue')::int`,
  }).from(invoicesTable);

  const [clientCount] = await db.select({ total: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "client"));
  const [techCount] = await db.select({ total: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "crew"));

  const totalEstimates = Number(estimateStats.total) || 1;
  const converted = Number(estimateStats.converted) || 0;
  const totalRevenue = Number(invoiceStats.totalRevenue) || 0;
  const completedJobs = Number(jobStats.completed) || 1;

  res.json({
    totalJobs: Number(jobStats.total),
    activeJobs: Number(jobStats.active),
    completedJobs: Number(jobStats.completed),
    scheduledJobs: Number(jobStats.scheduled),
    totalRevenue,
    pendingRevenue: Number(invoiceStats.pendingRevenue),
    pendingEstimates: Number(estimateStats.pending),
    approvedEstimates: Number(estimateStats.approved),
    overdueInvoices: Number(invoiceStats.overdue),
    totalClients: Number(clientCount.total),
    totalTechnicians: Number(techCount.total),
    estimateConversionRate: Math.round((converted / totalEstimates) * 100),
    avgJobValue: totalRevenue / completedJobs,
  });
});

router.get("/analytics/revenue", requireRole("admin", "manager"), async (_req, res): Promise<void> => {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const [revenue] = await db.select({
      total: sql<number>`coalesce(sum(amount_paid), 0)::float`,
    }).from(invoicesTable).where(sql`${invoicesTable.paidAt} >= ${d} and ${invoicesTable.paidAt} < ${next}`);
    const [jobs] = await db.select({ total: sql<number>`count(*)::int` })
      .from(jobsTable).where(sql`${jobsTable.completedAt} >= ${d} and ${jobsTable.completedAt} < ${next}`);
    months.push({
      month: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
      revenue: Number(revenue?.total) || 0,
      jobs: Number(jobs?.total) || 0,
    });
  }
  res.json(months);
});

router.get("/analytics/technicians", requireRole("admin", "manager"), async (_req, res): Promise<void> => {
  const techs = await db.select().from(usersTable).where(eq(usersTable.role, "crew"));
  const result = await Promise.all(techs.map(async (tech) => {
    const [stats] = await db.select({
      completed: sql<number>`count(*) filter (where status = 'completed')::int`,
    }).from(jobsTable).where(eq(jobsTable.assignedToId, tech.id));
    const [hours] = await db.select({
      total: sql<number>`coalesce(sum(hours_worked), 0)::float`,
    }).from(timeEntriesTable).where(eq(timeEntriesTable.userId, tech.id));
    return {
      id: tech.id,
      name: `${tech.firstName} ${tech.lastName}`,
      completedJobs: Number(stats?.completed) || 0,
      totalHours: Number(hours?.total) || 0,
      revenue: null, // No verified technician revenue attribution available
      rating: null, // No stored technician rating available
    };
  }));
  res.json(result);
});

export default router;
