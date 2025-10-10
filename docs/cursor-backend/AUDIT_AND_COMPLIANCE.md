# PPUK v6 Audit and Compliance

## Overview

The PPUK v6 platform implements comprehensive audit logging and compliance features to ensure data integrity, security, and regulatory compliance.

## Audit Architecture

### Audit Log Schema
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Audit Actions
```sql
CREATE TYPE audit_action AS ENUM (
  'create', 'read', 'update', 'delete', 'upload', 
  'download', 'share', 'claim', 'unclaim'
);
```

## Audit Triggers

### Automatic Audit Logging
```sql
-- Documents audit trigger
CREATE TRIGGER audit_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Notes audit trigger
CREATE TRIGGER audit_notes_changes
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Tasks audit trigger
CREATE TRIGGER audit_tasks_changes
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Property parties audit trigger
CREATE TRIGGER audit_property_parties_changes
  AFTER INSERT OR UPDATE OR DELETE ON property_parties
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();
```

### Audit Function
```sql
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  action_type audit_action;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Insert audit log entry
  INSERT INTO audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    COALESCE(NEW.uploaded_by, NEW.created_by, NEW.assigned_by, auth.uid()),
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Compliance Features

### 1. Data Retention Policies

**Retention Periods**:
- Audit logs: 7 years
- User data: 3 years after account closure
- Property data: 10 years after sale completion
- API cache: 30 days
- Document metadata: 7 years

**Implementation**:
```sql
-- Audit log retention
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log 
  WHERE created_at < NOW() - INTERVAL '7 years';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 2. Data Anonymization

**Anonymization Function**:
```sql
CREATE OR REPLACE FUNCTION anonymize_user_data(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Anonymize user profile
  UPDATE users SET
    email = 'anonymized@deleted.com',
    full_name = 'Anonymized User',
    phone = NULL,
    address_line_1 = NULL,
    address_line_2 = NULL,
    city = NULL,
    postcode = NULL,
    company_name = NULL,
    job_title = NULL
  WHERE id = user_id;
  
  -- Anonymize audit logs
  UPDATE audit_log SET
    actor_id = NULL,
    ip_address = NULL,
    user_agent = NULL
  WHERE actor_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 3. Right to Erasure (GDPR)

**Data Deletion Function**:
```sql
CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete user's documents
  DELETE FROM documents WHERE uploaded_by = user_id;
  
  -- Delete user's notes
  DELETE FROM notes WHERE created_by = user_id;
  
  -- Delete user's tasks
  DELETE FROM tasks WHERE created_by = user_id OR assigned_to = user_id;
  
  -- Delete property party relationships
  DELETE FROM property_parties WHERE user_id = user_id;
  
  -- Delete saved properties
  DELETE FROM saved_properties WHERE user_id = user_id;
  
  -- Delete user profile
  DELETE FROM users WHERE id = user_id;
  
  -- Anonymize audit logs
  UPDATE audit_log SET
    actor_id = NULL,
    ip_address = NULL,
    user_agent = NULL
  WHERE actor_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Security Compliance

### 1. Access Control

**RLS Policies for Audit Logs**:
```sql
-- Users can view audit logs for their properties
CREATE POLICY "Users can view audit logs for their properties"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_parties pp
      JOIN properties p ON p.id = pp.property_id
      WHERE pp.user_id = auth.uid()
      AND (
        (audit_log.entity_type = 'property' AND audit_log.entity_id = p.id) OR
        (audit_log.entity_type = 'document' AND audit_log.entity_id IN (
          SELECT d.id FROM documents d WHERE d.property_id = p.id
        )) OR
        (audit_log.entity_type = 'note' AND audit_log.entity_id IN (
          SELECT n.id FROM notes n WHERE n.property_id = p.id
        )) OR
        (audit_log.entity_type = 'task' AND audit_log.entity_id IN (
          SELECT t.id FROM tasks t WHERE t.property_id = p.id
        ))
      )
    )
  );
```

### 2. Data Encryption

**Sensitive Data Encryption**:
```typescript
import { createCipher, createDecipher } from 'crypto';

class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor(key: string) {
    this.key = Buffer.from(key, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('ppuk-audit', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('ppuk-audit', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 3. Audit Trail Integrity

**Hash Verification**:
```typescript
import { createHash } from 'crypto';

