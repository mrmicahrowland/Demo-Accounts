import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientApi } from "@/lib/client-api";

type Profile = { firstName: string; lastName: string; phone: string | null; address: string | null; city: string | null; state: string | null; zip: string | null; email: string };
const fields: Array<[keyof Profile, string]> = [["firstName","First name"],["lastName","Last name"],["phone","Phone"],["address","Street address"],["city","City"],["state","State"],["zip","ZIP code"]];

export function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => { clientApi<Profile>("/profile").then(setProfile).catch(e => setError(e.message)); }, []);
  async function save() {
    if (!profile) return;
    setError(""); setStatus("");
    try {
      const updates = Object.fromEntries(fields.map(([key]) => [key, profile[key] || null]));
      const saved = await clientApi<Profile>("/profile", { method: "PATCH", body: JSON.stringify(updates) });
      setProfile(saved); setStatus("Profile saved");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save"); }
  }
  return <ProtectedRoute roles={["client"]}><AppLayout><div className="max-w-2xl space-y-4">
    <h1 className="text-2xl font-bold">My Profile</h1>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {status && <p role="status">{status}</p>}
    {!profile ? <p>Loading profile…</p> : <Card><CardHeader><CardTitle>Contact information</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><Label>Email</Label><Input value={profile.email} disabled /><p className="text-xs text-muted-foreground">Email changes require verification and will be added in a subsequent update.</p></div>
      {fields.map(([key,label]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} value={profile[key] ?? ""} onChange={e => setProfile(p => p ? { ...p, [key]: e.target.value } : p)} /></div>)}
      <Button onClick={save}>Save profile</Button>
    </CardContent></Card>}
  </div></AppLayout></ProtectedRoute>;
}

const types = ["installation","repair","upgrade","maintenance","emergency"] as const;
type ServiceRequest = { id: number; type: string; status: string; description: string; createdAt: string };
export function ClientServiceRequestsPage() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [form, setForm] = useState({ type: "repair", description: "", serviceAddress: "", city: "", state: "", zip: "", gateMaterial: "", gateConfiguration: "", gateLengthFeet: "", gateHeightFeet: "", existingOperator: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => { clientApi<ServiceRequest[]>("/service-requests").then(setItems).catch(e => setError(e.message)); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setStatus("");
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([,v]) => v !== ""));
      const created = await clientApi<ServiceRequest>("/service-requests", { method: "POST", body: JSON.stringify(payload) });
      setItems(previous => [created, ...previous]); setStatus("Service request submitted");
      setForm(p => ({ ...p, description: "" }));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit"); }
  }
  return <ProtectedRoute roles={["client"]}><AppLayout><div className="max-w-3xl space-y-6">
    <h1 className="text-2xl font-bold">My Service Requests</h1>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {status && <p role="status">{status}</p>}
    <Card><CardHeader><CardTitle>Request a service</CardTitle></CardHeader><CardContent>
      <form className="space-y-4" onSubmit={submit}>
        <div><Label htmlFor="serviceType">Service type</Label><select id="serviceType" className="w-full border rounded-md bg-background p-2" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>{types.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        {([["serviceAddress","Service address"],["city","City"],["state","State"],["zip","ZIP code"],["gateMaterial","Gate material (optional)"],["gateConfiguration","Gate configuration (optional)"],["gateLengthFeet","Gate length in feet (optional)"],["gateHeightFeet","Gate height in feet (optional)"],["existingOperator","Existing gate operator (optional)"]] as const).map(([key,label]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} required={["serviceAddress","city","state","zip"].includes(key)} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></div>)}
        <div><Label htmlFor="description">Describe your service needs</Label><Textarea id="description" required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        {form.type === "emergency" && <p className="text-sm">Next-day emergency service: $75 site visit plus $150 for the first hour of troubleshooting. Additional work is quoted separately.</p>}
        <Button type="submit">Submit request</Button>
      </form>
    </CardContent></Card>
    <h2 className="text-xl font-semibold">Submitted requests</h2>
    {items.length === 0 ? <p className="text-muted-foreground">No requests yet.</p> : items.map(item => <Card key={item.id}><CardContent className="p-4"><p className="font-semibold">Request #{item.id} · {item.type}</p><p className="text-sm">{item.description}</p><p className="text-xs text-muted-foreground">{item.status} · {new Date(item.createdAt).toLocaleDateString()}</p></CardContent></Card>)}
  </div></AppLayout></ProtectedRoute>;
}
