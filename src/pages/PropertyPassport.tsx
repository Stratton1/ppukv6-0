import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import DocumentUploader from "@/components/property/DocumentUploader";
import PhotoGallery from "@/components/property/PhotoGallery";
import APIPreviewCard from "@/components/property/APIPreviewCard";
import PassportScore from "@/components/property/PassportScore";
import { mockEPCData, mockFloodData, mockHMLRData, mockPlanningData } from "@/lib/apis/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, MapPin, FileText, TrendingUp, Clock } from "lucide-react";

const PropertyPassport = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: propertyData, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProperty(propertyData);
      setIsOwner(user?.id === propertyData.claimed_by);

      // Fetch documents
      const { data: docsData } = await supabase
        .from("documents")
        .select("*")
        .eq("property_id", id);
      
      setDocuments(docsData || []);

      // Fetch photos
      const { data: photosData } = await supabase
        .from("property_photos")
        .select("*")
        .eq("property_id", id);
      
      setPhotos(photosData || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Link to="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.address_line_1}</h1>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{property.city}, {property.postcode}</span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {property.ppuk_reference}
              </Badge>
              <p className="text-sm text-muted-foreground">
                PPUK Reference
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="aspect-[21/9] bg-muted rounded-lg overflow-hidden">
            {property.front_photo_url ? (
              <img
                src={property.front_photo_url}
                alt={property.address_line_1}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="apis">Data</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Property Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold capitalize">{property.property_type.replace('_', ' ')}</p>
                  {property.property_style && (
                    <p className="text-sm text-muted-foreground capitalize mt-1">
                      {property.property_style.replace('_', ' ')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Bedrooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{property.bedrooms || "N/A"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Floor Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {property.total_floor_area_sqm ? `${property.total_floor_area_sqm} m²` : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">EPC Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{property.epc_rating || "N/A"}</p>
                    {property.epc_score && (
                      <p className="text-sm text-muted-foreground">Score: {property.epc_score}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tenure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold capitalize">{property.tenure}</p>
                  {property.tenure === 'leasehold' && property.lease_years_remaining && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {property.lease_years_remaining} years remaining
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Flood Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{property.flood_risk_level || "Unknown"}</p>
                </CardContent>
              </Card>
            </div>

            {property.title_number && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Title Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-mono">{property.title_number}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs" className="space-y-4">
            {isOwner && (
              <div className="grid md:grid-cols-2 gap-6">
                <DocumentUploader propertyId={property.id} onUploadComplete={fetchProperty} />
                <PassportScore property={property} documents={documents} photos={photos} />
              </div>
            )}
            
            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No documents uploaded</p>
                  <p className="text-muted-foreground">
                    {isOwner ? "Upload documents to complete your property passport" : "Documents will appear here once uploaded"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <CardTitle className="text-base capitalize">
                        {doc.document_type.replace('_', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{doc.file_name}</p>
                      {doc.file_size_bytes && (
                        <p className="text-xs text-muted-foreground">
                          Size: {(doc.file_size_bytes / 1024).toFixed(2)} KB
                        </p>
                      )}
                      {doc.description && (
                        <p className="text-sm mb-2 mt-2">{doc.description}</p>
                      )}
                      {doc.ai_summary && (
                        <p className="text-sm italic text-muted-foreground mb-2">{doc.ai_summary}</p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={async () => {
                          try {
                            // Extract file path from URL
                            const url = new URL(doc.file_url);
                            const pathParts = url.pathname.split('/');
                            const filePath = pathParts.slice(pathParts.indexOf('property-documents') + 1).join('/');
                            
                            // Generate signed URL for private bucket
                            const { data, error } = await supabase.storage
                              .from('property-documents')
                              .createSignedUrl(filePath, 3600); // 1 hour expiry

                            if (error) throw error;
                            
                            window.open(data.signedUrl, '_blank');
                          } catch (error) {
                            console.error('Download error:', error);
                            toast({
                              title: "Error",
                              description: "Failed to generate download link",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Download Document
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <PhotoGallery propertyId={property.id} canUpload={isOwner} />
          </TabsContent>

          {/* APIs Tab */}
          <TabsContent value="apis" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <APIPreviewCard
                title="EPC Certificate"
                description="Energy Performance Certificate data"
                data={mockEPCData}
                type="epc"
              />
              <APIPreviewCard
                title="Flood Risk"
                description="Environment Agency flood risk assessment"
                data={mockFloodData}
                type="flood"
              />
              <APIPreviewCard
                title="Title Information"
                description="HM Land Registry title summary"
                data={mockHMLRData}
                type="hmlr"
              />
              <APIPreviewCard
                title="Planning History"
                description="Local authority planning applications"
                data={mockPlanningData}
                type="planning"
              />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Property history coming soon</p>
                <p className="text-muted-foreground">
                  Previous sales, planning applications, and more
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">AI insights coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PropertyPassport;