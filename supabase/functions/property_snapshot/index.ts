/**
 * PPUK v6 Property Snapshot Edge Function
 * Aggregates comprehensive property data from multiple sources
 * Created: 2025-01-03
 * Purpose: Single endpoint for complete property overview with all related data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';
import { ApiResponse, ApiError } from '../shared/types.ts';

// ============================================================================
// TYPES
// ============================================================================

interface PropertySnapshot {
  property: any;
  epc?: any;
  floodRisk?: any;
  planning?: any;
  postcode?: any;
  address?: any;
  companies?: any[];
  stats: {
    documentCount: number;
    noteCount: number;
    taskCount: number;
    partyCount: number;
    lastDocumentUpload?: string;
    lastNoteCreated?: string;
    lastTaskCreated?: string;
    lastActivity?: string;
  };
  parties: any[];
  recentDocuments: any[];
  recentNotes: any[];
  recentTasks: any[];
  pinnedNotes: any[];
  pendingTasks: any[];
  overdueTasks: any[];
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const PropertySnapshotRequestSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),
  include_epc: z.boolean().optional().default(true),
  include_flood: z.boolean().optional().default(true),
  include_planning: z.boolean().optional().default(true),
  include_postcode: z.boolean().optional().default(true),
  include_companies: z.boolean().optional().default(false),
  include_recent_activity: z.boolean().optional().default(true),
  include_pinned_notes: z.boolean().optional().default(true),
  include_pending_tasks: z.boolean().optional().default(true),
  include_overdue_tasks: z.boolean().optional().default(true),
});

type PropertySnapshotRequest = z.infer<typeof PropertySnapshotRequestSchema>;

// ============================================================================
// PROPERTY SNAPSHOT BUILDER
// ============================================================================

class PropertySnapshotBuilder {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }

  /**
   * Build comprehensive property snapshot with visibility tiers
   */
  async buildSnapshot(request: PropertySnapshotRequest, relationship?: string): Promise<PropertySnapshot> {
    // Get base property data
    const property = await this.getProperty(request.property_id);
    if (!property) {
      throw new Error('Property not found');
    }

    // Get property parties (filtered by relationship)
    const parties = await this.getPropertyParties(request.property_id, relationship);

    // Get property statistics (filtered by relationship)
    const stats = await this.getPropertyStats(request.property_id, relationship);

    // Get recent activity (filtered by relationship)
    const recentActivity = request.include_recent_activity ? await this.getRecentActivity(request.property_id, relationship) : {};

    // Get pinned notes (filtered by relationship)
    const pinnedNotes = request.include_pinned_notes ? await this.getPinnedNotes(request.property_id, relationship) : [];

    // Get pending tasks (filtered by relationship)
    const pendingTasks = request.include_pending_tasks ? await this.getPendingTasks(request.property_id, relationship) : [];

    // Get overdue tasks (filtered by relationship)
    const overdueTasks = request.include_overdue_tasks ? await this.getOverdueTasks(request.property_id, relationship) : [];

    // Get recent documents (filtered by relationship)
    const recentDocuments = await this.getRecentDocuments(request.property_id, 5, relationship);

    // Get recent notes (filtered by relationship)
    const recentNotes = await this.getRecentNotes(request.property_id, 5, relationship);

    // Get recent tasks (filtered by relationship)
    const recentTasks = await this.getRecentTasks(request.property_id, 5, relationship);

    // Fetch external data if requested (always public)
    const externalData = await this.fetchExternalData(property, request);

    // Build snapshot
    const snapshot: PropertySnapshot = {
      property,
      parties,
      stats,
      recentDocuments,
      recentNotes,
      recentTasks,
      pinnedNotes,
      pendingTasks,
      overdueTasks,
      ...externalData,
    };

    return snapshot;
  }

  /**
   * Get property data
   */
  private async getProperty(propertyId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch property: ${error.message}`);
    }

    return data;
  }

  /**
   * Get property parties (filtered by relationship)
   */
  private async getPropertyParties(propertyId: string, relationship?: string): Promise<any[]> {
    let query = this.supabase
      .from('property_parties')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          role,
          company_name,
          job_title
        )
      `)
      .eq('property_id', propertyId);

    // Filter by relationship visibility
    if (relationship === 'interested') {
      // Interested users can only see other interested users (public parties)
      query = query.eq('relationship', 'interested');
    } else if (relationship === 'occupier') {
      // Occupiers can see other occupiers and interested users
      query = query.in('relationship', ['occupier', 'interested']);
    }
    // Owners can see all relationships (no filter)

    const { data, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch property parties: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get property statistics (filtered by relationship)
   */
  private async getPropertyStats(propertyId: string, relationship?: string): Promise<any> {
    // Build document query based on relationship
    let documentQuery = this.supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    if (relationship === 'interested') {
      documentQuery = documentQuery.eq('is_public', true);
    } else if (relationship === 'occupier') {
      documentQuery = documentQuery.in('is_public', [true, false]); // All documents
    }
    // Owners see all documents (no filter)

    const { count: documentCount } = await documentQuery;

    // Build note query based on relationship
    let noteQuery = this.supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    if (relationship === 'interested') {
      noteQuery = noteQuery.eq('visibility', 'public');
    } else if (relationship === 'occupier') {
      noteQuery = noteQuery.in('visibility', ['public', 'shared']);
    }
    // Owners see all notes (no filter)

    const { count: noteCount } = await noteQuery;

    // Build task query based on relationship
    let taskQuery = this.supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    if (relationship === 'interested') {
      taskQuery = taskQuery.eq('status', 'public'); // Only public tasks
    } else if (relationship === 'occupier') {
      taskQuery = taskQuery.in('status', ['pending', 'in_progress', 'completed']); // All active tasks
    }
    // Owners see all tasks (no filter)

    const { count: taskCount } = await taskQuery;

    // Get party count (filtered by relationship visibility)
    let partyQuery = this.supabase
      .from('property_parties')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    if (relationship === 'interested') {
      partyQuery = partyQuery.eq('relationship', 'interested');
    } else if (relationship === 'occupier') {
      partyQuery = partyQuery.in('relationship', ['occupier', 'interested']);
    }
    // Owners see all parties (no filter)

    const { count: partyCount } = await partyQuery;

    // Get last document upload (filtered)
    let lastDocQuery = this.supabase
      .from('documents')
      .select('created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (relationship === 'interested') {
      lastDocQuery = lastDocQuery.eq('is_public', true);
    } else if (relationship === 'occupier') {
      lastDocQuery = lastDocQuery.in('is_public', [true, false]);
    }

    const { data: lastDocument } = await lastDocQuery.single();

    // Get last note created (filtered)
    let lastNoteQuery = this.supabase
      .from('notes')
      .select('created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (relationship === 'interested') {
      lastNoteQuery = lastNoteQuery.eq('visibility', 'public');
    } else if (relationship === 'occupier') {
      lastNoteQuery = lastNoteQuery.in('visibility', ['public', 'shared']);
    }

    const { data: lastNote } = await lastNoteQuery.single();

    // Get last task created (filtered)
    let lastTaskQuery = this.supabase
      .from('tasks')
      .select('created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (relationship === 'interested') {
      lastTaskQuery = lastTaskQuery.eq('status', 'public');
    } else if (relationship === 'occupier') {
      lastTaskQuery = lastTaskQuery.in('status', ['pending', 'in_progress', 'completed']);
    }

    const { data: lastTask } = await lastTaskQuery.single();

    // Calculate last activity
    const activities = [
      lastDocument?.created_at,
      lastNote?.created_at,
      lastTask?.created_at,
    ].filter(Boolean);

    const lastActivity = activities.length > 0 
      ? activities.sort().pop() 
      : undefined;

    return {
      documentCount: documentCount || 0,
      noteCount: noteCount || 0,
      taskCount: taskCount || 0,
      partyCount: partyCount || 0,
      lastDocumentUpload: lastDocument?.created_at,
      lastNoteCreated: lastNote?.created_at,
      lastTaskCreated: lastTask?.created_at,
      lastActivity,
    };
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(propertyId: string): Promise<any> {
    // Get recent documents
    const { data: recentDocuments } = await this.supabase
      .from('documents')
      .select('id, file_name, document_type, created_at, uploaded_by')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Get recent notes
    const { data: recentNotes } = await this.supabase
      .from('notes')
      .select('id, title, created_at, created_by')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Get recent tasks
    const { data: recentTasks } = await this.supabase
      .from('tasks')
      .select('id, title, status, created_at, created_by')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(3);

    return {
      recentDocuments: recentDocuments || [],
      recentNotes: recentNotes || [],
      recentTasks: recentTasks || [],
    };
  }

  /**
   * Get pinned notes
   */
  private async getPinnedNotes(propertyId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select(`
        *,
        users:created_by (
          id,
          full_name,
          email
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_pinned', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pinned notes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pending tasks
   */
  private async getPendingTasks(propertyId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        users:created_by (
          id,
          full_name,
          email
        ),
        assigned_user:assigned_to (
          id,
          full_name,
          email
        )
      `)
      .eq('property_id', propertyId)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch pending tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get overdue tasks
   */
  private async getOverdueTasks(propertyId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        users:created_by (
          id,
          full_name,
          email
        ),
        assigned_user:assigned_to (
          id,
          full_name,
          email
        )
      `)
      .eq('property_id', propertyId)
      .in('status', ['pending', 'in_progress'])
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch overdue tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent documents
   */
  private async getRecentDocuments(propertyId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select(`
        *,
        users:uploaded_by (
          id,
          full_name,
          email
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent documents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent notes
   */
  private async getRecentNotes(propertyId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select(`
        *,
        users:created_by (
          id,
          full_name,
          email
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent notes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent tasks
   */
  private async getRecentTasks(propertyId: string, limit: number): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        users:created_by (
          id,
          full_name,
          email
        ),
        assigned_user:assigned_to (
          id,
          full_name,
          email
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetch external data from other APIs
   */
  private async fetchExternalData(property: any, request: PropertySnapshotRequest): Promise<any> {
    const externalData: any = {};

    // Fetch EPC data if requested
    if (request.include_epc && property.postcode) {
      try {
        const epcResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/epc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            postcode: property.postcode,
            address: property.address_line_1,
          }),
        });

        if (epcResponse.ok) {
          const epcData = await epcResponse.json();
          externalData.epc = epcData.data?.[0];
        }
      } catch (error) {
        console.error('EPC fetch error:', error);
      }
    }

    // Fetch flood risk data if requested
    if (request.include_flood && property.postcode) {
      try {
        const floodResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/flood`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            postcode: property.postcode,
            address: property.address_line_1,
          }),
        });

        if (floodResponse.ok) {
          const floodData = await floodResponse.json();
          externalData.floodRisk = floodData.data;
        }
      } catch (error) {
        console.error('Flood risk fetch error:', error);
      }
    }

    // Fetch postcode data if requested
    if (request.include_postcode && property.postcode) {
      try {
        const postcodeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/postcodes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            postcode: property.postcode,
          }),
        });

        if (postcodeResponse.ok) {
          const postcodeData = await postcodeResponse.json();
          externalData.postcode = postcodeData.data;
        }
      } catch (error) {
        console.error('Postcode fetch error:', error);
      }
    }

    return externalData;
  }
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

