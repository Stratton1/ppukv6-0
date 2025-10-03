/**
 * PropertyDataPanel Component
 * Displays comprehensive property data from EPC, HMLR, and Flood Risk APIs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  usePropertyData, 
  formatEPCRating, 
  formatFloodRiskLevel, 
  getFloodRiskColor,
  formatCurrency,
  formatDate
} from '@/lib/apis/property-api';
import type { PropertyIdentifier } from '@/types/api';
import { 
  Home, 
  Zap, 
  Shield, 
  Droplets, 
  Calendar, 
  PoundSterling,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PropertyDataPanelProps {
  property: PropertyIdentifier;
  className?: string;
}

export function PropertyDataPanel({ property, className }: PropertyDataPanelProps) {
  const { data, loading, error } = usePropertyData(property);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load property data: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={className}>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No property data available for this address.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { epc, hmlr, floodRisk } = data;

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="epc">EPC</TabsTrigger>
          <TabsTrigger value="hmlr">HMLR</TabsTrigger>
          <TabsTrigger value="flood">Flood Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {epc && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Energy Rating</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{epc.rating}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatEPCRating(epc.rating)} ({epc.score}/100)
                  </p>
                </CardContent>
              </Card>
            )}

            {hmlr && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Sale</CardTitle>
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(hmlr.price)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(hmlr.lastSold)}
                  </p>
                </CardContent>
              </Card>
            )}

            {floodRisk && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flood Risk</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: getFloodRiskColor(floodRisk.riskLevel),
                        color: getFloodRiskColor(floodRisk.riskLevel)
                      }}
                    >
                      {floodRisk.riskLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFloodRiskLevel(floodRisk.riskLevel)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="epc" className="space-y-4">
          {epc ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Energy Performance Certificate</span>
                </CardTitle>
                <CardDescription>
                  Last updated: {formatDate(epc.lastUpdated)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Rating</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {epc.rating}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatEPCRating(epc.rating)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Score</h4>
                    <div className="text-2xl font-bold">{epc.score}/100</div>
                  </div>
                </div>

                {epc.environmentalImpact && (
                  <div>
                    <h4 className="font-medium mb-2">Environmental Impact</h4>
                    <div className="grid gap-2 text-sm">
                      <div>CO₂ Emissions: {epc.environmentalImpact.co2Emissions} kg/m²/year</div>
                      <div>Energy Consumption: {epc.environmentalImpact.energyConsumption} kWh/m²/year</div>
                      <div>Renewable Energy: {epc.environmentalImpact.renewableEnergy}%</div>
                    </div>
                  </div>
                )}

                {epc.recommendations && epc.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {epc.recommendations.slice(0, 3).map((rec) => (
                        <div key={rec.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{rec.title}</span>
                            <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Cost: {formatCurrency(rec.cost)} • Savings: {formatCurrency(rec.savings)}/year
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {epc.certificateUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={epc.certificateUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Certificate
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                EPC data not available for this property.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="hmlr" className="space-y-4">
          {hmlr ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>HM Land Registry</span>
                </CardTitle>
                <CardDescription>
                  Title Number: {hmlr.titleNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Property Details</h4>
                    <div className="space-y-1 text-sm">
                      <div>Type: {hmlr.propertyType}</div>
                      <div>Tenure: {hmlr.tenure}</div>
                      {hmlr.buildDate && <div>Built: {formatDate(hmlr.buildDate)}</div>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Ownership</h4>
                    <div className="space-y-1 text-sm">
                      <div>Owner: {hmlr.owner}</div>
                      <div>Last Sold: {formatDate(hmlr.lastSold)}</div>
                      <div>Price: {formatCurrency(hmlr.price)}</div>
                    </div>
                  </div>
                </div>

                {hmlr.charges && hmlr.charges.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Charges & Restrictions</h4>
                    <div className="space-y-2">
                      {hmlr.charges.map((charge, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{charge.type}</span>
                            {charge.amount && (
                              <span className="text-sm font-medium">
                                {formatCurrency(charge.amount)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{charge.description}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Date: {formatDate(charge.date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                HMLR data not available for this property.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="flood" className="space-y-4">
          {floodRisk ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Droplets className="h-5 w-5" />
                  <span>Flood Risk Assessment</span>
                </CardTitle>
                <CardDescription>
                  Last updated: {formatDate(floodRisk.lastUpdated)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className="text-lg px-3 py-1"
                    style={{ 
                      borderColor: getFloodRiskColor(floodRisk.riskLevel),
                      color: getFloodRiskColor(floodRisk.riskLevel)
                    }}
                  >
                    {floodRisk.riskLevel}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatFloodRiskLevel(floodRisk.riskLevel)}
                  </span>
                </div>

                {floodRisk.riskFactors && floodRisk.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Risk Factors</h4>
                    <div className="space-y-2">
                      {floodRisk.riskFactors.map((factor, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{factor.type}</span>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: getFloodRiskColor(factor.riskLevel),
                                color: getFloodRiskColor(factor.riskLevel)
                              }}
                            >
                              {factor.riskLevel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{factor.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Probability: {factor.probability}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {floodRisk.historicalFloods && floodRisk.historicalFloods.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Historical Floods</h4>
                    <div className="space-y-2">
                      {floodRisk.historicalFloods.slice(0, 3).map((flood, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{formatDate(flood.date)}</span>
                            <Badge variant={flood.severity === 'Severe' ? 'destructive' : 'secondary'}>
                              {flood.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{flood.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {floodRisk.detailsUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={floodRisk.detailsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Report
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Flood risk data not available for this property.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
