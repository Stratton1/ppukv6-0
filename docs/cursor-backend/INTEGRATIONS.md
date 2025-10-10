# PPUK v6 External Integrations

## Overview

The PPUK v6 platform integrates with multiple external APIs to provide comprehensive property data. All integrations are designed with caching, rate limiting, and error handling.

## Integration Architecture

```
PPUK Platform → Edge Functions → External APIs → Cache → Database
     ↓
Rate Limiting → Authentication → Data Transformation → Response
```

## Data Sources

### 1. EPC (Energy Performance Certificate) API

**Provider**: UK EPC Open Data
**Endpoint**: `https://epc.opendatacommunities.org/api/v1`
**Authentication**: API Key (optional)
**Rate Limit**: 100 requests/hour
**Cache TTL**: 24 hours

**Data Provided**:
- Energy efficiency ratings
- CO2 emissions
- Heating costs
- Property characteristics
- Inspection dates

**Example Request**:
```typescript
const response = await fetch('https://epc.opendatacommunities.org/api/v1/domestic/search', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  },
  params: {
    postcode: 'SW1A 1AA',
    size: 100
  }
});
```

**Response Format**:
```json
{
  "results": [
    {
      "certificateNumber": "123456789",
      "address": "15 Victoria Street",
      "postcode": "SW1A 1AA",
      "currentRating": "D",
      "currentEfficiency": 65,
      "co2EmissionsCurrent": 2.5,
      "totalCostCurrent": 1200,
      "inspectionDate": "2023-01-15"
    }
  ]
}
```

### 2. Flood Risk API

**Provider**: Environment Agency
**Endpoint**: `https://environment.data.gov.uk/flood-monitoring`
**Authentication**: API Key (optional)
**Rate Limit**: 1000 requests/day
**Cache TTL**: 7 days

**Data Provided**:
- Surface water flood risk
- River and sea flood risk
- Groundwater flood risk
- Reservoir flood risk
- Current flood warnings
- Historical flood data

**Example Request**:
```typescript
const response = await fetch('https://environment.data.gov.uk/flood-monitoring/flood-risk/surface-water', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  },
  params: {
    lat: 51.5074,
    lng: -0.1278
  }
});
```

**Response Format**:
```json
{
  "riskLevel": "Low",
  "riskScore": 2,
  "description": "Low flood risk",
  "probability": "1 in 100 years",
  "impact": "Low impact",
  "mitigation": ["Monitor weather conditions", "Check flood warnings"]
}
```

### 3. Postcodes.io API

**Provider**: postcodes.io
**Endpoint**: `https://api.postcodes.io`
**Authentication**: None required
**Rate Limit**: 1000 requests/day
**Cache TTL**: 24 hours

**Data Provided**:
- Postcode validation
- Geocoding (postcode to coordinates)
- Reverse geocoding (coordinates to postcode)
- Administrative areas
- Parliamentary constituencies

**Example Request**:
```typescript
const response = await fetch('https://api.postcodes.io/postcodes/SW1A1AA', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
});
```

**Response Format**:
```json
{
  "result": {
    "postcode": "SW1A 1AA",
    "quality": 1,
    "eastings": 529090,
    "northings": 179645,
    "country": "England",
    "longitude": -0.1278,
    "latitude": 51.5074,
    "parliamentary_constituency": "Cities of London and Westminster",
    "admin_district": "Westminster",
    "region": "London"
  }
}
```

### 4. OS Places API

**Provider**: Ordnance Survey
**Endpoint**: `https://api.os.uk/places/v1`
**Authentication**: API Key required
**Rate Limit**: 1000 requests/day
**Cache TTL**: 24 hours

**Data Provided**:
- Address search and validation
- UPRN (Unique Property Reference Number)
- Property classification
- Administrative boundaries
- Geographic coordinates

**Example Request**:
```typescript
const response = await fetch('https://api.os.uk/places/v1/addresses', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  },
  params: {
    query: '15 Victoria Street',
    limit: 10
  }
});
```

**Response Format**:
```json
{
  "results": [
    {
      "uprn": "123456789012",
      "address": "15 Victoria Street, London",
      "postcode": "SW1A 1AA",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "classification": "Residential",
      "administrative_area": "Westminster"
    }
  ]
}
```

### 5. Planning API

**Provider**: Planning.data.gov.uk
**Endpoint**: `https://www.planning.data.gov.uk`
**Authentication**: API Key (optional)
**Rate Limit**: 100 requests/hour
**Cache TTL**: 24 hours

**Data Provided**:
- Planning applications
- Planning constraints
- Conservation areas
- Listed buildings
- Tree preservation orders

