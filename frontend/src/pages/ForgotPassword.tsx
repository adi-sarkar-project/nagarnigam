import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { forgotPassword } from "@/api/auth";
import { toast } from "sonner";
import ashokaChakra from "@/assets/ashoka-chakra.png";
import atmanirbhar from "@/assets/atmanirbhar-bharat.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      toast.success(response.message);
      setSent(true);
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              <Link to="/login">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-glow ring-1 ring-border">
              <img
                src={ashokaChakra}
                alt="Ashoka Chakra"
                width={56}
                height={56}
                className="h-14 w-14"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Forgot Password?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your registered email address to receive an OTP
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              भारत सरकार · Government of India
            </p>
          </div>

          <Card className="border-border/60 shadow-elegant">
            <CardContent className="p-6">
              {sent ? (
                <div className="text-center py-6">
                  <p className="text-lg font-semibold text-foreground">
                    OTP Sent!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Redirecting you to reset password page...
                  </p>
                </div>
              ) : (
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

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gradient-saffron text-primary-foreground hover:opacity-90"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              )}
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
