import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        console.error("Auth callback error:", error, errorDescription);
        navigate("/?error=" + encodeURIComponent(errorDescription || error));
        return;
      }

      if (code) {
        try {
          // Exchange code for session
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Error exchanging code for session:", error);
            navigate("/?error=" + encodeURIComponent(error.message));
            return;
          }

          console.log("Successfully authenticated");
          navigate("/");
        } catch (err) {
          console.error("Unexpected error during auth callback:", err);
          navigate("/?error=Unexpected+error+during+authentication");
        }
      } else {
        // No code found, redirect to home
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
