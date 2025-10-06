/**
 * Full-page error screen shown when environment is not configured
 */

import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { envMissingReason, getEnvDebugInfo } from "@/lib/env";

export function EnvErrorScreen() {
  const reasons = envMissingReason();
  const debugInfo = getEnvDebugInfo();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-3xl font-bold">Environment Not Configured</h1>
          <p className="text-muted-foreground">
            The application cannot start because required environment variables are missing or invalid.
          </p>
        </div>

        {/* Error Details */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Configuration</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {reasons.map((reason, i) => (
                <li key={i} className="text-sm">
                  {reason}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {/* Setup Instructions */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Local Development */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>Local Dev</Badge>
                Local Development
              </CardTitle>
              <CardDescription>Running on your machine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p className="font-medium">1. Create .env.local file</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  {`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
VITE_APP_ENV=development`}
                </pre>

                <p className="font-medium mt-4">2. Get values from Lovable Cloud</p>
                <p className="text-muted-foreground">
                  Copy SUPABASE_URL and SUPABASE_ANON_KEY from your .env file in the repo
                </p>

                <p className="font-medium mt-4">3. Restart dev server</p>
                <pre className="bg-muted p-3 rounded text-xs">npm run dev</pre>
              </div>
            </CardContent>
          </Card>

          {/* Lovable Cloud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Lovable Cloud</Badge>
                Lovable Cloud
              </CardTitle>
              <CardDescription>Deployed environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p className="font-medium">1. Environment variables are auto-set</p>
                <p className="text-muted-foreground">
                  Lovable Cloud automatically injects VITE_SUPABASE_* variables from your connected
                  Supabase project.
                </p>

                <p className="font-medium mt-4">2. Trigger a fresh build</p>
                <p className="text-muted-foreground">
                  If you just connected Supabase, trigger a new deployment to refresh environment
                  variables.
                </p>

                <p className="font-medium mt-4">3. Check backend connection</p>
                <p className="text-muted-foreground">
                  Open Lovable Cloud dashboard and verify Supabase is connected under "Backend"
                  settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Current environment state (no secrets shown)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span>VITE_SUPABASE_URL:</span>
                <span className={debugInfo.VITE_SUPABASE_URL.present ? "text-green-600" : "text-red-600"}>
                  {debugInfo.VITE_SUPABASE_URL.present ? "✓ Present" : "✗ Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VITE_SUPABASE_PUBLISHABLE_KEY:</span>
                <span
                  className={debugInfo.VITE_SUPABASE_PUBLISHABLE_KEY.present ? "text-green-600" : "text-red-600"}
                >
                  {debugInfo.VITE_SUPABASE_PUBLISHABLE_KEY.present ? "✓ Present" : "✗ Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VITE_APP_ENV:</span>
                <span>{debugInfo.VITE_APP_ENV.value || "not set"}</span>
              </div>
              <div className="flex justify-between">
                <span>MODE:</span>
                <span>{debugInfo.MODE}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <div className="text-center">
          <a
            href="/docs/ENV_AND_AUTH.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View full documentation: docs/ENV_AND_AUTH.md
          </a>
        </div>
      </div>
    </div>
  );
}
