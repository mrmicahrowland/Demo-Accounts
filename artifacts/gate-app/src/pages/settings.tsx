import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  async function save() {
    try {
      await updateMut.mutateAsync({ data: form });
      qc.invalidateQueries();
      toast({ title: "Settings saved!" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }

  function field(key: string, label: string, type = "text") {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        {isLoading ? <Skeleton className="h-9" /> : (
          <Input
            type={type}
            value={form[key] ?? ""}
            onChange={e => setForm((f: any) => ({ ...f, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value }))}
          />
        )}
      </div>
    );
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <AppLayout>
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-serif">Settings</h1>
              <p className="text-muted-foreground text-sm">Company and application settings</p>
            </div>
            <Button onClick={save} disabled={updateMut.isPending}>
              <Save size={14} className="mr-2" />
              {updateMut.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {field("companyName", "Company Name")}
              {field("companyPhone", "Phone")}
              {field("companyEmail", "Email")}
              {field("companyAddress", "Address")}
              {field("websiteUrl", "Website URL")}
              {field("businessHours", "Business Hours")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Billing & Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {field("siteVisitFee", "Site Visit Fee ($)", "number")}
              {field("taxRate", "Tax Rate (e.g. 0.08 for 8%)", "number")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Social Media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {field("facebookUrl", "Facebook URL")}
              {field("instagramUrl", "Instagram URL")}
              {field("twitterUrl", "Twitter / X URL")}
              {field("youtubeUrl", "YouTube URL")}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
