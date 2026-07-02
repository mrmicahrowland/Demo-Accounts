import { useListEstimates, useListInvoices, useListJobs } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkInvoicePaid } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  converted: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  reviewed: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  paid: "bg-green-500/15 text-green-500 border-green-500/30",
  overdue: "bg-red-500/15 text-red-500 border-red-500/30",
  partial: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function ClientEstimatesPage() {
  const { data: estimates, isLoading } = useListEstimates();
  return (
    <ProtectedRoute roles={["client"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-serif">My Estimates</h1>
            <p className="text-muted-foreground text-sm">View your estimate requests</p>
          </div>
          <div className="space-y-3">
            {isLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />) :
             (estimates ?? []).length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No estimates yet. <a href="/estimates/new" className="text-primary hover:underline">Request one</a>.</CardContent></Card>
            ) : (
              (estimates ?? []).map(est => (
                <Card key={est.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{(est as any).estimateNumber}</p>
                      <p className="text-xs text-muted-foreground capitalize">{(est as any).gateType?.replace(/_/g, " ")} — {(est as any).city}, {(est as any).state}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Submitted {new Date((est as any).createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs border mb-1 ${STATUS_COLORS[(est as any).status]}`}>{(est as any).status}</Badge>
                      {(est as any).estimateAmount && (
                        <p className="text-sm font-semibold">{fmt(parseFloat((est as any).estimateAmount))}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

export function ClientInvoicesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: invoices, isLoading } = useListInvoices();
  const payMut = useMarkInvoicePaid();

  async function pay(id: number) {
    try {
      await payMut.mutateAsync({ id });
      qc.invalidateQueries();
      toast({ title: "Payment recorded!" });
    } catch {
      toast({ title: "Payment failed", variant: "destructive" });
    }
  }

  return (
    <ProtectedRoute roles={["client"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-serif">My Invoices</h1>
            <p className="text-muted-foreground text-sm">View and pay your invoices</p>
          </div>
          <div className="space-y-3">
            {isLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />) :
             (invoices ?? []).length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No invoices yet.</CardContent></Card>
            ) : (
              (invoices ?? []).map(inv => (
                <Card key={inv.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm font-mono">{(inv as any).invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">Due: {(inv as any).dueDate ?? "On receipt"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">{fmt((inv as any).amount)}</p>
                        <Badge className={`text-xs border ${STATUS_COLORS[(inv as any).status]}`}>{(inv as any).status}</Badge>
                      </div>
                      {(inv as any).status !== "paid" && (
                        <Button size="sm" onClick={() => pay(inv.id!)} disabled={payMut.isPending}>
                          <CheckCircle size={14} className="mr-1" /> Pay Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

export function ClientJobsPage() {
  const { data: jobs, isLoading } = useListJobs();
  return (
    <ProtectedRoute roles={["client"]}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-serif">My Jobs</h1>
            <p className="text-muted-foreground text-sm">Track your service appointments</p>
          </div>
          <div className="space-y-3">
            {isLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />) :
             (jobs ?? []).length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No jobs scheduled yet.</CardContent></Card>
            ) : (
              (jobs ?? []).map(job => (
                <Card key={job.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{job.title}</p>
                      {(job as any).propertyAddress && <p className="text-xs text-muted-foreground">{(job as any).propertyAddress}</p>}
                      {(job as any).scheduledDate && <p className="text-xs text-muted-foreground">📅 {(job as any).scheduledDate}</p>}
                    </div>
                    <Badge className={`text-xs border ${STATUS_COLORS[(job as any).status]}`}>{(job as any).status?.replace("_", " ")}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
