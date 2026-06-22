import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, UserPlus, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import RedirectLoader from "@/components/RedirectLoader";
import ashokaChakra from "@/assets/ashoka-chakra.png";
import atmanirbhar from "@/assets/atmanirbhar-bharat.png";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      setLoading(false);
      toast.success("Account created! Waiting for admin approval.");
      setRedirecting(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error: unknown) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      if (errorMessage.includes("already exists")) {
        toast.error("An account with this email already exists");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (redirecting) {
    return <RedirectLoader message="Account created — waiting for admin approval..." />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="tricolor-stripe" />

      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-glow ring-1 ring-border">
              <img src={ashokaChakra} alt="Ashoka Chakra" width={56} height={56} className="h-14 w-14" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create Citizen Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join your city's complaint management system
            </p>
          </div>

          <Card className="border-border/60 shadow-elegant">
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
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
                      placeholder="At least 6 characters"
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
                  className="w-full gradient-saffron text-primary-foreground hover:opacity-90"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? "Creating account..." : "Register"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-navy hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <img src={atmanirbhar} alt="" width={20} height={20} className="h-5 w-5" loading="lazy" />
            <span className="text-xs font-semibold tracking-wide text-foreground">
              आत्मनिर्भर भारत · ATMANIRBHAR BHARAT
            </span>
          </div>
        </div>
      </div>

      <div className="tricolor-stripe" />
    </div>
  );
}
