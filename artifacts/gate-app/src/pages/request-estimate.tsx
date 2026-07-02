import { useState } from "react";
import { useCreateEstimate } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, Phone, Mail, MapPin, Clock, Shield, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GATE_TYPES = [
  { value: "sliding_gate", label: "Sliding Gate" },
  { value: "single_gate", label: "Single Swing Gate" },
  { value: "dual_gate", label: "Dual Swing Gate" },
  { value: "commercial", label: "Commercial Gate" },
  { value: "access_control", label: "Access Control System" },
  { value: "intercom", label: "Intercom / Video System" },
  { value: "repair", label: "Gate Repair" },
  { value: "maintenance", label: "Maintenance Service" },
  { value: "new_installation", label: "New Installation (Other)" },
];

const STEPS = ["Your Info", "Property", "Service", "Review"];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  gateType: string;
  description: string;
  acceptedTerms: boolean;
}

const INITIAL: FormData = {
  firstName: "", lastName: "", email: "", phone: "",
  propertyAddress: "", city: "", state: "GA", zip: "",
  gateType: "", description: "", acceptedTerms: false,
};

export default function RequestEstimatePage() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [estimateNumber, setEstimateNumber] = useState("");
  const createMut = useCreateEstimate();

  function set(key: keyof FormData, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function canProceed() {
    if (step === 0) return form.firstName && form.lastName && form.email && form.phone;
    if (step === 1) return form.propertyAddress && form.city && form.state && form.zip;
    if (step === 2) return !!form.gateType;
    if (step === 3) return form.acceptedTerms;
    return true;
  }

  async function submit() {
    try {
      const result = await createMut.mutateAsync({
        data: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          propertyAddress: form.propertyAddress,
          city: form.city,
          state: form.state,
          zip: form.zip,
          gateType: form.gateType as any,
          description: form.description || undefined,
          acceptedTerms: form.acceptedTerms,
        }
      });
      setEstimateNumber((result as any).estimateNumber ?? "");
      setSubmitted(true);
    } catch {
      toast({ title: "Submission failed", description: "Please try again or call us directly.", variant: "destructive" });
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Request Submitted!</h1>
            <p className="text-muted-foreground mt-2">We'll contact you within 1 business day to schedule your free site visit.</p>
          </div>
          {estimateNumber && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Your Estimate Reference</p>
              <p className="text-2xl font-mono font-bold text-primary">{estimateNumber}</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-4 text-left space-y-3">
            <p className="font-semibold text-sm">What happens next?</p>
            {[
              "Our team reviews your request (within a few hours)",
              "We call to confirm details & schedule a site visit ($150 fee)",
              "On-site inspection & detailed written estimate",
              "You approve and we schedule installation",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setForm(INITIAL); setStep(0); setSubmitted(false); }}>
              Submit Another
            </Button>
            <Link href="/login">
              <Button className="flex-1 w-full">
                Track Your Estimate <ChevronRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Questions? Call <a href="tel:4045550100" className="text-primary font-medium">(404) 555-0100</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#C9A84C] to-[#a0832a] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-black font-bold text-sm font-serif">AG</span>
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Automatic Gate & Entryways</p>
              <p className="text-xs text-muted-foreground">Free Estimate Request</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Phone size={12} /> (404) 555-0100</span>
            <Link href="/login">
              <Button variant="outline" size="sm">Client Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Trust signals */}
          <div className="hidden lg:block space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold leading-tight">
                Get Your Free<br />Estimate Today
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                Atlanta's premier gate installation and repair specialists. Serving the metro area since 2012.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: <Star size={16} />, title: "4.9 Star Rating", desc: "500+ satisfied customers" },
                { icon: <Shield size={16} />, title: "Licensed & Insured", desc: "Full liability coverage" },
                { icon: <Clock size={16} />, title: "Fast Response", desc: "Reply within 1 business day" },
                { icon: <MapPin size={16} />, title: "Atlanta Metro", desc: "60-mile service radius" },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-border rounded-xl p-4 bg-card space-y-3">
              <p className="font-semibold text-sm">Contact Us Directly</p>
              <a href="tel:4045550100" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone size={14} /> (404) 555-0100
              </a>
              <a href="mailto:info@automaticgate.com" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail size={14} /> info@automaticgate.com
              </a>
              <p className="text-xs text-muted-foreground">Mon–Fri 7am–7pm · Sat 8am–5pm · Emergency 24/7</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">Site Visit Fee: $150</p>
              <p className="text-xs text-muted-foreground mt-1">
                Waived when you proceed with installation. Covers travel, inspection, and your written estimate.
              </p>
            </div>
          </div>

          {/* Right: Multi-step form */}
          <div className="lg:col-span-2">
            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    i < step ? "bg-green-500 text-white" :
                    i === step ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {i < step ? <CheckCircle size={16} /> : i + 1}
                  </div>
                  <span className={cn("text-sm font-medium hidden sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>
                    {s}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={cn("h-0.5 flex-1 min-w-8 transition-colors", i < step ? "bg-green-500" : "bg-border")} />
                  )}
                </div>
              ))}
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-6 space-y-5">
                {/* Step 0: Contact Info */}
                {step === 0 && (
                  <>
                    <div>
                      <h3 className="text-xl font-serif font-bold">Your Contact Information</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">We'll use this to follow up with your estimate.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>First Name <span className="text-destructive">*</span></Label>
                        <Input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Sarah" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Last Name <span className="text-destructive">*</span></Label>
                        <Input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Johnson" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email Address <span className="text-destructive">*</span></Label>
                      <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number <span className="text-destructive">*</span></Label>
                      <Input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(404) 555-0100" />
                    </div>
                  </>
                )}

                {/* Step 1: Property */}
                {step === 1 && (
                  <>
                    <div>
                      <h3 className="text-xl font-serif font-bold">Property Address</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Where will the gate be installed or serviced?</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Street Address <span className="text-destructive">*</span></Label>
                      <Input value={form.propertyAddress} onChange={e => set("propertyAddress", e.target.value)} placeholder="123 Main St" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label>City <span className="text-destructive">*</span></Label>
                        <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Atlanta" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>State <span className="text-destructive">*</span></Label>
                        <Input value={form.state} onChange={e => set("state", e.target.value)} placeholder="GA" maxLength={2} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>ZIP Code <span className="text-destructive">*</span></Label>
                      <Input value={form.zip} onChange={e => set("zip", e.target.value)} placeholder="30301" maxLength={5} className="max-w-36" />
                    </div>
                  </>
                )}

                {/* Step 2: Service */}
                {step === 2 && (
                  <>
                    <div>
                      <h3 className="text-xl font-serif font-bold">Service Type</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Tell us about what you need.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gate / Service Type <span className="text-destructive">*</span></Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {GATE_TYPES.map(g => (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => set("gateType", g.value)}
                            className={cn(
                              "p-3 rounded-lg border text-left text-sm font-medium transition-all",
                              form.gateType === g.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 hover:bg-accent/30"
                            )}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Additional Details <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Textarea
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                        placeholder="Tell us more — gate width, material preference, existing equipment, urgency, etc."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <>
                    <div>
                      <h3 className="text-xl font-serif font-bold">Review & Submit</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Please confirm your information before submitting.</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-4 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{form.firstName} {form.lastName}</p></div>
                        <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{form.phone}</p></div>
                        <div className="col-span-2"><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{form.email}</p></div>
                        <div className="col-span-2"><p className="text-xs text-muted-foreground">Property</p><p className="font-medium">{form.propertyAddress}, {form.city}, {form.state} {form.zip}</p></div>
                        <div><p className="text-xs text-muted-foreground">Service</p><p className="font-medium capitalize">{form.gateType.replace(/_/g, " ")}</p></div>
                      </div>
                      {form.description && (
                        <div><p className="text-xs text-muted-foreground">Details</p><p className="text-sm">{form.description}</p></div>
                      )}
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
                      <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Site Visit Fee: $150</p>
                      <p className="text-muted-foreground text-xs">
                        Submitting this form does not charge your card. The $150 site visit fee is collected when we schedule your in-person estimate. This fee is waived if you move forward with installation.
                      </p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div
                        onClick={() => set("acceptedTerms", !form.acceptedTerms)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                          form.acceptedTerms ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                        )}
                      >
                        {form.acceptedTerms && <CheckCircle size={13} className="text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        I understand the $150 site visit fee and agree to be contacted by Automatic Gate & Entryways regarding my estimate request. <span className="text-destructive">*</span>
                      </span>
                    </label>
                  </>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => step > 0 ? setStep(s => s - 1) : undefined}
                    disabled={step === 0}
                    className="gap-2"
                  >
                    <ArrowLeft size={14} /> Back
                  </Button>
                  <div className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</div>
                  {step < STEPS.length - 1 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                      Continue <ChevronRight size={14} className="ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={submit} disabled={!canProceed() || createMut.isPending} className="bg-green-600 hover:bg-green-700">
                      {createMut.isPending ? "Submitting…" : "Submit Request ✓"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mobile trust signals */}
            <div className="lg:hidden mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: <Star size={14} />, text: "4.9 Stars — 500+ reviews" },
                { icon: <Shield size={14} />, text: "Licensed & Insured" },
                { icon: <Clock size={14} />, text: "24/7 Emergency Service" },
                { icon: <Phone size={14} />, text: "(404) 555-0100" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg p-2.5">
                  <span className="text-primary">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
