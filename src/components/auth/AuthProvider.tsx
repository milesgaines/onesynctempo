import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { initiateSpotifyAuth } from "@/lib/spotifyAuth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: any;
  refreshUserProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: any }>;
  signInWithSpotify: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({
  children,
}: {
  children: React.ReactNode | ((props: AuthContextType) => React.ReactNode);
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  console.log(
    "🔐 [AUTH] AuthProvider render - User:",
    user?.email || "None",
    "Loading:",
    loading,
  );

  useEffect(() => {
    console.log("🔄 [AUTH] AuthProvider useEffect starting");
    let isMounted = true;

    // Get initial session
    const getInitialSession = async () => {
      console.log("📡 [AUTH] Getting initial session from Supabase");
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("❌ [AUTH] Error getting session:", error);
        } else {
          console.log(
            "✅ [AUTH] Initial session retrieved:",
            session ? "Session found" : "No session",
          );
        }
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          console.log(
            "🔄 [AUTH] State updated - User:",
            session?.user?.email || "None",
          );
        }
      } catch (error) {
        console.error("❌ [AUTH] Error in getInitialSession:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log("👂 [AUTH] Setting up auth state change listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔄 [AUTH] Auth state change:",
        event,
        session ? "Session exists" : "No session",
      );
      if (!isMounted) {
        console.log("⚠️ [AUTH] Component unmounted, ignoring auth change");
        return;
      }

      try {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log(
          "✅ [AUTH] Auth state updated - User:",
          session?.user?.email || "None",
        );

        // Create user profile if new user
        if (event === "SIGNED_UP" && session?.user) {
          console.log(
            "👤 [AUTH] Creating user profile for new user:",
            session.user.email,
          );
          try {
            const { error } = await supabase.from("user_profiles").insert([
              {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || "New User",
                role: "artist",
                total_earnings: 0,
                available_balance: 0,
                pending_payments: 0,
                onboarding_completed: false,
              },
            ]);

            if (error && error.code !== "23505") {
              console.error("❌ [AUTH] Error creating user profile:", error);
            } else {
              console.log("✅ [AUTH] User profile created successfully");
            }
          } catch (profileError) {
            console.error(
              "❌ [AUTH] Error creating user profile:",
              profileError,
            );
          }
        }

        // Load user profile when signed in
        if (
          session?.user &&
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
        ) {
          await refreshUserProfile();
        }
      } catch (error) {
        console.error("❌ [AUTH] Error in auth state change:", error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserProfile = async () => {
    if (!user) return;

    try {
      console.log("🔄 [AUTH] Refreshing user profile for:", user.email);
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("❌ [AUTH] Error loading profile:", error);
        // Create a default profile if none exists
        if (error.code === "PGRST116") {
          console.log("📝 [AUTH] Creating default profile for user");
          const { error: insertError } = await supabase
            .from("user_profiles")
            .insert([
              {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || "New User",
                role: "artist",
                total_earnings: 0,
                available_balance: 0,
                pending_payments: 0,
                onboarding_completed: false,
              },
            ]);

          if (insertError && insertError.code !== "23505") {
            console.error(
              "❌ [AUTH] Error creating default profile:",
              insertError,
            );
          } else {
            // Retry loading the profile
            const { data: newProfile } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("id", user.id)
              .single();
            if (newProfile) {
              setUserProfile(newProfile);
            }
          }
        }
        return;
      }

      if (profile) {
        console.log(
          "✅ [AUTH] Profile refreshed:",
          profile.name || profile.email,
        );
        // Ensure onboarding_completed field exists with default value
        const profileWithDefaults = {
          ...profile,
          onboarding_completed: profile.onboarding_completed ?? false,
        };
        setUserProfile(profileWithDefaults);
      }
    } catch (error) {
      console.error("❌ [AUTH] Error refreshing profile:", error);
    }
  };

  // Load initial profile when user is available
  useEffect(() => {
    if (user && !loading) {
      refreshUserProfile();
    }
  }, [user, loading]);

  const signIn = async (email: string, password: string) => {
    console.log("🔐 [AUTH] Attempting sign in for:", email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("❌ [AUTH] Sign in error:", error);
    } else {
      console.log("✅ [AUTH] Sign in successful");
    }
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Get the current URL to use as redirect URL
    const redirectTo = `${window.location.origin}/auth/callback`;

    console.log(
      "📝 [AUTH] Signing up with email:",
      email,
      "redirect URL:",
      redirectTo,
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: redirectTo,
      },
    });

    console.log("📝 [AUTH] Sign up response:", {
      user: data.user ? "User created" : "No user",
      session: data.session ? "Session created" : "No session",
      error: error ? error.message : "No error",
    });
    return { error };
  };

  const signInWithSpotify = async () => {
    console.log("🎵 [AUTH] Initiating Spotify auth");
    try {
      await initiateSpotifyAuth();
      console.log("✅ [AUTH] Spotify auth initiated");
    } catch (error) {
      console.error("❌ [AUTH] Spotify auth error:", error);
    }
  };

  const signOut = async () => {
    console.log("🚪 [AUTH] Signing out user");
    try {
      await supabase.auth.signOut();
      console.log("✅ [AUTH] Sign out successful");
    } catch (error) {
      console.error("❌ [AUTH] Sign out error:", error);
    }
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    refreshUserProfile,
    signIn,
    signUp,
    signInWithSpotify,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {typeof children === "function" ? children(value) : children}
    </AuthContext.Provider>
  );
}
