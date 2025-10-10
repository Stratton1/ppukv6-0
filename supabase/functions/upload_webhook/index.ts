import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Request schema
const UploadWebhookSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
  property_id: z.string().uuid(),
  title: z.string().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

type UploadWebhookRequest = z.infer<typeof UploadWebhookSchema>;

// Response types
interface UploadWebhookResponse {
  success: boolean;
  document?: {
    id: string;
    property_id: string;
    document_type: string;
    file_name: string;
    file_url: string;
    file_size_bytes: number;
    mime_type: string;
    bucket_id: string;
    storage_path: string;
    checksum: string;
    title?: string;
    description?: string;
    tags: string[];
    uploaded_by: string;
    created_at: string;
  };
  error?: string;
  requestId: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Logger utility
class Logger {
  private requestId: string;

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  info(message: string, data?: any) {
    console.log(`[${this.requestId}] INFO: ${message}`, data ? JSON.stringify(data) : "");
  }

  error(message: string, error?: any) {
    console.error(`[${this.requestId}] ERROR: ${message}`, error ? JSON.stringify(error) : "");
  }

  warn(message: string, data?: any) {
    console.warn(`[${this.requestId}] WARN: ${message}`, data ? JSON.stringify(data) : "");
  }
}

// Authentication and authorization
async function authenticateUser(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error("Invalid authentication token");
    }

    return user.id;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function authorizePropertyAccess(userId: string, propertyId: string): Promise<boolean> {
  try {
    // Check if user is property owner
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("claimed_by")
      .eq("id", propertyId)
      .single();

    if (propertyError) {
      throw new Error(`Property not found: ${propertyError.message}`);
    }

    if (property.claimed_by === userId) {
      return true;
    }

    // Check if user has access via property parties
    const { data: party, error: partyError } = await supabase
      .from("property_parties")
      .select("role")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .in("role", ["owner", "agent", "surveyor", "conveyancer", "solicitor"])
      .single();

    if (partyError) {
      return false;
    }

    return !!party;
  } catch (error) {
    console.error("Authorization check failed:", error);
    return false;
  }
}

// Compute file checksum
async function computeChecksum(bucket: string, path: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new Error(`Failed to download file for checksum: ${error.message}`);
    }

    if (!data) {
      throw new Error("No file data received");
    }

    const arrayBuffer = await data.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    return hashHex;
  } catch (error) {
    throw new Error(`Checksum computation failed: ${error.message}`);
  }
}

// Get file metadata
async function getFileMetadata(bucket: string, path: string): Promise<{
  size: number;
  mimeType: string;
  lastModified: string;
}> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop(),
      });

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to get file metadata: ${error?.message || "File not found"}`);
    }

    const fileInfo = data[0];
    return {
      size: fileInfo.metadata?.size || 0,
      mimeType: fileInfo.metadata?.mimetype || "application/octet-stream",
      lastModified: fileInfo.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Metadata retrieval failed: ${error.message}`);
  }
}

