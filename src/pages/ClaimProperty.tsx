import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Home } from "lucide-react";

const ClaimProperty = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    postcode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    propertyType: "",
    propertyStyle: "",
    bedrooms: "",
    bathrooms: "",
    floorArea: "",
    yearBuilt: "",
    tenure: "freehold",
    titleNumber: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to claim a property",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("properties")
        .insert([{
          address_line_1: formData.addressLine1,
          address_line_2: formData.addressLine2 || null,
          city: formData.city,
          postcode: formData.postcode.toUpperCase(),
          property_type: formData.propertyType as any,
          property_style: formData.propertyStyle as any || null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          total_floor_area_sqm: formData.floorArea ? parseFloat(formData.floorArea) : null,
          year_built: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
          tenure: formData.tenure as any,
          title_number: formData.titleNumber || null,
          claimed_by: user.id,
          completion_percentage: 30,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property claimed successfully!",
      });

      navigate(`/property/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Claim Your Property</h1>
          <p className="text-muted-foreground">
            Step {step} of 3: Let's get your property registered
          </p>
          <div className="w-full h-2 bg-muted rounded-full mt-4">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Property Address"}
              {step === 2 && "Property Details"}
              {step === 3 && "Additional Information"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter the address of the property you want to claim"}
              {step === 2 && "Tell us about your property"}
              {step === 3 && "Final details to complete your claim"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Address */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    placeholder="SW1A 1AA"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="123 Main Street"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apartment 4B"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="London"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Property Details */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detached">Detached</SelectItem>
                      <SelectItem value="semi_detached">Semi-Detached</SelectItem>
                      <SelectItem value="terraced">Terraced</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="bungalow">Bungalow</SelectItem>
                      <SelectItem value="cottage">Cottage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    placeholder="3"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    placeholder="2"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floorArea">Floor Area (m²)</Label>
                  <Input
                    id="floorArea"
                    type="number"
                    min="0"
                    placeholder="100"
                    value={formData.floorArea}
                    onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Step 3: Additional Info */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder="1990"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure *</Label>
                  <Select
                    value={formData.tenure}
                    onValueChange={(value) => setFormData({ ...formData, tenure: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freehold">Freehold</SelectItem>
                      <SelectItem value="leasehold">Leasehold</SelectItem>
                      <SelectItem value="shared_ownership">Shared Ownership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleNumber">Title Number</Label>
                  <Input
                    id="titleNumber"
                    placeholder="AB123456"
                    value={formData.titleNumber}
                    onChange={(e) => setFormData({ ...formData, titleNumber: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found on your title deeds (optional)
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={nextStep}
                  className="ml-auto"
                  disabled={
                    (step === 1 && (!formData.postcode || !formData.addressLine1 || !formData.city)) ||
                    (step === 2 && !formData.propertyType)
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="ml-auto">
                  {loading ? "Claiming..." : "Claim Property"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClaimProperty;