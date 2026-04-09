import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /** When true, only owners. When false, only players. When omitted, any authenticated user. */
  requireOwner?: boolean;
}

export function ProtectedRoute({ children, requireOwner }: ProtectedRouteProps) {
  const { user, token, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (requireOwner === true) {
    if (!user.is_owner) {
      return <Navigate to="/bookings" replace />;
    }
  } else if (requireOwner === false) {
    if (user.is_owner) {
      return <Navigate to="/owner/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
