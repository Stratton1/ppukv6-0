/**
 * Property API Service
 * Client-side service for consuming PPUK Edge Functions
 * Provides typed interfaces for EPC, HMLR, and Flood Risk data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  EPCData, 
  HMLRData, 
  FloodRiskData, 
  PropertyIdentifier 
} from '../../types/api';

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
  timestamp: string;
  requestId: string;
  cache?: {
    cached: boolean;
    cacheKey: string;
    expiresAt: string;
    ttl: number;
  };
}

// Request types
interface EPCRequest extends PropertyIdentifier {}
interface HMLRRequest extends PropertyIdentifier {
  titleNumber?: string;
}
interface FloodRiskRequest extends PropertyIdentifier {}

/**
 * Base API client for Edge Functions
 */
class PropertyApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/functions/v1';
  }

  /**
   * Make authenticated request to Edge Function
   */
  private async makeRequest<T>(
    endpoint: string,
    data: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get EPC data for a property
   */
  async getEPCData(request: EPCRequest): Promise<EPCData> {
    const response = await this.makeRequest<EPCData>('/api-epc', request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch EPC data');
    }

    return response.data;
  }

  /**
   * Get HMLR data for a property
   */
  async getHMLRData(request: HMLRRequest): Promise<HMLRData> {
    const response = await this.makeRequest<HMLRData>('/api-hmlr', request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch HMLR data');
    }

    return response.data;
  }

  /**
   * Get flood risk data for a property
   */
  async getFloodRiskData(request: FloodRiskRequest): Promise<FloodRiskData> {
    const response = await this.makeRequest<FloodRiskData>('/api-flood', request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch flood risk data');
    }

    return response.data;
  }

  /**
   * Get all property data in parallel
   */
  async getAllPropertyData(property: PropertyIdentifier): Promise<{
    epc: EPCData | null;
    hmlr: HMLRData | null;
    floodRisk: FloodRiskData | null;
  }> {
    const [epcResult, hmlrResult, floodResult] = await Promise.allSettled([
      this.getEPCData(property),
      this.getHMLRData(property),
      this.getFloodRiskData(property),
    ]);

    return {
      epc: epcResult.status === 'fulfilled' ? epcResult.value : null,
      hmlr: hmlrResult.status === 'fulfilled' ? hmlrResult.value : null,
      floodRisk: floodResult.status === 'fulfilled' ? floodResult.value : null,
    };
  }
}

// Create singleton instance
export const propertyApi = new PropertyApiClient();

// Convenience functions
export const getEPCData = (request: EPCRequest) => propertyApi.getEPCData(request);
export const getHMLRData = (request: HMLRRequest) => propertyApi.getHMLRData(request);
export const getFloodRiskData = (request: FloodRiskRequest) => propertyApi.getFloodRiskData(request);
export const getAllPropertyData = (property: PropertyIdentifier) => propertyApi.getAllPropertyData(property);

// React hooks for API consumption
export function usePropertyData(property: PropertyIdentifier) {
  const [data, setData] = useState<{
    epc: EPCData | null;
    hmlr: HMLRData | null;
    floodRisk: FloodRiskData | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!property.postcode) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const result = await getAllPropertyData(property);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch property data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [property.postcode, property.address, property.uprn]);

  return { data, loading, error };
}

export function useEPCData(property: PropertyIdentifier) {
  const [data, setData] = useState<EPCData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!property.postcode) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const result = await getEPCData(property);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch EPC data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [property.postcode, property.address, property.uprn]);

  return { data, loading, error };
}

export function useHMLRData(property: PropertyIdentifier) {
  const [data, setData] = useState<HMLRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!property.postcode) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const result = await getHMLRData(property);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch HMLR data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [property.postcode, property.address, property.uprn]);

  return { data, loading, error };
}

export function useFloodRiskData(property: PropertyIdentifier) {
  const [data, setData] = useState<FloodRiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!property.postcode) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const result = await getFloodRiskData(property);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch flood risk data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [property.postcode, property.address, property.uprn]);

  return { data, loading, error };
}

// Utility functions
export function formatEPCRating(rating: string): string {
  const ratings = {
    'A': 'Excellent',
    'B': 'Very Good',
    'C': 'Good',
    'D': 'Average',
    'E': 'Below Average',
    'F': 'Poor',
    'G': 'Very Poor',
  };
  return ratings[rating as keyof typeof ratings] || rating;
}

export function formatFloodRiskLevel(level: string): string {
  const levels = {
    'Very Low': 'Very Low Risk',
    'Low': 'Low Risk',
    'Medium': 'Medium Risk',
    'High': 'High Risk',
    'Very High': 'Very High Risk',
  };
  return levels[level as keyof typeof levels] || level;
}

export function getFloodRiskColor(level: string): string {
  const colors = {
    'Very Low': '#10b981', // green
    'Low': '#84cc16', // lime
    'Medium': '#f59e0b', // amber
    'High': '#ef4444', // red
    'Very High': '#dc2626', // red-600
  };
  return colors[level as keyof typeof colors] || '#6b7280';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
