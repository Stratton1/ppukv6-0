/**
 * Development-only role impersonation bar
 * 
 * Allows switching roles without re-authenticating
 */

import { isDevelopment } from "@/lib/env";
import { useAuth, UserRole } from "@/app/auth/AuthProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

const ALL_ROLES: UserRole[] = [
  "Owner",
  "Purchaser",
  "Tenant",
  "Surveyor",
  "Agent",
  "Conveyancer",
  "Admin",
  "Partner",
];

export function ImpersonationBar() {
  const { roles, setRoles, user } = useAuth();

  // Only show in development
  if (!isDevelopment()) {
    return null;
  }

  // Only show when authenticated
  if (!user) {
    return null;
  }

  const currentRole = roles[0] || "Owner";

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            DEV MODE: Impersonating Role
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={currentRole}
            onValueChange={(value) => setRoles([value as UserRole])}
          >
            <SelectTrigger className="w-[180px] h-8 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className="bg-background">
            {user.email}
          </Badge>
        </div>
      </div>
    </div>
  );
}
