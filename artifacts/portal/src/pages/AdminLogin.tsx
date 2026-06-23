import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import logoPath from "@assets/IMG-20260622-WA0001_1782115480105.jpg";
import { signInAdmin } from "@/lib/adminAuth";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please enter your email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      toast({ title: "Login successful" });
      setLocation("/admin");
    } catch (err) {
      toast({ title: "Login failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="flex items-center gap-4 group">
            <img src={logoPath} alt="NES Logo" className="h-14 w-14 rounded-full border-2 border-white/40 object-cover flex-shrink-0 transition-transform group-hover:scale-105" />
            <div>
              <h1 className="font-bold text-lg leading-tight group-hover:underline">NATIONAL EMPOWERMENT SCHEME</h1>
              <p className="text-primary-foreground/80 text-xs">Training and Vocational Skills Registration Portal</p>
            </div>
          </a>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Admin Portal</h2>
            <p className="text-muted-foreground text-sm mt-1">Authorized personnel only</p>
          </div>

          <div className="bg-card border border-card-border rounded-xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-testid="button-login"
              >
                <Lock className="w-4 h-4 mr-2" />
                {loading ? "Signing in..." : "Sign In with Supabase"}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Authentication is powered by Supabase. This portal is restricted to
            authorized administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
