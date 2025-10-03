# PPUK API Documentation

**Version:** 1.0  
**Base URL:** `https://your-project.supabase.co/functions/v1`  
**Authentication:** Bearer token (Supabase JWT)

---

## Overview

The Property Passport UK API provides secure, server-side access to external property data sources including EPC (Energy Performance Certificates), HMLR (HM Land Registry), and Flood Risk data. All API keys and sensitive operations are handled server-side to maintain security.

### Key Features

- ✅ **Server-side API calls** - No secrets exposed to client
- ✅ **Zod validation** - Runtime type safety for all inputs/outputs
- ✅ **Rate limiting** - Prevents abuse and manages costs
- ✅ **Caching** - Reduces API calls and improves performance
- ✅ **Error handling** - Comprehensive error responses
- ✅ **Logging** - Full request/response logging for debugging
- ✅ **CORS support** - Cross-origin requests enabled

---

## Authentication

All API endpoints require a valid Supabase JWT token in the Authorization header:

```http
Authorization: Bearer <your-supabase-jwt-token>
```

### Getting a Token

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## Rate Limits

| Endpoint       | Limit        | Window | Notes          |
| -------------- | ------------ | ------ | -------------- |
| EPC API        | 100 requests | 1 hour | Per IP address |
| HMLR API       | 50 requests  | 1 hour | Per IP address |
| Flood Risk API | 200 requests | 1 hour | Per IP address |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid postcode format",
    "details": {
      "postcode": "INVALID123"
    },
    "timestamp": "2025-01-02T10:30:00Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  },
  "timestamp": "2025-01-02T10:30:00Z",
  "requestId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `EXTERNAL_API_ERROR` - External API failure
- `INTERNAL_ERROR` - Server error
- `METHOD_NOT_ALLOWED` - Invalid HTTP method

---

## Endpoints

### 1. EPC (Energy Performance Certificate) API

**Endpoint:** `POST /functions/v1/api-epc`

Fetches Energy Performance Certificate data from the UK EPC Register.

#### Request

```json
{
  "postcode": "SW1A 1AA",
  "address": "123 Victoria Street, London",
  "uprn": "123456789012"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "certificateNumber": "1234-5678-9012-3456-7890",
    "address": "123 Victoria Street, London",
    "postcode": "SW1A 1AA",
    "propertyType": "Detached house",
    "builtForm": "Detached",
    "totalFloorArea": 120.5,
    "currentRating": "C",
    "currentEfficiency": 72,
    "environmentalImpactRating": "D",
    "environmentalImpactEfficiency": 65,
    "mainFuelType": "Natural gas",
    "mainHeatingDescription": "Boiler and radiators",
    "mainHeatingControls": "Programmer, room thermostat and TRVs",
    "hotWaterDescription": "From main system",
    "lightingDescription": "Low energy lighting in 80% of fixed outlets",
    "windowsDescription": "Double glazed",
    "wallsDescription": "Cavity wall, as built, insulated (assumed)",
    "roofDescription": "Pitched, 300mm loft insulation",
    "floorDescription": "Suspended, no insulation (assumed)",
    "co2EmissionsCurrent": 3.2,
    "co2EmissionsPotential": 2.1,
    "totalCostCurrent": 1200,
    "totalCostPotential": 800,
    "inspectionDate": "2023-01-15T00:00:00Z",
    "lodgementDate": "2023-01-20T00:00:00Z"
  },
  "timestamp": "2025-01-02T10:30:00Z",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "cache": {
    "cached": false,
    "cacheKey": "epc:postcode:SW1A1AA|address:123 Victoria Street, London",
    "expiresAt": "2025-01-02T11:30:00Z",
    "ttl": 3600
  }
}
```

#### Required Fields

- `postcode` (string) - UK postcode in valid format

#### Optional Fields

- `address` (string) - Property address for disambiguation
- `uprn` (string) - Unique Property Reference Number