class AuditIntegrity {
  private static readonly SALT = process.env.AUDIT_SALT || 'default-salt';

  static generateHash(data: any): string {
    const dataString = JSON.stringify(data);
    const hash = createHash('sha256');
    hash.update(dataString + this.SALT);
    return hash.digest('hex');
  }

  static verifyHash(data: any, hash: string): boolean {
    return this.generateHash(data) === hash;
  }

  static addIntegrityHash(auditEntry: any): any {
    const hash = this.generateHash(auditEntry);
    return {
      ...auditEntry,
      integrity_hash: hash
    };
  }
}
```

## Compliance Reporting

### 1. Data Export

**User Data Export**:
```typescript
async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await getUser(userId);
  const properties = await getUserProperties(userId);
  const documents = await getUserDocuments(userId);
  const notes = await getUserNotes(userId);
  const tasks = await getUserTasks(userId);
  const auditLogs = await getUserAuditLogs(userId);

  return {
    user,
    properties,
    documents,
    notes,
    tasks,
    auditLogs,
    exportedAt: new Date().toISOString(),
    format: 'JSON',
    version: '1.0'
  };
}
```

### 2. Compliance Reports

**Data Processing Report**:
```typescript
interface ComplianceReport {
  totalUsers: number;
  totalProperties: number;
  totalDocuments: number;
  dataRetentionStatus: {
    auditLogs: number;
    userData: number;
    propertyData: number;
  };
  privacySettings: {
    dataSharing: boolean;
    marketingConsent: boolean;
    analyticsConsent: boolean;
  };
  securityMetrics: {
    failedLogins: number;
    suspiciousActivity: number;
    dataBreaches: number;
  };
}

async function generateComplianceReport(): Promise<ComplianceReport> {
  const totalUsers = await getUserCount();
  const totalProperties = await getPropertyCount();
  const totalDocuments = await getDocumentCount();
  
  const dataRetentionStatus = await getDataRetentionStatus();
  const privacySettings = await getPrivacySettings();
  const securityMetrics = await getSecurityMetrics();

  return {
    totalUsers,
    totalProperties,
    totalDocuments,
    dataRetentionStatus,
    privacySettings,
    securityMetrics
  };
}
```

## Monitoring and Alerting

### 1. Suspicious Activity Detection

**Activity Monitoring**:
```typescript
class ActivityMonitor {
  private static readonly SUSPICIOUS_PATTERNS = [
    'multiple_failed_logins',
    'unusual_access_patterns',
    'bulk_data_download',
    'unauthorized_access_attempts'
  ];

  static async detectSuspiciousActivity(userId: string, activity: any): Promise<boolean> {
    const recentActivities = await getRecentActivities(userId, 24); // Last 24 hours
    
    // Check for multiple failed logins
    const failedLogins = recentActivities.filter(a => a.action === 'login_failed');
    if (failedLogins.length > 5) {
      await this.alertSuspiciousActivity(userId, 'multiple_failed_logins');
      return true;
    }

    // Check for unusual access patterns
    const accessPatterns = this.analyzeAccessPatterns(recentActivities);
    if (accessPatterns.isUnusual) {
      await this.alertSuspiciousActivity(userId, 'unusual_access_patterns');
      return true;
    }

    return false;
  }

