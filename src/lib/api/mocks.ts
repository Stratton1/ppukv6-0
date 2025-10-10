/**
 * Mock data for PPUK v6 API endpoints
 * Provides deterministic sample data for development and demo purposes
 */

import { Snapshot, SearchResult, MyPropertiesResponse, WatchlistResponse } from './schemas'

/**
 * Check if mocks should be used
 */
export function shouldUseMocks(): boolean {
  return !import.meta.env.VITE_FN_BASE || import.meta.env.VITE_USE_MOCKS === 'true'
}

/**
 * Mock property data
 */
const mockProperty = {
  id: 'mock-property-1',
  uprn: '100023336956',
  ppuk_reference: 'PPUK-2025-001',
  address_line_1: '15 Victoria Street',
  address_line_2: 'Westminster',
  city: 'London',
  postcode: 'SW1A 1AA',
  title_number: 'NGL123456',
  property_type: 'flat',
  bedrooms: 2,
  bathrooms: 1,
  tenure: 'leasehold',
  council_tax_band: 'F',
  epc_rating: 'D',
  epc_score: 65,
  flood_risk_level: 'Low',
  front_photo_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  completion_percentage: 75,
  is_public: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-10T10:00:00Z',
}

/**
 * Mock documents
 */
const mockDocuments = [
  {
    id: 'doc-1',
    document_type: 'epc',
    file_name: 'EPC_Certificate.pdf',
    file_url: '/documents/epc-certificate.pdf',
    file_size_bytes: 1024000,
    mime_type: 'application/pdf',
    description: 'Energy Performance Certificate',
    uploaded_by: 'user-1',
    created_at: '2025-01-05T10:00:00Z',
    is_public: true,
  },
  {
    id: 'doc-2',
    document_type: 'floorplan',
    file_name: 'Floor_Plan.pdf',
    file_url: '/documents/floor-plan.pdf',
    file_size_bytes: 512000,
    mime_type: 'application/pdf',
    description: 'Property floor plan',
    uploaded_by: 'user-1',
    created_at: '2025-01-06T10:00:00Z',
    is_public: false,
  },
]

/**
 * Mock photos
 */
const mockPhotos = [
  {
    id: 'photo-1',
    file_name: 'living-room.jpg',
    file_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    caption: 'Spacious living room with natural light',
    room_type: 'living_room',
    is_featured: true,
    uploaded_by: 'user-1',
    created_at: '2025-01-07T10:00:00Z',
  },
  {
    id: 'photo-2',
    file_name: 'kitchen.jpg',
    file_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    caption: 'Modern kitchen with island',
    room_type: 'kitchen',
    is_featured: false,
    uploaded_by: 'user-1',
    created_at: '2025-01-08T10:00:00Z',
  },
]

/**
 * Mock property parties
 */
const mockParties = [
  {
    id: 'party-1',
    user_id: 'user-1',
    relationship: 'owner' as const,
    is_primary: true,
    assigned_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
  },
]

/**
 * Mock external data
 */
const mockExternalData = {
  epc: {
    rating: 'D',
    score: 65,
    rrn: '123456789',
    certificateNumber: '123456789',
    currentRating: 'D',
    currentEfficiency: 65,
    inspectionDate: '2023-01-15',
    expires_at: '2033-01-15T00:00:00Z',
  },
  flood: {
    band: 'Low',
    level: 'Low',
    source: 'Environment Agency',
    riskLevel: 'Low',
    riskScore: 2,
    lastUpdated: '2025-01-01T00:00:00Z',
  },
  companies: [],
  planning: [],
  postcode: {
    postcode: 'SW1A 1AA',
    quality: 1,
    eastings: 529090,
    northings: 179645,
    country: 'England',
    longitude: -0.141587,
    latitude: 51.499479,
  },
}

/**
 * Mock snapshot data
 */
export const mockSnapshot: Snapshot = {
  property: mockProperty,
  documents: mockDocuments,
  photos: mockPhotos,
  parties: mockParties,
  external: mockExternalData,
  stats: {
    documentCount: 2,
    noteCount: 3,
    taskCount: 1,
    partyCount: 1,
    photoCount: 2,
    lastDocumentUpload: '2025-01-06T10:00:00Z',
    lastNoteCreated: '2025-01-09T10:00:00Z',
    lastTaskCreated: '2025-01-08T10:00:00Z',
    lastActivity: '2025-01-10T10:00:00Z',
  },
  updatedAt: '2025-01-10T10:00:00Z',
}

/**
 * Mock search results
 */
export const mockSearchResults: SearchResult[] = [
  {
    uprn: '100023336956',
    address: '15 Victoria Street, Westminster, London',
    postcode: 'SW1A 1AA',
    id: 'mock-property-1',
    ppuk_reference: 'PPUK-2025-001',
    property_type: 'flat',
    city: 'London',
  },
  {
    uprn: '100023336957',
    address: '17 Victoria Street, Westminster, London',
    postcode: 'SW1A 1AA',
    id: 'mock-property-2',
    ppuk_reference: 'PPUK-2025-002',
    property_type: 'flat',
    city: 'London',
  },
  {
    uprn: '100023336958',
    address: '19 Victoria Street, Westminster, London',
    postcode: 'SW1A 1AA',
    id: 'mock-property-3',
    ppuk_reference: 'PPUK-2025-003',
    property_type: 'house',
    city: 'London',
  },
]

/**
 * Mock my properties response
 */
export const mockMyProperties: MyPropertiesResponse = {
  properties: [
    {
      ...mockProperty,
      relationship: 'owner',
      stats: {
        document_count: 2,
        note_count: 3,
        task_count: 1,
        photo_count: 2,
        planning_count: 0,
      },
    },
    {
      ...mockProperty,
      id: 'mock-property-2',
      address_line_1: '17 Victoria Street',
      ppuk_reference: 'PPUK-2025-002',
      relationship: 'interested',
      stats: {
        document_count: 1,
        note_count: 0,
        task_count: 0,
        photo_count: 1,
        planning_count: 0,
      },
    },
  ],
  total: 2,
  relationship: undefined,
  pagination: {
    limit: 50,
    offset: 0,
    has_more: false,
  },
}

/**
 * Mock watchlist response
 */
export const mockWatchlistResponse: WatchlistResponse = {
  ok: true,
  relationship: 'interested',
  property_id: 'mock-property-1',
  message: 'Property added to watchlist successfully',
}

/**
 * Mock API functions
 */
export const mockApi = {
  async getPropertySnapshot(propertyId: string): Promise<Snapshot> {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
    return mockSnapshot
  },

  async searchAddress(query: string): Promise<SearchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockSearchResults.filter(result => 
      result.address?.toLowerCase().includes(query.toLowerCase()) ||
      result.postcode?.toLowerCase().includes(query.toLowerCase())
    )
  },

  async getMyProperties(relationship?: string): Promise<MyPropertiesResponse> {
    await new Promise(resolve => setTimeout(resolve, 400))
    return {
      ...mockMyProperties,
      relationship,
    }
  },

  async addToWatchlist(propertyId: string): Promise<WatchlistResponse> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      ...mockWatchlistResponse,
      property_id: propertyId,
    }
  },

  async removeFromWatchlist(propertyId: string): Promise<WatchlistResponse> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      ok: true,
      property_id: propertyId,
      message: 'Property removed from watchlist successfully',
    }
  },
}

/**
 * Log mock usage in development
 */
if (import.meta.env.DEV && shouldUseMocks()) {
  console.log('🎭 Using mock data for PPUK v6 API')
  console.log('Set VITE_USE_MOCKS=false to disable mocks')
}
