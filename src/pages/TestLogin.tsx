import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { User, Home } from "lucide-react";

const TestLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const testUsers = [
    {
      email: "owner@ppuk.test",
      password: "password123",
      role: "owner",
      name: "Test Owner",
      description: "Property owner with 2 claimed properties",
    },
    {
      email: "buyer@ppuk.test",
      password: "password123",
      role: "buyer",
      name: "Test Buyer",
      description: "Property buyer searching for homes",
    },
  ];

  const handleTestLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Logged in",
        description: `Signed in as ${email}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please try manual login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Test User Login</h1>
            <p className="text-muted-foreground">
              Quick login with pre-configured test accounts
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testUsers.map((user) => (
              <Card key={user.email} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {user.role === "owner" ? (
                      <Home className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-secondary" />
                    )}
                    <CardTitle>{user.name}</CardTitle>
                  </div>
                  <CardDescription>{user.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-mono">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <span className="font-mono">{user.password}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="capitalize font-medium">{user.role}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleTestLogin(user.email, user.password)}
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : `Login as ${user.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-dashed">
            <CardContent className="py-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Or use the standard login page
              </p>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Go to Login Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;