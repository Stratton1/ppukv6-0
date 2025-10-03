import { Home, Bed, Bath, Maximize, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface PropertyCardProps {
  id: string;
  address: string;
  postcode: string;
  city: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  floorArea?: number;
  epcRating?: string;
  tenure: string;
  frontPhotoUrl?: string;
  ppukReference: string;
}

const PropertyCard = ({
  id,
  address,
  postcode,
  city,
  propertyType,
  bedrooms,
  bathrooms,
  floorArea,
  epcRating,
  tenure,
  frontPhotoUrl,
  ppukReference,
}: PropertyCardProps) => {
  return (
    <Link to={`/property/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-[4/3] bg-muted relative">
          {frontPhotoUrl ? (
            <img src={frontPhotoUrl} alt={address} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-20 w-20 text-muted-foreground" />
            </div>
          )}
          {epcRating && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              EPC {epcRating}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">{address}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>
                    {city}, {postcode}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {bedrooms && (
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  <span>{bedrooms}</span>
                </div>
              )}
              {bathrooms && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  <span>{bathrooms}</span>
                </div>
              )}
              {floorArea && (
                <div className="flex items-center">
                  <Maximize className="h-4 w-4 mr-1" />
                  <span>{floorArea} m²</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant="outline">{propertyType}</Badge>
              <span className="text-xs text-muted-foreground">{ppukReference}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
