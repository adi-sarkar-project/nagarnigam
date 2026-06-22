import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import RedirectLoader from "@/components/RedirectLoader";
import ashokaChakra from "@/assets/ashoka-chakra.png";
import atmanirbhar from "@/assets/atmanirbhar-bharat.png";

export default function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        logout();
        toast.error("This portal is for administrators only. Please use citizen login.");
        setLoading(false);
        return;
      }
      setLoading(false);
      toast.success(`Welcome, ${user.name}`);
      setRedirecting(true);
      setTimeout(() => navigate("/admin"), 1400);
    } catch (error: unknown) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      toast.error(errorMessage);
    }
  };

  if (redirecting) {
    return <RedirectLoader message="Redirecting to Admin Dashboard..." />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="tricolor-stripe" />

      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-navy/5 via-background to-primary/5 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-glow ring-1 ring-border">
              <ShieldCheck className="h-10 w-10 text-navy" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Administrator Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">URBANRESOLVE · Municipal Administration</p>
          </div>

          <Card className="border-border/60 shadow-elegant">
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@urbanresolve.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy text-white hover:bg-navy/90"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? "Signing in..." : "Admin Sign In"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 font-semibold text-navy hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Citizen login
                </Link>
              </p>
            </CardContent>
          </Card>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <img src={ashokaChakra} alt="" width={20} height={20} className="h-5 w-5" loading="lazy" />
            <img src={atmanirbhar} alt="" width={20} height={20} className="h-5 w-5" loading="lazy" />
            <span className="text-xs font-semibold tracking-wide text-foreground">
              भारत सरकार · Government of India
            </span>
          </div>
        </div>
      </div>

      <div className="tricolor-stripe" />
    </div>
  );
}
