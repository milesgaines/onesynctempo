import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Calendar,
  MapPin,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsChartsProps {
  data?: {
    plays: {
      labels: string[];
      values: number[];
    };
    revenue: {
      labels: string[];
      values: number[];
    };
    geography: {
      countries: string[];
      values: number[];
    };
    platforms: {
      names: string[];
      values: number[];
    };
  };
  type?: string;
}

const defaultData = {
  plays: {
    labels: [],
    values: [],
  },
  revenue: {
    labels: [],
    values: [],
  },
  geography: {
    countries: [],
    values: [],
  },
  platforms: {
    names: [],
    values: [],
  },
};

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data = defaultData,
  type = "overview",
}) => {
  const [dateRange, setDateRange] = useState<string>("30days");
  const [chartType, setChartType] = useState<string>("plays");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Define empty data structure
  const emptyData = {
    plays: {
      labels: [],
      values: [],
    },
    revenue: {
      labels: [],
      values: [],
    },
    geography: {
      countries: [],
      values: [],
    },
    platforms: {
      names: [],
      values: [],
    },
  };

  // Initialize with empty data
  const [chartData, setChartData] = useState(emptyData);

  // Update data when date range changes
  useEffect(() => {
    const updateData = async () => {
      // Only set loading if we're changing from the initial state
      if (dateRange !== "30days") {
        setIsLoading(true);
      }

      try {
        // Try to fetch real data from Supabase
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (user) {
          // Calculate date range
          const endDate = new Date();
          const startDate = new Date();

          switch (dateRange) {
            case "7days":
              startDate.setDate(endDate.getDate() - 7);
              break;
            case "30days":
              startDate.setDate(endDate.getDate() - 30);
              break;
            case "90days":
              startDate.setDate(endDate.getDate() - 90);
              break;
            case "year":
              startDate.setFullYear(endDate.getFullYear() - 1);
              break;
          }

          // Load analytics data
          const { data: analytics, error } = await supabase
            .from("analytics")
            .select("*")
            .eq("user_id", user.id)
            .gte("date", startDate.toISOString().split("T")[0])
            .lte("date", endDate.toISOString().split("T")[0])
            .order("date", { ascending: true });

          if (!error && analytics && analytics.length > 0) {
            console.log(
              "✅ [ANALYTICS CHARTS] Loaded",
              analytics.length,
              "analytics records",
            );

            // Process analytics data for charts
            const platformStats = analytics.reduce(
              (acc, record) => {
                const platform = record.platform || "Unknown";
                if (!acc[platform]) {
                  acc[platform] = { plays: 0, revenue: 0 };
                }
                acc[platform].plays += record.plays || 0;
                acc[platform].revenue += record.revenue || 0;
                return acc;
              },
              {} as Record<string, { plays: number; revenue: number }>,
            );

            // Process geography data
            const geoStats = analytics.reduce(
              (acc, record) => {
                const country = record.country || "Unknown";
                if (!acc[country]) {
                  acc[country] = 0;
                }
                acc[country] += record.plays || 0;
                return acc;
              },
              {} as Record<string, number>,
            );

            // Convert to chart format
            const platformEntries = (
              Object.entries(platformStats) as [
                string,
                { plays: number; revenue: number }
              ][]
            ).sort(([, a], [, b]) => b.revenue - a.revenue);

            const geoEntries = (
              Object.entries(geoStats) as [string, number][]
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10);

            const totalRevenue = (Object.values(
              platformStats,
            ) as { plays: number; revenue: number }[]).reduce(
              (sum, stats) => sum + stats.revenue,
              0,
            );

            const realData = {
              plays: {
                labels: platformEntries.map(([platform]) => platform),
                values: platformEntries.map(([, stats]) => stats.plays),
              },
              revenue: {
                labels: platformEntries.map(([platform]) => platform),
                values: platformEntries.map(([, stats]) => stats.revenue),
              },
              geography: {
                countries:
                  geoEntries.length > 0
                    ? geoEntries.map(([country]) => country)
                    : [],
                values:
                  geoEntries.length > 0
                    ? geoEntries.map(([, plays]) => plays)
                    : [],
              },
              platforms: {
                names: platformEntries.map(([platform]) => platform),
                values: platformEntries.map(([, stats]) =>
                  totalRevenue > 0
                    ? Math.round((stats.revenue / totalRevenue) * 100)
                    : 0,
                ),
              },
            };

            setChartData(realData);
          } else {
            console.log(
              "⚠️ [ANALYTICS CHARTS] No analytics data found, using empty data",
            );
            // Use empty data if no analytics found
            setChartData(emptyData);
          }
        } else {
          // No user, use empty data
          setChartData(emptyData);
        }
      } catch (error) {
        console.error("❌ [ANALYTICS CHARTS] Error loading data:", error);
        // Use empty data on error
        setChartData(emptyData);
      } finally {
        // Simulate loading delay for better UX
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };

    updateData();
  }, [dateRange]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Render different chart types based on the 'type' prop
  if (type === "geography") {
    return (
      <div className="w-full bg-background">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>
                Where your music is being played around the world
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden mb-6">
              {isLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              ) : (
                <div className="text-center">
                  <MapPin className="h-12 w-12 opacity-20 mx-auto" />
                  <h3 className="mt-2 text-lg font-medium">
                    Global Listener Map
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {chartData.geography.values.length > 0
                      ? `${formatNumber(chartData.geography.values.reduce((a, b) => a + b, 0))} listeners worldwide`
                      : "No geographic data available"}
                  </p>
                </div>
              )}
            </div>
            <ScrollArea className="h-[650px] w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 pr-4">
                {chartData.geography.countries.map((country, index) => (
                  <Card key={`geo-detail-${index}`} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium">{country}</div>
                      <div className="text-2xl font-bold">
                        {isLoading ? (
                          <div className="h-8 w-24 bg-muted/20 animate-pulse rounded"></div>
                        ) : (
                          formatNumber(chartData.geography.values[index])
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-muted-foreground">
                          {isLoading ? (
                            <div className="h-4 w-16 bg-muted/20 animate-pulse rounded"></div>
                          ) : (
                            <>
                              {chartData.geography.values.reduce(
                                (a, b) => a + b,
                                0,
                              ) > 0
                                ? `${Math.floor(
                                    (chartData.geography.values[index] /
                                      chartData.geography.values.reduce(
                                        (a, b) => a + b,
                                        0,
                                      )) *
                                      100,
                                  )}% of total`
                                : "No data available"}
                            </>
                          )}
                        </div>
                        <div
                          className={`text-xs ${index % 3 === 0 ? "text-green-500" : index % 3 === 1 ? "text-amber-500" : "text-red-500"}`}
                        >
                          <div className="text-xs mt-1">
                            <span className="text-muted-foreground">
                              No trend data available
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-background animate-fade-in overflow-visible relative">
      <Card className="w-full transition-all duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Track performance metrics and trends
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="plays"
            className="w-full"
            onValueChange={setChartType}
          >
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6 transition-all duration-300 hover:shadow-md">
              <TabsTrigger value="plays">
                <LineChartIcon className="mr-2 h-4 w-4" />
                Plays
              </TabsTrigger>
              <TabsTrigger value="revenue">
                <BarChart3 className="mr-2 h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="geography">
                <MapPin className="mr-2 h-4 w-4" />
                Geography
              </TabsTrigger>
              <TabsTrigger value="platforms">
                <PieChartIcon className="mr-2 h-4 w-4" />
                Platforms
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plays" className="space-y-4">
              <div className="h-[300px] w-full bg-background rounded-lg relative overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : chartData.plays.labels.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <LineChartIcon className="h-12 w-12 opacity-20 mx-auto" />
                      <h3 className="mt-2 text-lg font-medium">No Play Data</h3>
                      <p className="text-sm text-muted-foreground">
                        No play statistics available for the selected period
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData.plays.labels.map((label, index) => ({
                        name: label,
                        plays: chartData.plays.values[index],
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value) => formatNumber(value)}
                        tick={{ fontSize: 12 }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [
                          formatNumber(Number(value)),
                          "Plays",
                        ]}
                        labelFormatter={(label) => `Platform: ${label}`}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                        }}
                        itemStyle={{ color: "#e5e7eb" }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="plays"
                        stroke="#8884d8"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pb-4">
                {chartData.plays.labels.slice(0, 4).map((label, index) => (
                  <Card
                    key={`plays-${index}`}
                    className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <CardContent className="p-4">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-2xl font-bold">
                        {isLoading ? (
                          <div className="h-8 w-24 bg-muted/20 animate-pulse rounded"></div>
                        ) : (
                          formatNumber(chartData.plays.values[index])
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        No trend data available
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <div className="h-[300px] w-full bg-background rounded-lg relative overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : chartData.revenue.labels.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 opacity-20 mx-auto" />
                      <h3 className="mt-2 text-lg font-medium">
                        No Revenue Data
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        No revenue statistics available for the selected period
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.revenue.labels.map((label, index) => ({
                        name: label,
                        revenue: chartData.revenue.values[index],
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value) => `${formatNumber(value)}`}
                        tick={{ fontSize: 12 }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [
                          `${formatNumber(Number(value))}`,
                          "Revenue",
                        ]}
                        labelFormatter={(label) => `Category: ${label}`}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                        }}
                        itemStyle={{ color: "#e5e7eb" }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="revenue"
                        fill="#82ca9d"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pb-4">
                {chartData.revenue.labels.slice(0, 4).map((label, index) => (
                  <Card
                    key={`revenue-${index}`}
                    className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <CardContent className="p-4">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-2xl font-bold">
                        {isLoading ? (
                          <div className="h-8 w-24 bg-muted/20 animate-pulse rounded"></div>
                        ) : (
                          `${formatNumber(chartData.revenue.values[index])}`
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        No trend data available
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-4">
              <div className="h-[400px] w-full bg-background rounded-lg relative overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : chartData.geography.countries.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 opacity-20 mx-auto" />
                      <h3 className="mt-2 text-lg font-medium">
                        No Geographic Data
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        No geographic distribution data available for the
                        selected period
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData.geography.countries.map(
                        (country, index) => ({
                          name: country,
                          listeners: chartData.geography.values[index],
                        }),
                      )}
                      margin={{ top: 20, right: 30, left: 80, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.1}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => formatNumber(value)}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={80}
                      />
                      <RechartsTooltip
                        formatter={(value) => [
                          formatNumber(Number(value)),
                          "Listeners",
                        ]}
                        labelFormatter={(label) => `Country: ${label}`}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                        }}
                        itemStyle={{ color: "#e5e7eb" }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="listeners"
                        fill="#8884d8"
                        radius={[0, 4, 4, 0]}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <ScrollArea className="h-[600px] w-full mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4 pr-4">
                  {chartData.geography.countries.map((country, index) => (
                    <Card
                      key={`geo-${index}`}
                      className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <CardContent className="p-4">
                        <div className="text-sm font-medium">{country}</div>
                        <div className="text-2xl font-bold">
                          {isLoading ? (
                            <div className="h-8 w-24 bg-muted/20 animate-pulse rounded"></div>
                          ) : (
                            formatNumber(chartData.geography.values[index])
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div className="text-xs mt-1">
                            <span className="text-muted-foreground">
                              No trend data available
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="platforms" className="space-y-4">
              <div className="h-[300px] w-full bg-background rounded-lg relative overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : chartData.platforms.names.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 opacity-20 mx-auto" />
                      <h3 className="mt-2 text-lg font-medium">
                        No Platform Data
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        No platform distribution data available for the selected
                        period
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.platforms.names.map((name, index) => ({
                          name: name,
                          value: chartData.platforms.values[index],
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        animationDuration={1500}
                      >
                        {chartData.platforms.names.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#8884d8",
                                "#82ca9d",
                                "#ffc658",
                                "#ff8042",
                                "#0088fe",
                                "#00C49F",
                              ][index % 6]
                            }
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, "Market Share"]}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                        }}
                        itemStyle={{ color: "#e5e7eb" }}
                        labelStyle={{ color: "#e5e7eb" }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pb-4">
                {chartData.platforms.names
                  .slice(0, 4)
                  .map((platform, index) => (
                    <Card
                      key={`platform-${index}`}
                      className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <CardContent className="p-4">
                        <div className="text-sm font-medium">{platform}</div>
                        <div className="text-2xl font-bold">
                          {isLoading ? (
                            <div className="h-8 w-24 bg-muted/20 animate-pulse rounded"></div>
                          ) : (
                            formatNumber(chartData.platforms.values[index])
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isLoading ? (
                            <div className="h-4 w-16 bg-muted/20 animate-pulse rounded"></div>
                          ) : (
                            <>
                              {chartData.platforms.values.reduce(
                                (a, b) => a + b,
                                0,
                              ) > 0
                                ? `${Math.floor(
                                    (chartData.platforms.values[index] /
                                      chartData.platforms.values.reduce(
                                        (a, b) => a + b,
                                        0,
                                      )) *
                                      100,
                                  )}% of total`
                                : "No data available"}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="h-[300px] w-full bg-background rounded-lg relative overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">
                        Advanced Analytics
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        No advanced analytics data available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
