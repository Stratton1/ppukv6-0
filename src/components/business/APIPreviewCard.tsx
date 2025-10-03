import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface APIPreviewCardProps {
  title: string;
  description: string;
  data: any;
  type: "epc" | "flood" | "hmlr" | "planning";
}

const APIPreviewCard = ({ title, description, data, type }: APIPreviewCardProps) => {
  const renderContent = () => {
    switch (type) {
      case "epc":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{data.rating}</div>
                <div className="text-sm text-muted-foreground">Current Rating</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-muted-foreground">
                  {data.potentialRating}
                </div>
                <div className="text-xs text-muted-foreground">Potential</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Energy Efficiency</span>
                <span className="font-medium">{data.currentEnergyEfficiency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Environmental Impact</span>
                <span className="font-medium">{data.currentEnvironmentalImpact}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Expires</span>
                <span className="font-medium">
                  {new Date(data.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            {data.recommendations && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Recommendations:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {data.recommendations.map((rec: string, i: number) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "flood": {
        const getRiskColor = (risk: string) => {
          switch (risk.toLowerCase()) {
            case "very low":
              return "text-green-600";
            case "low":
              return "text-blue-600";
            case "medium":
              return "text-orange-600";
            case "high":
              return "text-red-600";
            default:
              return "";
          }
        };

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Surface Water</div>
                <div className={`font-semibold ${getRiskColor(data.surfaceWater)}`}>
                  {data.surfaceWater}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Rivers & Sea</div>
                <div className={`font-semibold ${getRiskColor(data.riverSea)}`}>
                  {data.riverSea}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Groundwater</div>
                <div className={`font-semibold ${getRiskColor(data.groundwater)}`}>
                  {data.groundwater}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reservoirs</div>
                <div className={`font-semibold ${getRiskColor(data.reservoirs)}`}>
                  {data.reservoirs}
                </div>
              </div>
            </div>
            {data.details?.recommendations && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm font-medium">Recommendations:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {data.details.recommendations.map((rec: string, i: number) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case "hmlr":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Title Number</div>
                <div className="font-mono font-medium">{data.titleNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tenure</div>
                <div className="font-medium">{data.tenure}</div>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm font-medium">Purchase History:</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current</span>
                  <span className="font-medium">
                    £{data.pricePaid.toLocaleString()} (
                    {new Date(data.dateOfPurchase).getFullYear()})
                  </span>
                </div>
                {data.previousSales?.map((sale: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-muted-foreground">
                    <span>Previous</span>
                    <span>
                      £{sale.price.toLocaleString()} ({new Date(sale.date).getFullYear()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "planning":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Applications:</div>
              {data.recentApplications?.map((app: any, i: number) => (
                <div key={i} className="p-2 bg-muted/50 rounded text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{app.reference}</span>
                    <Badge variant={app.status === "Approved" ? "default" : "secondary"}>
                      {app.status}
                    </Badge>
                  </div>
                  <div>{app.description}</div>
                  <div className="text-xs text-muted-foreground">
                    Decided: {new Date(app.dateDecided).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            {data.constraints && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm font-medium">Constraints:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {data.constraints.map((constraint: string, i: number) => (
                    <li key={i}>• {constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return <div>No data available</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Info className="mr-1 h-3 w-3" />
            Simulated Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

export default APIPreviewCard;
