import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, User, Home, Image, FileText, LogOut, Zap } from "lucide-react";
import {
  ensureUser,
  ensureOwnerProperty,
  seedSamplePhoto,
  seedSampleDocument,
  oneClickDevSetup,
  debugPropertiesSchema,
  checkDatabaseMigrations,
  DevSeedResult,
} from "@/lib/dev/devSeed";

const TestLogin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DevSeedResult[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleAction = async (action: () => Promise<DevSeedResult>, description: string) => {
    setLoading(true);
    try {
      const result = await action();

      // Enhanced error display with code, message, details, hint, and payload
      let displayMessage = result.message;
      if (result.error) {
        displayMessage += `\nError: ${result.error}`;
      }
      if (result.data && typeof result.data === "object") {
        const errorDetails = result.data as any;
        if (errorDetails.code) displayMessage += `\nCode: ${errorDetails.code}`;
        if (errorDetails.details) displayMessage += `\nDetails: ${errorDetails.details}`;
        if (errorDetails.hint) displayMessage += `\nHint: ${errorDetails.hint}`;
        if (errorDetails.payload)
          displayMessage += `\nPayload: ${JSON.stringify(errorDetails.payload, null, 2)}`;
      }

      setResults(prev => [...prev, { ...result, message: displayMessage }]);

      // Refresh auth state if user-related action
      if (description.includes("Log In") || description.includes("Log Out")) {
        await checkAuth();
      }
    } catch (error: any) {
      let errorMessage = `${description}: ${error.message}`;
      if (error.code) errorMessage += `\nCode: ${error.code}`;
      if (error.details) errorMessage += `\nDetails: ${error.details}`;
      if (error.hint) errorMessage += `\nHint: ${error.hint}`;

      setResults(prev => [
        ...prev,
        {
          success: false,
          message: errorMessage,
          error: error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setResults(prev => [
        ...prev,
        {
          success: true,
          message: "Logged out successfully",
        },
      ]);
    } catch (error: any) {
      setResults(prev => [
        ...prev,
        {
          success: false,
          message: `Logout failed: ${error.message}`,
          error: error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  if (!import.meta.env.DEV) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Test Login is only available in development mode.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🧪 Test Login - Dev Tools</h1>
        <p className="text-muted-foreground">
          Development utilities for creating test users, properties, and sample data.
        </p>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Current User Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <Badge variant="outline">Logged In</Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">Not logged in</p>
          )}
        </CardContent>
      </Card>

      {/* One-Click Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            One-Click Dev Setup
          </CardTitle>
          <CardDescription>
            Creates owner user, property, sample photo, and document in one go
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => handleAction(oneClickDevSetup, "One-Click Setup")}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Setting up..." : "🚀 One-Click Dev Setup"}
          </Button>
        </CardContent>
      </Card>

      {/* Individual Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Actions</CardTitle>
          <CardDescription>Create users, properties, and sample data step by step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() =>
                handleAction(
                  () =>
                    ensureUser("owner@ppuk.test", "password123", {
                      full_name: "Test Owner",
                      role: "owner",
                    }),
                  "Create/Log In Owner"
                )
              }
              disabled={loading}
              variant="outline"
            >
              <User className="mr-2 h-4 w-4" />
              Create/Log In Owner
            </Button>

            <Button
              onClick={() =>
                handleAction(
                  () =>
                    ensureUser("buyer@ppuk.test", "password123", {
                      full_name: "Test Buyer",
                      role: "buyer",
                    }),
                  "Create/Log In Buyer"
                )
              }
              disabled={loading}
              variant="outline"
            >
              <User className="mr-2 h-4 w-4" />
              Create/Log In Buyer
            </Button>

            <Button
              onClick={() =>
                handleAction(() => ensureOwnerProperty(supabase, user), "Ensure Owner Property")
              }
              disabled={loading}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Ensure Owner Property
            </Button>

            <Button
              onClick={async () => {
                // First ensure property exists, then seed photo
                const propertyResult = await ensureOwnerProperty(supabase, user);
                if (propertyResult.success && propertyResult.data?.propertyId) {
                  await handleAction(
                    () => seedSamplePhoto(propertyResult.data.propertyId),
                    "Seed Sample Photo"
                  );
                } else {
                  setResults(prev => [
                    ...prev,
                    {
                      success: false,
                      message: "Seed Sample Photo: No property found. Create a property first.",
                      error: "No property ID",
                    },
                  ]);
                }
              }}
              disabled={loading}
              variant="outline"
            >
              <Image className="mr-2 h-4 w-4" />
              Seed Sample Photo
            </Button>

            <Button
              onClick={async () => {
                // First ensure property exists, then seed document
                const propertyResult = await ensureOwnerProperty(supabase, user);
                if (propertyResult.success && propertyResult.data?.propertyId) {
                  await handleAction(
                    () => seedSampleDocument(propertyResult.data.propertyId),
                    "Seed Sample Document"
                  );
                } else {
                  setResults(prev => [
                    ...prev,
                    {
                      success: false,
                      message: "Seed Sample Document: No property found. Create a property first.",
                      error: "No property ID",
                    },
                  ]);
                }
              }}
              disabled={loading}
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Seed Sample Document
            </Button>

            <Button onClick={handleLogout} disabled={loading} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>

            <Button
              onClick={() => handleAction(debugPropertiesSchema, "Debug Schema")}
              disabled={loading}
              variant="outline"
            >
              🔍 Debug Schema
            </Button>

            <Button
              onClick={() => handleAction(checkDatabaseMigrations, "Check Migrations")}
              disabled={loading}
              variant="outline"
            >
              🗄️ Check Migrations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((result, index) => (
              <Alert key={index} variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.message}
                  {result.data && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Navigate to other dev tools and pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <a href="/debug/storage">Debug Storage</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/dashboard">Dashboard</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/">Home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestLogin;
