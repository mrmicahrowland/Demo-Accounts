import { useState } from "react";
import { useListEstimates, useUpdateEstimate, useConvertEstimateToInvoice, useDeleteEstimate } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Eye, CheckCircle, ArrowRight, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  reviewed: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  approved: "bg-green-500/15 text-green-500 border-green-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  converted: "bg-purple-500/15 text-purple-500 border-purple-500/30",
};

export default function EstimatesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const { data: estimates, isLoading } = useListEstimates({ status: statusFilter !== "all" ? statusFilter : undefined });
  const updateMut = useUpdateEstimate();
  const convertMut = useConvertEstimateToInvoice();
  const deleteMut = useDeleteEstimate();

  const filtered = (estimates ?? []).filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (e as any).clientName?.toLowerCase().includes(s) ||
      (e as any).email?.toLowerCase().includes(s) ||
      (e as any).estimateNumber?.toLowerCase().includes(s) ||
      (e as any).propertyAddress?.toLowerCase().includes(s)
    );
  });

  async function updateStatus(id: number, status: string) {
    try {
      await updateMut.mutateAsync({ id, data: { status } });
      qc.invalidateQueries();
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  async function convert(id: number) {
    try {
      await convertMut.mutateAsync({ id });
      qc.invalidateQueries();
      toast({ title: "Converted to invoice!", description: "Invoice created successfully." });
    } catch {
      toast({ title: "Conversion failed", variant: "destructive" });
    }
  }

  async function deleteEst(id: number) {
    try {
      await deleteMut.mutateAsync({ id });
      qc.invalidateQueries();
      setSelected(null);
      toast({ title: "Estimate deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  return (
    <ProtectedRoute roles={["admin", "manager", "supervisor"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-serif">Estimates</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Manage estimate requests from clients</p>
            </div>
            <Badge variant="secondary" className="text-sm">{filtered.length} total</Badge>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, address…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Estimate #</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Client</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Gate Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {[...Array(7)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        No estimates found
                      </td>
                    </tr>
                  ) : (
                    filtered.map(est => (
                      <tr key={est.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{(est as any).estimateNumber}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{(est as any).clientName ?? `${(est as any).firstName} ${(est as any).lastName}`}</div>
                          <div className="text-xs text-muted-foreground">{(est as any).email}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell capitalize text-sm text-muted-foreground">
                          {(est as any).gateType?.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                          {(est as any).city}, {(est as any).state}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs border ${STATUS_COLORS[(est as any).status]}`}>
                            {(est as any).status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell font-medium">
                          {(est as any).estimateAmount
                            ? `$${parseFloat((est as any).estimateAmount).toLocaleString()}`
                            : <span className="text-muted-foreground text-xs">TBD</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelected(est)}>
                              <Eye size={13} />
                            </Button>
                            {(est as any).status === "pending" && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-500" onClick={() => updateStatus(est.id!, "approved")}>
                                <CheckCircle size={13} />
                              </Button>
                            )}
                            {(est as any).status === "approved" && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-purple-500" onClick={() => convert(est.id!)}>
                                <ArrowRight size={13} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">
                Estimate {selected?.estimateNumber}
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{selected.clientName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{selected.phone}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selected.email}</p></div>
                  <div><p className="text-xs text-muted-foreground">Gate Type</p><p className="font-medium capitalize">{selected.gateType?.replace(/_/g, " ")}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Address</p><p className="font-medium">{selected.propertyAddress}, {selected.city}, {selected.state} {selected.zip}</p></div>
                  {selected.description && <div className="col-span-2"><p className="text-xs text-muted-foreground">Description</p><p>{selected.description}</p></div>}
                  <div><p className="text-xs text-muted-foreground">Site Visit Fee</p><p className="font-medium">${parseFloat(selected.siteVisitFee || 150).toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Estimate Amount</p><p className="font-medium">{selected.estimateAmount ? `$${parseFloat(selected.estimateAmount).toLocaleString()}` : "TBD"}</p></div>
                </div>
                <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                  {selected.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => { updateStatus(selected.id, "approved"); setSelected(null); }}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => { updateStatus(selected.id, "reviewed"); setSelected(null); }}>Mark Reviewed</Button>
                      <Button size="sm" variant="destructive" onClick={() => { updateStatus(selected.id, "rejected"); setSelected(null); }}>Reject</Button>
                    </>
                  )}
                  {selected.status === "approved" && (
                    <Button size="sm" onClick={() => { convert(selected.id); setSelected(null); }}>
                      <ArrowRight size={14} className="mr-1" /> Convert to Invoice
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-destructive ml-auto" onClick={() => deleteEst(selected.id)}>
                    <Trash2 size={13} className="mr-1" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
