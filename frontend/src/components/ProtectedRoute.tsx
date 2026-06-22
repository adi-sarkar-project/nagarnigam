import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import RedirectLoader from "@/components/RedirectLoader";
import type { Role } from "@/types/app";

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <RedirectLoader message="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    const redirectPath = 
      user.role === "admin" ? "/admin" :
      user.role === "staff" ? "/staff" :
      "/citizen";
    return <Navigate to={redirectPath} replace />;
  }

  // Check pending approval for both citizen and staff
  if (
    (user.role === "citizen" || user.role === "staff") &&
    user.approvalStatus === "pending" &&
    !user.isApproved
  ) {
    return <Navigate to="/approval-pending" replace />;
  }

  return <>{children}</>;
}