---

### 2. HMLR (HM Land Registry) API

**Endpoint:** `POST /functions/v1/api-hmlr`

Fetches property title information and transaction history from HM Land Registry.

#### Request

```json
{
  "postcode": "SW1A 1AA",
  "address": "123 Victoria Street, London",
  "titleNumber": "NGL123456"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "titleNumber": "NGL123456",
    "address": "123 Victoria Street, London",
    "postcode": "SW1A 1AA",
    "tenure": "Freehold",
    "pricePaid": 850000,
    "pricePaidDate": "2022-06-15T00:00:00Z",
    "propertyType": "Detached house",
    "newBuild": false,
    "estateType": "Residential",
    "transactions": [
      {
        "price": 850000,
        "date": "2022-06-15T00:00:00Z",
        "category": "Standard Price Paid",
        "newBuild": false,
        "estateType": "Residential"
      }
    ],
    "charges": [
      {
        "chargeNumber": "CHG001",
        "chargeType": "Mortgage",
        "chargeDescription": "Legal charge",
        "chargeDate": "2022-06-15T00:00:00Z",
        "chargeAmount": 680000,
        "chargeHolder": "ABC Bank PLC"
      }
    ],
    "restrictions": []
  },
  "timestamp": "2025-01-02T10:30:00Z",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "cache": {
    "cached": false,
    "cacheKey": "hmlr:postcode:SW1A1AA|address:123 Victoria Street, London",
    "expiresAt": "2025-01-02T12:30:00Z",
    "ttl": 7200
  }
}
```

#### Required Fields

- `postcode` (string) - UK postcode in valid format

#### Optional Fields

- `address` (string) - Property address for disambiguation
- `titleNumber` (string) - Land Registry title number

---

### 3. Flood Risk API

**Endpoint:** `POST /functions/v1/api-flood`

Fetches comprehensive flood risk data from the Environment Agency.

#### Request

```json
{
  "postcode": "SW1A 1AA",
  "address": "123 Victoria Street, London",
  "uprn": "123456789012"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "address": "123 Victoria Street, London",
    "postcode": "SW1A 1AA",
    "uprn": "123456789012",
    "floodRisk": {
      "surfaceWater": {
        "level": "Low",
        "score": 3,
        "description": "Surface water flood risk is low",
        "probability": "1 in 200 years",
        "impact": "Minor impact possible",
        "mitigation": [
          "Ensure adequate insurance coverage",
          "Keep important documents in waterproof containers",
          "Have an emergency flood plan"
        ]
      },
      "riversAndSea": {
        "level": "Very Low",
        "score": 1,
        "description": "Rivers and sea flood risk is very low",
        "probability": "1 in 1000 years",
        "impact": "Minimal impact expected"
      },
      "groundwater": {
        "level": "Very Low",
        "score": 1,
        "description": "Groundwater flood risk is very low",
        "probability": "1 in 1000 years",
        "impact": "Minimal impact expected"
      },
      "reservoirs": {
        "level": "Very Low",
        "score": 1,
        "description": "Reservoirs flood risk is very low",
        "probability": "1 in 1000 years",
        "impact": "Minimal impact expected"
      }
    },
    "riskLevel": "Low",
    "riskScore": 3,
    "lastUpdated": "2025-01-02T10:30:00Z",
    "dataSource": "Environment Agency",
    "warnings": [],
    "historicalFloods": []
  },
  "timestamp": "2025-01-02T10:30:00Z",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "cache": {
    "cached": false,
    "cacheKey": "flood:postcode:SW1A1AA|address:123 Victoria Street, London",
    "expiresAt": "2025-01-03T10:30:00Z",
    "ttl": 86400
  }
}
```

#### Required Fields

- `postcode` (string) - UK postcode in valid format

#### Optional Fields

