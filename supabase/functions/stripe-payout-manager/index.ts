import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
    const PICA_STRIPE_CONNECTION_KEY = Deno.env.get(
      "PICA_STRIPE_CONNECTION_KEY",
    );

    if (!PICA_SECRET_KEY || !PICA_STRIPE_CONNECTION_KEY) {
      throw new Error("Missing PICA credentials");
    }

    let endpoint = "";
    let method = "GET";
    let body = null;
    let actionId = "";

    switch (action) {
      case "list_payouts":
        const payoutParams = new URLSearchParams();
        if (params.status) payoutParams.append("status", params.status);
        payoutParams.append("limit", (params.limit || 50).toString());
        if (params.created?.gte)
          payoutParams.append("created[gte]", params.created.gte.toString());
        if (params.created?.lte)
          payoutParams.append("created[lte]", params.created.lte.toString());

        endpoint = `v1/payouts?${payoutParams}`;
        actionId = "conn_mod_def::GCmLSbTmkW4::3wzTQK8jTRyi_GeLzPeKQg";
        break;

      case "create_payout":
        if (!params.amount || !params.destination) {
          throw new Error("Missing required fields: amount, destination");
        }

        endpoint = "v1/payouts";
        method = "POST";
        body = new URLSearchParams({
          amount: params.amount.toString(),
          currency: params.currency || "usd",
          destination: params.destination,
          description: params.description || "Payout from OneSync",
          method: params.method || "standard",
        });
        actionId = "conn_mod_def::GCmLQxFmO6A::09vMSElPTbuLewGRzzLhpA";
        break;

      case "get_balance":
        endpoint = "v1/balance";
        actionId = "conn_mod_def::GCmLMcCm3nQ::-fHp-X6BSQeDvHGK2YSI1w";
        break;

      case "get_balance_transactions":
        const txnParams = new URLSearchParams();
        if (params.limit) txnParams.append("limit", params.limit.toString());
        if (params.starting_after)
          txnParams.append("starting_after", params.starting_after);
        if (params.type) txnParams.append("type", params.type);

        endpoint = `v1/balance_transactions?${txnParams}`;
        actionId = "conn_mod_def::GCmLSbTmkW4::3wzTQK8jTRyi_GeLzPeKQg";
        break;

      case "get_payout":
        if (!params.payoutId) {
          throw new Error("Missing required field: payoutId");
        }
        endpoint = `v1/payouts/${params.payoutId}`;
        actionId = "conn_mod_def::GCmLQW9Q5pA::Q2xUaCDKT0ObezUN3cH8HQ";
        break;

      case "create_external_account":
        if (
          !params.account_holder_name ||
          !params.routing_number ||
          !params.account_number
        ) {
          throw new Error("Missing required fields for bank account");
        }

        endpoint = "v1/accounts/acct_default/external_accounts";
        method = "POST";
        body = new URLSearchParams({
          "external_account[object]": "bank_account",
          "external_account[country]": params.country || "US",
          "external_account[currency]": params.currency || "usd",
          "external_account[account_holder_name]": params.account_holder_name,
          "external_account[account_holder_type]":
            params.account_holder_type || "individual",
          "external_account[routing_number]": params.routing_number,
          "external_account[account_number]": params.account_number,
        });
        actionId = "conn_mod_def::GCmLSbTmkW4::3wzTQK8jTRyi_GeLzPeKQg";
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(
      `https://api.picaos.com/v1/passthrough/${endpoint}`,
      {
        method,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-pica-secret": PICA_SECRET_KEY,
          "x-pica-connection-key": PICA_STRIPE_CONNECTION_KEY,
          "x-pica-action-id": actionId,
        },
        body: body,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Stripe API error (${response.status}):`, errorText);
      throw new Error(`Stripe API error: ${response.status} - ${errorText}`);
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
    console.error("Error in Stripe payout manager:", error);
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
