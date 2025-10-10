import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Process OCR job
async function processOCRJob(job: any, logger: Logger): Promise<any> {
  logger.info("Processing OCR job", { jobId: job.id, documentId: job.document_id });

  try {
    // Get document details
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", job.document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // For now, we'll implement a basic OCR simulation
    // In production, this would integrate with a real OCR service
    const extractedText = await simulateOCR(document, logger);
    
    // Update document with extracted text
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        extracted_text: extractedText,
        meta_json: {
          ...document.meta_json,
          ocr_confidence: 0.95,
          ocr_processed_at: new Date().toISOString(),
          word_count: extractedText.split(/\s+/).length,
        },
        processing_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    logger.info("OCR processing completed", { 
      documentId: document.id,
      wordCount: extractedText.split(/\s+/).length 
    });

    return {
      success: true,
      extracted_text: extractedText,
      confidence: 0.95,
      word_count: extractedText.split(/\s+/).length,
    };

  } catch (error) {
    logger.error("OCR processing failed", error);
    throw error;
  }
}

// Simulate OCR processing (replace with real OCR service)
async function simulateOCR(document: any, logger: Logger): Promise<string> {
  // This is a placeholder implementation
  // In production, integrate with services like:
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Computer Vision
  // - Tesseract.js for client-side processing
  
  const mockExtractedText = `
Document Type: ${document.document_type}
Property ID: ${document.property_id}
File Name: ${document.file_name}
Upload Date: ${document.created_at}

This is a simulated OCR extraction. In a real implementation, this would contain the actual text extracted from the document using optical character recognition technology.

The document appears to be a ${document.document_type} document for property ${document.property_id}. The file was uploaded on ${new Date(document.created_at).toLocaleDateString()}.

Key information that might be extracted:
- Document title and type
- Property details and references
- Dates and timestamps
- Financial figures and amounts
- Legal text and clauses
- Signatures and endorsements

This mock extraction demonstrates the structure of OCR results that would be stored in the extracted_text field and used for search and analysis purposes.
  `.trim();

  logger.info("OCR simulation completed", { 
    documentType: document.document_type,
    textLength: mockExtractedText.length 
  });

  return mockExtractedText;
}

// Process AV scan job
async function processAVScanJob(job: any, logger: Logger): Promise<any> {
  logger.info("Processing AV scan job", { jobId: job.id, documentId: job.document_id });

  try {
    // Get document details
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", job.document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Simulate AV scan (replace with real AV service)
    const scanResult = await simulateAVScan(document, logger);
    
    // Update document with scan results
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        av_status: scanResult.status,
        meta_json: {
          ...document.meta_json,
          av_scan: {
            status: scanResult.status,
            scanned_at: new Date().toISOString(),
            threats_detected: scanResult.threats,
            scan_engine: "MockAV",
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    logger.info("AV scan completed", { 
      documentId: document.id,
      status: scanResult.status,
      threats: scanResult.threats.length 
    });

    return scanResult;

  } catch (error) {
    logger.error("AV scan failed", error);
    throw error;
  }
}

// Simulate AV scan (replace with real AV service)
async function simulateAVScan(document: any, logger: Logger): Promise<{
  status: "clean" | "quarantined";
  threats: string[];
}> {
  // This is a placeholder implementation
  // In production, integrate with services like:
  // - ClamAV
  // - VirusTotal API
  // - AWS GuardDuty
  // - Microsoft Defender for Cloud
  
  // Simulate scan based on file characteristics
  const fileName = document.file_name.toLowerCase();
  const mimeType = document.mime_type.toLowerCase();
  
  // Mock threat detection logic
  const suspiciousPatterns = [
    "virus", "malware", "trojan", "backdoor", "keylogger",
    "phishing", "spam", "exploit", "payload"
  ];
  
  const threats: string[] = [];
  
  // Check filename for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (fileName.includes(pattern)) {
      threats.push(`Suspicious filename pattern: ${pattern}`);
    }
  }
  
  // Check for executable files in document buckets
  const executableTypes = [
    "application/x-executable",
    "application/x-msdownload",
    "application/x-msdos-program"
  ];
  
  if (executableTypes.includes(mimeType)) {
    threats.push("Executable file detected in document storage");
  }
  
  // Mock result
  const status = threats.length > 0 ? "quarantined" : "clean";
  
  logger.info("AV scan simulation completed", { 
    status,
    threatsCount: threats.length,
    fileName: document.file_name 
  });

  return { status, threats };
}

