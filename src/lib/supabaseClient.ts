import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://tycuphjdepjcopjilgxy.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Y3VwaGpkZXBqY29wamlsZ3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2ODE0NjMsImV4cCI6MjA2NDI1NzQ2M30.04em3kgOr4sumjT-HWpVhjkH31DqzsdyreJb2QILCzk";

console.log("🔧 [SUPABASE] Configuration check:", {
  url: supabaseUrl ? "✅ Set" : "❌ Missing",
  key: supabaseAnonKey ? "✅ Set" : "❌ Missing",
  usingDefaults:
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ [SUPABASE] Using default Supabase configuration");
}

console.log(
  "🚀 [SUPABASE] Initializing Supabase client with URL:",
  supabaseUrl,
);

// Create client with additional options for better reliability
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "x-application-name": "OneSync Music Platform",
    },
  },
  db: {
    schema: "public",
  },
});

// Test connection on initialization with enhanced error reporting
supabase
  .from("tracks")
  .select("count")
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error("❌ [SUPABASE] Initial connection test failed:", error);
      console.error(
        "❌ [SUPABASE] Error details - Code:",
        error.code,
        "Message:",
        error.message,
      );
      console.error(
        "❌ [SUPABASE] Please ensure your Supabase project is properly configured",
      );
      console.error("❌ [SUPABASE] URL:", supabaseUrl.substring(0, 15) + "...");

      // Check for common error codes
      if (error.code === "42P01") {
        console.error(
          "❌ [SUPABASE] Error: Table 'tracks' does not exist. Please run the SQL schema.",
        );
      } else if (error.code === "PGRST116") {
        console.error(
          "❌ [SUPABASE] Error: Invalid API key or unauthorized access.",
        );
      } else if (error.code === "PGRST301") {
        console.error(
          "❌ [SUPABASE] Error: Database connection error. Check your Supabase URL.",
        );
      }
    } else {
      console.log("✅ [SUPABASE] Initial connection test successful");
      console.log(
        "✅ [SUPABASE] Database is properly configured and accessible",
      );
    }
  })
  .catch((err) => {
    console.error(
      "❌ [SUPABASE] Exception during initial connection test:",
      err,
    );
    console.error(
      "❌ [SUPABASE] This may indicate a network issue or invalid Supabase URL",
    );
  });

// Database Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  release_date: string;
  description?: string;
  audio_file_url?: string;
  artwork_url?: string;
  platforms: string[];
  is_explicit: boolean;
  plays: number;
  revenue: number;
  status: "pending" | "processing" | "live" | "failed";
  created_at: string;
  updated_at: string;
  user_id: string;
  cat_number?: string; // Now optional as it's auto-generated
  release_id?: string; // Link to release
}

export interface Release {
  id: string;
  user_id: string;
  title: string;
  release_type: "Single" | "EP" | "Album";
  primary_artist: string;
  display_artist?: string;
  featured_artist?: string;
  artist_id?: string;
  label?: string;
  cat_number?: string;
  main_genre: string;
  sub_genre?: string;
  upc?: string;
  release_date: string;
  original_release_date?: string;
  countries?: string[];
  is_worldwide: boolean;
  platforms: string[];
  description?: string;
  copyrights?: string;
  release_notes?: string;
  artwork_url?: string;
  artwork_name?: string;
  retailers?: string[];
  exclusive_for?: string;
  allow_preorder_itunes: boolean;
  total_plays: number;
  total_revenue: number;
  track_count: number;
  status: "draft" | "pending" | "processing" | "live" | "failed" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface ReleaseWithTracks extends Release {
  tracks: Track[];
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: "pending" | "approved" | "completed" | "rejected" | "processing";
  trolley_recipient_id?: string;
  trolley_payout_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  track_id?: string;
  amount: number;
  platform: string;
  status: "completed" | "pending" | "failed";
  reference: string;
  created_at: string;
}

export interface Analytics {
  id: string;
  user_id: string;
  track_id?: string;
  date: string;
  plays: number;
  revenue: number;
  platform: string;
  country?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: "artist" | "label" | "contributor";
  bio?: string;
  website?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    youtube?: string;
  };
  total_earnings: number;
  available_balance: number;
  pending_payments: number;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}
