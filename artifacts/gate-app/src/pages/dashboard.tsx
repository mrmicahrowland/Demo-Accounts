import { useGetDashboardStats, useGetRevenueData, useListJobs, useListEstimates } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  Briefcase, DollarSign, FileText, Receipt,
  TrendingUp, Users, Clock, AlertCircle
} from "lucide-react";

function StatCard({ title, value, subtitle, icon, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 font-serif">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueData();
  const { data: jobs } = useListJobs({ status: "scheduled" });
  const { data: pendingEstimates } = useListEstimates({ status: "pending" });

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  return (
    <ProtectedRoute roles={["admin", "manager", "supervisor", "crew"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-serif">
              Welcome back, {user?.firstName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your business today.</p>
          </div>

          {/* Stats grid */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Revenue" value={fmt(stats?.totalRevenue ?? 0)} subtitle="All time" icon={<DollarSign size={20} />} />
              <StatCard title="Active Jobs" value={stats?.activeJobs ?? 0} subtitle="In progress" icon={<Briefcase size={20} />} />
              <StatCard title="Pending Estimates" value={stats?.pendingEstimates ?? 0} subtitle="Awaiting review" icon={<FileText size={20} />} />
              <StatCard title="Overdue Invoices" value={stats?.overdueInvoices ?? 0} subtitle="Needs attention" icon={<Receipt size={20} />} />
              <StatCard title="Completed Jobs" value={stats?.completedJobs ?? 0} subtitle="This period" icon={<TrendingUp size={20} />} />
              <StatCard title="Scheduled Jobs" value={stats?.scheduledJobs ?? 0} subtitle="Upcoming" icon={<Clock size={20} />} />
              <StatCard title="Total Clients" value={stats?.totalClients ?? 0} icon={<Users size={20} />} />
              <StatCard title="Conversion Rate" value={`${stats?.estimateConversionRate ?? 0}%`} subtitle="Estimate to job" icon={<TrendingUp size={20} />} />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Revenue (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <Skeleton className="h-56" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenue ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                        formatter={(v: number) => [fmt(v), "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <div className="space-y-4">
              {/* Pending estimates */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Pending Estimates</span>
                    <Link href="/estimates">
                      <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(pendingEstimates ?? []).slice(0, 4).map(est => (
                    <div key={est.id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-foreground/80">{(est as any).clientName ?? `${(est as any).firstName} ${(est as any).lastName}`}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{(est as any).gateType?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                  {!pendingEstimates?.length && (
                    <p className="text-xs text-muted-foreground text-center py-2">No pending estimates</p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming jobs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Upcoming Jobs</span>
                    <Link href="/jobs">
                      <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(jobs ?? []).slice(0, 4).map(job => (
                    <div key={job.id} className="flex items-center justify-between text-sm gap-2">
                      <span className="truncate text-foreground/80">{job.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{job.scheduledDate ?? "TBD"}</Badge>
                    </div>
                  ))}
                  {!jobs?.length && (
                    <p className="text-xs text-muted-foreground text-center py-2">No scheduled jobs</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
