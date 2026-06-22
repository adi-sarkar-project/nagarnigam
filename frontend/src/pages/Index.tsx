import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Shield, Users, UserPlus, LogIn } from "lucide-react";
import ashokaChakra from "@/assets/ashoka-chakra.png";
import atmanirbhar from "@/assets/atmanirbhar-bharat.png";

export default function Index() {
  const { user } = useAuth();

  // Redirect logged-in users to their dashboard
  if (user) {
    let redirectPath = "/citizen";
    if (user.role === "admin") {
      redirectPath = "/admin";
    } else if (user.role === "staff") {
      redirectPath = "/staff";
    }
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="tricolor-stripe" />

      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-glow ring-1 ring-border">
              <img src={ashokaChakra} alt="Ashoka Chakra" width={56} height={56} className="h-14 w-14" />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">URBANRESOLVE</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Municipal Complaint Management Portal
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              भारत सरकार · Government of India
            </p>
          </div>

          {/* Three Panels */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Citizen Panel */}
            <Card className="border-border/60 shadow-elegant">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Citizen Portal</h2>
                    <p className="text-xs text-muted-foreground">For residents and citizens</p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                  Register complaints about civic issues in your area. Track progress and view resolution updates.
                </p>

                <div className="space-y-2">
                  <Button asChild className="w-full gradient-saffron text-primary-foreground hover:opacity-90">
                    <Link to="/register">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/login?type=citizen">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Staff Panel */}
            <Card className="border-border/60 shadow-elegant">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Staff Portal</h2>
                    <p className="text-xs text-muted-foreground">For municipal staff</p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                  View assigned complaints and resolve them with after photos.
                </p>

                <div className="space-y-2">
                  <Button asChild className="w-full bg-orange-600 text-white hover:bg-orange-700">
                    <Link to="/staff/register">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/staff/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Panel */}
            <Card className="border-border/60 shadow-elegant">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Admin Portal</h2>
                    <p className="text-xs text-muted-foreground">For municipal officials</p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                  Manage and resolve citizen complaints. Approve staff accounts and assign cities.
                </p>

                <div className="space-y-2">
                  <Button asChild className="w-full gradient-green text-success-foreground hover:opacity-90">
                    <Link to="/login?type=admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Login
                    </Link>
                  </Button>
                </div>

                <p className="mt-3 text-xs text-center text-muted-foreground">
                  Pre-authorized accounts only
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm ring-1 ring-border">
            <img src={atmanirbhar} alt="" width={16} height={16} className="h-4 w-4" />
            <span className="hidden text-xs sm:inline">आत्मनिर्भर भारत</span>
            <span className="text-xs">·</span>
            <span className="text-xs">Atmanirbhar Bharat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
