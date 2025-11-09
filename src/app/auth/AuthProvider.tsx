/**
 * Authentication context provider
 *
 * Provides auth state, user info, and role management
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabaseReady, getSupabaseOrNull } from "@/lib/supabase/client";
import { EnvErrorScreen } from "@/components/dev/EnvErrorScreen";

export type UserRole =
  | "Owner"
  | "Purchaser"
  | "Tenant"
  | "Surveyor"
  | "Agent"
  | "Conveyancer"
  | "Admin"
  | "Partner";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  isLoading: boolean;
  setRoles: (roles: UserRole[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  suspenseFallback?: ReactNode;
}

export function AuthProvider({ children, suspenseFallback }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRolesState] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get supabase client (hooks must be called before any returns)
  const supabase = supabaseReady ? getSupabaseOrNull() : null;

  useEffect(() => {
    // If environment not ready or supabase not available, don't initialize
    if (!supabaseReady || !supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Extract roles from user metadata
      const userRoles = session?.user?.user_metadata?.roles as UserRole[] | undefined;
      setRolesState(userRoles && userRoles.length > 0 ? userRoles : ["Owner"]);

      setIsLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Extract roles from user metadata
      const userRoles = session?.user?.user_metadata?.roles as UserRole[] | undefined;
      setRolesState(userRoles && userRoles.length > 0 ? userRoles : ["Owner"]);

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const setRoles = (newRoles: UserRole[]) => {
    setRolesState(newRoles);
  };

  // If environment not ready, show error screen (after hooks)
  if (!supabaseReady || !supabase) {
    return <EnvErrorScreen />;
  }

  if (isLoading && suspenseFallback) {
    return <>{suspenseFallback}</>;
  }

  return (
    <AuthContext.Provider value={{ user, session, roles, isLoading, setRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user has required role(s)
 *
 * @param required Single role or array of roles (user needs at least one)
 */
export function useHasRole(required: UserRole | UserRole[]): boolean {
  const { roles } = useAuth();

  const requiredArray = Array.isArray(required) ? required : [required];

  // Admin has access to everything
  if (roles.includes("Admin")) return true;

  // Check if user has at least one required role
  return requiredArray.some((role) => roles.includes(role));
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { session } = useAuth();
  return session !== null;
}
