/**
 * API Response Schemas using Zod for runtime validation
 * Provides type-safe parsing of API responses with graceful fallbacks
 */

import { z } from 'zod'

// Base property schema
export const PropertyCore = z.object({
  id: z.string().optional(),
  uprn: z.string().optional(),
  ppuk_reference: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  title_number: z.string().optional(),
  property_type: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  tenure: z.string().optional(),
  council_tax_band: z.string().optional(),
  epc_rating: z.string().optional(),
  epc_score: z.number().optional(),
  flood_risk_level: z.string().optional(),
  front_photo_url: z.string().optional(),
  completion_percentage: z.number().optional(),
  is_public: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

// EPC data schema
export const EPCData = z.object({
  rating: z.string().optional(),
  score: z.number().optional(),
  rrn: z.string().optional(),
  certificateNumber: z.string().optional(),
  currentRating: z.string().optional(),
  currentEfficiency: z.number().optional(),
  inspectionDate: z.string().optional(),
  expires_at: z.string().optional(),
}).optional()

// Flood risk data schema
export const FloodData = z.object({
  band: z.string().optional(),
  level: z.string().optional(),
  source: z.string().optional(),
  riskLevel: z.string().optional(),
  riskScore: z.number().optional(),
  lastUpdated: z.string().optional(),
}).optional()

// Document schema
export const Document = z.object({
  id: z.string(),
  document_type: z.string(),
  file_name: z.string(),
  file_url: z.string(),
  file_size_bytes: z.number().optional(),
  mime_type: z.string().optional(),
  description: z.string().optional(),
  uploaded_by: z.string(),
  created_at: z.string(),
  is_public: z.boolean().optional(),
})

// Photo schema
export const Photo = z.object({
  id: z.string(),
  file_name: z.string(),
  file_url: z.string(),
  caption: z.string().optional(),
  room_type: z.string().optional(),
  is_featured: z.boolean().optional(),
  uploaded_by: z.string(),
  created_at: z.string(),
})

// Property party schema
export const PropertyParty = z.object({
  id: z.string(),
  user_id: z.string(),
  relationship: z.enum(['owner', 'occupier', 'interested']).optional(),
  role: z.string().optional(), // Legacy field
  is_primary: z.boolean().optional(),
  assigned_at: z.string(),
  created_at: z.string(),
})

// External data schema
export const ExternalData = z.object({
  epc: EPCData,
  flood: FloodData,
  companies: z.any().optional(),
  planning: z.any().optional(),
  postcode: z.any().optional(),
})

// Main snapshot schema
export const Snapshot = z.object({
  property: PropertyCore,
  documents: z.array(Document).optional(),
  photos: z.array(Photo).optional(),
  parties: z.array(PropertyParty).optional(),
  external: ExternalData.optional(),
  stats: z.object({
    documentCount: z.number().optional(),
    noteCount: z.number().optional(),
    taskCount: z.number().optional(),
    partyCount: z.number().optional(),
    photoCount: z.number().optional(),
    lastDocumentUpload: z.string().optional(),
    lastNoteCreated: z.string().optional(),
    lastTaskCreated: z.string().optional(),
    lastActivity: z.string().optional(),
  }).optional(),
  updatedAt: z.string().optional(),
})

// Search result schema
export const SearchResult = z.object({
  uprn: z.string(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  id: z.string().optional(),
  ppuk_reference: z.string().optional(),
  property_type: z.string().optional(),
  city: z.string().optional(),
})

// API response wrapper
export const ApiResponse = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().optional(),
    requestId: z.string().optional(),
  }).optional(),
  timestamp: z.string().optional(),
  requestId: z.string().optional(),
})

// My properties response
export const MyPropertiesResponse = z.object({
  properties: z.array(PropertyCore.extend({
    relationship: z.enum(['owner', 'occupier', 'interested']).optional(),
    stats: z.object({
      document_count: z.number().optional(),
      note_count: z.number().optional(),
      task_count: z.number().optional(),
      photo_count: z.number().optional(),
      planning_count: z.number().optional(),
    }).optional(),
  })),
  total: z.number().optional(),
  relationship: z.string().optional(),
  pagination: z.object({
    limit: z.number().optional(),
    offset: z.number().optional(),
    has_more: z.boolean().optional(),
  }).optional(),
})

// Watchlist response
export const WatchlistResponse = z.object({
  ok: z.boolean(),
  relationship: z.string().optional(),
  property_id: z.string().optional(),
  message: z.string().optional(),
})

// Type exports
export type PropertyCore = z.infer<typeof PropertyCore>
export type Snapshot = z.infer<typeof Snapshot>
export type Document = z.infer<typeof Document>
export type Photo = z.infer<typeof Photo>
export type PropertyParty = z.infer<typeof PropertyParty>
export type SearchResult = z.infer<typeof SearchResult>
export type SearchItem = SearchResult
export type ApiResponse = z.infer<typeof ApiResponse>
export type MyPropertiesResponse = z.infer<typeof MyPropertiesResponse>
export type WatchlistResponse = z.infer<typeof WatchlistResponse>
export type EPCData = z.infer<typeof EPCData>
export type FloodData = z.infer<typeof FloodData>
