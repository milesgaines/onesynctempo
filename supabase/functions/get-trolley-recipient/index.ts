import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipientId } = await req.json();

    if (!recipientId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: recipientId" }),
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
      `https://api.trolley.com/v1/recipients/${recipientId}`,
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
          error: "Failed to fetch recipient",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const recipient = await response.json();

    return new Response(JSON.stringify(recipient), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching Trolley recipient:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
