/**
 * Debug page for environment variables
 * 
 * Only accessible in development mode
 */

import { isDevelopment, getEnvDebugInfo, envMissingReason } from "@/lib/env";
import { supabaseReady } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Navigate } from "react-router-dom";

export default function DebugEnv() {
  // Only accessible in development
  if (!isDevelopment()) {
    return <Navigate to="/" replace />;
  }

  const debugInfo = getEnvDebugInfo();
  const errors = envMissingReason();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Environment Debug</h1>
            <p className="text-muted-foreground">
              Diagnostic information for environment variables and Supabase connection
            </p>
          </div>

          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {supabaseReady ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Supabase Client:</span>
                  <Badge variant={supabaseReady ? "default" : "destructive"}>
                    {supabaseReady ? "Ready" : "Not Initialized"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Environment:</span>
                  <Badge variant="outline">{debugInfo.VITE_APP_ENV.value}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Build Mode:</span>
                  <Badge variant="outline">{debugInfo.MODE}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Presence and basic info (secrets are never displayed)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <EnvVarRow
                  name="VITE_SUPABASE_URL"
                  present={debugInfo.VITE_SUPABASE_URL.present}
                  length={debugInfo.VITE_SUPABASE_URL.length}
                  preview={debugInfo.VITE_SUPABASE_URL.preview}
                />
                <EnvVarRow
                  name="VITE_SUPABASE_PUBLISHABLE_KEY"
                  present={debugInfo.VITE_SUPABASE_PUBLISHABLE_KEY.present}
                  length={debugInfo.VITE_SUPABASE_PUBLISHABLE_KEY.length}
                />
                <EnvVarRow
                  name="VITE_SUPABASE_ANON_KEY"
                  present={debugInfo.VITE_SUPABASE_ANON_KEY.present}
                  length={debugInfo.VITE_SUPABASE_ANON_KEY.length}
                  note="Legacy name (use PUBLISHABLE_KEY)"
                />
                <EnvVarRow
                  name="VITE_APP_ENV"
                  present={debugInfo.VITE_APP_ENV.present}
                  value={debugInfo.VITE_APP_ENV.value}
                />
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Fix</CardTitle>
              <CardDescription>
                If you're seeing errors, follow these steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-2">1. Local Development (.env.local)</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV=development`}
                </pre>
              </div>

              <div>
                <p className="font-medium mb-2">2. Restart dev server</p>
                <pre className="bg-muted p-3 rounded text-xs">npm run dev</pre>
              </div>

              <div>
                <p className="font-medium mb-2">3. Lovable Cloud</p>
                <p className="text-sm text-muted-foreground">
                  Environment variables are automatically injected. If missing, check that Supabase
                  is connected in the Lovable Cloud dashboard.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">4. Documentation</p>
                <p className="text-sm text-muted-foreground">
                  See <code className="text-xs bg-muted px-1 py-0.5 rounded">docs/ENV_AND_AUTH.md</code> for complete setup guide
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface EnvVarRowProps {
  name: string;
  present: boolean;
  length?: number;
  value?: string;
  preview?: string;
  note?: string;
}

function EnvVarRow({ name, present, length, value, preview, note }: EnvVarRowProps) {
  return (
    <div className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="space-y-1">
        <code className="text-sm font-mono">{name}</code>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      <div className="text-right space-y-1">
        {present ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Present</span>
            </div>
            {length !== undefined && (
              <p className="text-xs text-muted-foreground">Length: {length}</p>
            )}
            {value && (
              <p className="text-xs text-muted-foreground">{value}</p>
            )}
            {preview && (
              <p className="text-xs text-muted-foreground font-mono">{preview}</p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-600">Missing</span>
          </div>
        )}
      </div>
    </div>
  );
}
