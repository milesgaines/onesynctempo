import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleSpotifyCallback } from "@/lib/spotifyAuth";
import { Button } from "@/components/ui/button";
import { Music, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState(
    "Processing Spotify authentication...",
  );

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get code and state from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");

        if (error) {
          console.error("Spotify auth error:", error);
          setStatus("error");
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (!code || !state) {
          setStatus("error");
          setMessage("Missing authentication parameters");
          return;
        }

        // Process the callback
        const result = await handleSpotifyCallback(code, state);

        if (result.success) {
          setStatus("success");
          setMessage("Spotify account connected successfully!");

          // Redirect after a short delay
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(result.error || "Failed to connect Spotify account");
        }
      } catch (error) {
        console.error("Error in Spotify callback:", error);
        setStatus("error");
        setMessage("An unexpected error occurred");
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-mesh p-4">
      <div className="w-full max-w-md p-8 bg-card/90 backdrop-blur-md rounded-xl border border-border/40 shadow-glass">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Music className="h-12 w-12 text-primary mr-3 animate-pulse-slow" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">
            Spotify Connection
          </h1>

          <div className="mt-8 flex flex-col items-center justify-center">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">{message}</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium mb-2">{message}</p>
                <p className="text-muted-foreground mb-6">
                  Redirecting you back...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg font-medium mb-2">Connection Failed</p>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Button onClick={() => navigate("/")}>
                  Return to Dashboard
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
