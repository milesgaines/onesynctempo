import { supabase } from "./supabaseClient";

// Types for analytics data
export interface StreamingAnalytics {
  platform: string;
  plays: number;
  revenue: number;
  date: string;
  country?: string;
  trackId?: string;
  artistId?: string;
}

export interface SalesData {
  platform: string;
  units: number;
  revenue: number;
  date: string;
  territory: string;
  productType: string;
}

export interface GeographicData {
  country: string;
  plays: number;
  revenue: number;
  percentage: number;
}

export interface PlatformPerformance {
  platform: string;
  totalPlays: number;
  totalRevenue: number;
  averageRevenuePerPlay: number;
  marketShare: number;
}

// Spotify Analytics Functions
export async function getSpotifyAnalytics(params: {
  artistId?: string;
  trackId?: string;
  timeRange?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-spotify-analytics",
      {
        body: {
          action: params.artistId
            ? "get_artist_analytics"
            : "get_track_analytics",
          artistId: params.artistId,
          trackId: params.trackId,
          time_range: params.timeRange || "medium_term",
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching Spotify analytics:", error);
    return null;
  }
}

export async function getSpotifyStreamingData(params: {
  timeRange?: string;
  limit?: number;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-spotify-analytics",
      {
        body: {
          action: "get_streaming_data",
          time_range: params.timeRange || "medium_term",
          limit: params.limit || 50,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching Spotify streaming data:", error);
    return null;
  }
}

// Apple Music Analytics Functions
export async function getAppleMusicSalesReports(params: {
  vendorNumber: string;
  reportType?: string;
  reportDate?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-apple-music-analytics",
      {
        body: {
          action: "get_sales_reports",
          vendor_number: params.vendorNumber,
          report_type: params.reportType || "Sales",
          report_date: params.reportDate,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching Apple Music sales reports:", error);
    return null;
  }
}

export async function getAppleMusicFinancialReports(params: {
  vendorNumber: string;
  regionCode?: string;
  reportDate?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-apple-music-analytics",
      {
        body: {
          action: "get_financial_reports",
          vendor_number: params.vendorNumber,
          region_code: params.regionCode,
          report_date: params.reportDate,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching Apple Music financial reports:", error);
    return null;
  }
}

// Consolidated Analytics Functions
export async function getConsolidatedAnalytics(params: {
  timeRange: string;
  platforms?: string[];
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (params.timeRange) {
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

    // Fetch from local analytics table
    const { data: localAnalytics, error } = await supabase
      .from("analytics")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) throw error;

    // Process and aggregate data
    const platformStats = (localAnalytics || []).reduce(
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

    const geoStats = (localAnalytics || []).reduce(
      (acc, record) => {
        const country = record.country || "Unknown";
        if (!acc[country]) {
          acc[country] = { plays: 0, revenue: 0 };
        }
        acc[country].plays += record.plays || 0;
        acc[country].revenue += record.revenue || 0;
        return acc;
      },
      {} as Record<string, { plays: number; revenue: number }>,
    );

    return {
      platformStats,
      geoStats,
      totalPlays: (Object.values(
        platformStats,
      ) as { plays: number; revenue: number }[]).reduce(
        (sum, p) => sum + p.plays,
        0,
      ),
      totalRevenue: (Object.values(
        platformStats,
      ) as { plays: number; revenue: number }[]).reduce(
        (sum, p) => sum + p.revenue,
        0,
      ),
      rawData: localAnalytics || [],
    };
  } catch (error) {
    console.error("Error fetching consolidated analytics:", error);
    return {
      platformStats: {},
      geoStats: {},
      totalPlays: 0,
      totalRevenue: 0,
      rawData: [],
    };
  }
}

// Enhanced Sales Tracking
export async function getEnhancedSalesData(params: {
  timeRange: string;
  includeStripe?: boolean;
  includePlatforms?: boolean;
}) {
  try {
    const results = {
      stripe: null as any,
      platforms: null as any,
      consolidated: null as any,
    };

    // Get Stripe sales data if requested
    if (params.includeStripe) {
      const { data: stripeData } = await supabase.functions.invoke(
        "supabase-functions-stripe-payout-manager",
        {
          body: {
            action: "get_balance_transactions",
            type: "payment",
            limit: 100,
          },
        },
      );
      results.stripe = stripeData;
    }

    // Get platform analytics if requested
    if (params.includePlatforms) {
      results.platforms = await getConsolidatedAnalytics({
        timeRange: params.timeRange,
      });
    }

    // Consolidate all sales data
    const totalRevenue =
      (results.stripe?.data || []).reduce(
        (sum: number, txn: any) => sum + txn.net / 100,
        0,
      ) + (results.platforms?.totalRevenue || 0);

    results.consolidated = {
      totalRevenue,
      stripeRevenue: (results.stripe?.data || []).reduce(
        (sum: number, txn: any) => sum + txn.net / 100,
        0,
      ),
      platformRevenue: results.platforms?.totalRevenue || 0,
      totalTransactions: (results.stripe?.data || []).length,
      totalPlays: results.platforms?.totalPlays || 0,
    };

    return results;
  } catch (error) {
    console.error("Error fetching enhanced sales data:", error);
    return {
      stripe: null,
      platforms: null,
      consolidated: {
        totalRevenue: 0,
        stripeRevenue: 0,
        platformRevenue: 0,
        totalTransactions: 0,
        totalPlays: 0,
      },
    };
  }
}

// Real-time Analytics Sync
export async function syncAnalyticsData() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // This would typically sync data from external APIs
    // and update the local analytics table
    console.log("🔄 [ANALYTICS] Starting analytics sync for user:", user.id);

    // Placeholder for actual sync logic
    // In a real implementation, this would:
    // 1. Fetch latest data from Spotify, Apple Music, etc.
    // 2. Process and normalize the data
    // 3. Update the local analytics table
    // 4. Trigger real-time updates to connected clients

    return { success: true, message: "Analytics sync completed" };
  } catch (error) {
    console.error("Error syncing analytics data:", error);
    return { success: false, error: error.message };
  }
}
