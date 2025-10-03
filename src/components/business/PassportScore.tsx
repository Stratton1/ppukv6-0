import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle } from "lucide-react";

interface PassportScoreProps {
  property: any;
  documents: any[];
  photos: any[];
}

const PassportScore = ({ property, documents, photos }: PassportScoreProps) => {
  const checks = [
    { id: "address", label: "Address details", completed: !!(property.address_line_1 && property.postcode) },
    { id: "type", label: "Property type & style", completed: !!(property.property_type && property.property_style) },
    { id: "bedrooms", label: "Bedrooms & bathrooms", completed: !!(property.bedrooms && property.bathrooms) },
    { id: "size", label: "Floor area", completed: !!property.total_floor_area_sqm },
    { id: "tenure", label: "Tenure details", completed: !!property.tenure },
    { id: "frontPhoto", label: "Front elevation photo", completed: !!property.front_photo_url },
    { id: "epc", label: "EPC certificate", completed: documents.some(d => d.document_type === 'epc') },
    { id: "floorplan", label: "Floorplan", completed: documents.some(d => d.document_type === 'floorplan') },
    { id: "titleDeed", label: "Title deed", completed: documents.some(d => d.document_type === 'title_deed') },
    { id: "photos", label: "Interior photos (3+)", completed: photos.length >= 3 },
  ];

  const completedCount = checks.filter(c => c.completed).length;
  const totalCount = checks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passport Completeness</CardTitle>
        <CardDescription>
          {completedCount} of {totalCount} key items complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold text-lg">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        <div className="space-y-2 pt-2">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center space-x-2 text-sm">
              {check.completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={check.completed ? "text-foreground" : "text-muted-foreground"}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        {percentage < 100 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Complete your passport to unlock full property insights and increase buyer confidence.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PassportScore;