# Property Passport UK - API Integration Roadmap

## Overview

This document outlines the roadmap for integrating external APIs to enhance Property Passport UK with comprehensive property data. The APIs are prioritized by value, cost, and implementation complexity.

---

## 🎯 Phase 1: Core Property Data (COMPLETED)

### ✅ EPC (Energy Performance Certificate) API
- **Status**: Edge Function deployed
- **Endpoint**: `/functions/v1/api-epc`
- **Data**: Energy ratings, efficiency scores, recommendations
- **Cost**: Free (EPC Register API)
- **Implementation**: Complete with mock data

### ✅ HMLR (HM Land Registry) API
- **Status**: Edge Function deployed
- **Endpoint**: `/functions/v1/api-hmlr`
- **Data**: Title numbers, ownership, sale history, charges
- **Cost**: Free (HMLR Price Paid Data)
- **Implementation**: Complete with mock data

### ✅ Flood Risk API
- **Status**: Edge Function deployed
- **Endpoint**: `/functions/v1/api-flood`
- **Data**: Flood risk levels, historical floods, mitigation
- **Cost**: Free (Environment Agency API)
- **Implementation**: Complete with mock data

---

## 🚀 Phase 2: Enhanced Property Intelligence (IN PROGRESS)

### 1. Police UK Crime Statistics API
- **Priority**: High
- **Status**: Stub created
- **Endpoint**: `/functions/v1/api-crime`
- **Data**: Crime statistics, safety ratings, trends
- **Cost**: Free
- **API**: [Police UK Data API](https://data.police.uk/docs/)
- **Implementation Plan**:
  - [ ] Create Edge Function with Zod validation
  - [ ] Implement crime data fetching by postcode
  - [ ] Add safety rating calculation
  - [ ] Cache results for 24 hours
  - [ ] Add to PropertyDataPanel component

### 2. Google Maps / Street View API
- **Priority**: High
- **Status**: Stub created
- **Endpoint**: `/functions/v1/api-streetview`
- **Data**: Street view images, nearby places, walkability
- **Cost**: $7 per 1000 requests (Street View), $5 per 1000 requests (Places)
- **API**: [Google Maps Platform](https://developers.google.com/maps)
- **Implementation Plan**:
  - [ ] Create Edge Function with API key management
  - [ ] Implement Street View image generation
  - [ ] Add nearby places search (schools, hospitals, transport)
  - [ ] Calculate walkability scores
  - [ ] Cache images and data for 30 days
  - [ ] Add to PropertyDataPanel component

### 3. Ofsted Education API
- **Priority**: High
- **Status**: Stub created
- **Endpoint**: `/functions/v1/api-education`
- **Data**: School ratings, catchment areas, performance
- **Cost**: Free
- **API**: [Ofsted API](https://www.gov.uk/government/statistical-data-sets/schools-pupils-and-their-characteristics-statistical-first-release)
- **Implementation Plan**:
  - [ ] Create Edge Function for school data
  - [ ] Implement school search by postcode
  - [ ] Add Ofsted rating integration
  - [ ] Calculate catchment area analysis
  - [ ] Cache results for 7 days
  - [ ] Add to PropertyDataPanel component

---

## 🌍 Phase 3: Environmental & Heritage Data

### 4. Environment Agency API
- **Priority**: Medium
- **Status**: Stub created
- **Endpoint**: `/functions/v1/api-environmental`
- **Data**: Air quality, noise levels, green spaces, environmental risks
- **Cost**: Free
- **API**: [Environment Agency API](https://environment.data.gov.uk/)
- **Implementation Plan**:
  - [ ] Create Edge Function for environmental data
  - [ ] Implement air quality monitoring
  - [ ] Add noise level assessments
  - [ ] Map green spaces and parks
  - [ ] Cache results for 1 hour (real-time data)
  - [ ] Add to PropertyDataPanel component

### 5. Historic England API
- **Priority**: Medium
- **Status**: Stub created
- **Endpoint**: `/functions/v1/api-heritage`
- **Data**: Listed buildings, conservation areas, scheduled monuments
- **Cost**: Free
- **API**: [Historic England API](https://historicengland.org.uk/listing/the-list/)
- **Implementation Plan**:
  - [ ] Create Edge Function for heritage data
  - [ ] Implement listed building search
  - [ ] Add conservation area mapping
  - [ ] Include scheduled monuments
  - [ ] Cache results for 30 days
  - [ ] Add to PropertyDataPanel component

---

## 📊 Phase 4: Demographics & Infrastructure

### 6. ONS (Office for National Statistics) API
- **Priority**: Medium
- **Status**: Stub created
- **Endpoint**: `/functions/v1/api-demographics`
- **Data**: Population, demographics, socioeconomics, housing
- **Cost**: Free
- **API**: [ONS API](https://developer.ons.gov.uk/)
- **Implementation Plan**:
  - [ ] Create Edge Function for census data
  - [ ] Implement demographic analysis
  - [ ] Add socioeconomic indicators
  - [ ] Include housing statistics
  - [ ] Cache results for 30 days
  - [ ] Add to PropertyDataPanel component

### 7. Ordnance Survey API
- **Priority**: Low
- **Status**: Stub created
- **Endpoint**: `/functions/v1/api-topographic`
- **Data**: Property boundaries, topography, land use, utilities
- **Cost**: Free tier available, paid for detailed data
- **API**: [OS Data Hub](https://osdatahub.os.uk/)
- **Implementation Plan**:
  - [ ] Create Edge Function for OS data
  - [ ] Implement property boundary mapping
  - [ ] Add topographic analysis
  - [ ] Include utility information
  - [ ] Cache results for 30 days
  - [ ] Add to PropertyDataPanel component

---

## 🔧 Implementation Strategy

### Edge Function Architecture
```
supabase/functions/
├── api-crime/
│   ├── index.ts
│   └── crime-service.ts
├── api-streetview/
│   ├── index.ts
│   └── maps-service.ts
├── api-education/
│   ├── index.ts
│   └── education-service.ts
├── api-environmental/
│   ├── index.ts
│   └── environmental-service.ts
├── api-heritage/
│   ├── index.ts
│   └── heritage-service.ts
├── api-demographics/
│   ├── index.ts
│   └── demographics-service.ts
└── api-topographic/
    ├── index.ts
    └── topographic-service.ts
```

### Shared Components
- **Validation**: Zod schemas for all API inputs/outputs
- **Caching**: Redis-based caching with configurable TTL
- **Rate Limiting**: Per-user and per-API rate limits
- **Error Handling**: Structured error responses
- **Logging**: Comprehensive logging with correlation IDs

### Client Integration
```typescript
// Usage in React components
import { usePropertyData } from '../lib/apis/property-api';
import { useCrimeData, useEducationData } from '../lib/apis/external';

function PropertyDataPanel({ property }) {
  const { data: crimeData } = useCrimeData(property);
  const { data: educationData } = useEducationData(property);
  
  return (
    <div>
      <CrimeSection data={crimeData} />
      <EducationSection data={educationData} />
    </div>
  );
}
```

---

## 💰 Cost Analysis

### Free APIs (No Cost)
- Police UK Crime Statistics
- Ofsted Education Data
- Environment Agency Data
- Historic England Data
- ONS Demographics
- HMLR Land Registry
- EPC Register

### Paid APIs (Budget Required)
- **Google Maps Platform**: ~$50-100/month for 10,000 property views
- **Ordnance Survey**: ~$200-500/month for detailed mapping data

### Total Estimated Monthly Cost
- **Phase 1**: $0 (Free APIs only)
- **Phase 2**: $50-100 (Google Maps integration)
- **Phase 3**: $50-100 (No additional cost)
- **Phase 4**: $200-500 (OS detailed data)

---

## 🚦 Implementation Timeline

### Q1 2025: Phase 2 (High Priority)
- **Week 1-2**: Police UK Crime API
- **Week 3-4**: Google Maps/Street View API
- **Week 5-6**: Ofsted Education API
- **Week 7-8**: Integration and testing

### Q2 2025: Phase 3 (Medium Priority)
- **Week 1-2**: Environment Agency API
- **Week 3-4**: Historic England API
- **Week 5-6**: Integration and testing

### Q3 2025: Phase 4 (Lower Priority)
- **Week 1-2**: ONS Demographics API
- **Week 3-4**: Ordnance Survey API
- **Week 5-6**: Integration and testing

---

## 🔒 Security Considerations

### API Key Management
- All API keys stored as Supabase secrets
- Never exposed to client-side code
- Rotated regularly (quarterly)
- Monitored for usage and abuse

### Rate Limiting
- Per-user limits: 100 requests/hour
- Per-API limits: Based on provider limits
- Circuit breakers for failing APIs
- Graceful degradation when limits exceeded

### Data Privacy
- No PII stored in external API calls
- Postcode-only queries where possible
- Data anonymization for analytics
- GDPR compliance for EU users

---

## 📈 Success Metrics

### Technical Metrics
- API response time < 2 seconds
- 99.9% uptime for Edge Functions
- < 1% error rate
- Cache hit rate > 80%

### Business Metrics
- Property completion score improvement
- User engagement increase
- Time spent on property pages
- User satisfaction scores

### Cost Metrics
- API cost per property view
- Cost per user acquisition
- ROI on paid API integrations

---

## 🛠️ Development Guidelines

### Code Standards
- TypeScript strict mode
- Zod validation for all inputs
- Comprehensive error handling
- Unit tests for all functions
- Integration tests for API calls

### Documentation
- API documentation for each endpoint
- Integration guides for developers
- Troubleshooting guides
- Performance optimization guides

### Monitoring
- Real-time API health monitoring
- Performance dashboards
- Error tracking and alerting
- Cost monitoring and optimization

---

## 🔄 Future Enhancements

### Advanced Features
- AI-powered property insights
- Predictive analytics for property values
- Market trend analysis
- Investment opportunity scoring

### Additional APIs
- Planning permission data
- Local authority information
- Transport for London (TfL) data
- Weather and climate data
- Energy efficiency recommendations

### Integration Opportunities
- Property listing platforms
- Estate agent systems
- Mortgage provider APIs
- Insurance company data
- Surveyor reports

---

**Last Updated**: 2025-01-02  
**Version**: 1.0  
**Status**: Planning Phase
