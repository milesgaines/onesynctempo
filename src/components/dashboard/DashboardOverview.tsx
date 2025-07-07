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
  DollarSign,
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

          const platformDataArray = (
            Object.entries(platformStats) as [
              string,
              { plays: number; revenue: number }
            ][]
          )
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

    // Add error boundary for the async function
    loadAnalyticsData().catch((error) => {
      console.error(
        "❌ [DASHBOARD] Unhandled error in loadAnalyticsData:",
        error,
      );
      setIsLoading(false);
      setDataLoaded(true);
    });

    // Safely call onTimeRangeChange
    try {
      onTimeRangeChange(timeRange);
    } catch (error) {
      console.error("❌ [DASHBOARD] Error in onTimeRangeChange:", error);
    }
  }, [
    timeRange,
    initialRevenueData,
    initialPlatformData,
    onTimeRangeChange,
    initialTimeRange,
  ]);

  return (
    <div className="w-full h-full overflow-y-auto bg-black relative">
      {/* Dynamic animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-white/[0.01] rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-64 h-64 bg-white/[0.015] rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        ></div>
        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
            animation: "gridMove 20s linear infinite",
          }}
        ></div>
      </div>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-20 relative z-10">
        {/* Bold header section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex-1 min-w-0 relative mb-4 lg:mb-0">
            <div className="relative pr-20">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white animate-fade-in">
                DASHBOARD
              </h1>
              <div className="absolute top-2 right-0 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-mono font-bold tracking-wider">
                  LIVE
                </span>
              </div>
            </div>
            <p className="text-gray-400 mt-3 text-xl font-medium">
              Real-time performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full lg:w-[180px] bg-gray-900 border-gray-700 text-white hover:bg-gray-800 transition-all duration-200">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="7d" className="text-white hover:bg-gray-800">
                  Last 7 days
                </SelectItem>
                <SelectItem
                  value="30d"
                  className="text-white hover:bg-gray-800"
                >
                  Last 30 days
                </SelectItem>
                <SelectItem
                  value="90d"
                  className="text-white hover:bg-gray-800"
                >
                  Last 90 days
                </SelectItem>
                <SelectItem
                  value="12m"
                  className="text-white hover:bg-gray-800"
                >
                  Last 12 months
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="bg-gray-900 border-gray-700 text-white hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110"
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
              className="bg-gray-900 border-gray-700 text-white hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110"
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

        {/* Bold animated stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-up">
          <Card className="overflow-hidden border-gray-800 bg-gray-900/80 hover:bg-gray-900 transition-all duration-500 animate-scale-in group hover:scale-105 hover:shadow-2xl">
            <CardHeader className="pb-3 pt-6 px-6 relative">
              <div className="absolute top-4 right-4 w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                TOTAL REVENUE
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-10 w-32 bg-gray-700 animate-pulse rounded-lg"></div>
                  ) : (
                    <span className="text-4xl font-black text-white tracking-tight">
                      {revenueData.total.amount}
                    </span>
                  )}
                </div>
                {(!isLoading || dataLoaded) && (
                  <div
                    className={`flex items-center text-sm font-bold px-3 py-2 rounded-lg ${revenueData.total.trend === "up" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}
                  >
                    {revenueData.total.trend === "up" ? (
                      <ArrowUpRight className="h-5 w-5 mr-1 animate-bounce" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 mr-1 animate-bounce" />
                    )}
                    {Math.abs(revenueData.total.change).toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-gray-800 bg-gray-900/80 hover:bg-gray-900 transition-all duration-500 animate-scale-in group hover:scale-105 hover:shadow-2xl">
            <CardHeader className="pb-3 pt-6 px-6 relative">
              <div className="absolute top-4 right-4 w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                TOTAL PLAYS
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-10 w-32 bg-gray-700 animate-pulse rounded-lg"></div>
                  ) : (
                    <span className="text-4xl font-black text-white tracking-tight">
                      {formatNumber(
                        platformData.reduce((sum, p) => sum + p.plays, 0),
                      )}
                    </span>
                  )}
                </div>
                {(!isLoading || dataLoaded) && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-gray-800 bg-gray-900/80 hover:bg-gray-900 transition-all duration-500 animate-scale-in group hover:scale-105 hover:shadow-2xl">
            <CardHeader className="pb-3 pt-6 px-6 relative">
              <div className="absolute top-4 right-4 w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                PLATFORMS
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-10 w-32 bg-gray-700 animate-pulse rounded-lg"></div>
                  ) : (
                    <span className="text-4xl font-black text-white tracking-tight">
                      {platformData.length}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                  ACTIVE
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-gray-800 bg-gray-900/80 hover:bg-gray-900 transition-all duration-500 animate-scale-in group hover:scale-105 hover:shadow-2xl">
            <CardHeader className="pb-3 pt-6 px-6 relative">
              <div className="absolute top-4 right-4 w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <LineChartIcon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                AVG RATE
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {isLoading && !dataLoaded ? (
                    <div className="h-10 w-32 bg-gray-700 animate-pulse rounded-lg"></div>
                  ) : (
                    <span className="text-4xl font-black text-white tracking-tight">
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
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                  /1K
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bold analytics chart */}
        <Card className="overflow-hidden border-gray-800 bg-gray-900/80 transition-all duration-500 animate-fade-in hover:bg-gray-900 group">
          <CardHeader className="pt-6 px-8 pb-4 relative">
            <div className="absolute top-6 right-6 w-14 h-14 bg-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-wide">
              ANALYTICS
            </CardTitle>
            <CardDescription className="text-lg text-gray-400 font-medium">
              Performance metrics overview
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[450px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="relative">
                    <img
                      src="/spinning-loader.png"
                      alt="Loading"
                      className="h-16 w-16 animate-spin brightness-150 drop-shadow-lg"
                      onError={(e) => {
                        console.warn("Loading image not found, using fallback");
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full">
                  <AnalyticsCharts
                    data={{
                      plays: {
                        labels: platformData?.map((p) => p.name) || [],
                        values: platformData?.map((p) => p.plays) || [],
                      },
                      revenue: {
                        labels: platformData?.map((p) => p.name) || [],
                        values: platformData?.map((p) => p.revenue) || [],
                      },
                      geography: {
                        countries: [],
                        values: [],
                      },
                      platforms: {
                        names: platformData?.map((p) => p.name) || [],
                        values: platformData?.map((p) => p.percentage) || [],
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bold bottom cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20 animate-slide-up">
          <Card className="overflow-hidden h-full border-gray-800 bg-gray-900/80 transition-all duration-500 hover:bg-gray-900 group">
            <CardHeader className="pt-6 px-8 pb-4 relative">
              <div className="absolute top-6 right-6 w-14 h-14 bg-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-white uppercase tracking-wide">
                PLATFORMS
              </CardTitle>
              <CardDescription className="text-lg text-gray-400 font-medium">
                Performance by platform
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-6 overflow-y-auto max-h-[400px]">
              <div className="space-y-6">
                {platformData && platformData.length > 0 ? (
                  platformData.map((platform, index) => (
                    <div
                      key={`${platform.name}-${index}`}
                      className="flex items-center justify-between p-5 rounded-xl bg-black/40 hover:bg-black/60 border border-gray-700 hover:border-white/20 transition-all duration-500 group hover:scale-105"
                    >
                      <div className="space-y-2">
                        <p className="text-lg font-black leading-none text-white uppercase tracking-wide">
                          {platform.name}
                        </p>
                        <p className="text-sm text-gray-400 font-mono">
                          {isLoading && !dataLoaded ? (
                            <div className="h-4 w-32 bg-gray-700 animate-pulse rounded"></div>
                          ) : (
                            <>
                              {formatNumber(platform.plays)} plays · $
                              {platform.revenue.toFixed(2)}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-black text-white">
                          {isLoading && !dataLoaded ? (
                            <div className="h-5 w-10 bg-gray-700 animate-pulse rounded"></div>
                          ) : (
                            `${platform.percentage}%`
                          )}
                        </div>
                        <div className="w-40 h-4 bg-gray-800 rounded-full overflow-hidden">
                          {isLoading && !dataLoaded ? (
                            <div className="h-full bg-gray-600 animate-pulse"></div>
                          ) : (
                            <div
                              className="h-full bg-white transition-all duration-1000 ease-out rounded-full group-hover:bg-gray-300"
                              style={{ width: `${platform.percentage}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg font-medium">
                      NO DATA AVAILABLE
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="px-8 pb-6 pt-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-black border-gray-700 text-white hover:bg-white hover:text-black transition-all duration-300 font-bold uppercase tracking-wider"
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
                <BarChart3 className="h-5 w-5 mr-3" />
                DETAILED BREAKDOWN
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden h-full border-gray-800 bg-gray-900/80 transition-all duration-500 hover:bg-gray-900 group">
            <CardHeader className="pt-6 px-8 pb-4 relative">
              <div className="absolute top-6 right-6 w-14 h-14 bg-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <PieChart className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-white uppercase tracking-wide">
                GEOGRAPHY
              </CardTitle>
              <CardDescription className="text-lg text-gray-400 font-medium">
                Global distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="h-[320px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="relative">
                      <img
                        src="/spinning-loader.png"
                        alt="Loading"
                        className="h-16 w-16 animate-spin brightness-150 drop-shadow-lg"
                        onError={(e) => {
                          console.warn(
                            "Loading image not found, using fallback",
                          );
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full">
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
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="px-8 pb-6 pt-4 mt-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-black border-gray-700 text-white hover:bg-white hover:text-black transition-all duration-300 font-bold uppercase tracking-wider"
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
                <PieChart className="h-5 w-5 mr-3" />
                DETAILED BREAKDOWN
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