// Process metadata extraction job
async function processMetadataJob(job: any, logger: Logger): Promise<any> {
  logger.info("Processing metadata extraction job", { jobId: job.id, documentId: job.document_id });

  try {
    // Get document details
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", job.document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Extract metadata based on document type
    const metadata = await extractDocumentMetadata(document, logger);
    
    // Update document with extracted metadata
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        meta_json: {
          ...document.meta_json,
          ...metadata,
          extracted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    logger.info("Metadata extraction completed", { 
      documentId: document.id,
      metadataKeys: Object.keys(metadata).length 
    });

    return metadata;

  } catch (error) {
    logger.error("Metadata extraction failed", error);
    throw error;
  }
}

// Extract document metadata
async function extractDocumentMetadata(document: any, logger: Logger): Promise<any> {
  const metadata: any = {
    document_type: document.document_type,
    file_size_mb: Math.round((document.file_size_bytes / 1024 / 1024) * 100) / 100,
    mime_type: document.mime_type,
    upload_date: document.created_at,
  };

  // Add type-specific metadata
  switch (document.document_type) {
    case "epc":
      metadata.epc_rating = "C"; // Mock EPC rating
      metadata.valid_until = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "survey":
      metadata.survey_type = "HomeBuyer";
      metadata.surveyor = "Mock Surveyor Ltd";
      break;
    case "title_deed":
      metadata.title_number = "TITLE123456";
      metadata.tenure = "Freehold";
      break;
    case "planning":
      metadata.application_reference = "PLAN/2024/001";
      metadata.status = "Approved";
      break;
  }

  logger.info("Metadata extracted", { 
    documentType: document.document_type,
    metadataKeys: Object.keys(metadata).length 
  });

  return metadata;
}

// Update job status
async function updateJobStatus(
  jobId: string, 
  status: "processing" | "completed" | "failed", 
  result?: any, 
  error?: string,
  logger: Logger
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
    updateData.result = result;
  } else if (status === "failed") {
    updateData.last_error = error;
    updateData.attempts = (await getCurrentAttempts(jobId)) + 1;
  } else if (status === "processing") {
    updateData.started_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("document_jobs")
    .update(updateData)
    .eq("id", jobId);

  if (updateError) {
    logger.error("Failed to update job status", updateError);
  } else {
    logger.info("Job status updated", { jobId, status });
  }
}

// Get current attempt count
async function getCurrentAttempts(jobId: string): Promise<number> {
  const { data: job } = await supabase
    .from("document_jobs")
    .select("attempts")
    .eq("id", jobId)
    .single();

  return job?.attempts || 0;
}

// Main worker function
async function processDocumentJobs(): Promise<{ processed: number; failed: number }> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Starting document job processing");

    // Get queued jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("document_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(10);

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      logger.info("No jobs to process");
      return { processed: 0, failed: 0 };
    }

    logger.info(`Found ${jobs.length} jobs to process`);

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        // Update job status to processing
        await updateJobStatus(job.id, "processing", undefined, undefined, logger);

        let result: any;

        // Process based on job kind
        switch (job.kind) {
          case "ocr":
            result = await processOCRJob(job, logger);
            break;
          case "av_scan":
            result = await processAVScanJob(job, logger);
            break;
          case "extract_metadata":
            result = await processMetadataJob(job, logger);
            break;
          default:
            throw new Error(`Unknown job kind: ${job.kind}`);
        }

        // Mark job as completed
        await updateJobStatus(job.id, "completed", result, undefined, logger);
        processed++;

      } catch (error) {
        logger.error(`Job ${job.id} failed`, error);
        
        // Check if we should retry
        const attempts = await getCurrentAttempts(job.id);
        if (attempts < job.max_attempts) {
          // Reset to queued for retry
          await updateJobStatus(job.id, "queued", undefined, error.message, logger);
        } else {
          // Mark as failed permanently
          await updateJobStatus(job.id, "failed", undefined, error.message, logger);
        }
        
        failed++;
      }
    }

    logger.info("Document job processing completed", { processed, failed });
    return { processed, failed };

  } catch (error) {
    logger.error("Document job processing failed", error);
    throw error;
  }
}

// Main handler
async function handleDocumentWorker(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Document worker request received");

    const result = await processDocumentJobs();

    return new Response(JSON.stringify({
      success: true,
      processed: result.processed,
      failed: result.failed,
      requestId,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("Document worker failed", error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      requestId,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Serve the function
serve(handleDocumentWorker);
