import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { checkSpotifyConnection, disconnectSpotify } from "@/lib/spotifyAuth";

interface SpotifyIntegrationProps {
  onStatusChange?: (connected: boolean) => void;
}

const SpotifyIntegration = ({ onStatusChange }: SpotifyIntegrationProps) => {
  const { signInWithSpotify } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        const connected = await checkSpotifyConnection();
        setIsConnected(connected);
        if (onStatusChange) onStatusChange(connected);
      } catch (error) {
        console.error("Error checking Spotify connection:", error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [onStatusChange]);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const success = await disconnectSpotify();
      if (success) {
        setIsConnected(false);
        if (onStatusChange) onStatusChange(false);
      }
    } catch (error) {
      console.error("Error disconnecting Spotify:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Music className="h-6 w-6 text-[#1DB954]" />
          <CardTitle>Spotify Integration</CardTitle>
        </div>
        <CardDescription>
          Connect your Spotify account to import playlists and analyze your
          music
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isConnected ? (
          <div className="bg-[#1DB954]/10 p-4 rounded-lg border border-[#1DB954]/30">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-[#1DB954] mr-2" />
              <div>
                <h3 className="font-medium">Connected to Spotify</h3>
                <p className="text-sm text-muted-foreground">
                  Your Spotify account is connected and ready to use
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-muted-foreground mr-2" />
              <div>
                <h3 className="font-medium">Not Connected</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Spotify account to access additional features
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button
            variant="outline"
            className="w-full border-[#1DB954]/30 hover:bg-[#1DB954]/10"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>Disconnect Spotify</>
            )}
          </Button>
        ) : (
          <Button
            className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            onClick={signInWithSpotify}
          >
            <Music className="mr-2 h-4 w-4" />
            Connect Spotify
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SpotifyIntegration;
