import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Intercom unread count via PICA
    const picaResponse = await fetch(
      "https://pica.onesync.ai/intercom/conversations/search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("PICA_SECRET_KEY")}`,
          "Content-Type": "application/json",
          "X-Connection-Key": Deno.env.get("PICA_INTERCOM_CONNECTION_KEY"),
        },
        body: JSON.stringify({
          query: {
            field: "user_id",
            operator: "=",
            value: user_id,
          },
          pagination: {
            per_page: 50,
          },
        }),
      },
    );

    if (!picaResponse.ok) {
      console.error("PICA API error:", await picaResponse.text());
      return new Response(
        JSON.stringify({
          error: "Failed to fetch Intercom data",
          unread_count: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await picaResponse.json();

    // Count unread conversations
    let unreadCount = 0;
    if (data.conversations && Array.isArray(data.conversations)) {
      unreadCount = data.conversations.filter(
        (conv: any) => conv.read === false || conv.state === "open",
      ).length;
    }

    return new Response(
      JSON.stringify({
        unread_count: unreadCount,
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching Intercom unread count:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        unread_count: 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
