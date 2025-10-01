import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DevAuthBypassProps {
  enabled?: boolean;
}

export const DevAuthBypass = ({ enabled = true }: DevAuthBypassProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!enabled) return null;

  const bypassLogin = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Dev Bypass Success",
        description: `Logged in as ${name}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Bypass Failed",
        description: error.message || "Could not bypass login",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-dashed border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-lg">DEV MODE: Quick Login</CardTitle>
        </div>
        <CardDescription>
          Development bypass for rapid testing (hidden in production)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid gap-2 md:grid-cols-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => bypassLogin("owner@ppuk.test", "password123", "Test Owner")}
          >
            <Home className="h-4 w-4" />
            Login as Owner
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => bypassLogin("buyer@ppuk.test", "password123", "Test Buyer")}
          >
            <User className="h-4 w-4" />
            Login as Buyer
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Credentials: owner@ppuk.test / buyer@ppuk.test | password123
        </p>
      </CardContent>
    </Card>
  );
};
