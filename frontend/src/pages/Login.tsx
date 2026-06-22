import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  ArrowLeft,
  Shield,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import RedirectLoader from "@/components/RedirectLoader";
import ashokaChakra from "@/assets/ashoka-chakra.png";
import atmanirbhar from "@/assets/atmanirbhar-bharat.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginType = searchParams.get("type") || "citizen"; // admin, citizen, or staff
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState<null | "admin" | "citizen" | "staff">(
    null,
  );
  const isAdmin = loginType === "admin";
  const isStaff = loginType === "staff";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      setLoading(false);
      toast.success(`Welcome back, ${user.name}`);
      setRedirecting(user.role);
      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "staff") {
          navigate("/staff");
        } else {
          navigate("/citizen");
        }
      }, 1400);
    } catch (error: unknown) {
      setLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "Invalid email or password";
      toast.error(errorMessage);
    }
  };

  if (redirecting) {
    return (
      <RedirectLoader
        message={
          redirecting === "admin"
            ? "Redirecting to Admin Dashboard..."
            : redirecting === "staff"
              ? "Redirecting to Staff Panel..."
              : "Redirecting to Citizen Panel..."
        }
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="tricolor-stripe" />

      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <div className="mb-6 flex flex-col items-center text-center">
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-glow ring-1 ring-border ${isAdmin ? "bg-success/10" : ""}`}
            >
              <img
                src={ashokaChakra}
                alt="Ashoka Chakra"
                width={56}
                height={56}
                className="h-14 w-14"
              />
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Shield className="h-5 w-5 text-success" />
              ) : isStaff ? (
                <User className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
              <h1 className="text-2xl font-bold text-foreground">
                {isAdmin ? "Admin Login" : isStaff ? "Staff Login" : "Citizen Login"}
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin ? "Municipal Officials Only" : isStaff ? "Staff Portal" : "Citizen Portal"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              भारत सरकार · Government of India
            </p>
          </div>

          <Card className="border-border/60 shadow-elegant">
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-4">
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
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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
                  className={`w-full ${isAdmin ? "gradient-green text-success-foreground" : isStaff ? "bg-orange-600 text-white" : "gradient-saffron text-primary-foreground"} hover:opacity-90`}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading
                    ? "Signing in..."
                    : isAdmin
                      ? "Admin Sign In"
                      : isStaff
                        ? "Staff Sign In"
                        : "Sign In"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Forgot password?{" "}
                <Link
                  to="/forgot-password"
                  className="font-semibold text-navy hover:underline"
                >
                  Reset here
                </Link>
              </p>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                New citizen?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-navy hover:underline"
                >
                  Create an account
                </Link>
              </p>

              <p className="mt-3 text-center text-sm text-muted-foreground">
                Administrator?{" "}
                <Link
                  to="/admin/login"
                  className="font-semibold text-navy hover:underline"
                >
                  Admin login
                </Link>
              </p>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Staff?{" "}
                <Link
                  to="/staff/login"
                  className="font-semibold text-navy hover:underline"
                >
                  Staff login
                </Link>
              </p>
            </CardContent>
          </Card>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <img
              src={atmanirbhar}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5"
              loading="lazy"
            />
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
