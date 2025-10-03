import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Upload, Download, Database, Storage, CheckCircle, XCircle } from "lucide-react";

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
}

interface MediaItem {
  id: string;
  property_id: string;
  type: string;
  url: string;
  caption: string | null;
  created_at: string;
}

interface DocumentItem {
  id: string;
  property_id: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

const DebugStorage = () => {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load buckets
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) throw bucketsError;
      setBuckets(bucketsData || []);

      // Load media (photos)
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('type', 'photo')
        .order('created_at', { ascending: false })
        .limit(5);
      if (mediaError) {
        console.warn('Media table not found or no photos:', mediaError);
        setMedia([]);
      } else {
        setMedia(mediaData || []);
      }

      // Load documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id, property_id, file_name, mime_type, file_size_bytes, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (docsError) throw docsError;
      setDocuments(docsData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadTestPhoto = async () => {
    setUploading(true);
    try {
      // Get a test property ID
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .limit(1);
      
      if (propError || !properties || properties.length === 0) {
        throw new Error('No properties found. Please create a property first.');
      }

      const propertyId = properties[0].id;
      const fileName = `${propertyId}/test-photo-${Date.now()}.jpg`;
      
      // Create a simple test image (1x1 pixel JPEG)
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
      
      // Convert data URL to blob
      const response = await fetch(testImageData);
      const blob = await response.blob();
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(fileName, blob);
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(fileName);

      // Insert into media table
      const { error: mediaError } = await supabase
        .from('media')
        .insert({
          property_id: propertyId,
          type: 'photo',
          url: publicUrl,
          caption: 'Debug upload test',
        });

      if (mediaError) throw mediaError;

      toast({
        title: "Success",
        description: "Test photo uploaded successfully",
      });

      loadData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadTestDocument = async () => {
    setUploading(true);
    try {
      // Get a test property ID
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .limit(1);
      
      if (propError || !properties || properties.length === 0) {
        throw new Error('No properties found. Please create a property first.');
      }

      const propertyId = properties[0].id;
      const fileName = `${propertyId}/test-doc-${Date.now()}.pdf`;
      
      // Create a simple test PDF
      const testPdfData = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0K';
      
      // Convert data URL to blob
      const response = await fetch(testPdfData);
      const blob = await response.blob();
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, blob);
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      // Insert into documents table
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          property_id: propertyId,
          document_type: 'other',
          file_name: 'test-document.pdf',
          file_url: publicUrl,
          file_size_bytes: blob.size,
          mime_type: 'application/pdf',
          description: 'Debug upload test',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || 'debug-user',
        });

      if (docError) throw docError;

      toast({
        title: "Success",
        description: "Test document uploaded successfully",
      });

      loadData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const testSignedUrl = async (document: DocumentItem) => {
    try {
      // Extract path from URL
      const url = new URL(document.file_url);
      const path = url.pathname.split('/').slice(3).join('/'); // Remove /storage/v1/object/public/property-documents/
      
      const { data, error } = await supabase.storage
        .from('property-documents')
        .createSignedUrl(path, 3600);
      
      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        toast({
          title: "Success",
          description: "Signed URL generated and opened",
        });
      }
    } catch (error: any) {
      console.error('Signed URL error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getBucketStatus = (bucketId: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    return bucket ? (
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm">Found</span>
        <Badge variant={bucket.public ? "default" : "secondary"}>
          {bucket.public ? "Public" : "Private"}
        </Badge>
      </div>
    ) : (
      <div className="flex items-center space-x-2">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm">Not found</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading storage debug info...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Storage Debug Page</h1>
        <p className="text-muted-foreground">
          Debug storage buckets, media, and documents. Test uploads and signed URLs.
        </p>
      </div>

      {/* Buckets Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Storage className="mr-2 h-5 w-5" />
            Storage Buckets
          </CardTitle>
          <CardDescription>
            Status of property-photos and property-documents buckets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">property-photos</h4>
              {getBucketStatus('property-photos')}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">property-documents</h4>
              {getBucketStatus('property-documents')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Test Uploads
          </CardTitle>
          <CardDescription>
            Upload test files to verify storage and database integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={uploadTestPhoto} 
              disabled={uploading}
              className="flex items-center"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Test Photo
            </Button>
            <Button 
              onClick={uploadTestDocument} 
              disabled={uploading}
              variant="outline"
              className="flex items-center"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Test Document
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media (Photos) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Media Table (Photos)
          </CardTitle>
          <CardDescription>
            Last 5 photos from media table where type='photo'
          </CardDescription>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <Alert>
              <AlertDescription>
                No photos found in media table. Upload a test photo to see data here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {media.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <div className="font-medium">{item.caption || 'No caption'}</div>
                    <div className="text-sm text-muted-foreground">
                      Property: {item.property_id} | Type: {item.type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                  <img 
                    src={item.url} 
                    alt={item.caption || 'Photo'} 
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Documents Table
          </CardTitle>
          <CardDescription>
            Last 5 documents from documents table
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <Alert>
              <AlertDescription>
                No documents found. Upload a test document to see data here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <div className="font-medium">{doc.file_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Property: {doc.property_id} | Size: {doc.file_size_bytes ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB` : 'Unknown'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => testSignedUrl(doc)}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Test Signed URL
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SQL Verification Queries */}
      <Card>
        <CardHeader>
          <CardTitle>SQL Verification Queries</CardTitle>
          <CardDescription>
            Run these queries in Supabase SQL Editor to verify data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Check Buckets</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`SELECT id, name, public
FROM storage.buckets
WHERE id IN ('property-photos','property-documents');`}
            </pre>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Check Media (Photos)</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`SELECT id, property_id, type, url, caption, created_at
FROM media
WHERE type = 'photo'
ORDER BY created_at DESC
LIMIT 10;`}
            </pre>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Check Documents</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`SELECT id, property_id, file_name, mime_type, file_size_bytes, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugStorage;
