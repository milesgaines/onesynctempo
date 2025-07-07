import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Download, Share2 } from "lucide-react";

interface TracksModuleProps {
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    plays: number;
    revenue: number;
    streams: number;
  }>;
  onExportData: () => void;
}

const TracksModule: React.FC<TracksModuleProps> = ({
  tracks,
  onExportData,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Track Performance</CardTitle>
        <CardDescription>
          Detailed performance metrics for each track
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
            >
              <div>
                <h3 className="font-semibold">{track.title}</h3>
                <p className="text-sm text-muted-foreground">{track.artist}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 md:mt-0">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {track.plays.toLocaleString()} plays
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${track.revenue.toFixed(2)} revenue
                  </p>
                </div>
                <Badge variant="outline">
                  {track.streams.toLocaleString()} streams
                </Badge>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter Tracks
        </Button>
        <Button variant="outline" onClick={onExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TracksModule;