**Example Request**:
```typescript
const response = await fetch('https://www.planning.data.gov.uk/applications', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  },
  params: {
    postcode: 'SW1A 1AA',
    status: 'approved'
  }
});
```

**Response Format**:
```json
{
  "results": [
    {
      "reference": "APP/2023/001",
      "address": "15 Victoria Street",
      "description": "Extension to rear",
      "status": "Approved",
      "applicationDate": "2023-01-15",
      "decisionDate": "2023-03-15",
      "applicant": "John Smith"
    }
  ]
}
```

### 6. Companies House API

**Provider**: Companies House
**Endpoint**: `https://api.company-information.service.gov.uk`
**Authentication**: API Key required
**Rate Limit**: 600 requests/5 minutes
**Cache TTL**: 24 hours

**Data Provided**:
- Company information
- Officer details
- Filing history
- Company status
- Registered address

**Example Request**:
```typescript
const response = await fetch('https://api.company-information.service.gov.uk/company/12345678', {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${btoa(apiKey + ':')}`,
    'Accept': 'application/json'
  }
});
```

**Response Format**:
```json
{
  "company_number": "12345678",
  "company_name": "Example Ltd",
  "company_status": "active",
  "company_type": "ltd",
  "date_of_creation": "2020-01-01",
  "registered_office_address": {
    "address_line_1": "123 Business Street",
    "postal_code": "SW1A 1AA",
    "country": "England"
  }
}
```

## Integration Patterns

### 1. Caching Strategy

**Database Caching**:
```typescript
// Check cache first
const cached = await cache.get('epc', cacheKey);
if (cached) {
  return cached;
}

// Fetch from external API
const data = await fetchExternalAPI();

// Cache the result
await cache.set('epc', cacheKey, data, 86400); // 24 hours
```

**Cache Keys**:
- EPC: `epc:postcode:address`
- Flood: `flood:lat:lng`
- Postcodes: `postcode:SW1A1AA`
- OS Places: `osplaces:query:limit`
- Planning: `planning:postcode:status`
- Companies: `companies:company_number`

### 2. Rate Limiting

**Per-User Limits**:
```typescript
const rateLimit = await checkRateLimit(userId, 100, 3600); // 100/hour
if (rateLimit.exceeded) {
  throw new Error('Rate limit exceeded');
}
```

**Per-IP Limits**:
```typescript
const ipRateLimit = await checkIPRateLimit(ipAddress, 1000, 86400); // 1000/day
if (ipRateLimit.exceeded) {
  throw new Error('IP rate limit exceeded');
}
```

### 3. Error Handling

**Retry Logic**:
```typescript
async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

**Fallback Data**:
```typescript
try {
  const data = await fetchExternalAPI();
  return data;
} catch (error) {
  console.error('External API error:', error);
  return getDefaultData(); // Fallback to default values
}
```

### 4. Data Transformation

**Normalization**:
```typescript
function transformEPCData(rawData: any): EPCReport {
  return {
    certificateNumber: rawData.certificateNumber || '',
    address: rawData.address || '',
    postcode: rawData.postcode || '',
    currentRating: normalizeRating(rawData.currentRating),
    currentEfficiency: parseInt(rawData.currentEfficiency) || 0,
    // ... other fields
  };
}
```

**Validation**:
```typescript
function validateEPCData(data: any): boolean {
  return data.certificateNumber && 
         data.address && 
         data.postcode && 
         data.currentRating;
}
```

## API Keys Management

### Environment Variables
```bash
# EPC API
EPC_API_KEY=epc_key_123

# Flood Risk API
FLOOD_API_KEY=flood_key_456

# OS Places API
OSPLACES_API_KEY=osplaces_key_789

# Planning API
PLANNING_API_KEY=planning_key_012

# Companies House API
COMPANIES_API_KEY=companies_key_345
```

### Key Rotation
```typescript
// Check key expiration
const keyExpiry = await getKeyExpiry(provider);
if (keyExpiry < Date.now()) {
  await rotateAPIKey(provider);
}
```

## Monitoring & Alerting

### Health Checks
```typescript
async function checkAPIHealth(provider: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

### Metrics Collection
```typescript
// Track API usage
await trackAPICall(provider, endpoint, duration, success);

// Track rate limits
await trackRateLimit(provider, remaining, reset);

// Track errors
await trackError(provider, error, context);
```

### Alerting
```typescript
// Rate limit alerts
if (remaining < 10) {
  await sendAlert('Rate limit warning', { provider, remaining });
}

