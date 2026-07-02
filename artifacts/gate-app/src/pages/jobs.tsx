import { useState } from "react";
import { useListJobs, useUpdateJobStatus, useListUsers, useAssignJob } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Search, MapPin, Calendar, User, Eye, Play, CheckCircle, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  paused: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-400",
  medium: "text-blue-400",
  high: "text-amber-400",
  urgent: "text-red-400",
};

export default function JobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const { data: jobs, isLoading } = useListJobs({ status: statusFilter !== "all" ? statusFilter : undefined });
  const { data: users } = useListUsers({ role: "crew" });
  const updateStatus = useUpdateJobStatus();
  const assignJob = useAssignJob();

  const isAdmin = ["admin", "manager"].includes(user?.role ?? "");

  const filtered = (jobs ?? []).filter(job => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      job.title?.toLowerCase().includes(s) ||
      (job as any).clientName?.toLowerCase().includes(s) ||
      (job as any).propertyAddress?.toLowerCase().includes(s)
    );
  });

  async function changeStatus(id: number, status: string) {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      qc.invalidateQueries();
      toast({ title: `Job ${status.replace("_", " ")}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  }

  async function assign(jobId: number, assignedToId: number) {
    try {
      await assignJob.mutateAsync({ id: jobId, data: { assignedToId } });
      qc.invalidateQueries();
      toast({ title: "Job assigned!" });
    } catch {
      toast({ title: "Assignment failed", variant: "destructive" });
    }
  }

  return (
    <ProtectedRoute roles={["admin", "manager", "supervisor", "crew"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-serif">Jobs</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Field service work orders</p>
            </div>
            <Badge variant="secondary">{filtered.length} jobs</Badge>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No jobs found</CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(job => (
                <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(job)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{job.title}</h3>
                      <Badge className={`text-xs border shrink-0 ${STATUS_COLORS[(job as any).status]}`}>
                        {(job as any).status?.replace("_", " ")}
                      </Badge>
                    </div>
                    {(job as any).clientName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User size={12} /> {(job as any).clientName}
                      </div>
                    )}
                    {(job as any).propertyAddress && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={12} /> {(job as any).propertyAddress}, {(job as any).city}
                      </div>
                    )}
                    {(job as any).scheduledDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} /> {(job as any).scheduledDate} {(job as any).scheduledTime && `at ${(job as any).scheduledTime}`}
                      </div>
                    )}
                    {(job as any).assignedToName && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <User size={12} /> {(job as any).assignedToName}
                      </div>
                    )}
                    <div className="flex items-center gap-1 pt-1" onClick={e => e.stopPropagation()}>
                      {(job as any).status === "scheduled" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => changeStatus(job.id!, "in_progress")}>
                          <Play size={11} className="mr-1" /> Start
                        </Button>
                      )}
                      {(job as any).status === "in_progress" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => changeStatus(job.id!, "paused")}>
                            <Pause size={11} className="mr-1" /> Pause
                          </Button>
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={() => changeStatus(job.id!, "completed")}>
                            <CheckCircle size={11} className="mr-1" /> Complete
                          </Button>
                        </>
                      )}
                      {(job as any).status === "paused" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => changeStatus(job.id!, "in_progress")}>
                          <Play size={11} className="mr-1" /> Resume
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">{selected?.title}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`text-xs border ${STATUS_COLORS[selected.status]}`}>{selected.status?.replace("_", " ")}</Badge>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Priority</p>
                    <p className={`font-semibold capitalize ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</p>
                  </div>
                  {selected.clientName && <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{selected.clientName}</p></div>}
                  {selected.assignedToName && <div><p className="text-xs text-muted-foreground">Assigned To</p><p className="font-medium">{selected.assignedToName}</p></div>}
                  {selected.propertyAddress && <div className="col-span-2"><p className="text-xs text-muted-foreground">Location</p><p>{selected.propertyAddress}, {selected.city}, {selected.state}</p></div>}
                  {selected.scheduledDate && <div><p className="text-xs text-muted-foreground">Scheduled</p><p>{selected.scheduledDate}</p></div>}
                  {selected.gateType && <div><p className="text-xs text-muted-foreground">Gate Type</p><p className="capitalize">{selected.gateType.replace(/_/g, " ")}</p></div>}
                  {selected.notes && <div className="col-span-2"><p className="text-xs text-muted-foreground">Notes</p><p>{selected.notes}</p></div>}
                </div>
                {isAdmin && users && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Assign to Crew Member</p>
                    <Select onValueChange={v => assign(selected.id, parseInt(v, 10))}>
                      <SelectTrigger><SelectValue placeholder="Select crew member" /></SelectTrigger>
                      <SelectContent>
                        {(users as any[]).map(u => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.firstName} {u.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
