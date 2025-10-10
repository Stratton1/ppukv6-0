/**
 * PropertyDemo - Example component demonstrating PPUK v6 API usage
 * Shows how to use the typed API layer and hooks in a real component
 */

import { useState } from 'react'
import { Search, Home, Heart, HeartOff, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Import our API hooks
import { 
  usePropertySnapshot, 
  useSearchAddress, 
  useMyProperties, 
  useWatchlistMutations,
  useIsInWatchlist,
  useFeatureFlags 
} from '@/lib/api/hooks'

// Import common components
import { ErrorBanner } from '@/components/common/ErrorBanner'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingBlock, PropertyCardSkeleton, SearchResultsSkeleton } from '@/components/common/LoadingBlock'
import { DataAttribution } from '@/components/common/DataAttribution'

export function PropertyDemo() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>()

  // Feature flags
  const { relationships, docUploads, notes } = useFeatureFlags()

  // API hooks
  const { data: searchResults, isLoading: isSearching } = useSearchAddress(searchQuery)
  const { data: propertySnapshot, isLoading: isLoadingSnapshot } = usePropertySnapshot(selectedPropertyId)
  const { data: myProperties, isLoading: isLoadingMyProperties } = useMyProperties()
  const { addToWatchlist, removeFromWatchlist, isLoading: isWatchlistLoading } = useWatchlistMutations()
  const { isInWatchlist } = useIsInWatchlist(selectedPropertyId)

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      // In a real app, you might debounce this
    }
  }

  // Handle property selection
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
  }

  // Handle watchlist toggle
  const handleWatchlistToggle = async () => {
    if (!selectedPropertyId) return

    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync({ property_id: selectedPropertyId })
      } else {
        await addToWatchlist.mutateAsync({ property_id: selectedPropertyId })
      }
    } catch (error) {
      console.error('Watchlist operation failed:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">PPUK v6 API Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating the typed API layer and React Query hooks
        </p>
        
        {/* Feature flags display */}
        <div className="flex justify-center gap-2">
          {relationships && <Badge variant="secondary">Relationships</Badge>}
          {docUploads && <Badge variant="secondary">Document Uploads</Badge>}
          {notes && <Badge variant="secondary">Notes</Badge>}
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search Properties</TabsTrigger>
          <TabsTrigger value="my-properties">My Properties</TabsTrigger>
          <TabsTrigger value="property-details">Property Details</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter postcode or address..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />

              {isSearching && <SearchResultsSkeleton count={3} />}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Search Results</h3>
                  {searchResults.map((result) => (
                    <div
                      key={result.uprn}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handlePropertySelect(result.id || result.uprn)}
                    >
                      <div>
                        <p className="font-medium">{result.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.postcode} • {result.property_type}
                        </p>
                        {result.ppuk_reference && (
                          <Badge variant="outline" className="mt-1">
                            {result.ppuk_reference}
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length > 2 && !isSearching && (!searchResults || searchResults.length === 0) && (
                <EmptyState
                  icon={<Search className="h-12 w-12" />}
                  title="No properties found"
                  description="Try a different search term or check the spelling."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Properties Tab */}
        <TabsContent value="my-properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                My Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMyProperties && <PropertyCardSkeleton />}

              {myProperties && myProperties.properties.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProperties.properties.map((property) => (
                    <Card key={property.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium line-clamp-2">
                              {property.address_line_1}
                            </h3>
                            {property.relationship && (
                              <Badge variant="secondary">
                                {property.relationship}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {property.postcode} • {property.property_type}
                          </p>
                          
                          {property.ppuk_reference && (
                            <Badge variant="outline" className="text-xs">
                              {property.ppuk_reference}
                            </Badge>
                          )}

                          {property.stats && (
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{property.stats.document_count || 0} docs</span>
                              <span>{property.stats.photo_count || 0} photos</span>
                              <span>{property.stats.note_count || 0} notes</span>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handlePropertySelect(property.id!)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoadingMyProperties && (!myProperties || myProperties.properties.length === 0) && (
                <EmptyState
                  icon={<Home className="h-12 w-12" />}
                  title="No properties found"
                  description="You haven't added any properties yet. Search for properties to get started."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Details Tab */}
        <TabsContent value="property-details" className="space-y-4">
          {!selectedPropertyId ? (
            <EmptyState
              icon={<Home className="h-12 w-12" />}
              title="Select a property"
              description="Choose a property from the search results or your properties list to view details."
            />
          ) : (
            <div className="space-y-4">
              {/* Property Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{propertySnapshot?.property.address_line_1}</CardTitle>
                      <p className="text-muted-foreground">
                        {propertySnapshot?.property.postcode} • {propertySnapshot?.property.property_type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {relationships && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleWatchlistToggle}
                          disabled={isWatchlistLoading}
                        >
                          {isInWatchlist ? (
                            <>
                              <HeartOff className="h-4 w-4 mr-2" />
                              Remove from Watchlist
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4 mr-2" />
                              Add to Watchlist
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Property Details */}
              {isLoadingSnapshot && <LoadingBlock />}

              {propertySnapshot && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Basic Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Property Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Bedrooms</p>
                            <p className="font-medium">{propertySnapshot.property.bedrooms || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Bathrooms</p>
                            <p className="font-medium">{propertySnapshot.property.bathrooms || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tenure</p>
                            <p className="font-medium">{propertySnapshot.property.tenure || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Council Tax</p>
                            <p className="font-medium">{propertySnapshot.property.council_tax_band || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* EPC Information */}
                    {propertySnapshot.external?.epc && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Energy Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {propertySnapshot.external.epc.rating}
                              </div>
                              <p className="text-sm text-muted-foreground">EPC Rating</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {propertySnapshot.external.epc.score}
                              </div>
                              <p className="text-sm text-muted-foreground">Score</p>
                            </div>
                          </div>
                          <DataAttribution sources={[{ name: 'EPC Register', isOfficial: true, isFree: true }]} compact />
                        </CardContent>
                      </Card>
                    )}

                    {/* Flood Risk */}
                    {propertySnapshot.external?.flood && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Flood Risk</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4">
                            <Badge variant={propertySnapshot.external.flood.riskLevel === 'Low' ? 'default' : 'destructive'}>
                              {propertySnapshot.external.flood.riskLevel} Risk
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Score: {propertySnapshot.external.flood.riskScore}/10
                            </span>
                          </div>
                          <DataAttribution sources={[{ name: 'Environment Agency', isOfficial: true, isFree: true }]} compact />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Stats */}
                    {propertySnapshot.stats && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Property Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Documents</span>
                            <span className="font-medium">{propertySnapshot.stats.documentCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Photos</span>
                            <span className="font-medium">{propertySnapshot.stats.photoCount || 0}</span>
                          </div>
                          {notes && (
                            <div className="flex justify-between">
                              <span className="text-sm">Notes</span>
                              <span className="font-medium">{propertySnapshot.stats.noteCount || 0}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm">Tasks</span>
                            <span className="font-medium">{propertySnapshot.stats.taskCount || 0}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Data Attribution */}
                    <DataAttribution 
                      sources={[
                        { name: 'EPC Register', isOfficial: true, isFree: true },
                        { name: 'Environment Agency', isOfficial: true, isFree: true },
                        { name: 'HM Land Registry', isOfficial: true, isFree: true },
                      ]} 
                    />
                  </div>
                </div>
              )}

              {/* Error Handling */}
              {propertySnapshot === null && !isLoadingSnapshot && (
                <ErrorBanner
                  title="Failed to load property"
                  message="There was an error loading the property details. Please try again."
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
