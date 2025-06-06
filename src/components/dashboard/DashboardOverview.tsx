import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  Calendar,
  Download,
} from "lucide-react";
import AnalyticsCharts from "./AnalyticsCharts";
import { supabase, Analytics, Track, UserProfile } from "@/lib/supabaseClient";
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
} from "recharts";

interface RevenueData {
  amount: string;
  change: number;
  trend: "up" | "down";
}

interface PlatformData {
  name: string;
  plays: number;
  revenue: number;
  percentage: number;
}

interface DashboardOverviewProps {
  revenueData?: {
    total: RevenueData;
    monthly: RevenueData;
    weekly: RevenueData;
  };
  platformData?: PlatformData[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

// Empty placeholder for data structure
const timeRangeData: Record<string, { revenueData: any; platformData: any }> =
  {};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  revenueData: initialRevenueData = {
    total: { amount: "$0.00", change: 0, trend: "up" },
    monthly: { amount: "$0.00", change: 0, trend: "up" },
    weekly: { amount: "$0.00", change: 0, trend: "up" },
  },
  platformData: initialPlatformData = [],
  timeRange: initialTimeRange = "30d",
  onTimeRangeChange = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  // Use the timeRangeData directly based on the current timeRange
  const [revenueData, setRevenueData] = useState(() => {
    return timeRangeData[initialTimeRange]?.revenueData || initialRevenueData;
  });
  const [platformData, setPlatformData] = useState(() => {
    return timeRangeData[initialTimeRange]?.platformData || initialPlatformData;
  });

  const formatNumber = (num: number): string => {
    if (typeof num !== "number" || isNaN(num)) {
      return "0";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return Math.round(num).toString();
  };

  // Load real data from Supabase based on time range
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!dataLoaded) {
        setIsLoading(true);
      }
      try {
        // Safely handle potential undefined supabase.auth
        if (!supabase?.auth?.getUser) {
          console.error("❌ [DASHBOARD] Supabase auth not available");
          setIsLoading(false);
          return;
        }

        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) {
          console.log("⚠️ [DASHBOARD] No authenticated user found");
          setIsLoading(false);
          return;
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();

        switch (timeRange) {
          case "7d":
            startDate.setDate(endDate.getDate() - 7);
            break;
          case "30d":
            startDate.setDate(endDate.getDate() - 30);
            break;
          case "90d":
            startDate.setDate(endDate.getDate() - 90);
            break;
          case "12m":
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }

        // Load analytics data
        const { data: analytics, error: analyticsError } = await supabase
          .from("analytics")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0])
          .order("date", { ascending: true });

