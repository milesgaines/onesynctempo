import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { batchId } = await req.json();

    if (!batchId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: batchId" }),
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
      `https://api.trolley.com/v1/batches/${batchId}`,
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
          error: "Failed to fetch batch status",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const batch = await response.json();

    return new Response(JSON.stringify(batch), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching Trolley batch status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
