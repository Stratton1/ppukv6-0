import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Plus, LogOut } from "lucide-react";
import { PropertyCard } from "@/components";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    // Fetch user's properties
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("*")
      .eq("claimed_by", user.id);

    setProperties(propertiesData || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || "User"}</h1>
            <p className="text-muted-foreground mt-1">
              Role: {profile?.role?.toUpperCase() || "USER"}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/claim")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Claim Property
              </CardTitle>
              <CardDescription>Add a new property to your portfolio</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
              <CardDescription>{properties.length} claimed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{properties.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Completion</CardTitle>
              <CardDescription>Property passport progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {properties.length > 0
                  ? Math.round(
                      properties.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) /
                        properties.length
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Properties */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">My Properties</h2>
          {properties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No properties yet</p>
                <p className="text-muted-foreground mb-4">
                  Claim your first property to get started
                </p>
                <Button onClick={() => navigate("/claim")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Claim Property
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(property => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  address={property.address_line_1}
                  postcode={property.postcode}
                  city={property.city}
                  propertyType={property.property_type}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  floorArea={property.total_floor_area_sqm}
                  epcRating={property.epc_rating}
                  tenure={property.tenure}
                  frontPhotoUrl={property.front_photo_url}
                  ppukReference={property.ppuk_reference}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
