import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components";
import { PropertyCard } from "@/components";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
  }, [searchParams]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const query = searchParams.get("q") || "";

      let supabaseQuery = supabase.from("properties").select("*").eq("is_public", true);

      if (query) {
        supabaseQuery = supabaseQuery.or(
          `address_line_1.ilike.%${query}%,postcode.ilike.%${query}%,city.ilike.%${query}%`
        );
      }

      const { data, error } = await supabaseQuery.limit(20);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              type="text"
              placeholder="Enter postcode, address, or area..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button type="button" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </form>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {loading ? "Searching..." : `${properties.length} properties found`}
            </h2>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No properties found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
            </div>
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

export default SearchResults;