// API down alerts
if (!await checkAPIHealth(provider)) {
  await sendAlert('API down', { provider, timestamp });
}
```

## Testing

### Mock Services
```typescript
// Mock EPC API
const mockEPCAPI = {
  search: jest.fn().mockResolvedValue({
    results: [{
      certificateNumber: '123456789',
      address: '15 Victoria Street',
      postcode: 'SW1A 1AA',
      currentRating: 'D'
    }]
  })
};
```

### Integration Tests
```typescript
describe('EPC Integration', () => {
  it('should fetch EPC data', async () => {
    const data = await epcClient.fetchEPCData({
      postcode: 'SW1A 1AA'
    });
    
    expect(data).toBeDefined();
    expect(data[0].certificateNumber).toBe('123456789');
  });
});
```

## Troubleshooting

### Common Issues

1. **API Key Issues**:
   - Check key validity and expiration
   - Verify key permissions
   - Rotate keys if necessary

2. **Rate Limiting**:
   - Implement exponential backoff
   - Use request queuing
   - Monitor usage patterns

3. **Data Quality**:
   - Validate response data
   - Handle missing fields
   - Implement data cleaning

4. **Performance**:
   - Optimize cache TTL
   - Implement request batching
   - Monitor response times

### Debug Tools
```typescript
// Enable debug logging
const debug = process.env.DEBUG === 'true';

if (debug) {
  console.log('API Request:', { url, headers, body });
  console.log('API Response:', { status, data });
}
```

## Security Considerations

### API Key Security
- Store keys in environment variables
- Use key rotation
- Monitor key usage
- Implement key validation

### Data Privacy
- Sanitize sensitive data
- Implement data retention policies
- Use encryption for stored data
- Audit data access

### Rate Limiting
- Implement per-user limits
- Use IP-based limiting
- Monitor for abuse
- Implement circuit breakers

## New Integrations (Phase 2.2)

### 7. Planning API (Real Implementation)

**Provider**: Planning.data.gov.uk / Local Planning Authorities
**Endpoint**: `https://www.planning.data.gov.uk`
**Authentication**: API Key (optional)
**Rate Limit**: 100 requests/hour
**Cache TTL**: 24 hours
**Status**: Real implementation with mock data

**Data Provided**:
- Planning applications and decisions
- Planning constraints and designations
- Conservation areas and listed buildings
- Tree preservation orders
- Article 4 directions

**Example Response**:
```json
{
  "address": "123 Example Street",
  "postcode": "EX1 1AB",
  "applications": [
    {
      "reference": "PLAN/2024/001",
      "description": "Single storey rear extension",
      "status": "Approved",
      "applicationDate": "2024-01-15",
      "decisionDate": "2024-03-20",
      "applicant": "John Smith"
    }
  ],
  "constraints": [
    {
      "type": "Conservation Area",
      "name": "Example Conservation Area",
      "status": "Active"
    }
  ]
}
```

### 8. Price Paid Data API (Real Implementation)

**Provider**: HM Land Registry Open Data
**Endpoint**: `https://www.gov.uk/government/collections/price-paid-data`
**Authentication**: None required
**Rate Limit**: 500 requests/day
**Cache TTL**: 7 days
**Status**: Real implementation with mock data

**Data Provided**:
- Property transaction history
- Sale prices and dates
- Property types and tenure
- Address details and postcodes

**Example Response**:
```json
{
  "entries": [
    {
      "transactionId": "1234567890",
      "price": 450000,
      "date": "2023-06-15",
      "postcode": "EX1 1AB",
      "propertyType": "Terraced",
      "tenure": "Freehold",
      "paon": "123",
      "street": "Example Street"
    }
  ],
  "total": 3,
  "postcode": "EX1 1AB"
}
```

### 9. Companies House API (Real Implementation)

**Provider**: Companies House
**Endpoint**: `https://api.company-information.service.gov.uk`
**Authentication**: API Key required
**Rate Limit**: 600 requests/5 minutes
**Cache TTL**: 7 days
**Status**: Real implementation (requires API key)

**Data Provided**:
- Company information and status
- Officer details and roles
- Filing history and documents
- Registered office addresses
- SIC codes and business activities

**Example Response**:
```json
{
  "companies": [
    {
      "companyNumber": "12345678",
      "companyName": "Example Property Management Ltd",
      "status": "Active",
      "type": "Private Limited Company",
      "dateOfCreation": "2020-01-15",
      "officers": [
        {
          "name": "John Smith",
          "officerRole": "Director",
          "appointedOn": "2020-01-15"
        }
      ]
    }
  ],
  "total": 2
}
```