- `address` (string) - Property address for disambiguation
- `uprn` (string) - Unique Property Reference Number

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// EPC API Example
async function getEPCData(postcode: string, address?: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch("/functions/v1/api-epc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      postcode,
      address,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

// Usage
try {
  const epcData = await getEPCData("SW1A 1AA", "123 Victoria Street, London");
  console.log("EPC Rating:", epcData.data.currentRating);
  console.log("Energy Efficiency:", epcData.data.currentEfficiency);
} catch (error) {
  console.error("Failed to fetch EPC data:", error);
}
```

### React Hook Example

```typescript
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export function useEPCData(postcode: string, address?: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postcode) return;

    async function fetchEPCData() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch("/functions/v1/api-epc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ postcode, address }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEPCData();
  }, [postcode, address]);

  return { data, loading, error };
}
```

---

## Caching

All API responses are cached to improve performance and reduce external API calls:

| API        | Cache Duration | Cache Key Format           |
| ---------- | -------------- | -------------------------- | ------------------ |
| EPC        | 1 hour         | `epc:postcode:{postcode}   | address:{address}` |
| HMLR       | 2 hours        | `hmlr:postcode:{postcode}  | address:{address}` |
| Flood Risk | 24 hours       | `flood:postcode:{postcode} | address:{address}` |

Cache information is included in responses:

```json
{
  "cache": {
    "cached": false,
    "cacheKey": "epc:postcode:SW1A1AA|address:123 Victoria Street, London",
    "expiresAt": "2025-01-02T11:30:00Z",
    "ttl": 3600
  }
}
```

---

## Environment Variables

The following environment variables must be set in your Supabase project:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Keys (optional - will use mock data if not provided)
EPC_API_KEY=your-epc-api-key
HMLR_API_KEY=your-hmlr-api-key
FLOOD_API_KEY=your-flood-api-key

# API Base URLs (optional - uses defaults if not provided)
EPC_API_BASE_URL=https://epc.opendatacommunities.org/api/v1
HMLR_API_BASE_URL=https://api.landregistry.gov.uk
FLOOD_API_BASE_URL=https://environment.data.gov.uk
```

---

## Development

### Local Development

1. **Install Supabase CLI:**

   ```bash
   npm install -g supabase
   ```

2. **Start local development:**

   ```bash
   supabase start
   ```

3. **Deploy functions:**
   ```bash
   supabase functions deploy api-epc
   supabase functions deploy api-hmlr
   supabase functions deploy api-flood
   ```

### Testing

```bash
# Test EPC API
curl -X POST http://localhost:54321/functions/v1/api-epc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"postcode": "SW1A 1AA"}'

# Test HMLR API
curl -X POST http://localhost:54321/functions/v1/api-hmlr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"postcode": "SW1A 1AA"}'

# Test Flood Risk API
curl -X POST http://localhost:54321/functions/v1/api-flood \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"postcode": "SW1A 1AA"}'
```

---

## Security

### API Key Protection

- All external API keys are stored server-side only
- Client never has access to API keys
- Keys are passed securely to external APIs

### Input Validation

- All inputs validated with Zod schemas
- Postcode format validation
- SQL injection prevention
- XSS protection

### Rate Limiting

- Per-IP rate limiting
- Prevents API abuse
- Cost management for external APIs

### Error Handling

- No sensitive information in error messages
- Comprehensive logging for debugging
- Graceful degradation on API failures

---

## Monitoring

### Logging

All API requests are logged with:

- Request ID for tracing
- User ID (if authenticated)
- Property ID (if available)
- Request parameters
- Response status
- Performance metrics

### Metrics

- Request count per endpoint
- Response times
- Error rates
- Cache hit rates
- Rate limit violations

---

## Support

For API support or questions:

- Check the logs in Supabase Dashboard
- Review error responses for specific issues
- Ensure all required environment variables are set
- Verify API keys are valid and have sufficient quota

---

**Last Updated:** 2025-01-02  
**Version:** 1.0  
**Status:** ✅ Ready for Production
