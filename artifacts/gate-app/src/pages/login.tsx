import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getRoleHomeRoute } from "@/lib/role-home";
import { Eye, EyeOff, ShieldCheck, ChevronRight } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@automaticgate.com", password: "admin123", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", description: "Full system access" },
  { role: "Manager", email: "manager@automaticgate.com", password: "manager123", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", description: "Manage jobs & estimates" },
  { role: "Supervisor", email: "supervisor@automaticgate.com", password: "supervisor123", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", description: "Field supervision" },
  { role: "Crew", email: "crew@automaticgate.com", password: "crew123", color: "bg-green-500/20 text-green-400 border-green-500/30", description: "Job assignments" },
  { role: "Client", email: "client@automaticgate.com", password: "client123", color: "bg-gray-500/20 text-gray-300 border-gray-500/30", description: "Client portal" },
];

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await login({ email, password });
      setLocation(getRoleHomeRoute(response.user.role));
    } catch {
      toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
    }
  }

  async function handleDemoLogin(demoEmail: string, demoPassword: string) {
    try {
      const response = await login({ email: demoEmail, password: demoPassword });
      setLocation(getRoleHomeRoute(response.user.role));
    } catch {
      toast({ title: "Demo login failed", description: "Please try again.", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#111111] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#111] to-[#1a1a1a]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9A84C]/5 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#C9A84C] to-[#a0832a] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-black font-bold text-3xl font-serif">AG</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-3">
            Automatic Gate<br />&amp; Entryways
          </h1>
          <p className="text-white/50 text-lg">Enterprise Field Service Management</p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
            {[
              ["Estimates", "Track & convert"],
              ["Invoicing", "Automated billing"],
              ["Job Dispatch", "Real-time tracking"],
              ["Analytics", "Revenue insights"],
            ].map(([title, desc]) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-[#C9A84C] font-semibold text-sm">{title}</p>
                <p className="text-white/50 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <div className="w-14 h-14 bg-gradient-to-br from-[#C9A84C] to-[#a0832a] rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-black font-bold text-xl font-serif">AG</span>
            </div>
            <h1 className="text-2xl font-serif font-bold">Automatic Gate & Entryways</h1>
          </div>

          {/* Login form */}
          <Card className="border-border shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-serif">Welcome back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(s => !s)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={isLoggingIn}>
                  {isLoggingIn ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo accounts */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                Demo Accounts — Click to Login
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={isLoggingIn}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors text-left group"
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${account.color} min-w-[72px] text-center`}>
                    {account.role}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-foreground/80 truncate">{account.email}</p>
                    <p className="text-xs text-muted-foreground">{account.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
