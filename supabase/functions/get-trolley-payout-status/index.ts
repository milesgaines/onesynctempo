import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { payoutId } = await req.json();

    if (!payoutId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: payoutId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const trolleyApiKey = Deno.env.get("TROLLEY_API_KEY");
    const trolleyApiSecret = Deno.env.get("TROLLEY_API_SECRET");

    if (!trolleyApiKey || !trolleyApiSecret) {
      return new Response(
        JSON.stringify({ error: "Trolley API credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Basic Auth header
    const credentials = btoa(`${trolleyApiKey}:${trolleyApiSecret}`);

    const response = await fetch(
      `https://api.trolley.com/v1/payouts/${payoutId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Trolley API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch payout status",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payout = await response.json();

    return new Response(JSON.stringify(payout), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching Trolley payout status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