### 10. Police API (Real Implementation)

**Provider**: UK Police API
**Endpoint**: `https://data.police.uk/api`
**Authentication**: None required
**Rate Limit**: 1000 requests/day
**Cache TTL**: 7 days
**Status**: Real implementation with mock data

**Data Provided**:
- Crime statistics by area
- Crime categories and trends
- Safety ratings and comparisons
- Historical crime data

**Example Response**:
```json
{
  "area": "EX1 1AB",
  "period": "2024-01",
  "totalCrimes": 45,
  "crimesByCategory": [
    {
      "category": "Anti-social behaviour",
      "count": 12,
      "percentage": 26.7
    }
  ],
  "crimeRate": 2.3,
  "comparison": {
    "nationalAverage": 3.1,
    "localAuthorityAverage": 2.8,
    "percentile": 25
  }
}
```

## Link-Out Stubs (Phase 2.2)

### 11. INSPIRE / National Polygon Service (Link-Out Stub)

**Provider**: INSPIRE Directive / HM Land Registry
**Status**: Link-out stub (paid service)
**Cache TTL**: 7 days

**Purpose**: Property boundary and land parcel data
**Links Provided**:
- INSPIRE Portal access
- National Polygon Service documentation
- Land Registry INSPIRE data downloads
- Environment Agency spatial data
- Natural England protected areas
- Ordnance Survey Open Data

### 12. VOA Council Tax (Link-Out Stub)

**Provider**: Valuation Office Agency
**Status**: Link-out stub (no free API)
**Cache TTL**: 30 days

**Purpose**: Council tax band information
**Links Provided**:
- Official council tax band checker
- VOA property search tool
- Council tax appeals process
- VOA contact information
- Local authority finder

### 13. OS Places API (Link-Out Stub)

**Provider**: Ordnance Survey
**Status**: Link-out stub (paid service)
**Cache TTL**: 7 days

**Purpose**: Address data and UPRN lookups
**Links Provided**:
- OS Places API documentation
- OS Data Hub registration
- API explorer and testing tools
- Alternative free services (postcodes.io)

### 14. FENSA (Link-Out Stub)

**Provider**: FENSA (Fenestration Self-Assessment Scheme)
**Status**: Link-out stub (no free API)
**Cache TTL**: 30 days

**Purpose**: Window and door installation certificates
**Links Provided**:
- FENSA installer search
- Certificate verification
- Registration process
- Technical standards guide
- Building regulations compliance

### 15. Gas Safe Register (Link-Out Stub)

**Provider**: Gas Safe Register
**Status**: Link-out stub (no free API)
**Cache TTL**: 30 days

**Purpose**: Gas engineer registration and certificates
**Links Provided**:
- Gas Safe engineer finder
- Engineer registration checker
- Gas safety certificate verification
- Registration process
- Safety standards and regulations

## API Rate Limits Summary

| Provider | Rate Limit | Burst Limit | Cache TTL | Status |
|----------|------------|-------------|-----------|---------|
| EPC | 100/hour | 10/minute | 24 hours | Real |
| Flood Risk | 1000/day | 50/minute | 7 days | Real |
| Postcodes | 1000/day | 100/minute | 30 days | Real |
| Planning | 100/hour | 10/minute | 24 hours | Real (mock) |
| Price Paid | 500/day | 25/minute | 7 days | Real (mock) |
| Companies House | 600/5min | 120/minute | 7 days | Real (requires key) |
| Police | 1000/day | 50/minute | 7 days | Real (mock) |
| INSPIRE | N/A | N/A | 7 days | Link-out |
| VOA | N/A | N/A | 30 days | Link-out |
| OS Places | N/A | N/A | 7 days | Link-out |
| FENSA | N/A | N/A | 30 days | Link-out |
| Gas Safe | N/A | N/A | 30 days | Link-out |

## Environment Variables

### Required Secrets
```bash
# Companies House API (for real implementation)
COMPANIES_HOUSE_API_KEY=your_api_key_here

# Optional OCR Processing
OCR_ENABLED=true
OCR_PROVIDER=google_vision
OCR_API_KEY=your_ocr_key

# Optional Antivirus Scanning
AV_ENABLED=true
AV_PROVIDER=clamav
AV_QUARANTINE_BUCKET=quarantine
```

### Optional API Keys
```bash
# EPC API (for enhanced access)
EPC_API_KEY=your_epc_key

# Flood Risk API (for enhanced access)
FLOOD_API_KEY=your_flood_key

# Planning API (for enhanced access)
PLANNING_API_KEY=your_planning_key
```
