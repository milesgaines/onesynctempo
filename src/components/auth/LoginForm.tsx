import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "./AuthProvider";
import { Loader2, Music } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Separator } from "@/components/ui/separator";

const LoginForm: React.FC = () => {
  const { signIn, signUp, signInWithSpotify } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Handle email confirmation redirect
  useEffect(() => {
    // Check if we have a hash in the URL (from email confirmation)
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);

      console.log("🔗 [LOGIN] Current URL hash:", hash);
      console.log(
        "🔗 [LOGIN] Current URL search params:",
        window.location.search,
      );

      // Check for any auth-related parameters
      const hasAuthParams =
        (hash &&
          (hash.includes("access_token") || hash.includes("type=signup"))) ||
        searchParams.has("access_token") ||
        searchParams.has("error") ||
        searchParams.has("type");

      if (hasAuthParams) {
        setLoading(true);
        setMessage("Processing authentication...");

        // Try to get tokens from hash first (old format)
        let accessToken = hash
          ? new URLSearchParams(hash.substring(1)).get("access_token")
          : null;
        let refreshToken = hash
          ? new URLSearchParams(hash.substring(1)).get("refresh_token")
          : null;

        // If not in hash, try query params (new format)
        if (!accessToken) {
          accessToken = searchParams.get("access_token");
          refreshToken = searchParams.get("refresh_token");
        }

        // Check for error in URL
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          console.error("Auth error from URL:", errorParam, errorDescription);
          setError(`Authentication error: ${errorDescription || errorParam}`);
          setLoading(false);
          return;
        }

        if (accessToken) {
          console.log("Found access token, setting session");
          // Exchange the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Error setting session:", error);
            setError("Error confirming email: " + error.message);
          } else {
            console.log("Session set successfully:", data);
            setMessage("Email confirmed successfully! You are now logged in.");
            // Clear the hash/query from the URL without reloading the page
            window.history.replaceState(
              null,
              document.title,
              window.location.pathname,
            );
          }
        } else {
          // If we don't have tokens but have confirmation parameters, try to recover the session
          console.log("No access token found, trying to get session");
          const { data, error } = await supabase.auth.getSession();
          console.log("Get session result:", { data, error });

          if (error) {
            console.error("Error getting session:", error);
            setError("Error confirming email: " + error.message);
          } else if (data.session) {
            setMessage("Email confirmed successfully! You are now logged in.");
            window.history.replaceState(
              null,
              document.title,
              window.location.pathname,
            );
          } else {
            setError(
              "Unable to confirm email. Please try logging in directly.",
            );
          }
        }
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔐 [LOGIN] Sign in attempt for:", email);
    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);
    if (error) {
      console.error("❌ [LOGIN] Sign in failed:", error.message);
      setError(error.message);
    } else {
      console.log("✅ [LOGIN] Sign in successful");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 [LOGIN] Sign up attempt for:", email, "name:", name);
    setLoading(true);
    setError("");

    const { error } = await signUp(email, password, name);
    if (error) {
      console.error("❌ [LOGIN] Sign up failed:", error.message);
      setError(error.message);
    } else {
      console.log("✅ [LOGIN] Sign up successful, check email");
      setError("Check your email for the confirmation link!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-mesh p-4 animate-fade-in">
      <Card className="w-full max-w-md backdrop-blur-sm bg-background/95 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/onesync-logo-white.png"
              alt="OneSync"
              className="h-8 w-auto"
            />
          </div>
          <CardTitle>Welcome to OneSync</CardTitle>
          <CardDescription>Your music distribution platform</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full relative overflow-hidden group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <img
                        src="/spinning-loader.png"
                        alt="Loading"
                        className="mr-2 h-4 w-4 animate-spin brightness-150"
                      />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 -translate-x-full animate-shimmer group-hover:animate-shimmer"></span>
                      Sign In
                    </>
                  )}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-card px-2 text-xs text-muted-foreground">
                      OR
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border-[#1DB954]/50"
                  onClick={() => signInWithSpotify()}
                  disabled={loading}
                >
                  <Music className="mr-2 h-4 w-4 text-[#1DB954]" />
                  Continue with Spotify
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full relative overflow-hidden group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <img
                        src="/spinning-loader.png"
                        alt="Loading"
                        className="mr-2 h-4 w-4 animate-spin brightness-150"
                      />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 -translate-x-full animate-shimmer group-hover:animate-shimmer"></span>
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