async function authenticateUser(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user.id;
}

async function authorizePropertyAccess(userId: string, propertyId: string): Promise<{ hasAccess: boolean; relationship?: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .from('property_parties')
    .select('relationship')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { hasAccess: false };
  }

  return { hasAccess: true, relationship: data.relationship };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function createErrorResponse(error: string, status: number = 500): Response {
  const errorResponse: ApiError = {
    code: 'PROPERTY_SNAPSHOT_ERROR',
    message: error,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };

  return new Response(JSON.stringify({
    success: false,
    error: errorResponse,
    timestamp: new Date().toISOString(),
    requestId: errorResponse.requestId,
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function createSuccessResponse<T>(data: T, requestId: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow GET and POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse request body
    let requestData: PropertySnapshotRequest;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      requestData = {
        property_id: url.searchParams.get('property_id') || '',
        include_epc: url.searchParams.get('include_epc') !== 'false',
        include_flood: url.searchParams.get('include_flood') !== 'false',
        include_planning: url.searchParams.get('include_planning') !== 'false',
        include_postcode: url.searchParams.get('include_postcode') !== 'false',
        include_companies: url.searchParams.get('include_companies') === 'true',
        include_recent_activity: url.searchParams.get('include_recent_activity') !== 'false',
        include_pinned_notes: url.searchParams.get('include_pinned_notes') !== 'false',
        include_pending_tasks: url.searchParams.get('include_pending_tasks') !== 'false',
        include_overdue_tasks: url.searchParams.get('include_overdue_tasks') !== 'false',
      };
    } else {
      const body = await req.json();
      requestData = body;
    }

    // Validate request
    const validationResult = PropertySnapshotRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return createErrorResponse(
        `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const userId = await authenticateUser(authHeader);

    // Authorize property access
    const authResult = await authorizePropertyAccess(userId, validationResult.data.property_id);
    if (!authResult.hasAccess) {
      return createErrorResponse('Access denied to property', 403);
    }

    // Build property snapshot with relationship-based filtering
    const snapshotBuilder = new PropertySnapshotBuilder();
    const snapshot = await snapshotBuilder.buildSnapshot(validationResult.data, authResult.relationship);

    // Return success response
    return createSuccessResponse(snapshot, requestId);

  } catch (error) {
    console.error('Property snapshot function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage, 500);
  }
});