  private static async alertSuspiciousActivity(userId: string, pattern: string): Promise<void> {
    await createAuditLog({
      actor_id: userId,
      action: 'suspicious_activity',
      entity_type: 'user',
      entity_id: userId,
      metadata: {
        pattern,
        timestamp: new Date().toISOString(),
        severity: 'high'
      }
    });

    await sendSecurityAlert({
      userId,
      pattern,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. Data Breach Detection

**Breach Monitoring**:
```typescript
class BreachDetector {
  static async detectDataBreach(): Promise<boolean> {
    // Check for unauthorized access
    const unauthorizedAccess = await this.checkUnauthorizedAccess();
    if (unauthorizedAccess.length > 0) {
      await this.handleDataBreach(unauthorizedAccess);
      return true;
    }

    // Check for data exfiltration
    const dataExfiltration = await this.checkDataExfiltration();
    if (dataExfiltration.length > 0) {
      await this.handleDataBreach(dataExfiltration);
      return true;
    }

    return false;
  }

  private static async handleDataBreach(incidents: any[]): Promise<void> {
    // Log breach incident
    await createAuditLog({
      action: 'data_breach_detected',
      entity_type: 'system',
      entity_id: 'breach-detector',
      metadata: {
        incidents,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      }
    });

    // Notify security team
    await notifySecurityTeam({
      type: 'data_breach',
      incidents,
      timestamp: new Date().toISOString()
    });

    // Implement containment measures
    await this.implementContainmentMeasures(incidents);
  }
}
```

## Regulatory Compliance

### 1. GDPR Compliance

**Data Subject Rights**:
```typescript
class GDPRCompliance {
  // Right to access
  static async getDataSubjectData(userId: string): Promise<any> {
    return await exportUserData(userId);
  }

  // Right to rectification
  static async rectifyData(userId: string, corrections: any): Promise<void> {
    await updateUserData(userId, corrections);
    await createAuditLog({
      actor_id: userId,
      action: 'data_rectification',
      entity_type: 'user',
      entity_id: userId,
      metadata: { corrections }
    });
  }

  // Right to erasure
  static async eraseData(userId: string): Promise<void> {
    await deleteUserData(userId);
    await createAuditLog({
      actor_id: userId,
      action: 'data_erasure',
      entity_type: 'user',
      entity_id: userId,
      metadata: { reason: 'user_request' }
    });
  }

  // Right to portability
  static async exportData(userId: string): Promise<any> {
    const data = await exportUserData(userId);
    return {
      ...data,
      format: 'machine_readable',
      exportedAt: new Date().toISOString()
    };
  }
}
```

### 2. Data Protection Impact Assessment

**DPIA Report**:
```typescript
interface DPIARecord {
  processingPurpose: string;
  dataCategories: string[];
  dataSubjects: string[];
  dataRetention: string;
  securityMeasures: string[];
  riskAssessment: {
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
  };
  mitigationMeasures: string[];
}

async function generateDPIA(): Promise<DPIARecord> {
  return {
    processingPurpose: 'Property management and transaction facilitation',
    dataCategories: ['Personal data', 'Property data', 'Financial data', 'Document data'],
    dataSubjects: ['Property owners', 'Buyers', 'Tenants', 'Agents', 'Surveyors'],
    dataRetention: '7 years for audit logs, 3 years for user data',
    securityMeasures: [
      'Row Level Security (RLS)',
      'Data encryption at rest and in transit',
      'Access control and authentication',
      'Audit logging',
      'Regular security assessments'
    ],
    riskAssessment: {
      likelihood: 'low',
      impact: 'medium',
      riskLevel: 'low'
    },
    mitigationMeasures: [
      'Strong authentication and authorization',
      'Data minimization',
      'Regular security updates',
      'Incident response procedures'
    ]
  };
}
```

## Testing and Validation

### 1. Audit Log Testing

```typescript
describe('Audit Logging', () => {
  it('should log document creation', async () => {
    const document = await createDocument({
      property_id: 'prop-123',
      document_type: 'epc',
      file_name: 'test.pdf'
    });

    const auditLogs = await getAuditLogs('document', document.id);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe('create');
  });

  it('should log document updates', async () => {
    const document = await createDocument({...});
    await updateDocument(document.id, { description: 'Updated' });

    const auditLogs = await getAuditLogs('document', document.id);
    expect(auditLogs).toHaveLength(2);
    expect(auditLogs[1].action).toBe('update');
  });
});
```

### 2. Compliance Testing

```typescript
describe('GDPR Compliance', () => {
  it('should export user data', async () => {
    const userId = 'user-123';
    const data = await GDPRCompliance.getDataSubjectData(userId);
    
    expect(data.user).toBeDefined();
    expect(data.properties).toBeDefined();
    expect(data.documents).toBeDefined();
  });

  it('should delete user data', async () => {
    const userId = 'user-123';
    await GDPRCompliance.eraseData(userId);
    
    const user = await getUser(userId);
    expect(user).toBeNull();
  });
});
```

## Maintenance and Monitoring

### 1. Regular Audits

**Audit Schedule**:
- Daily: Security log review
- Weekly: Data retention compliance
- Monthly: Access control review
- Quarterly: Full compliance audit
- Annually: DPIA review

### 2. Automated Monitoring

**Monitoring Scripts**:
```typescript
// Daily audit log review
async function dailyAuditReview(): Promise<void> {
  const suspiciousActivities = await detectSuspiciousActivities();
  if (suspiciousActivities.length > 0) {
    await alertSecurityTeam(suspiciousActivities);
  }
}

// Weekly data retention check
async function weeklyRetentionCheck(): Promise<void> {
  const expiredData = await findExpiredData();
  if (expiredData.length > 0) {
    await cleanupExpiredData(expiredData);
  }
}
```

### 3. Compliance Dashboard

**Dashboard Metrics**:
- Audit log volume
- Data retention status
- Security incidents
- Compliance score
- Risk assessment

## 📁 Uploads Pipeline

### Storage Architecture
The system uses a multi-bucket design for organized document storage:

```
property-images/          # Photos and media files
professional-reports/      # Surveyor/conveyancer PDFs
warranties-guarantees/    # FENSA/EICR/warranty docs
planning-docs/            # Planning PDFs, decision notices
misc-docs/                # Everything else
```

### Path Convention
All files follow a consistent path structure:
```
{bucket}/property/{property_id}/{yyyy}/{mm}/{filename}
```

### Upload Webhook Process
1. **Authentication**: Verify JWT token and user permissions
2. **Authorization**: Check property access via `property_parties` table
3. **Metadata Extraction**: Get file size, MIME type, last modified
4. **Checksum Computation**: Calculate SHA-256 hash for integrity
5. **Document Record**: Create entry in `documents` table
6. **Audit Logging**: Record upload event with sanitized metadata
7. **Job Queue**: Create OCR and AV scan jobs if enabled

### Document Processing Jobs
The system supports automated document processing:

#### OCR Processing
- **Trigger**: PDF and image files (JPEG, PNG, TIFF, BMP)
- **Job Type**: `ocr`
- **Output**: Extracted text stored in `documents.extracted_text`
- **Metadata**: Confidence scores, word counts, processing timestamps

#### Antivirus Scanning
- **Trigger**: All uploaded files
- **Job Type**: `av_scan`
- **Output**: Scan status stored in `documents.av_status`
- **Actions**: Quarantine infected files, log threats

#### Metadata Extraction
- **Trigger**: All document types
- **Job Type**: `extract_metadata`
- **Output**: Structured data in `documents.meta_json`
- **Examples**: EPC ratings, survey details, planning references

## 🔧 Buckets, RLS and Path Conventions

### Storage Bucket Configuration
Each bucket has specific RLS policies based on property access:

```sql
-- Property images (public viewing for shared properties)
CREATE POLICY "Users can view property images they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-images'
        AND EXISTS (/* property access check */)
    );

-- Professional reports (restricted to assigned professionals)
CREATE POLICY "Professionals can upload reports to assigned properties" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'professional-reports'
        AND EXISTS (/* professional role check */)
    );
```

### Path-Based Access Control
RLS policies use the path structure to determine property access:
- Extract `property_id` from path: `property/{property_id}/...`
- Verify user has access to that property
- Apply role-based permissions (owner, agent, surveyor, etc.)

### File Lifecycle Management
- **Upload**: Files stored with checksum and metadata
- **Processing**: OCR, AV scan, metadata extraction jobs
- **Access**: Signed URLs for private documents (1-hour expiry)
- **Retention**: Configurable cleanup of old files and jobs
- **Audit**: Complete history of all file operations

## 🤖 OCR/AV Optionality and Secrets

### Environment Configuration
The system supports optional processing features via environment variables:

```bash
# OCR Processing
OCR_ENABLED=true                    # Enable OCR for PDFs and images
OCR_PROVIDER=google_vision          # OCR service provider
OCR_API_KEY=your_api_key           # Provider API key

# Antivirus Scanning  
AV_ENABLED=true                     # Enable AV scanning
AV_PROVIDER=clamav                  # AV service provider
AV_QUARANTINE_BUCKET=quarantine    # Quarantine bucket for infected files
```

### Job Processing
The `document_worker` edge function processes queued jobs:

1. **Poll Jobs**: Check for `status='queued'` jobs
2. **Process**: Call appropriate service (OCR, AV, metadata)
3. **Update**: Store results in document record
4. **Retry**: Handle failures with exponential backoff
5. **Cleanup**: Remove completed jobs after retention period

### Security Considerations
- **API Keys**: Stored in Supabase secrets, never in code
- **Quarantine**: Infected files moved to secure quarantine bucket
- **Logging**: All processing activities logged with sanitized data
- **Access**: Only authorized users can access processed results
