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
  Legend,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface PerformanceModuleProps {
  dailyStats: Array<{ date: string; plays: number; revenue: number }>;
  platformStats: Array<{ platform: string; percentage: number; color: string }>;
}

const PerformanceModule: React.FC<PerformanceModuleProps> = ({
  dailyStats,
  platformStats,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
        <CardDescription>
          Detailed performance metrics and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Performance Over Time */}
          <div>
            <h3 className="text-lg font-medium mb-4">Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="plays"
                  name="Plays"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue ($)"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Daily Plays
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        dailyStats.reduce((sum, day) => sum + day.plays, 0) /
                          dailyStats.length,
                      ).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Daily Revenue
                    </p>
                    <p className="text-2xl font-bold">
                      $
                      {(
                        dailyStats.reduce((sum, day) => sum + day.revenue, 0) /
                        dailyStats.length
                      ).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Revenue per 1K Plays
                    </p>
                    <p className="text-2xl font-bold">
                      $
                      {(
                        (dailyStats.reduce((sum, day) => sum + day.revenue, 0) /
                          dailyStats.reduce((sum, day) => sum + day.plays, 0)) *
                        1000
                      ).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Comparison */}
          <div>
            <h3 className="text-lg font-medium mb-4">Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="percentage"
                  name="Platform Share (%)"
                  fill="#8884d8"
                >
                  {platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceModule;
