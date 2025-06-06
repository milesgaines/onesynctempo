import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "./button";
import { Slider } from "./slider";

interface SleekAudioPlayerProps {
  audioUrl?: string;
  title?: string;
  artist?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  playerId?: string;
}

const SleekAudioPlayer: React.FC<SleekAudioPlayerProps> = ({
  audioUrl,
  title = "Unknown Track",
  artist = "Unknown Artist",
  className = "",
  onPlay,
  onPause,
  autoPlay = false,
  playerId = "default",
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple play/pause handler
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      console.warn(`No audio element or URL available`);
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        // Pause all other players
        window.dispatchEvent(
          new CustomEvent("pause-all-players", { detail: { playerId } }),
        );

        setIsLoading(true);
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
        onPlay?.();
      }
    } catch (error: any) {
      console.error("Audio play error:", error);
      setIsLoading(false);
      setIsPlaying(false);

      if (error.name === "NotAllowedError") {
        setError("Click to enable audio playback");
      } else {
        setError("Audio playback failed");
      }
    }
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  // Handle metadata loaded
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
      setError(null);
    }
  };

  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPause?.();
  };

  // Handle audio error
  const handleError = () => {
    setError("Failed to load audio");
    setIsLoading(false);
    setIsPlaying(false);
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      const newMutedState = !isMuted;
      audio.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  // Setup audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsLoading(false);

    // Set initial properties
    audio.volume = volume;
    audio.muted = isMuted;

    // Add event listeners
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl, volume, isMuted]);

  // Handle global pause events
  useEffect(() => {
    const handleGlobalPause = (event: CustomEvent) => {
      if (
        event.detail?.playerId !== playerId &&
        isPlaying &&
        audioRef.current
      ) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener(
      "pause-all-players",
      handleGlobalPause as EventListener,
    );
    return () =>
      window.removeEventListener(
        "pause-all-players",
        handleGlobalPause as EventListener,
      );
  }, [isPlaying, playerId]);

  // Format time display
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioUrl) {
    return (
      <div
        className={`flex items-center gap-3 p-2 bg-muted/20 rounded-lg ${className}`}
      >
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <Play className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">
            No audio available
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center gap-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}
      >
        <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center">
          <Play className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-destructive truncate">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null);
              if (audioRef.current) {
                audioRef.current.load();
              }
            }}
            className="h-6 text-xs mt-1"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background border rounded-lg p-3 ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
      />

      {/* Main Player Row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayPause}
          disabled={isLoading}
          className="h-8 w-8 p-0 hover:bg-primary/10"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted-foreground truncate">{artist}</p>
            </div>
            <div className="text-xs text-muted-foreground ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full h-1"
              disabled={!duration}
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-6 w-6 p-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-16 h-1"
            disabled={!audioUrl}
          />
        </div>
      </div>
    </div>
  );
};

export { SleekAudioPlayer };
