import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, ...params } = body || {};

    const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
    const PICA_SPOTIFY_CONNECTION_KEY = Deno.env.get(
      "PICA_SPOTIFY_CONNECTION_KEY",
    );

    if (!PICA_SECRET_KEY || !PICA_SPOTIFY_CONNECTION_KEY) {
      console.error("Missing PICA credentials", {
        hasPicaSecret: !!PICA_SECRET_KEY,
        hasPicaSpotifyKey: !!PICA_SPOTIFY_CONNECTION_KEY,
      });
      throw new Error("Missing PICA credentials");
    }

    let endpoint = "";
    let method = "GET";
    let body = null;
    let actionId = "";

    switch (action) {
      case "get_artist_analytics":
        if (!params.artistId) {
          throw new Error("Missing required field: artistId");
        }
        endpoint = `v1/artists/${params.artistId}/insights`;
        actionId = "conn_mod_def::GCmLSpotify1::AnalyticsInsights";
        break;

      case "get_track_analytics":
        if (!params.trackId) {
          throw new Error("Missing required field: trackId");
        }
        endpoint = `v1/tracks/${params.trackId}/insights`;
        actionId = "conn_mod_def::GCmLSpotify2::TrackInsights";
        break;

      case "get_streaming_data":
        const streamParams = new URLSearchParams();
        if (params.time_range)
          streamParams.append("time_range", params.time_range);
        if (params.limit) streamParams.append("limit", params.limit.toString());

        endpoint = `v1/me/player/recently-played?${streamParams}`;
        actionId = "conn_mod_def::GCmLSpotify3::StreamingData";
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(
      `https://api.picaos.com/v1/passthrough/${endpoint}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-pica-secret": PICA_SECRET_KEY,
          "x-pica-connection-key": PICA_SPOTIFY_CONNECTION_KEY,
          "x-pica-action-id": actionId,
        },
        body: body ? JSON.stringify(body) : null,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Spotify API error (${response.status}):`, errorText);
      throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
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
    console.error("Error in Spotify analytics:", error);
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
