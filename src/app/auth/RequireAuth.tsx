/**
 * Route guard that requires authentication
 */

import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface RequireAuthProps {
  children: ReactNode;
  suspenseFallback?: ReactNode;
}

export function RequireAuth({ children, suspenseFallback }: RequireAuthProps) {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
    }
  }, [session, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      suspenseFallback || (
        <div className="min-h-screen bg-background p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
