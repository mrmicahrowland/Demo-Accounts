import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHomeRoute } from "@/lib/role-home";

interface ProtectedRouteProps {
  roles?: string[];
  children: React.ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    } else if (!isLoading && isAuthenticated && roles && roles.length > 0) {
      if (!roles.includes(user?.role || "")) {
        setLocation(getRoleHomeRoute(user?.role ?? ""));
      }
    }
  }, [isLoading, isAuthenticated, user, roles, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role || "")) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
