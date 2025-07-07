import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
    const PICA_APPLE_MUSIC_CONNECTION_KEY = Deno.env.get(
      "PICA_APPLE_MUSIC_CONNECTION_KEY",
    );

    if (!PICA_SECRET_KEY || !PICA_APPLE_MUSIC_CONNECTION_KEY) {
      throw new Error("Missing PICA credentials");
    }

    let endpoint = "";
    let method = "GET";
    let body = null;
    let actionId = "";

    switch (action) {
      case "get_sales_reports":
        const reportParams = new URLSearchParams();
        if (params.vendor_number)
          reportParams.append("filter[vendorNumber]", params.vendor_number);
        if (params.report_type)
          reportParams.append("filter[reportType]", params.report_type);
        if (params.report_date)
          reportParams.append("filter[reportDate]", params.report_date);

        endpoint = `v1/salesReports?${reportParams}`;
        actionId = "conn_mod_def::GCmLApple1::SalesReports";
        break;

      case "get_financial_reports":
        const finParams = new URLSearchParams();
        if (params.vendor_number)
          finParams.append("filter[vendorNumber]", params.vendor_number);
        if (params.region_code)
          finParams.append("filter[regionCode]", params.region_code);
        if (params.report_date)
          finParams.append("filter[reportDate]", params.report_date);

        endpoint = `v1/financeReports?${finParams}`;
        actionId = "conn_mod_def::GCmLApple2::FinanceReports";
        break;

      case "get_analytics_data":
        const analyticsParams = new URLSearchParams();
        if (params.measures)
          analyticsParams.append("filter[measures]", params.measures);
        if (params.dimension)
          analyticsParams.append("filter[dimension]", params.dimension);
        if (params.start_time)
          analyticsParams.append("filter[startTime]", params.start_time);
        if (params.end_time)
          analyticsParams.append("filter[endTime]", params.end_time);

        endpoint = `v1/analytics/app-analytics?${analyticsParams}`;
        actionId = "conn_mod_def::GCmLApple3::AnalyticsData";
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(
      `https://api.picaos.com/v1/passthrough/${endpoint}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-pica-secret": PICA_SECRET_KEY,
          "x-pica-connection-key": PICA_APPLE_MUSIC_CONNECTION_KEY,
          "x-pica-action-id": actionId,
        },
        body: body,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apple Music API error (${response.status}):`, errorText);
      throw new Error(
        `Apple Music API error: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in Apple Music analytics:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
