import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { payouts } = await req.json();

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid payouts array" }),
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

    // Format payouts for Trolley API
    const formattedPayouts = payouts.map((payout) => ({
      recipient: {
        id: payout.recipientId,
      },
      sourceAmount: payout.amount.toString(),
      sourceCurrency: payout.currency || "USD",
      memo:
        payout.memo ||
        `Batch payout for ${payout.amount} ${payout.currency || "USD"}`,
    }));

    const batchData = {
      payouts: formattedPayouts,
    };

    const response = await fetch("https://api.trolley.com/v1/batches", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Trolley API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create batch", details: errorData }),
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
    console.error("Error creating Trolley batch:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
