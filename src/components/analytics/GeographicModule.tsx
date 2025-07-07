import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart,
  Area,
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
import { Globe, Download, TrendingUp, MapPin } from "lucide-react";

interface GeographicModuleProps {
  geographicStats: Array<{ country: string; plays: number }>;
  onExportData: () => void;
}

const GeographicModule: React.FC<GeographicModuleProps> = ({
  geographicStats = [],
  onExportData,
}) => {
  // Calculate total plays for percentage display
  const totalPlays = geographicStats.reduce((sum, item) => sum + item.plays, 0);

  // Add percentage data for visualization
  const enhancedData = geographicStats.map((item) => ({
    ...item,
    percentage: ((item.plays / totalPlays) * 100).toFixed(1),
  }));

  return (
    <Card className="shadow-lg border-opacity-50 overflow-hidden bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl border border-pink-500/10">
      <CardHeader className="bg-gradient-to-r from-pink-500/10 to-card/90 border-b border-pink-500/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              <Globe className="h-5 w-5 mr-2 text-pink-500" />
              Geographic Distribution
            </CardTitle>
            <CardDescription className="mt-1">
              Where your music is being played around the world
            </CardDescription>
          </div>
          <div className="bg-pink-500/10 rounded-full p-2 transition-transform duration-300 hover:scale-110 hover:shadow-glow hover:bg-pink-500/20">
            <Globe className="h-6 w-6 text-pink-500 animate-pulse-subtle" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* World Map Visualization with gradient background */}
          <div className="bg-gradient-to-b from-primary/10 to-card/50 rounded-xl p-6 h-[300px] flex items-center justify-center border border-primary/20 shadow-inner transition-all duration-300 hover:shadow-glow">
            <div className="text-center space-y-3">
              <Globe className="h-16 w-16 mx-auto text-primary/80 animate-float" />
              <p className="text-muted-foreground font-medium bg-card/50 backdrop-blur-sm py-2 px-4 rounded-lg border border-primary/10 shadow-sm">
                Interactive world map visualization coming soon
              </p>
              <p className="text-xs text-muted-foreground/70">
                Explore your global audience with our upcoming interactive map
                feature
              </p>
            </div>
          </div>

          {/* Top Countries Section with improved styling */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center bg-gradient-to-r from-primary/80 to-blue-400/80 bg-clip-text text-transparent">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Top Countries
            </h3>
            <div className="space-y-3">
              {enhancedData.slice(0, 5).map((country, index) => (
                <div
                  key={country.country}
                  className="flex items-center justify-between p-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-all duration-200 group hover:shadow-glow hover:border-primary/30"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center mr-3 text-xs font-bold group-hover:from-primary/30 group-hover:to-blue-400/30 transition-colors duration-200 shadow-sm group-hover:shadow-glow">
                      {index + 1}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <span className="font-medium group-hover:text-primary transition-colors duration-200">
                        {country.country}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-primary/60 to-blue-400/60 shadow-glow transition-all duration-500 ease-out"
                        style={{
                          width: `${(country.plays / enhancedData[0].plays) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold bg-gradient-to-r from-primary/90 to-blue-400/90 bg-clip-text text-transparent">
                        {country.plays.toLocaleString()}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {country.percentage}% of total
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Performance Chart with improved styling */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center bg-gradient-to-r from-primary/80 to-blue-400/80 bg-clip-text text-transparent">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Geographic Performance
            </h3>
            <div className="bg-gradient-to-br from-card/80 to-card/60 p-4 rounded-xl border border-primary/20 transition-all duration-300 hover:shadow-glow hover:border-primary/30">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={enhancedData.slice(0, 5)}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.2}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => value.toLocaleString()}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="country"
                    width={100}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [value.toLocaleString(), "Plays"]}
                    contentStyle={{
                      backgroundColor: "rgba(22, 22, 22, 0.9)",
                      borderRadius: "8px",
                      border: "1px solid rgba(100, 149, 237, 0.2)",
                      boxShadow:
                        "0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(100, 149, 237, 0.3)",
                      padding: "8px 12px",
                    }}
                    cursor={{ fill: "rgba(100, 149, 237, 0.1)" }}
                  />
                  <Bar
                    dataKey="plays"
                    fill="url(#colorPlays)"
                    name="Plays"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                  <defs>
                    <linearGradient id="colorPlays" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop
                        offset="100%"
                        stopColor="#60a5fa"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-card/90 to-card/70 border-t border-primary/20 p-4">
        <Button
          variant="web3"
          className="w-full transition-all duration-300 group"
          onClick={onExportData}
        >
          <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          Export Geographic Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GeographicModule;
