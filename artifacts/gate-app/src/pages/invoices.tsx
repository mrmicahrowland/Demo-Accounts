import { useState } from "react";
import { useListInvoices, useMarkInvoicePaid } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, CheckCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  partial: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  paid: "bg-green-500/15 text-green-500 border-green-500/30",
  overdue: "bg-red-500/15 text-red-500 border-red-500/30",
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const { data: invoices, isLoading } = useListInvoices({ status: statusFilter !== "all" ? statusFilter : undefined });
  const payMut = useMarkInvoicePaid();

  const filtered = (invoices ?? []).filter(inv => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (inv as any).invoiceNumber?.toLowerCase().includes(s) ||
      (inv as any).clientName?.toLowerCase().includes(s)
    );
  });

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  async function markPaid(id: number) {
    try {
      await payMut.mutateAsync({ id });
      qc.invalidateQueries();
      setSelected(null);
      toast({ title: "Invoice marked as paid!" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  return (
    <ProtectedRoute roles={["admin", "manager"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-serif">Invoices</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Track payments and billing</p>
            </div>
            <Badge variant="secondary">{filtered.length} total</Badge>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Invoice #</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Client</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Paid</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Due Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4" /></td>)}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No invoices found</td></tr>
                  ) : (
                    filtered.map(inv => (
                      <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{(inv as any).invoiceNumber}</td>
                        <td className="px-4 py-3 font-medium">{(inv as any).clientName ?? `Client #${inv.clientId}`}</td>
                        <td className="px-4 py-3 font-semibold">{fmt((inv as any).amount ?? 0)}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{fmt((inv as any).amountPaid ?? 0)}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{(inv as any).dueDate ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs border ${STATUS_COLORS[(inv as any).status]}`}>{(inv as any).status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelected(inv)}>
                              <Eye size={13} />
                            </Button>
                            {(inv as any).status !== "paid" && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-500" onClick={() => markPaid(inv.id!)}>
                                <CheckCircle size={13} />
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

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">Invoice {selected?.invoiceNumber}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{selected.clientName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><Badge className={`text-xs border ${STATUS_COLORS[selected.status]}`}>{selected.status}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-semibold text-lg">{fmt(selected.amount)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Amount Paid</p><p className="font-semibold text-lg text-green-500">{fmt(selected.amountPaid)}</p></div>
                  {selected.dueDate && <div><p className="text-xs text-muted-foreground">Due Date</p><p>{selected.dueDate}</p></div>}
                  {selected.notes && <div className="col-span-2"><p className="text-xs text-muted-foreground">Notes</p><p>{selected.notes}</p></div>}
                </div>
                {selected.lineItems?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wide">Line Items</p>
                    <div className="space-y-1 rounded-lg border border-border p-3">
                      {selected.lineItems.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.description} (×{item.quantity})</span>
                          <span className="font-semibold">{fmt(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.status !== "paid" && (
                  <Button onClick={() => markPaid(selected.id)} className="w-full">
                    <CheckCircle size={14} className="mr-2" /> Mark as Paid
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
