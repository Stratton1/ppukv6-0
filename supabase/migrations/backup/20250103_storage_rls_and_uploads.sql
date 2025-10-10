-- Storage buckets, RLS policies, and upload infrastructure
-- Phase 2.2: Multi-bucket design with property-scoped access

-- Create storage buckets (if not already created)
-- Note: Buckets are typically created via Supabase Studio or CLI
-- This migration documents the required buckets and their configurations

-- Bucket configurations (to be created manually in Supabase Studio):
-- 1. property-images (public: false) - photos/media
-- 2. professional-reports (public: false) - surveyor/conveyancer PDFs  
-- 3. warranties-guarantees (public: false) - FENSA/EICR/warranty docs
-- 4. planning-docs (public: false) - planning PDFs, decision notices
-- 5. misc-docs (public: false) - everything else

-- Document processing jobs table
CREATE TABLE IF NOT EXISTS document_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('ocr', 'av_scan', 'extract_metadata', 'generate_thumbnail')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    payload JSONB,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes for document_jobs
CREATE INDEX IF NOT EXISTS idx_document_jobs_status ON document_jobs(status);
CREATE INDEX IF NOT EXISTS idx_document_jobs_kind ON document_jobs(kind);
CREATE INDEX IF NOT EXISTS idx_document_jobs_document_id ON document_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_jobs_created_at ON document_jobs(created_at);

-- RLS policies for document_jobs
ALTER TABLE document_jobs ENABLE ROW LEVEL SECURITY;

-- Only property owners and assigned professionals can view jobs for their documents
CREATE POLICY "Users can view document jobs for their properties" ON document_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            JOIN properties p ON p.id = d.property_id
            WHERE d.id = document_jobs.document_id
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

-- Only system can insert/update document jobs (via service role)
CREATE POLICY "System can manage document jobs" ON document_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Storage RLS policies for each bucket
-- These policies ensure users can only access files for properties they have access to

-- Property images bucket RLS
CREATE POLICY "Users can view property images they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-images'
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'purchaser', 'tenant', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

CREATE POLICY "Users can upload property images to their properties" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

CREATE POLICY "Users can update property images they uploaded" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images'
        AND owner = auth.uid()
    );

CREATE POLICY "Users can delete property images they uploaded" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images'
        AND owner = auth.uid()
    );

-- Professional reports bucket RLS
CREATE POLICY "Users can view professional reports they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'professional-reports'
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'purchaser', 'tenant', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

CREATE POLICY "Professionals can upload reports to assigned properties" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'professional-reports'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND EXISTS (
                SELECT 1 FROM property_parties pp
                WHERE pp.property_id = p.id
                AND pp.user_id = auth.uid()
                AND pp.role IN ('owner', 'agent', 'surveyor', 'conveyancer', 'solicitor')
            )
        )
    );

-- Warranties and guarantees bucket RLS
CREATE POLICY "Users can view warranties they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'warranties-guarantees'
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'purchaser', 'tenant', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

CREATE POLICY "Users can upload warranties to their properties" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'warranties-guarantees'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

-- Planning documents bucket RLS
CREATE POLICY "Users can view planning docs they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'planning-docs'
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'purchaser', 'tenant', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

CREATE POLICY "Users can upload planning docs to their properties" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'planning-docs'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

-- Miscellaneous documents bucket RLS
CREATE POLICY "Users can view misc docs they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'misc-docs'
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'purchaser', 'tenant', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

CREATE POLICY "Users can upload misc docs to their properties" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'misc-docs'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND (
                p.claimed_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = p.id
                    AND pp.user_id = auth.uid()
                    AND pp.role IN ('owner', 'agent', 'surveyor', 'conveyancer', 'solicitor')
                )
            )
        )
    );

-- Update documents table to support new fields
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS bucket_id TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS checksum TEXT,
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS meta_json JSONB,
ADD COLUMN IF NOT EXISTS av_status TEXT DEFAULT 'clean' CHECK (av_status IN ('clean', 'quarantined', 'scanning', 'error')),
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Indexes for new document fields
CREATE INDEX IF NOT EXISTS idx_documents_bucket_id ON documents(bucket_id);
CREATE INDEX IF NOT EXISTS idx_documents_checksum ON documents(checksum);
CREATE INDEX IF NOT EXISTS idx_documents_av_status ON documents(av_status);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);

-- Function to update document processing status
CREATE OR REPLACE FUNCTION update_document_processing_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the document's processing status based on job completion
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE documents 
        SET processing_status = 'completed',
            extracted_text = COALESCE(NEW.result->>'extracted_text', extracted_text),
            meta_json = COALESCE(NEW.result, meta_json),
            updated_at = NOW()
        WHERE id = NEW.document_id;
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        UPDATE documents 
        SET processing_status = 'failed',
            updated_at = NOW()
        WHERE id = NEW.document_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update document processing status
CREATE TRIGGER update_document_processing_status_trigger
    AFTER UPDATE ON document_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_document_processing_status();

-- Function to clean up old completed jobs
CREATE OR REPLACE FUNCTION cleanup_old_document_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM document_jobs 
    WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE document_jobs IS 'Queue for document processing jobs (OCR, AV scan, metadata extraction)';
COMMENT ON COLUMN document_jobs.kind IS 'Type of processing job: ocr, av_scan, extract_metadata, generate_thumbnail';
COMMENT ON COLUMN document_jobs.status IS 'Job status: queued, processing, completed, failed, cancelled';
COMMENT ON COLUMN document_jobs.payload IS 'Job-specific parameters and configuration';
COMMENT ON COLUMN document_jobs.result IS 'Job output and extracted data';

COMMENT ON COLUMN documents.bucket_id IS 'Storage bucket identifier';
COMMENT ON COLUMN documents.storage_path IS 'Full path within the storage bucket';
COMMENT ON COLUMN documents.checksum IS 'SHA-256 checksum of the file content';
COMMENT ON COLUMN documents.extracted_text IS 'OCR extracted text content';
COMMENT ON COLUMN documents.meta_json IS 'Extracted metadata and structured data';
COMMENT ON COLUMN documents.av_status IS 'Antivirus scan status';
COMMENT ON COLUMN documents.processing_status IS 'Overall document processing status';
