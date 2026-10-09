import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface TestSeriesCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: "Foundation" | "Intermediate";
  isPurchased?: boolean;
  attemptsUsed?: number;
  attemptsTotal?: number;
  evaluationStatus?: "pending" | "completed";
}

const TestSeriesCard: React.FC<TestSeriesCardProps> = ({
  id,
  title,
  description,
  thumbnail,
  price,
  level,
  isPurchased = false,
  attemptsUsed = 0,
  attemptsTotal = 3,
  evaluationStatus,
}) => {
  return (
    <Card className="overflow-hidden flex flex-col h-full group border transition-all hover:border-ca-primary hover:shadow-lg">
      <div className="relative aspect-video w-full overflow-hidden">
        <Link to={`/student/test-series/${id}`}>
          <img
            src={
              thumbnail ||
              "https://images.unsplash.com/photo-1606326608690-4e0281b1e588?ixlib=rb-4.0.3"
            }
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <Badge
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
          variant="secondary"
        >
          {level}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {title}
        </CardTitle>
        <p className="text-gray-600 text-sm line-clamp-2 mt-1">{description}</p>
      </CardHeader>

      <CardContent className="flex-grow">
        {isPurchased ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Attempts:{" "}
                <span className="font-bold text-gray-800">
                  {attemptsUsed || 0}/{attemptsTotal || "∞"}
                </span>
              </span>
              {evaluationStatus && (
                <Badge
                  variant={
                    evaluationStatus === "pending" ? "outline" : "default"
                  }
                  className={
                    evaluationStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : "bg-green-100 text-green-800 border-green-300"
                  }
                >
                  {evaluationStatus === "pending" ? "Pending" : "Evaluated"}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ca-primary">₹{price}</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isPurchased ? (
          <Link to={`/student/test-series/${id}`} className="w-full">
            <Button className="w-full bg-ca-primary hover:bg-ca-primary/90">
              <Play className="h-4 w-4 mr-2" />
              {attemptsUsed > 0 ? "View & Retake" : "Start Test"}
            </Button>
          </Link>
        ) : (
          <Button className="w-full bg-ca-primary hover:bg-ca-primary/90">
            Buy Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TestSeriesCard;
