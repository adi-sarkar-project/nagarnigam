import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

export default function ApprovalPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-border/60 shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {user.approvalStatus === "pending" || !user.isApproved ? (
                <>
                  <div className="flex justify-center">
                    <AlertCircle className="h-16 w-16 text-yellow-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="mb-2 text-xl font-bold text-foreground">Pending Approval</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Your account is under review by administrators. You will receive an email once your account has
                      been approved or rejected.
                    </p>
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left">
                      <p className="text-sm text-yellow-900">
                        <strong>What happens next?</strong>
                        <br />
                        Our team will review your registration. This usually takes 24–48 hours.
                      </p>
                    </div>
                  </div>
                </>
              ) : user.approvalStatus === "approved" ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="mb-2 text-xl font-bold text-green-600">Account Approved!</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {user.role === "staff" 
                        ? "You can now access the staff dashboard and manage complaints." 
                        : "You can now access the citizen dashboard and file complaints."}
                    </p>
                    <Button
                      onClick={() => navigate(user.role === "staff" ? "/staff" : "/citizen")}
                      className="w-full gradient-saffron text-primary-foreground hover:opacity-90"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <XCircle className="h-16 w-16 text-red-600" />
                  </div>
                  <div className="text-center">
                    <h2 className="mb-2 text-xl font-bold text-red-600">Account Rejected</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Unfortunately, your account request has been rejected.
                    </p>
                    {user.rejectionReason && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                        <p className="text-sm text-red-900">
                          <strong>Reason:</strong>
                          <br />
                          {user.rejectionReason}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      If you believe this is a mistake, please contact the administrator.
                    </p>
                  </div>
                </>
              )}

              <Button onClick={logout} variant="outline" className="w-full">
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
