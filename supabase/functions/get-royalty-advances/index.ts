import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Set a timeout for the entire function
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Function timeout")), 25000); // 25 second timeout
    });

    const mainLogic = async () => {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase configuration");
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get user from auth header with timeout
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header");
      }

      const token = authHeader.replace("Bearer ", "");
      if (!token) {
        throw new Error("Invalid token format");
      }

      // Use a shorter timeout for auth check
      const authPromise = supabase.auth.getUser(token);
      const authTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Auth timeout")), 5000);
      });

      const {
        data: { user },
        error: authError,
      } = await Promise.race([authPromise, authTimeout]);

      if (authError || !user) {
        throw new Error(
          `Authentication failed: ${authError?.message || "Invalid user token"}`,
        );
      }

      // Mock data for now - in a real implementation, this would come from your database
      // or be calculated from Stripe data
      const mockAdvances = [
        {
          id: "adv_001",
          amount: 5000,
          currency: "USD",
          advanceDate: "2024-01-15",
          repaidAmount: 2500,
          remainingBalance: 2500,
          status: "active",
          description: "Q1 2024 Royalty Advance",
          repaymentHistory: [
            {
              id: "rep_001",
              amount: 1000,
              date: "2024-02-01",
              payoutId: "po_123",
              description: "February earnings deduction",
            },
            {
              id: "rep_002",
              amount: 1500,
              date: "2024-03-01",
              payoutId: "po_124",
              description: "March earnings deduction",
            },
          ],
        },
        {
          id: "adv_002",
          amount: 3000,
          currency: "USD",
          advanceDate: "2024-03-01",
          repaidAmount: 800,
          remainingBalance: 2200,
          status: "active",
          description: "Spring 2024 Marketing Advance",
          repaymentHistory: [
            {
              id: "rep_003",
              amount: 800,
              date: "2024-04-01",
              payoutId: "po_125",
              description: "April earnings deduction",
            },
          ],
        },
      ];

      return {
        success: true,
        data: { advances: mockAdvances },
        user_id: user.id,
      };
    };

    // Race between main logic and timeout
    const result = await Promise.race([mainLogic(), timeoutPromise]);

    return new Response(JSON.stringify(result.data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching royalty advances:", error);

    // Determine appropriate status code based on error type
    let status = 500;
    let errorMessage = "Internal server error";

    if (error.message.includes("timeout")) {
      status = 504;
      errorMessage = "Request timeout - please try again";
    } else if (
      error.message.includes("authorization") ||
      error.message.includes("Authentication")
    ) {
      status = 401;
      errorMessage = "Authentication failed";
    } else if (error.message.includes("Missing Supabase")) {
      status = 500;
      errorMessage = "Server configuration error";
    } else {
      errorMessage = error.message || "Unknown error occurred";
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        success: false,
      }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
