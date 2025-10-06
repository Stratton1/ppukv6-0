/**
 * Route guard that requires specific role(s)
 */

import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useHasRole, UserRole } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface RequireRoleProps {
  children: ReactNode;
  roles: UserRole[];
  suspenseFallback?: ReactNode;
}

export function RequireRole({ children, roles, suspenseFallback }: RequireRoleProps) {
  const { isLoading } = useAuth();
  const hasRole = useHasRole(roles);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !hasRole) {
      toast({
        title: "Access Denied",
        description: `This page requires one of: ${roles.join(", ")}`,
        variant: "destructive",
      });
      navigate("/dashboard", { replace: true });
    }
  }, [hasRole, isLoading, navigate, toast, roles]);

  if (isLoading) {
    return (
      suspenseFallback || (
        <div className="min-h-screen bg-background p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      )
    );
  }

  if (!hasRole) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
