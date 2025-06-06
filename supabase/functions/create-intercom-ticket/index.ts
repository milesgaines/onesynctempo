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
    const { releaseData, userData } = await req.json();

    if (!releaseData || !userData) {
      return new Response(
        JSON.stringify({ error: "Missing releaseData or userData" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get environment variables
    const picaSecret = Deno.env.get("PICA_SECRET_KEY");
    const picaConnectionKey = Deno.env.get("PICA_INTERCOM_CONNECTION_KEY");
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

    // Create ticket content
    const ticketTitle = `New Release Upload: ${releaseData.releaseTitle || releaseData.trackTitle}`;
    const ticketBody = `
A new full release has been uploaded to OneSync!

**Release Details:**
- Title: ${releaseData.releaseTitle || releaseData.trackTitle}
- Artist: ${releaseData.primaryArtist || releaseData.artist}
- Genre: ${releaseData.mainGenre || releaseData.genre}
- Release Date: ${releaseData.releaseDate}
- Release Type: ${releaseData.releaseType}
- Platforms: ${releaseData.platforms?.join(", ") || "Not specified"}

**User Information:**
- Name: ${userData.name}
- Email: ${userData.email}
- User ID: ${userData.id}

**Track Information:**
- Track Title: ${releaseData.trackTitle || releaseData.title}
- Track Number: ${releaseData.trackNumber || 1}
- Featured Artist: ${releaseData.featuredArtist || "None"}
- Explicit Content: ${releaseData.isExplicit ? "Yes" : "No"}
- Description: ${releaseData.description || "No description provided"}

**Additional Details:**
- Label: ${releaseData.label || "Independent"}
- UPC: ${releaseData.upc || "Not provided"}
- Countries: ${releaseData.isWorldwide ? "Worldwide" : releaseData.countries?.join(", ") || "Not specified"}
- Copyrights: ${releaseData.copyrights || "Not specified"}
- Audio Files: ${releaseData.audioFiles?.length || 1} file(s)
- Artwork: ${releaseData.artwork ? "Uploaded" : "Not uploaded"}

**Upload Status:** Completed successfully
**Timestamp:** ${new Date().toISOString()}

Please review this release for quality assurance and distribution processing.
    `;

    // Create the ticket using PICA passthrough to Intercom
    const ticketPayload = {
      message_type: "inbound",
      subject: ticketTitle,
      body: ticketBody,
      from: {
        type: "user",
        id: userData.id,
        name: userData.name,
        email: userData.email,
      },
      created_at: Math.floor(Date.now() / 1000),
    };

    console.log("Creating Intercom ticket with payload:", ticketPayload);

    // Make request to PICA API to create Intercom ticket
    const response = await fetch(
      `https://api.picaos.com/v1/passthrough/v1/projects/${supabaseProjectRef}/intercom/conversations`,
      {
        method: "POST",
        headers: {
          "x-pica-secret": picaSecret,
          "x-pica-connection-key": picaConnectionKey,
          "x-pica-action-id":
            "conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketPayload),
      },
    );

    if (response.status === 200 || response.status === 201) {
      const responseData = await response.json();
      console.log("Intercom ticket created successfully:", responseData);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Intercom ticket created successfully",
          ticketId: responseData.id || "unknown",
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
          error: "Failed to create Intercom ticket",
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
    console.error("Error creating Intercom ticket:", error);
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
