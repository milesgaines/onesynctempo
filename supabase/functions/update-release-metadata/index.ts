import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { releaseId, metadata } = await req.json();

    if (!releaseId || !metadata) {
      return new Response(
        JSON.stringify({ error: "Missing releaseId or metadata" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get environment variables
    const picaSecret = Deno.env.get("PICA_SECRET_KEY");
    const picaConnectionKey = Deno.env.get("PICA_SUPABASE_CONNECTION_KEY");
    const supabaseProjectRef = Deno.env.get("SUPABASE_PROJECT_ID");

    if (!picaSecret || !picaConnectionKey || !supabaseProjectRef) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Helper function to safely escape SQL strings
    const escapeSqlString = (str) => {
      if (!str) return "NULL";
      return `'${str.toString().replace(/'/g, "''")}'`;
    };

    // Helper function to format array for SQL
    const formatSqlArray = (arr) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return "NULL";
      const escapedItems = arr.map((item) =>
        item.toString().replace(/'/g, "''"),
      );
      return `ARRAY['${escapedItems.join("','")}'::text[]]`;
    };

    // Construct comprehensive SQL update query with all metadata fields
    const sqlQuery = `
      UPDATE releases
      SET
        title = ${escapeSqlString(metadata.title)},
        primary_artist = ${escapeSqlString(metadata.primary_artist)},
        display_artist = ${escapeSqlString(metadata.display_artist)},
        featured_artist = ${escapeSqlString(metadata.featured_artist)},
        release_type = ${escapeSqlString(metadata.release_type || "Single")},
        main_genre = ${escapeSqlString(metadata.main_genre)},
        sub_genre = ${escapeSqlString(metadata.sub_genre)},
        release_date = ${escapeSqlString(metadata.release_date)},
        original_release_date = ${escapeSqlString(metadata.original_release_date)},
        description = ${escapeSqlString(metadata.description)},
        label = ${escapeSqlString(metadata.label)},
        upc = ${escapeSqlString(metadata.upc)},
        countries = ${formatSqlArray(metadata.countries)},
        is_worldwide = ${metadata.is_worldwide || false},
        copyrights = ${escapeSqlString(metadata.copyrights)},
        release_notes = ${escapeSqlString(metadata.release_notes)},
        retailers = ${formatSqlArray(metadata.retailers)},
        exclusive_for = ${escapeSqlString(metadata.exclusive_for)},
        allow_preorder_itunes = ${metadata.allow_preorder_itunes || false},
        platforms = ${formatSqlArray(metadata.platforms) === "NULL" ? "ARRAY[]::text[]" : formatSqlArray(metadata.platforms)},
        updated_at = NOW()
      WHERE id = ${escapeSqlString(releaseId)}
      RETURNING *;
    `;

    console.log("Executing SQL query:", sqlQuery);

    // Make request to PICA API
    const response = await fetch(
      `https://api.picaos.com/v1/passthrough/v1/projects/${supabaseProjectRef}/database/query`,
      {
        method: "POST",
        headers: {
          "x-pica-secret": picaSecret,
          "x-pica-connection-key": picaConnectionKey,
          "x-pica-action-id":
            "conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
      },
    );

    if (response.status === 201) {
      console.log("Release metadata updated successfully");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Release metadata updated successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else {
      const errorText = await response.text();
      console.error("PICA API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to update release metadata",
          details: errorText,
          status: response.status,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error updating release metadata:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
