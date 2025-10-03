import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  Image,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UploadCloud,
  HardDrive,
} from "lucide-react";

interface BucketInfo {
  id: string;
  status: "exists" | "missing" | "no-permission";
  sampleCount: number;
}

interface MediaItem {
  id: string;
  property_id: string;
  type?: string;
  url?: string;
  caption?: string;
  title?: string;
  mime_type?: string;
  file_name?: string;
  file_path?: string;
  file_size_bytes?: number;
  room_type?: string;
  uploaded_by?: string;
  created_at?: string;
}

interface DocumentItem {
  id: string;
  property_id: string;
  created_at: string;
  [key: string]: any; // Allow any additional fields
}

const DebugStorage = () => {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hasTypeColumn, setHasTypeColumn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const checkBucket = async (id: string): Promise<BucketInfo> => {
    const { data, error } = await supabase.storage.from(id).list("", { limit: 1 });
    if (!error) {
      return { id, status: "exists", sampleCount: data?.length ?? 0 };
    }
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("not found")) {
      return { id, status: "missing", sampleCount: 0 };
    }
    return { id, status: "no-permission", sampleCount: 0 };
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const errors: string[] = [];

    try {
      console.log("Starting data load...");

      // Check if type column exists using PostgREST probe
      const { error: typeError } = await supabase.from("media").select("type").limit(0);
      const typeColumnPresent = !typeError;
      setHasTypeColumn(typeColumnPresent);
      console.log("Type column present:", typeColumnPresent, typeError?.message ?? null);

      // Check buckets individually
      const bucketChecks = await Promise.all([
        checkBucket("property-photos"),
        checkBucket("property-documents"),
      ]);
      setBuckets(bucketChecks);
      console.log("Bucket checks:", bucketChecks);

      // Load media (photos) - try with type column first, fallback to mime_type
      let mediaData, mediaError;
      if (typeColumnPresent) {
        const result = await supabase
          .from("media")
          .select("*")
          .eq("type", "photo")
          .order("created_at", { ascending: false })
          .limit(5);
        mediaData = result.data;
        mediaError = result.error;
      } else {
        const result = await supabase
          .from("media")
          .select("*")
          .ilike("mime_type", "image/%")
          .order("created_at", { ascending: false })
          .limit(5);
        mediaData = result.data;
        mediaError = result.error;
      }

      if (mediaError) {
        console.warn("Media table not found or no photos:", mediaError);
        setMedia([]);
        errors.push(`Media load failed: ${mediaError.message}`);
      } else {
        setMedia(mediaData || []);
        console.log("Media loaded:", mediaData?.length ?? 0, "items");
      }

      // Load documents with schema-tolerant query
      const { data: docsData, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (docsError) {
        console.warn("Documents load failed:", docsError);
        setDocuments([]);
        errors.push(`Documents load failed: ${docsError.message}`);
      } else {
        setDocuments(docsData || []);
        console.log("Documents loaded:", docsData?.length ?? 0, "items");
      }

      // Set error if any loads failed
      if (errors.length > 0) {
        setError(errors[0]);
        toast({
          title: "Warning",
          description: errors[0],
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message);
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
      const { data: properties } = await supabase.from("properties").select("id").limit(1);

      if (!properties || properties.length === 0) {
        throw new Error("No properties found. Please create a property first.");
      }

      const propertyId = properties[0].id;

      // Create a test file
      const testFile = new File(["test photo content"], "test-photo.jpg", { type: "image/jpeg" });

      // Upload to storage
      const fileName = `${Date.now()}-test-photo.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("property-photos")
        .upload(`${propertyId}/${fileName}`, testFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("property-photos")
        .getPublicUrl(uploadData.path);

      // Save to media table
      const { error: dbError } = await supabase.from("media").insert({
        property_id: propertyId,
        type: "photo",
        url: urlData.publicUrl,
        caption: "Test photo uploaded via debug page",
        room_type: "test",
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || "test-user",
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Test photo uploaded successfully!",
      });

      // Reload data
      loadData();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Error",
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
      const { data: properties } = await supabase.from("properties").select("id").limit(1);

      if (!properties || properties.length === 0) {
        throw new Error("No properties found. Please create a property first.");
      }

      const propertyId = properties[0].id;

      // Create a test file
      const testFile = new File(["test document content"], "test-doc.pdf", {
        type: "application/pdf",
      });

      // Upload to storage
      const fileName = `${Date.now()}-test-doc.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(`${propertyId}/${fileName}`, testFile);

      if (uploadError) throw uploadError;

      // Save to documents table
      const { error: dbError } = await supabase.from("documents").insert({
        property_id: propertyId,
        document_type: "other",
        file_name: fileName,
        file_url: uploadData.path,
        file_size_bytes: testFile.size,
        mime_type: "application/pdf",
        description: "Test document uploaded via debug page",
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || "test-user",
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Test document uploaded successfully!",
      });

      // Reload data
      loadData();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const testSignedUrl = async (document: DocumentItem) => {
    try {
      const fileName = document.file_name ?? document.name ?? document.title ?? "unknown";
      const { data, error } = await supabase.storage
        .from("property-documents")
        .createSignedUrl(fileName, 3600);

      if (error) throw error;

      window.open(data.signedUrl, "_blank");

      toast({
        title: "Success",
        description: "Signed URL generated and opened in new tab",
      });
    } catch (error: any) {
      console.error("Signed URL error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getBucketStatus = (bucketId: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm">Not checked</span>
        </div>
      );
    }

    const statusConfig = {
      exists: { icon: CheckCircle2, color: "text-green-500", text: "Exists" },
      missing: { icon: XCircle, color: "text-red-500", text: "Missing" },
      "no-permission": {
        icon: ShieldAlert,
        color: "text-amber-500",
        text: "Exists (no permission)",
      },
    };

    const config = statusConfig[bucket.status];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className="text-sm">{config.text}</span>
        {bucket.sampleCount > 0 && (
          <span className="text-xs text-muted-foreground">({bucket.sampleCount} files)</span>
        )}
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Media table:</span>
          {hasTypeColumn === null ? (
            <span className="text-sm text-gray-500">Checking...</span>
          ) : hasTypeColumn ? (
            <span className="text-sm text-green-600">type column present ✅</span>
          ) : (
            <span className="text-sm text-red-600">type column missing ❌</span>
          )}
        </div>
        {import.meta.env.DEV && media.length === 0 && documents.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Open{" "}
              <a href="/test-login" className="underline">
                /test-login
              </a>{" "}
              and click "One-Click Dev Setup" to create a property with sample data.
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Buckets Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="mr-2 h-5 w-5" />
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
              {getBucketStatus("property-photos")}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">property-documents</h4>
              {getBucketStatus("property-documents")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="mr-2 h-5 w-5" />
            Media Items (Photos)
          </CardTitle>
          <CardDescription>Recent media items from the media table</CardDescription>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <p className="text-muted-foreground">No media items found</p>
          ) : (
            <div className="space-y-2">
              {media.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{item.caption || "Untitled"}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.type} •{" "}
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "Unknown date"}
                    </p>
                  </div>
                  <Badge variant="outline">{item.type}</Badge>
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
            <FileText className="mr-2 h-5 w-5" />
            Documents
          </CardTitle>
          <CardDescription>Recent documents from the documents table</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground">No documents found</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => {
                const fileName = doc.file_name ?? doc.name ?? doc.title ?? "(untitled)";
                const mimeType = doc.mime_type ?? doc.content_type ?? null;
                const fileSize = doc.file_size_bytes ?? doc.file_size ?? null;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">{fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {mimeType && `${mimeType} • `}
                        {fileSize && `${Math.round(fileSize / 1024)}KB • `}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => testSignedUrl(doc)}>
                      Test Signed URL
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UploadCloud className="mr-2 h-5 w-5" />
            Test Uploads
          </CardTitle>
          <CardDescription>Test photo and document uploads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={uploadTestPhoto}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image className="h-4 w-4" />
              )}
              Upload Test Photo
            </Button>
            <Button
              onClick={uploadTestDocument}
              disabled={uploading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Upload Test Document
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SQL Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            SQL Verification Queries
          </CardTitle>
          <CardDescription>
            Run these queries in Supabase SQL Editor to verify the setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Check if type column exists:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`SELECT column_name FROM information_schema.columns 
WHERE table_schema='public' AND table_name='media' 
ORDER BY 1;`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Check recent media rows:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`SELECT id, property_id, type, mime_type, file_name, created_at
FROM public.media
ORDER BY created_at DESC
LIMIT 10;`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugStorage;