// Create document record
async function createDocumentRecord(
  request: UploadWebhookRequest,
  userId: string,
  metadata: { size: number; mimeType: string; lastModified: string },
  checksum: string,
  logger: Logger
): Promise<any> {
  try {
    const fileName = request.path.split("/").pop() || "unknown";
    const documentType = request.type || "other";
    
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        property_id: request.property_id,
        document_type: documentType,
        file_name: fileName,
        file_url: request.path,
        file_size_bytes: metadata.size,
        mime_type: metadata.mimeType,
        bucket_id: request.bucket,
        storage_path: request.path,
        checksum: checksum,
        title: request.title,
        description: request.description,
        tags: request.tags || [],
        uploaded_by: userId,
        status: "ready",
        processing_status: "pending",
        av_status: "clean",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document record: ${error.message}`);
    }

    logger.info("Document record created", { documentId: document.id });
    return document;
  } catch (error) {
    logger.error("Failed to create document record", error);
    throw error;
  }
}

// Create audit log entry
async function createAuditLogEntry(
  userId: string,
  propertyId: string,
  documentId: string,
  action: string,
  metadata: any,
  logger: Logger
): Promise<void> {
  try {
    const { error } = await supabase
      .from("audit_log")
      .insert({
        actor_id: userId,
        action: action,
        entity_type: "documents",
        entity_id: documentId,
        metadata: {
          property_id: propertyId,
          ...metadata,
        },
      });

    if (error) {
      logger.warn("Failed to create audit log entry", error);
    } else {
      logger.info("Audit log entry created");
    }
  } catch (error) {
    logger.warn("Audit logging failed", error);
  }
}

// Create OCR job if applicable
async function createOCRJob(
  documentId: string,
  mimeType: string,
  logger: Logger
): Promise<void> {
  const ocrEnabled = Deno.env.get("OCR_ENABLED") === "true";
  
  if (!ocrEnabled) {
    logger.info("OCR processing disabled");
    return;
  }

  // Check if file type supports OCR
  const supportedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/tiff",
    "image/bmp",
  ];

  if (!supportedTypes.includes(mimeType.toLowerCase())) {
    logger.info("File type does not support OCR", { mimeType });
    return;
  }

  try {
    const { error } = await supabase
      .from("document_jobs")
      .insert({
        document_id: documentId,
        kind: "ocr",
        status: "queued",
        payload: {
          mime_type: mimeType,
          priority: "normal",
        },
      });

    if (error) {
      logger.warn("Failed to create OCR job", error);
    } else {
      logger.info("OCR job created");
    }
  } catch (error) {
    logger.warn("OCR job creation failed", error);
  }
}

// AV scan job if enabled
async function createAVScanJob(
  documentId: string,
  logger: Logger
): Promise<void> {
  const avEnabled = Deno.env.get("AV_ENABLED") === "true";
  
  if (!avEnabled) {
    logger.info("AV scanning disabled");
    return;
  }

  try {
    const { error } = await supabase
      .from("document_jobs")
      .insert({
        document_id: documentId,
        kind: "av_scan",
        status: "queued",
        payload: {
          priority: "high",
        },
      });

    if (error) {
      logger.warn("Failed to create AV scan job", error);
    } else {
      logger.info("AV scan job created");
    }
  } catch (error) {
    logger.warn("AV scan job creation failed", error);
  }
}

// Main handler
async function handleUploadWebhook(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Upload webhook request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = UploadWebhookSchema.parse(body);

    // Authenticate user
    const authHeader = request.headers.get("Authorization");
    const userId = await authenticateUser(authHeader);

    // Authorize property access
    const hasAccess = await authorizePropertyAccess(userId, validatedRequest.property_id);
    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Access denied to property",
          requestId,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get file metadata
    const metadata = await getFileMetadata(validatedRequest.bucket, validatedRequest.path);
    logger.info("File metadata retrieved", metadata);

    // Compute checksum
    const checksum = await computeChecksum(validatedRequest.bucket, validatedRequest.path);
    logger.info("File checksum computed", { checksum: checksum.substring(0, 8) + "..." });

    // Create document record
    const document = await createDocumentRecord(
      validatedRequest,
      userId,
      metadata,
      checksum,
      logger
    );

    // Create audit log entry
    await createAuditLogEntry(
      userId,
      validatedRequest.property_id,
      document.id,
      "document.uploaded",
      {
        file_name: document.file_name,
        file_size: document.file_size_bytes,
        mime_type: document.mime_type,
        checksum: checksum.substring(0, 8) + "...",
      },
      logger
    );

    // Create processing jobs
    await createOCRJob(document.id, metadata.mimeType, logger);
    await createAVScanJob(document.id, logger);

    const response: UploadWebhookResponse = {
      success: true,
      document: {
        id: document.id,
        property_id: document.property_id,
        document_type: document.document_type,
        file_name: document.file_name,
        file_url: document.file_url,
        file_size_bytes: document.file_size_bytes,
        mime_type: document.mime_type,
        bucket_id: document.bucket_id,
        storage_path: document.storage_path,
        checksum: document.checksum,
        title: document.title,
        description: document.description,
        tags: document.tags,
        uploaded_by: document.uploaded_by,
        created_at: document.created_at,
      },
      requestId,
    };

    logger.info("Upload webhook completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("Upload webhook failed", error);

    const response: UploadWebhookResponse = {
      success: false,
      error: error.message,
      requestId,
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Serve the function
serve(handleUploadWebhook);
