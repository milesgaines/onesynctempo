import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: "Subscription ID is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const picaSecretKey = Deno.env.get("PICA_SECRET_KEY");
    const picaStripeConnectionKey = Deno.env.get("PICA_STRIPE_CONNECTION_KEY");

    if (!picaSecretKey || !picaStripeConnectionKey) {
      return new Response(
        JSON.stringify({ error: "Missing PICA configuration" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const response = await fetch(
      `https://api.picaos.com/v1/passthrough/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "x-pica-secret": picaSecretKey,
          "x-pica-connection-key": picaStripeConnectionKey,
          "x-pica-action-id": "conn_mod_def::GCmLIl_J0PU",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stripe API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscription" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        },
      );
    }

    const subscription = await response.json();

    return new Response(JSON.stringify({ subscription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
