/**
 * DataAttribution - Component for displaying data source attribution
 * Shows source, timestamp, and external links for property data
 */

import { ExternalLink, Clock, Database, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DataSource {
  name: string
  url?: string
  lastUpdated?: string
  isOfficial?: boolean
  isFree?: boolean
}

interface DataAttributionProps {
  sources: DataSource[]
  className?: string
  compact?: boolean
}

export function DataAttribution({ 
  sources, 
  className = '', 
  compact = false 
}: DataAttributionProps) {
  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 text-xs text-muted-foreground ${className}`}>
        {sources.map((source, index) => (
          <div key={index} className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span>{source.name}</span>
            {source.isOfficial && (
              <Shield className="h-3 w-3 text-green-600" />
            )}
            {source.url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => window.open(source.url, '_blank')}
                aria-label={`View ${source.name} data source`}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <h4 className="font-medium">Data Sources</h4>
          </div>
          
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{source.name}</span>
                  {source.isOfficial && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Official
                    </Badge>
                  )}
                  {source.isFree && (
                    <Badge variant="outline" className="text-xs">
                      Free
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {source.lastUpdated && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(source.lastUpdated).toLocaleDateString()}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Last updated: {new Date(source.lastUpdated).toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {source.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(source.url, '_blank')}
                      aria-label={`View ${source.name} data source`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Predefined data sources for common property data
 */
export const PROPERTY_DATA_SOURCES: Record<string, DataSource[]> = {
  epc: [
    {
      name: 'EPC Register',
      url: 'https://www.gov.uk/find-energy-certificate',
      isOfficial: true,
      isFree: true,
    }
  ],
  flood: [
    {
      name: 'Environment Agency',
      url: 'https://www.gov.uk/check-flood-risk',
      isOfficial: true,
      isFree: true,
    }
  ],
  planning: [
    {
      name: 'Planning.data.gov.uk',
      url: 'https://www.planning.data.gov.uk/',
      isOfficial: true,
      isFree: true,
    }
  ],
  postcode: [
    {
      name: 'Postcodes.io',
      url: 'https://postcodes.io/',
      isOfficial: false,
      isFree: true,
    }
  ],
  companies: [
    {
      name: 'Companies House',
      url: 'https://find-and-update.company-information.service.gov.uk/',
      isOfficial: true,
      isFree: true,
    }
  ],
  pricePaid: [
    {
      name: 'HM Land Registry',
      url: 'https://www.gov.uk/search-property-information-land-registry',
      isOfficial: true,
      isFree: true,
    }
  ],
  crime: [
    {
      name: 'Police UK',
      url: 'https://data.police.uk/',
      isOfficial: true,
      isFree: true,
    }
  ],
}

/**
 * Hook for getting data sources with timestamps
 */
export function useDataSources(dataTypes: string[], lastUpdated?: Record<string, string>) {
  const sources: DataSource[] = []
  
  dataTypes.forEach(type => {
    const typeSources = PROPERTY_DATA_SOURCES[type] || []
    typeSources.forEach(source => {
      sources.push({
        ...source,
        lastUpdated: lastUpdated?.[type],
      })
    })
  })
  
  return sources
}

/**
 * EPC data attribution component
 */
export function EPCDataAttribution({ 
  lastUpdated, 
  compact = false 
}: { 
  lastUpdated?: string
  compact?: boolean 
}) {
  const sources = useDataSources(['epc'], { epc: lastUpdated })
  return <DataAttribution sources={sources} compact={compact} />
}

/**
 * Flood data attribution component
 */
export function FloodDataAttribution({ 
  lastUpdated, 
  compact = false 
}: { 
  lastUpdated?: string
  compact?: boolean 
}) {
  const sources = useDataSources(['flood'], { flood: lastUpdated })
  return <DataAttribution sources={sources} compact={compact} />
}

/**
 * Planning data attribution component
 */
export function PlanningDataAttribution({ 
  lastUpdated, 
  compact = false 
}: { 
  lastUpdated?: string
  compact?: boolean 
}) {
  const sources = useDataSources(['planning'], { planning: lastUpdated })
  return <DataAttribution sources={sources} compact={compact} />
}

/**
 * Combined property data attribution
 */
export function PropertyDataAttribution({ 
  dataTypes, 
  lastUpdated, 
  compact = false 
}: { 
  dataTypes: string[]
  lastUpdated?: Record<string, string>
  compact?: boolean 
}) {
  const sources = useDataSources(dataTypes, lastUpdated)
  return <DataAttribution sources={sources} compact={compact} />
}
