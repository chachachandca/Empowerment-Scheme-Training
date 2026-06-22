import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import logoPath from "@assets/IMG-20260622-WA0001_1782115480105.jpg";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const adminLogin = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Please enter username and password", variant: "destructive" });
      return;
    }
    adminLogin.mutate({ data: { username, password } }, {
      onSuccess: () => {
        toast({ title: "Login successful" });
        setLocation("/admin");
      },
      onError: () => toast({ title: "Invalid username or password", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <img src={logoPath} alt="NES Logo" className="h-14 w-14 rounded-full border-2 border-white/40 object-cover flex-shrink-0" />
          <div>
            <h1 className="font-bold text-lg leading-tight">NATIONAL EMPOWERMENT SCHEME</h1>
            <p className="text-primary-foreground/80 text-xs">Training and Vocational Skills Registration Portal</p>
          </div>
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoComplete="username"
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
                    placeholder="Enter password"
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
                disabled={adminLogin.isPending}
                data-testid="button-login"
              >
                <Lock className="w-4 h-4 mr-2" />
                {adminLogin.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            This portal is restricted to authorized administrators only.
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
