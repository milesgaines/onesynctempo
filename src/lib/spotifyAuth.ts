// Spotify Authentication Helper
import { supabase } from "./supabaseClient";

// Spotify API configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = `${window.location.origin}/auth/spotify-callback`;
const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming",
].join(" ");

/**
 * Generate a random string for state parameter
 */
const generateRandomString = (length: number): string => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * Initiate Spotify OAuth flow
 */
export const initiateSpotifyAuth = async (): Promise<void> => {
  if (!SPOTIFY_CLIENT_ID) {
    console.error("VITE_SPOTIFY_CLIENT_ID environment variable is not set");
    console.error("Spotify Client ID is not configured");
    throw new Error("Spotify Client ID is not configured");
  }

  console.log(
    "🎵 [SPOTIFY] Initiating Spotify auth with Client ID:",
    SPOTIFY_CLIENT_ID.substring(0, 8) + "...",
  );

  // Generate and store state for CSRF protection
  const state = generateRandomString(16);
  localStorage.setItem("spotify_auth_state", state);

  // Build authorization URL
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("client_id", SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("scope", SPOTIFY_SCOPES);

  console.log("🎵 [SPOTIFY] Redirect URI:", SPOTIFY_REDIRECT_URI);
  console.log("🎵 [SPOTIFY] Auth URL:", authUrl.toString());

  // Redirect to Spotify authorization page
  window.location.href = authUrl.toString();
};

/**
 * Handle Spotify OAuth callback
 */
export const handleSpotifyCallback = async (
  code: string,
  state: string,
): Promise<{
  success: boolean;
  error?: string;
  userData?: any;
}> => {
  // Verify state parameter to prevent CSRF attacks
  const storedState = localStorage.getItem("spotify_auth_state");
  if (!state || state !== storedState) {
    return { success: false, error: "State verification failed" };
  }

  try {
    // Exchange code for tokens via server function
    // Note: In a real implementation, this should be done server-side
    // For demo purposes, we'll simulate a successful response

    // Get current user from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Store Spotify connection in user metadata
    const { error } = await supabase
      .from("user_profiles")
      .update({
        spotify_connected: true,
        spotify_connected_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user profile:", error);
      return { success: false, error: "Failed to update user profile" };
    }

    // Clear state from storage
    localStorage.removeItem("spotify_auth_state");

    return {
      success: true,
      userData: {
        connected: true,
        connectedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error handling Spotify callback:", error);
    return {
      success: false,
      error: "Failed to process Spotify authentication",
    };
  }
};

/**
 * Check if user has connected Spotify
 */
export const checkSpotifyConnection = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("user_profiles")
      .select("spotify_connected")
      .eq("id", user.id)
      .single();

    return data?.spotify_connected || false;
  } catch (error) {
    console.error("Error checking Spotify connection:", error);
    return false;
  }
};

/**
 * Disconnect Spotify from user account
 */
export const disconnectSpotify = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("user_profiles")
      .update({
        spotify_connected: false,
        spotify_connected_at: null,
      })
      .eq("id", user.id);

    return !error;
  } catch (error) {
    console.error("Error disconnecting Spotify:", error);
    return false;
  }
};
