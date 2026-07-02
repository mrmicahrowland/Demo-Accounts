import { useState } from "react";
import { useListTimeEntries, useCreateTimeEntry } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Plus } from "lucide-react";

export default function TimeEntriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ userId: user?.id ?? 0, jobId: "", startTime: "", endTime: "", hoursWorked: "", notes: "" });

  const { data: entries, isLoading } = useListTimeEntries();
  const createMut = useCreateTimeEntry();

  async function handleCreate() {
    try {
      await createMut.mutateAsync({ data: { ...form, userId: Number(user?.id), jobId: Number(form.jobId), hoursWorked: form.hoursWorked ? Number(form.hoursWorked) : undefined } as any });
      qc.invalidateQueries();
      setShowCreate(false);
      toast({ title: "Time entry logged!" });
    } catch {
      toast({ title: "Failed to create entry", variant: "destructive" });
    }
  }

  const total = (entries ?? []).reduce((sum, e) => sum + ((e as any).hoursWorked ?? 0), 0);

  return (
    <ProtectedRoute roles={["admin", "manager", "supervisor", "crew"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-serif">Time Tracking</h1>
              <p className="text-muted-foreground text-sm">Log and review work hours</p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} className="mr-2" /> Log Time
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-5 flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Clock size={20} /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold font-serif">{total.toFixed(1)}</p>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Entries</p>
              <p className="text-2xl font-bold font-serif">{(entries ?? []).length}</p>
            </CardContent></Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Employee</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Job ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Start</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">End</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Hours</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4" /></td>)}
                      </tr>
                    ))
                  ) : (entries ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No time entries yet</td></tr>
                  ) : (
                    (entries as any[]).map(entry => (
                      <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{entry.userName ?? `User #${entry.userId}`}</td>
                        <td className="px-4 py-3 text-muted-foreground">Job #{entry.jobId}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(entry.startTime).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{entry.endTime ? new Date(entry.endTime).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3 font-semibold">{entry.hoursWorked ? `${entry.hoursWorked}h` : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-48">{entry.notes ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Log Time Entry</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Job ID</Label><Input type="number" value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Start Time</Label><Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} /></div>
                <div className="space-y-1"><Label>End Time</Label><Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>Hours Worked</Label><Input type="number" step="0.25" value={form.hoursWorked} onChange={e => setForm(f => ({ ...f, hoursWorked: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? "Saving…" : "Log Time"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
