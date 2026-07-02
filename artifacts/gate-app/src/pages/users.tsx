import { useState } from "react";
import { useListUsers, useCreateUser } from "@workspace/api-client-react";
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
import { Search, UserPlus, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  supervisor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  crew: "bg-green-500/20 text-green-400 border-green-500/30",
  client: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function UsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "crew", password: "" });

  const { data: users, isLoading } = useListUsers({ role: roleFilter !== "all" ? roleFilter : undefined, search: search || undefined });
  const createMut = useCreateUser();

  async function handleCreate() {
    try {
      await createMut.mutateAsync({ data: form as any });
      qc.invalidateQueries();
      setShowCreate(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", role: "crew", password: "" });
      toast({ title: "Team member created!" });
    } catch {
      toast({ title: "Failed to create user", variant: "destructive" });
    }
  }

  return (
    <ProtectedRoute roles={["admin", "manager"]}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-serif">Team Members</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Manage your team and client accounts</p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <UserPlus size={15} className="mr-2" /> Add Member
            </Button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="crew">Crew</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className="h-36" />)
            ) : (users ?? []).length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">No users found</div>
            ) : (
              (users as any[] ?? []).map(user => (
                <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                        <Badge className={`text-xs border capitalize ${ROLE_COLORS[user.role]}`}>{user.role}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Mail size={11} /> <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone size={11} /> {user.phone}
                        </div>
                      )}
                      {user.city && (
                        <p className="text-xs text-muted-foreground mt-0.5">{user.city}, {user.state}</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${user.isActive ? "bg-green-400" : "bg-gray-400"}`} title={user.isActive ? "Active" : "Inactive"} />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>First Name</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="crew">Crew</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