        // Load tracks data for additional context
        const { data: tracks, error: tracksError } = await supabase
          .from("tracks")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "live");

        if (analyticsError) {
          console.error(
            "❌ [DASHBOARD] Analytics query error:",
            analyticsError,
          );
        }

        if (tracksError) {
          console.error("❌ [DASHBOARD] Tracks query error:", tracksError);
        }

        if (analytics && analytics.length > 0) {
          console.log(
            "✅ [DASHBOARD] Loaded",
            analytics.length,
            "analytics records",
          );

          // Calculate revenue data
          const totalRevenue = analytics.reduce(
            (sum, record) => sum + (record.revenue || 0),
            0,
          );
          const totalPlays = analytics.reduce(
            (sum, record) => sum + (record.plays || 0),
            0,
          );

          // Calculate platform breakdown
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

          const platformDataArray = Object.entries(platformStats)
            .map(([platform, stats]) => ({
              name: platform,
              plays: stats.plays,
              revenue: stats.revenue,
              percentage:
                totalRevenue > 0
                  ? Math.round((stats.revenue / totalRevenue) * 100)
                  : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);

          // Calculate period-based metrics for trend analysis
          const periodDays =
            timeRange === "7d"
              ? 7
              : timeRange === "30d"
                ? 30
                : timeRange === "90d"
                  ? 90
                  : 365;
          const previousPeriodStart = new Date(startDate);
          previousPeriodStart.setDate(
            previousPeriodStart.getDate() - periodDays,
          );

          const { data: previousAnalytics } = await supabase
            .from("analytics")
            .select("revenue, plays")
            .eq("user_id", user.id)
            .gte("date", previousPeriodStart.toISOString().split("T")[0])
            .lt("date", startDate.toISOString().split("T")[0]);

          const previousRevenue =
            previousAnalytics?.reduce(
              (sum, record) => sum + (record.revenue || 0),
              0,
            ) || 0;
          const previousPlays =
            previousAnalytics?.reduce(
              (sum, record) => sum + (record.plays || 0),
              0,
            ) || 0;

          // Calculate actual trend percentages
          const revenueChange =
            previousRevenue > 0
              ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
              : 0;
          const playsChange =
            previousPlays > 0
              ? ((totalPlays - previousPlays) / previousPlays) * 100
              : 0;

          // Update revenue data with real calculations
          const newRevenueData = {
            total: {
              amount: `${totalRevenue.toFixed(2)}`,
              change: Math.round(revenueChange * 100) / 100,
              trend: revenueChange >= 0 ? ("up" as const) : ("down" as const),
            },
            monthly: {
              amount: `${(totalRevenue / Math.max(1, timeRange === "12m" ? 12 : timeRange === "90d" ? 3 : 1)).toFixed(2)}`,
              change: Math.round(revenueChange * 0.8 * 100) / 100,
              trend: revenueChange >= 0 ? ("up" as const) : ("down" as const),
            },
            weekly: {
              amount: `${(totalRevenue / Math.max(1, timeRange === "12m" ? 52 : timeRange === "90d" ? 13 : timeRange === "30d" ? 4 : 1)).toFixed(2)}`,
              change: Math.round(revenueChange * 0.6 * 100) / 100,
              trend: revenueChange >= 0 ? ("up" as const) : ("down" as const),
            },
          };

          setRevenueData(newRevenueData);
          setPlatformData(platformDataArray);
        } else {
          console.log(
            "⚠️ [DASHBOARD] No analytics data found, using empty state",
          );

          // No analytics data, use empty state
          setRevenueData({
            total: { amount: "$0.00", change: 0, trend: "up" },
            monthly: { amount: "$0.00", change: 0, trend: "up" },
            weekly: { amount: "$0.00", change: 0, trend: "up" },
          });
          setPlatformData([]);
        }
      } catch (error) {
        console.error("❌ [DASHBOARD] Error loading analytics:", error);
        // Use empty state on error
        setRevenueData({
          total: { amount: "$0.00", change: 0, trend: "up" },
          monthly: { amount: "$0.00", change: 0, trend: "up" },
          weekly: { amount: "$0.00", change: 0, trend: "up" },
        });
        setPlatformData([]);
      } finally {
        setIsLoading(false);
        setDataLoaded(true);
      }
    };

    loadAnalyticsData();
    onTimeRangeChange(timeRange);
  }, [
    timeRange,
    initialRevenueData,
    initialPlatformData,
    onTimeRangeChange,
    initialTimeRange,
  ]);

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-20">
        {/* Header section with improved positioning */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 min-w-0 relative mb-4 lg:mb-0">
            <div className="relative pr-16">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <span className="absolute top-0 right-0 text-xs bg-primary text-white px-2 py-1 rounded-full animate-pulse">
                Live
              </span>
            </div>
            <p className="text-muted-foreground mt-2">
              Monitor your music performance and revenue.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-primary/10"
              onClick={() => {
                console.log("Calendar button clicked");
                const today = new Date();
                const lastWeek = new Date(
                  today.getTime() - 7 * 24 * 60 * 60 * 1000,
                );
                alert(
                  `Custom date range: ${lastWeek.toLocaleDateString()} - ${today.toLocaleDateString()}\n\nAdvanced date picker coming soon!`,
                );
              }}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-primary/10"
              onClick={() => {
                console.log("Download button clicked");
                try {
                  // Generate comprehensive dashboard report
                  const reportData = {
                    reportType: "Dashboard Analytics Report",
                    timeRange,
                    generatedAt: new Date().toISOString(),
                    summary: {
                      totalRevenue: revenueData.total.amount,
                      monthlyRevenue: revenueData.monthly.amount,
                      weeklyRevenue: revenueData.weekly.amount,
                      platformCount: platformData.length,
                    },
                    revenueData,
                    platformData,
                    metadata: {
                      exportedBy: "OneSync Dashboard",
                      version: "1.0.0",
                    },
                  };

                  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `onesync-dashboard-${timeRange}-${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  alert(
                    `Dashboard report for ${timeRange} downloaded successfully!\nFile: onesync-dashboard-${timeRange}-${new Date().toISOString().split("T")[0]}.json`,
                  );
                } catch (error) {
                  console.error("Export error:", error);
                  alert("Failed to export report. Please try again.");
                }
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats cards with fixed heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-8 w-28 bg-muted/20 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-white">
                      {revenueData.total.amount}
                    </span>
                  )}
                </div>
                {(!isLoading || dataLoaded) && (
                  <div
                    className={`flex items-center text-sm ${revenueData.total.trend === "up" ? "text-green-500" : "text-red-500"}`}
                  >
                    {revenueData.total.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(revenueData.total.change).toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Plays
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-8 w-28 bg-muted/20 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-white">
                      {formatNumber(
                        platformData.reduce((sum, p) => sum + p.plays, 0),
                      )}
                    </span>
                  )}
                </div>
                {(!isLoading || dataLoaded) && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="text-xs">No trend data</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Platforms
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-8 w-28 bg-muted/20 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-white">{platformData.length}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Streaming services
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Revenue/Play
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-8 w-28 bg-muted/20 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-white">
                      $
                      {platformData.reduce((sum, p) => sum + p.plays, 0) > 0
                        ? (
                            (platformData.reduce(
                              (sum, p) => sum + p.revenue,
                              0,
                            ) /
                              platformData.reduce(
                                (sum, p) => sum + p.plays,
                                0,
                              )) *
                            1000
                          ).toFixed(3)
                        : "0.000"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  per 1K plays
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics chart with fixed height */}
        <Card className="overflow-hidden">
          <CardHeader className="pt-4 px-6 pb-2">
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>
              Comprehensive view of your music performance
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[450px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src="/spinning-loader.png"
                    alt="Loading"
                    className="h-12 w-12 animate-spin brightness-150"
                  />
                </div>
              ) : (
                <AnalyticsCharts
                  data={{
                    plays: {
                      labels: platformData.map((p) => p.name),
                      values: platformData.map((p) => p.plays),
                    },
                    revenue: {
                      labels: platformData.map((p) => p.name),
                      values: platformData.map((p) => p.revenue),
                    },
                    geography: {
                      countries: [],
                      values: [],
                    },
                    platforms: {
                      names: platformData.map((p) => p.name),
                      values: platformData.map((p) => p.percentage),
                    },
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom cards with consistent heights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
          <Card className="overflow-hidden h-full">
            <CardHeader className="pt-4 px-6 pb-2">
              <CardTitle>Top Platforms</CardTitle>
              <CardDescription>
                Revenue and plays breakdown by platform
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-4 overflow-y-auto max-h-[400px]">
              <div className="space-y-4">
                {platformData.map((platform) => (
                  <div
                    key={platform.name}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {platform.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isLoading && !dataLoaded ? (
                          <div className="h-4 w-32 bg-muted/20 animate-pulse rounded"></div>
                        ) : (
                          <>
                            {formatNumber(platform.plays)} plays · $
                            {platform.revenue.toFixed(2)}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        {isLoading && !dataLoaded ? (
                          <div className="h-4 w-8 bg-muted/20 animate-pulse rounded"></div>
                        ) : (
                          `${platform.percentage}%`
                        )}
                      </div>
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        {isLoading && !dataLoaded ? (
                          <div className="h-full bg-muted/40 animate-pulse"></div>
                        ) : (
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${platform.percentage}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const platformReport = {
                    reportType: "Platform Performance Report",
                    timeRange,
                    platforms: platformData.map((p) => ({
                      name: p.name,
                      plays: p.plays,
                      revenue: p.revenue,
                      percentage: p.percentage,
                      performance:
                        p.percentage > 30
                          ? "Excellent"
                          : p.percentage > 15
                            ? "Good"
                            : "Needs Improvement",
                    })),
                    generatedAt: new Date().toISOString(),
                  };

                  const blob = new Blob(
                    [JSON.stringify(platformReport, null, 2)],
                    {
                      type: "application/json",
                    },
                  );
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `platform-breakdown-${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  alert("Platform breakdown report downloaded!");
                }}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View detailed breakdown
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden h-full">
            <CardHeader className="pt-4 px-6 pb-2">
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>
                Where your music is being played around the world
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="h-[720px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src="/spinning-loader.png"
                      alt="Loading"
                      className="h-12 w-12 animate-spin brightness-150"
                    />
                  </div>
                ) : (
                  <AnalyticsCharts
                    type="geography"
                    data={{
                      geography: {
                        countries: [],
                        values: [],
                      },
                      plays: { labels: [], values: [] },
                      revenue: { labels: [], values: [] },
                      platforms: { names: [], values: [] },
                    }}
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-4 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (platformData.length === 0) {
                    alert("No geographic data available to export.");
                    return;
                  }

                  const geoReport = {
                    reportType: "Geographic Distribution Report",
                    timeRange,
                    countries: [],
                    generatedAt: new Date().toISOString(),
                    note: "No geographic data available",
                  };

                  const blob = new Blob([JSON.stringify(geoReport, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `geographic-report-${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  alert("Geographic distribution report downloaded!");
                }}
              >
                <PieChart className="h-4 w-4 mr-2" />
                View detailed breakdown
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
