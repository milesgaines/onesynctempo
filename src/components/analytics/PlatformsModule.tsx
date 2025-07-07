import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
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
import { Separator } from "@/components/ui/separator";
import { PieChart as PieChartIcon, Music, BarChart3 } from "lucide-react";

interface PlatformsModuleProps {
  platformStats: Array<{ platform: string; percentage: number; color: string }>;
  onExportData: () => void;
}

const PlatformsModule: React.FC<PlatformsModuleProps> = ({
  platformStats,
  onExportData,
}) => {
  return (
    <Card className="shadow-lg border-opacity-50 overflow-hidden bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl border border-pink-500/10">
      <CardHeader className="bg-gradient-to-r from-pink-500/10 to-card/90 border-b border-pink-500/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              <Music className="h-5 w-5 mr-2 text-pink-500" />
              Platform Distribution
            </CardTitle>
            <CardDescription className="mt-1">
              Performance breakdown by streaming platform
            </CardDescription>
          </div>
          <div className="bg-pink-500/10 rounded-full p-2 transition-transform duration-300 hover:scale-110 hover:shadow-glow hover:bg-pink-500/20">
            <PieChartIcon className="h-6 w-6 text-pink-500 animate-pulse-subtle" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-card/80 to-card/60 p-4 rounded-xl border border-primary/20 transition-all duration-300 hover:shadow-glow hover:border-primary/30">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, percentage }) =>
                    `${platform} ${percentage}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="percentage"
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {platformStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(22, 22, 22, 0.9)",
                    borderRadius: "8px",
                    border: "1px solid rgba(100, 149, 237, 0.2)",
                    boxShadow:
                      "0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(100, 149, 237, 0.3)",
                    padding: "8px 12px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {platformStats.map((platform) => (
              <div
                key={platform.platform}
                className="flex items-center justify-between p-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-all duration-200 group hover:shadow-glow hover:border-primary/30"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded shadow-glow"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="font-medium group-hover:text-primary transition-colors duration-200">
                    {platform.platform}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium bg-gradient-to-r from-primary/90 to-indigo-400/90 bg-clip-text text-transparent">
                    {platform.percentage}%
                  </span>
                  <div className="w-24 h-2 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${platform.percentage}%`,
                        backgroundColor: platform.color,
                        boxShadow: "0 0 8px rgba(var(--primary-rgb) / 0.5)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6 bg-primary/20" />

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center bg-gradient-to-r from-primary/80 to-indigo-400/80 bg-clip-text text-transparent">
            <BarChart3 className="h-4 w-4 mr-2 text-primary" />
            Platform Performance Comparison
          </h3>
          <div className="bg-gradient-to-br from-card/80 to-card/60 p-4 rounded-xl border border-primary/20 transition-all duration-300 hover:shadow-glow hover:border-primary/30">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(22, 22, 22, 0.9)",
                    borderRadius: "8px",
                    border: "1px solid rgba(100, 149, 237, 0.2)",
                    boxShadow:
                      "0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(100, 149, 237, 0.3)",
                    padding: "8px 12px",
                  }}
                />
                <Bar
                  dataKey="percentage"
                  name="Market Share (%)"
                  animationDuration={1500}
                  animationEasing="ease-out"
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
      <CardFooter className="bg-gradient-to-r from-card/90 to-card/70 border-t border-primary/20 p-4">
        <Button
          variant="web3"
          className="w-full transition-all duration-300 group"
          onClick={onExportData}
        >
          <PieChartIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          Export Platform Analytics
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlatformsModule;
