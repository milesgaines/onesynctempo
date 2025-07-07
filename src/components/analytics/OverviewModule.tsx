import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface OverviewModuleProps {
  dailyStats: Array<{ date: string; plays: number; revenue: number }>;
  platformStats: Array<{ platform: string; percentage: number; color: string }>;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    plays: number;
    revenue: number;
  }>;
  onViewDetails: () => void;
}

const OverviewModule: React.FC<OverviewModuleProps> = ({
  dailyStats,
  platformStats,
  tracks,
  onViewDetails,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
        <CardDescription>
          Summary of your music performance across all platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Performance Chart */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Daily Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString()}`,
                    "Plays",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="plays"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend Chart */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toFixed(2)}`,
                    "Revenue",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Platform Distribution</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  label={({ platform, percentage }) =>
                    `${platform} ${percentage}%`
                  }
                >
                  {platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              {platformStats.map((platform) => (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: platform.color }}
                    />
                    <span className="font-medium">{platform.platform}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {platform.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Tracks Preview */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Top Tracks</h3>
          <div className="space-y-2">
            {tracks.slice(0, 3).map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h4 className="font-semibold">{track.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {track.artist}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {track.plays.toLocaleString()} plays
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${track.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onViewDetails}>
          <BarChart3 className="h-4 w-4 mr-2" />
          View Detailed Performance
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OverviewModule;
