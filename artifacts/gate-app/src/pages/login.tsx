import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getRoleHomeRoute } from "@/lib/role-home";
import { Eye, EyeOff } from "lucide-react";

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

        </div>
      </div>
    </div>
  );
}
