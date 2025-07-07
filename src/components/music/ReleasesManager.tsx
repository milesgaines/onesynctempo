import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Share2,
  Music,
  Calendar,
  Eye,
  TrendingUp,
  Plus,
  ChevronRight,
  Save,
  X,
  Info,
  Volume2,
  FileDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SleekAudioPlayer } from "@/components/ui/sleek-audio-player";

interface Release {
  id: string;
  title: string;
  primary_artist: string;
  display_artist?: string;
  featured_artist?: string;
  release_type: "Single" | "EP" | "Album";
  main_genre: string;
  sub_genre?: string;
  release_date: string;
  original_release_date?: string;
  status: "draft" | "pending" | "live" | "rejected";
  total_plays: number;
  total_revenue: number;
  track_count: number;
  artwork_url?: string;
  platforms: string[];
  tracks?: Track[];
  description?: string;
  label?: string;
  upc?: string;
  countries?: string[];
  is_worldwide?: boolean;
  copyrights?: string;
  release_notes?: string;
  retailers?: string[];
  exclusive_for?: string;
  allow_preorder_itunes?: boolean;
}

interface Track {
  id: string;
  title: string;
  track_number: number;
  duration?: string;
  plays: number;
  revenue: number;
  audio_file_url?: string;
}

interface ReleasesManagerProps {
  onRefresh?: () => void;
}

// Form validation schema - Matching MusicUploader exactly
const releaseFormSchema = z.object({
  // Basic fields matching MusicUploader
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  genre: z.string().min(1, "Genre is required"),
  releaseDate: z.string().min(1, "Release date is required"),
  description: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  isExplicit: z.boolean().optional(),
  releaseType: z.enum(["single", "release", "Album", "EP", "Single"]),

  // Release Info Fields - exact match to MusicUploader
  releaseTitle: z.string().min(1, "Release title is required"),
  primaryArtist: z.string().min(1, "Primary artist is required"),
  displayArtist: z.string().optional(),
  featuredArtist: z.string().optional(),
  label: z.string().optional(),
  catNumber: z.string().optional(),
  mainGenre: z.string().min(1, "Main genre is required"),
  subGenre: z.string().optional(),
  upc: z.string().optional(),
  countries: z.array(z.string()).optional(),
  isWorldwide: z.boolean().optional(),
  originalReleaseDate: z.string().optional(),
  copyrights: z.string().optional(),
  releaseNotes: z.string().optional(),
  retailers: z.array(z.string()).optional(),
  exclusiveFor: z.string().optional(),
  allowPreOrderITunes: z.boolean().optional(),

  // Track Info Fields - exact match to MusicUploader
  trackNumber: z.number().min(1),
  trackDisplayArtist: z.string().optional(),
  trackFeaturedArtist: z.string().optional(),
  trackTitle: z.string().min(1, "Track title is required"),
  mixVersion: z.string().optional(),
  remixer: z.string().optional(),
  publisher: z.string().optional(),
  contributors: z.array(z.string()).optional(),
  lyricist: z.string().optional(),
  composer: z.string().optional(),
  albumOnly: z.boolean().optional(),
});

type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

// Available platforms for distribution
const platforms = [
  { id: "spotify", name: "Spotify" },
  { id: "apple", name: "Apple Music" },
  { id: "youtube", name: "YouTube Music" },
  { id: "amazon", name: "Amazon Music" },
  { id: "tidal", name: "Tidal" },
  { id: "deezer", name: "Deezer" },
  { id: "pandora", name: "Pandora" },
  { id: "soundcloud", name: "SoundCloud" },
  { id: "bandcamp", name: "Bandcamp" },
  { id: "beatport", name: "Beatport" },
  { id: "traxsource", name: "Traxsource" },
  { id: "juno", name: "Juno Download" },
];

const ReleasesManager: React.FC<ReleasesManagerProps> = ({ onRefresh }) => {
  const { user } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "pending" | "draft">(
    "all",
  );
  const [expandedReleases, setExpandedReleases] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentlyPlayingTrack, setCurrentlyPlayingTrack] = useState<
    string | null
  >(null);

  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      // Basic fields matching MusicUploader
      title: "",
      artist: "",
      genre: "",
      releaseDate: new Date().toISOString().split("T")[0],
      description: "",
      platforms: [],
      isExplicit: false,
      releaseType: "Single",

      // Release Info Fields - exact match to MusicUploader
      releaseTitle: "",
      primaryArtist: "",
      displayArtist: "",
      featuredArtist: "",
      label: "",
      catNumber: "",
      mainGenre: "",
      subGenre: "",
      upc: "",
      countries: [],
      isWorldwide: false,
      originalReleaseDate: "",
      copyrights: "",
      releaseNotes: "",
      retailers: [],
      exclusiveFor: "",
      allowPreOrderITunes: false,

      // Track Info Fields - exact match to MusicUploader
      trackNumber: 1,
      trackDisplayArtist: "",
      trackFeaturedArtist: "",
      trackTitle: "",
      mixVersion: "",
      remixer: "",
      publisher: "",
      contributors: [],
      lyricist: "",
      composer: "",
      albumOnly: false,
    },
  });

  // Extract loadReleases function to make it reusable
  const loadReleases = async (showToasts = true) => {
    console.log(
      "🔄 [RELEASES] Starting loadReleases function with showToasts=",
      showToasts,
    );
    // Call the onRefresh callback if provided
    if (onRefresh) {
      onRefresh();
    }
    if (!user) return;

    setIsLoading(true);
    try {
      console.log("🔄 [RELEASES] Loading releases for user:", user.id);

      // Try to load both releases and tracks from Supabase
      const [releasesResult, tracksResult] = await Promise.all([
        supabase
          .from("releases")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("tracks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      console.log("📊 [RELEASES] Raw releases data:", releasesResult.data);
      console.log("📊 [RELEASES] Raw tracks data:", tracksResult.data);

      if (releasesResult.error) {
        console.error(
          "❌ [RELEASES] Error loading releases:",
          releasesResult.error,
        );
        if (showToasts) {
          toast.error("Failed to load releases from database.");
        }
      }

      if (tracksResult.error) {
        console.error(
          "❌ [RELEASES] Error loading tracks:",
          tracksResult.error,
        );
        if (showToasts) {
          toast.error("Failed to load tracks from database.");
        }
      }

      // Process releases data
      const releases = releasesResult.data || [];
      const tracks = tracksResult.data || [];

      // If we have releases, use them; otherwise create releases from tracks
      let processedReleases = [];

      if (releases.length > 0) {
        console.log(
          `✅ [RELEASES] Found ${releases.length} releases in database`,
        );

        processedReleases = releases.map((release) => {
          // Find tracks that belong to this release
          const releaseTracks = tracks.filter(
            (track) =>
              track.release_id === release.id ||
              (track.release_title === release.title &&
                track.primary_artist === release.primary_artist),
          );

          // Map platform IDs to display names for better UI
          const platformNames =
            release.platforms?.map((platformId) => {
              const platformMap = {
                spotify: "Spotify",
                apple: "Apple Music",
                youtube: "YouTube Music",
                amazon: "Amazon Music",
                tidal: "Tidal",
                deezer: "Deezer",
                pandora: "Pandora",
                soundcloud: "SoundCloud",
              };
              return platformMap[platformId] || platformId;
            }) || [];

          return {
            id: release.id,
            title: release.title || "Untitled Release",
            primary_artist: release.primary_artist || "Unknown Artist",
            display_artist: release.display_artist,
            featured_artist: release.featured_artist,
            release_type: release.release_type || "Single",
            main_genre: release.main_genre || "Other",
            sub_genre: release.sub_genre,
            release_date:
              release.release_date || new Date().toISOString().split("T")[0],
            original_release_date: release.original_release_date,
            status: release.status || "draft",
            total_plays: release.total_plays || 0,
            total_revenue: release.total_revenue || 0,
            track_count: release.track_count || releaseTracks.length,
            artwork_url:
              release.artwork_url ||
              "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
            platforms: platformNames,
            tracks: releaseTracks.map((track) => ({
              id: track.id,
              title: track.title,
              track_number: track.track_number || 1,
              duration: track.duration || "3:45",
              plays: track.plays || 0,
              revenue: track.revenue || 0,
              audio_file_url: track.audio_file_url,
            })),
            description: release.description,
            label: release.label,
            upc: release.upc,
            countries: release.countries,
            is_worldwide: release.is_worldwide,
            copyrights: release.copyrights,
            release_notes: release.release_notes,
            retailers: release.retailers,
            exclusive_for: release.exclusive_for,
            allow_preorder_itunes: release.allow_preorder_itunes,
          };
        });
      } else if (tracks.length > 0) {
        console.log(
          `✅ [RELEASES] No releases found, creating from ${tracks.length} tracks`,
        );

        // Group tracks by release info to create virtual releases
        const trackGroups = new Map();

        tracks.forEach((track) => {
          const releaseKey = `${track.release_title || track.title}_${track.primary_artist || track.artist}`;
          if (!trackGroups.has(releaseKey)) {
            trackGroups.set(releaseKey, []);
          }
          trackGroups.get(releaseKey).push(track);
        });

        processedReleases = Array.from(trackGroups.entries()).map(
          ([key, groupTracks]) => {
            const firstTrack = groupTracks[0];
            const totalPlays = groupTracks.reduce(
              (sum, track) => sum + (track.plays || 0),
              0,
            );
            const totalRevenue = groupTracks.reduce(
              (sum, track) => sum + (track.revenue || 0),
              0,
            );

            // Map platform IDs to display names
            const platformNames =
              firstTrack.platforms?.map((platformId) => {
                const platformMap = {
                  spotify: "Spotify",
                  apple: "Apple Music",
                  youtube: "YouTube Music",
                  amazon: "Amazon Music",
                  tidal: "Tidal",
                  deezer: "Deezer",
                  pandora: "Pandora",
                  soundcloud: "SoundCloud",
                };
                return platformMap[platformId] || platformId;
              }) || [];

            return {
              id: firstTrack.id, // Use first track ID as release ID
              title:
                firstTrack.release_title ||
                firstTrack.title ||
                "Untitled Release",
              primary_artist:
                firstTrack.primary_artist ||
                firstTrack.artist ||
                "Unknown Artist",
              display_artist: firstTrack.display_artist,
              featured_artist: firstTrack.featured_artist,
              release_type: firstTrack.release_type || "Single",
              main_genre: firstTrack.main_genre || firstTrack.genre || "Other",
              sub_genre: firstTrack.sub_genre,
              release_date:
                firstTrack.release_date ||
                new Date().toISOString().split("T")[0],
              original_release_date: firstTrack.original_release_date,
              status: firstTrack.status || "pending",
              total_plays: totalPlays,
              total_revenue: totalRevenue,
              track_count: groupTracks.length,
              artwork_url:
                firstTrack.artwork_url ||
                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
              platforms: platformNames,
              tracks: groupTracks.map((track) => ({
                id: track.id,
                title: track.title,
                track_number: track.track_number || 1,
                duration: track.duration || "3:45",
                plays: track.plays || 0,
                revenue: track.revenue || 0,
                audio_file_url: track.audio_file_url,
              })),
              description: firstTrack.description,
              label: firstTrack.label,
              upc: firstTrack.upc,
              countries: firstTrack.countries,
              is_worldwide: firstTrack.is_worldwide,
              copyrights: firstTrack.copyrights,
              release_notes: firstTrack.release_notes,
              retailers: firstTrack.retailers,
              exclusive_for: firstTrack.exclusive_for,
              allow_preorder_itunes: firstTrack.allow_preorder_itunes,
            };
          },
        );
      }

      console.log("✅ [RELEASES] Processed releases:", processedReleases);
      setReleases(processedReleases);

      if (showToasts) {
        if (processedReleases.length > 0) {
          toast.success(
            `Loaded ${processedReleases.length} releases from database`,
          );
        } else {
          toast("No releases found. Upload your first track!");
        }
      }
    } catch (error) {
      console.error("❌ [RELEASES] Error loading releases:", error);
      if (showToasts) {
        toast.error("Failed to load releases. Please try again.");
      }
      setReleases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Call loadReleases when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log(
        "🔄 [RELEASES] Initial loading of releases for user:",
        user.id,
      );
      // Initial load with toasts to show feedback
      loadReleases(true);
    }
  }, [user]);

  // Auto-refresh releases every 30 seconds to keep data fresh
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log("🔄 [RELEASES] Auto-refreshing releases");
      loadReleases(false); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Add a public method to force refresh releases
  // This can be called from parent components
  const refreshReleases = () => {
    if (user) {
      console.log("🔄 [RELEASES] Manual refresh of releases requested");
      const toastId = toast.loading("Refreshing your releases...");
      loadReleases(true).finally(() => {
        toast.dismiss(toastId);
      });
    }
  };

  // Make refreshReleases available globally for other components to call
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - Adding a custom method to window
      window.refreshReleases = refreshReleases;
    }
    return () => {
      if (typeof window !== "undefined") {
        // @ts-ignore - Cleanup
        delete window.refreshReleases;
      }
    };
  }, [user]);

  // Listen for track upload events to refresh the list
  useEffect(() => {
    const handleTrackUploaded = (event: CustomEvent) => {
      console.log(
        "🔔 [RELEASES] Received track-uploaded event, refreshing tracks",
        event.detail,
      );
      if (user && event.detail?.track) {
        // Immediately add the new track to the UI for instant feedback
        const newTrack = event.detail.track;
        console.log(
          "🔔 [RELEASES] Adding new track to UI immediately:",
          newTrack,
        );

        // Process the track to match the expected format
        const processedTrack = {
          id: newTrack.id,
          title: newTrack.title || "Untitled Track",
          artist: newTrack.artist || "Unknown Artist",
          album: newTrack.album || newTrack.title,
          genre: newTrack.genre || "Other",
          duration: newTrack.duration || "3:45",
          release_date:
            newTrack.release_date || new Date().toISOString().split("T")[0],
          status: newTrack.status || "pending",
          plays: newTrack.plays || 0,
          revenue: newTrack.revenue || 0,
          artwork_url:
            newTrack.artwork_url ||
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
          audio_url:
            newTrack.audio_file_url ||
            (newTrack.audio_file_urls && newTrack.audio_file_urls.length > 0
              ? newTrack.audio_file_urls[0]
              : undefined),
          platforms: Array.isArray(newTrack.platforms)
            ? newTrack.platforms.map((platformId) => {
                const platformMap = {
                  spotify: "Spotify",
                  apple: "Apple Music",
                  youtube: "YouTube Music",
                  amazon: "Amazon Music",
                  tidal: "Tidal",
                  deezer: "Deezer",
                  pandora: "Pandora",
                  soundcloud: "SoundCloud",
                };
                return platformMap[platformId] || platformId;
              })
            : [],
        };

        // Create a temporary release from the track data to show immediately
        const tempRelease: Release = {
          id: newTrack.id,
          title: newTrack.title || "Untitled Release",
          primary_artist: newTrack.artist || "Unknown Artist",
          display_artist: newTrack.display_artist,
          featured_artist: newTrack.featured_artist,
          release_type: newTrack.release_type || "Single",
          main_genre: newTrack.genre || "Other",
          sub_genre: newTrack.sub_genre,
          release_date:
            newTrack.release_date || new Date().toISOString().split("T")[0],
          status: "pending",
          total_plays: 0,
          total_revenue: 0,
          track_count: 1,
          artwork_url:
            newTrack.artwork_url ||
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
          platforms: Array.isArray(newTrack.platforms)
            ? newTrack.platforms.map((platformId) => {
                const platformMap = {
                  spotify: "Spotify",
                  apple: "Apple Music",
                  youtube: "YouTube Music",
                  amazon: "Amazon Music",
                  tidal: "Tidal",
                  deezer: "Deezer",
                  pandora: "Pandora",
                  soundcloud: "SoundCloud",
                };
                return platformMap[platformId] || platformId;
              })
            : [],
          tracks: [
            {
              id: newTrack.id,
              title: newTrack.title || "Untitled Track",
              track_number: 1,
              duration: newTrack.duration || "3:45",
              plays: 0,
              revenue: 0,
              audio_file_url:
                newTrack.audio_file_url ||
                (newTrack.audio_file_urls && newTrack.audio_file_urls.length > 0
                  ? newTrack.audio_file_urls[0]
                  : undefined),
            },
          ],
        };

        // Add the new release to the beginning of the releases array for immediate feedback
        setReleases((prevReleases) => [tempRelease, ...prevReleases]);
        console.log(
          "📝 [RELEASES] Added temporary release to UI:",
          tempRelease,
        );

        const toastId = toast.loading(
          "New track uploaded! Syncing with database...",
        );

        // Also refresh from database to ensure consistency
        setTimeout(() => {
          loadReleases(false).finally(() => {
            toast.dismiss(toastId);
            toast.success("Track uploaded and synced successfully!");
          });
        }, 2000); // Increased delay to ensure database consistency
      }
    };

    const handleRefreshTracks = () => {
      console.log("🔄 [RELEASES] Received refresh-tracks event");
      if (user) {
        // Add a small delay to ensure the database has time to update
        setTimeout(() => {
          loadReleases(true); // Show toast for manual refresh
        }, 2000); // Increased delay for better database consistency
      }
    };

    window.addEventListener(
      "track-uploaded",
      handleTrackUploaded as EventListener,
    );
    window.addEventListener("refresh-tracks", handleRefreshTracks);

    return () => {
      window.removeEventListener(
        "track-uploaded",
        handleTrackUploaded as EventListener,
      );
      window.removeEventListener("refresh-tracks", handleRefreshTracks);
    };
  }, [user]);

  const getStatusColor = (status: Release["status"]) => {
    switch (status) {
      case "live":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "draft":
        return "bg-gray-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: Release["status"]) => {
    switch (status) {
      case "live":
        return "Live";
      case "pending":
        return "Pending";
      case "draft":
        return "Draft";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const filteredReleases = releases.filter(
    (release) => filter === "all" || release.status === filter,
  );

  const totalPlays = releases.reduce(
    (sum, release) => sum + release.total_plays,
    0,
  );
  const totalRevenue = releases.reduce(
    (sum, release) => sum + release.total_revenue,
    0,
  );
  const liveReleases = releases.filter(
    (release) => release.status === "live",
  ).length;
  const totalTracks = releases.reduce(
    (sum, release) => sum + release.track_count,
    0,
  );

  const handleTrackPlay = useCallback(
    (trackId: string) => {
      console.log(`🎵 [RELEASES] Track play requested:`, trackId);

      // Stop all other players
      if (currentlyPlayingTrack && currentlyPlayingTrack !== trackId) {
        console.log(
          `🔇 [RELEASES] Stopping currently playing track:`,
          currentlyPlayingTrack,
        );
      }

      setCurrentlyPlayingTrack(trackId);
      console.log(`✅ [RELEASES] Set currently playing track:`, trackId);
    },
    [currentlyPlayingTrack],
  );

  const handleTrackPause = useCallback(
    (trackId: string) => {
      console.log(`⏸️ [RELEASES] Track pause requested:`, trackId);

      if (currentlyPlayingTrack === trackId) {
        setCurrentlyPlayingTrack(null);
        console.log(`✅ [RELEASES] Cleared currently playing track`);
      }
    },
    [currentlyPlayingTrack],
  );

  const handleReleaseClick = (release: Release) => {
    console.log("🔍 [RELEASES] Opening release details:", release.id);
    setSelectedRelease(release);
    setIsDetailDialogOpen(true);
    setIsEditMode(false);

    // Reset form with comprehensive release data - matching MusicUploader structure exactly
    form.reset({
      // Basic fields matching MusicUploader
      title: release.title || "",
      artist: release.primary_artist || "",
      genre: release.main_genre || "",
      releaseDate:
        release.release_date || new Date().toISOString().split("T")[0],
      description: release.description || "",
      platforms: Array.isArray(release.platforms) ? release.platforms : [],
      isExplicit: false, // This would need to be stored in release data
      releaseType: release.release_type || "Single",

      // Release Info Fields - exact match to MusicUploader
      releaseTitle: release.title || "",
      primaryArtist: release.primary_artist || "",
      displayArtist: release.display_artist || "",
      featuredArtist: release.featured_artist || "",
      label: release.label || "",
      catNumber: "", // Auto-generated field
      mainGenre: release.main_genre || "",
      subGenre: release.sub_genre || "",
      upc: release.upc || "",
      countries: Array.isArray(release.countries) ? release.countries : [],
      isWorldwide: release.is_worldwide || false,
      originalReleaseDate: release.original_release_date || "",
      copyrights: release.copyrights || "",
      releaseNotes: release.release_notes || "",
      retailers: Array.isArray(release.retailers) ? release.retailers : [],
      exclusiveFor: release.exclusive_for || "",
      allowPreOrderITunes: release.allow_preorder_itunes || false,

      // Track Info Fields - exact match to MusicUploader
      trackNumber: 1, // Default for single track
      trackDisplayArtist: "",
      trackFeaturedArtist: release.featured_artist || "",
      trackTitle: release.title || "",
      mixVersion: "",
      remixer: "",
      publisher: "",
      contributors: [],
      lyricist: "",
      composer: "",
      albumOnly: false,
    });
  };

  const handleEditRelease = (releaseId: string) => {
    console.log("✏️ [RELEASES] Editing release:", releaseId);
    const release = releases.find((r) => r.id === releaseId);
    if (release) {
      setSelectedRelease(release);
      setIsDetailDialogOpen(true);
      setIsEditMode(true);

      // Reset form with comprehensive release data - matching MusicUploader structure exactly
      form.reset({
        // Basic fields matching MusicUploader
        title: release.title || "",
        artist: release.primary_artist || "",
        genre: release.main_genre || "",
        releaseDate:
          release.release_date || new Date().toISOString().split("T")[0],
        description: release.description || "",
        platforms: Array.isArray(release.platforms) ? release.platforms : [],
        isExplicit: false, // This would need to be stored in release data
        releaseType: release.release_type || "Single",

        // Release Info Fields - exact match to MusicUploader
        releaseTitle: release.title || "",
        primaryArtist: release.primary_artist || "",
        displayArtist: release.display_artist || "",
        featuredArtist: release.featured_artist || "",
        label: release.label || "",
        catNumber: "", // Auto-generated field
        mainGenre: release.main_genre || "",
        subGenre: release.sub_genre || "",
        upc: release.upc || "",
        countries: Array.isArray(release.countries) ? release.countries : [],
        isWorldwide: release.is_worldwide || false,
        originalReleaseDate: release.original_release_date || "",
        copyrights: release.copyrights || "",
        releaseNotes: release.release_notes || "",
        retailers: Array.isArray(release.retailers) ? release.retailers : [],
        exclusiveFor: release.exclusive_for || "",
        allowPreOrderITunes: release.allow_preorder_itunes || false,

        // Track Info Fields - exact match to MusicUploader
        trackNumber: 1, // Default for single track
        trackDisplayArtist: "",
        trackFeaturedArtist: release.featured_artist || "",
        trackTitle: release.title || "",
        mixVersion: "",
        remixer: "",
        publisher: "",
        contributors: [],
        lyricist: "",
        composer: "",
        albumOnly: false,
      });
    } else {
      console.error("❌ [RELEASES] Release not found:", releaseId);
      toast.error("Release not found");
    }
  };

  const handleSaveRelease = async (values: ReleaseFormValues) => {
    if (!selectedRelease || !user) return;

    setIsUpdating(true);
    try {
      console.log(
        `💾 [RELEASES] Updating release with comprehensive metadata: ${selectedRelease.id}`,
      );

      // Map form values to database schema - matching MusicUploader structure
      const updateData = {
        // Basic fields
        title: values.releaseTitle || values.title,
        primary_artist: values.primaryArtist || values.artist,
        display_artist: values.displayArtist,
        featured_artist: values.featuredArtist,
        release_type: values.releaseType,
        main_genre: values.mainGenre || values.genre,
        sub_genre: values.subGenre,
        release_date: values.releaseDate,
        original_release_date: values.originalReleaseDate,
        description: values.description,
        label: values.label,
        upc: values.upc,
        countries: values.countries,
        is_worldwide: values.isWorldwide,
        copyrights: values.copyrights,
        release_notes: values.releaseNotes,
        retailers: values.retailers,
        exclusive_for: values.exclusiveFor,
        allow_preorder_itunes: values.allowPreOrderITunes,
        platforms: values.platforms,
      };

      // Use the Edge Function for comprehensive metadata update
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-update-release-metadata",
        {
          body: {
            releaseId: selectedRelease.id,
            metadata: updateData,
          },
        },
      );

      if (error) {
        console.error(
          "❌ [RELEASES] Error updating release via Edge Function:",
          error,
        );
        throw error;
      }

      if (!data?.success) {
        console.error("❌ [RELEASES] Edge Function returned error:", data);
        throw new Error(data?.error || "Unknown error occurred");
      }

      // Update the local state with comprehensive data
      setReleases((prev) =>
        prev.map((release) =>
          release.id === selectedRelease.id
            ? {
                ...release,
                title: updateData.title,
                primary_artist: updateData.primary_artist,
                display_artist: updateData.display_artist,
                featured_artist: updateData.featured_artist,
                release_type: updateData.release_type as Release["release_type"],
                main_genre: updateData.main_genre,
                sub_genre: updateData.sub_genre,
                release_date: updateData.release_date,
                original_release_date: updateData.original_release_date,
                description: updateData.description,
                label: updateData.label,
                upc: updateData.upc,
                countries: updateData.countries,
                is_worldwide: updateData.is_worldwide,
                copyrights: updateData.copyrights,
                release_notes: updateData.release_notes,
                retailers: updateData.retailers,
                exclusive_for: updateData.exclusive_for,
                allow_preorder_itunes: updateData.allow_preorder_itunes,
                platforms: updateData.platforms,
              }
            : release,
        ),
      );

      toast.success("Release metadata updated successfully with all fields!");
      setIsEditMode(false);

      // Refresh releases to ensure consistency
      setTimeout(() => {
        loadReleases(false);
      }, 1000);

      console.log(
        `✅ [RELEASES] Release updated with comprehensive metadata: ${selectedRelease.id}`,
      );
    } catch (error) {
      console.error("❌ [RELEASES] Error updating release:", error);
      toast.error(
        `Failed to update release: ${error.message || "Please try again."}`,
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const closeDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedRelease(null);
    setIsEditMode(false);
    form.reset();
  };

  const handleShareRelease = (release: Release) => {
    const shareText = `🎵 Check out "${release.title}" by ${release.primary_artist}\n\n🎧 Genre: ${release.main_genre}\n📅 Released: ${new Date(release.release_date).toLocaleDateString()}\n▶️ ${release.total_plays.toLocaleString()} plays\n🎵 ${release.track_count} track${release.track_count !== 1 ? "s" : ""}\n\n#OneSync #MusicDistribution`;

    if (navigator.share) {
      navigator
        .share({
          title: `${release.title} - ${release.primary_artist}`,
          text: shareText,
          url: window.location.href,
        })
        .then(() => toast.success("Release shared successfully!"))
        .catch(() => {
          // Fallback to clipboard
          navigator.clipboard.writeText(
            shareText + `\n\n${window.location.href}`,
          );
          toast.success("Share text copied to clipboard!");
        });
    } else {
      navigator.clipboard.writeText(shareText + `\n\n${window.location.href}`);
      toast.success("Share text copied to clipboard!");
    }
  };

  const handleDownloadRelease = (release: Release) => {
    console.log(
      `📥 [RELEASES] Attempting to download release: ${release.title}`,
    );

    // Generate release info as downloadable text file
    const releaseInfo = `Release Information\n==================\n\nTitle: ${release.title}\nArtist: ${release.primary_artist}\nType: ${release.release_type}\nGenre: ${release.main_genre}\nRelease Date: ${release.release_date}\nTotal Plays: ${release.total_plays.toLocaleString()}\nTotal Revenue: ${release.total_revenue.toFixed(2)}\nTrack Count: ${release.track_count}\nStatus: ${release.status}\nPlatforms: ${release.platforms.join(", ")}\n\nTracks:\n${release.tracks?.map((track, index) => `${index + 1}. ${track.title} (${track.plays} plays)`).join("\n") || "No tracks available"}\n\nGenerated by OneSync\nDate: ${new Date().toISOString()}`;

    const blob = new Blob([releaseInfo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${release.title.replace(/[^a-zA-Z0-9]/g, "_")}_release_info.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Release information downloaded");
    console.log(`✅ [RELEASES] Release info downloaded for: ${release.title}`);
  };

  const handleDeleteRelease = async (releaseId: string) => {
    console.log(`🗑️ [RELEASES] Attempting to delete release: ${releaseId}`);
    if (
      window.confirm(
        "Are you sure you want to delete this release? This will also delete all associated tracks. This action cannot be undone.",
      )
    ) {
      try {
        console.log(`🗑️ [RELEASES] Deleting release: ${releaseId}`);

        // First, get the release details to find associated files
        const { data: releaseData, error: fetchError } = await supabase
          .from("releases")
          .select("*, tracks(*)")
          .eq("id", releaseId)
          .single();

        if (fetchError) {
          console.error(
            "❌ [RELEASES] Error fetching release details:",
            fetchError,
          );
          throw fetchError;
        }

        // Delete the release record from the database (this will cascade delete tracks)
        const { error: deleteError } = await supabase
          .from("releases")
          .delete()
          .eq("id", releaseId);

        if (deleteError) {
          console.error(
            "❌ [RELEASES] Error deleting release record:",
            deleteError,
          );
          throw deleteError;
        }

        // Try to delete associated files from storage
        try {
          if (releaseData && releaseData.tracks) {
            const userFolder = user?.id.substring(0, 8);

            // Delete files for each track
            for (const track of releaseData.tracks) {
              const folderPath = `${userFolder}/${track.id}`;

              console.log(
                `🗑️ [RELEASES] Attempting to delete files from: ${folderPath}`,
              );

              // Delete audio files
              const { error: audioDeleteError } = await supabase.storage
                .from("tracks")
                .remove([`${folderPath}/audio`]);

              if (audioDeleteError) {
                console.warn(
                  "⚠️ [RELEASES] Error deleting audio files:",
                  audioDeleteError,
                );
              }
            }

            // Delete artwork files
            const artworkFolderPath = `${userFolder}/${releaseId}`;
            const { error: artworkDeleteError } = await supabase.storage
              .from("artwork")
              .remove([`${artworkFolderPath}/artwork`]);

            if (artworkDeleteError) {
              console.warn(
                "⚠️ [RELEASES] Error deleting artwork files:",
                artworkDeleteError,
              );
            }
          }
        } catch (storageError) {
          console.warn(
            "⚠️ [RELEASES] Error cleaning up storage files:",
            storageError,
          );
          // Non-critical error, continue with success message
        }

        // Update the UI
        setReleases(releases.filter((release) => release.id !== releaseId));
        toast.success("Release deleted successfully!");
        console.log(`✅ [RELEASES] Release deleted: ${releaseId}`);

        // Refresh the release list to ensure UI is in sync with database
        setTimeout(() => {
          console.log("🔄 [RELEASES] Refreshing release list after deletion");
          loadReleases(true); // Show feedback after deletion
        }, 2000); // Increased delay for database consistency
      } catch (error) {
        console.error("❌ [RELEASES] Error deleting release:", error);
        toast.error("Failed to delete release. Please try again.");
      }
    }
  };

  const handleDownloadCatalogCSV = () => {
    console.log(
      `📥 [RELEASES] Generating catalog CSV for ${releases.length} releases`,
    );

    try {
      // Define CSV headers
      const headers = [
        "Release Title",
        "Primary Artist",
        "Display Artist",
        "Featured Artist",
        "Release Type",
        "Main Genre",
        "Sub Genre",
        "Release Date",
        "Original Release Date",
        "Status",
        "Total Plays",
        "Total Revenue",
        "Track Count",
        "Label",
        "UPC",
        "Copyright",
        "Platforms",
        "Countries",
        "Is Worldwide",
        "Description",
        "Release Notes",
      ];

      // Convert releases data to CSV rows
      const csvRows = releases.map((release) => [
        `"${(release.title || "").replace(/"/g, '""')}"`,
        `"${(release.primary_artist || "").replace(/"/g, '""')}"`,
        `"${(release.display_artist || "").replace(/"/g, '""')}"`,
        `"${(release.featured_artist || "").replace(/"/g, '""')}"`,
        `"${(release.release_type || "").replace(/"/g, '""')}"`,
        `"${(release.main_genre || "").replace(/"/g, '""')}"`,
        `"${(release.sub_genre || "").replace(/"/g, '""')}"`,
        `"${release.release_date || ""}"`,
        `"${release.original_release_date || ""}"`,
        `"${(release.status || "").replace(/"/g, '""')}"`,
        release.total_plays || 0,
        release.total_revenue || 0,
        release.track_count || 0,
        `"${(release.label || "").replace(/"/g, '""')}"`,
        `"${(release.upc || "").replace(/"/g, '""')}"`,
        `"${(release.copyrights || "").replace(/"/g, '""')}"`,
        `"${(release.platforms || []).join(", ").replace(/"/g, '""')}"`,
        `"${(release.countries || []).join(", ").replace(/"/g, '""')}"`,
        release.is_worldwide ? "Yes" : "No",
        `"${(release.description || "").replace(/"/g, '""')}"`,
        `"${(release.release_notes || "").replace(/"/g, '""')}"`,
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `music_catalog_${currentDate}.csv`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `Catalog exported successfully! Downloaded ${releases.length} releases.`,
      );
      console.log(`✅ [RELEASES] CSV catalog downloaded: ${filename}`);
    } catch (error) {
      console.error("❌ [RELEASES] Error generating CSV:", error);
      toast.error("Failed to generate CSV file. Please try again.");
    }
  };

  const toggleReleaseExpansion = (releaseId: string) => {
    setExpandedReleases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(releaseId)) {
        newSet.delete(releaseId);
      } else {
        newSet.add(releaseId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-background min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            My Releases
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your music catalog and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadCatalogCSV}
            disabled={releases.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
            <Button
              variant="glow"
            className="animate-pulse-slow"
            onClick={() => {
              // Dispatch a custom event to trigger the upload dialog
              console.log("🎵 [RELEASES] Upload New Track button clicked");

              // Try multiple methods to open the upload dialog
              const methods = [
                // Method 1: Look for upload trigger button
                () => {
                  const uploadTrigger = document.querySelector(
                    "[data-upload-trigger]",
                  );
                  if (uploadTrigger) {
                    console.log(
                      "✅ [RELEASES] Found upload trigger, clicking...",
                    );
                    (uploadTrigger as HTMLElement).click();
                    return true;
                  }
                  return false;
                },

                // Method 2: Dispatch custom event
                () => {
                  console.log(
                    "📡 [RELEASES] Dispatching open-upload-dialog event",
                  );
                  window.dispatchEvent(new CustomEvent("open-upload-dialog"));
                  return true;
                },

                // Method 3: Navigate to upload route
                () => {
                  console.log("🔄 [RELEASES] Navigating to upload route");
                  window.location.href = "/upload";
                  return true;
                },
              ];

              // Try each method until one succeeds
              for (const method of methods) {
                try {
                  if (method()) {
                    break;
                  }
                } catch (error) {
                  console.warn("⚠️ [RELEASES] Method failed:", error);
                }
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload New Track
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Releases
            </CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {releases.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {liveReleases} live releases
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Plays
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {totalPlays.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From streaming & sales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Tracks
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {totalTracks}
            </div>
            <p className="text-xs text-muted-foreground">Across all releases</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "live", "pending", "draft"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status === "all" ? "All Releases" : getStatusText(status)}
            <Badge variant="secondary" className="ml-2">
              {status === "all"
                ? releases.length
                : releases.filter((r) => r.status === status).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Tracks Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Release Catalog
          </CardTitle>
          <CardDescription>
            View and manage all your music releases (albums, EPs, and singles)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReleases.length === 0 ? (
            <div className="text-center py-12 bg-background">
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                No releases found in database
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all"
                  ? "You haven't uploaded any releases to the database yet."
                  : `No ${filter} releases found in the database.`}
              </p>
              <div className="space-y-4">
                  <Button
                    variant="glow"
                  onClick={() => {
                    // Dispatch a custom event to trigger the upload dialog
                    console.log(
                      "🎵 [RELEASES] Upload First Release button clicked",
                    );

                    // Try multiple methods to open the upload dialog
                    const methods = [
                      // Method 1: Look for upload trigger button
                      () => {
                        const uploadTrigger = document.querySelector(
                          "[data-upload-trigger]",
                        );
                        if (uploadTrigger) {
                          console.log(
                            "✅ [RELEASES] Found upload trigger, clicking...",
                          );
                          (uploadTrigger as HTMLElement).click();
                          return true;
                        }
                        return false;
                      },

                      // Method 2: Dispatch custom event
                      () => {
                        console.log(
                          "📡 [RELEASES] Dispatching open-upload-dialog event",
                        );
                        window.dispatchEvent(
                          new CustomEvent("open-upload-dialog"),
                        );
                        return true;
                      },

                      // Method 3: Navigate to upload route
                      () => {
                        console.log("🔄 [RELEASES] Navigating to upload route");
                        window.location.href = "/upload";
                        return true;
                      },
                    ];

                    // Try each method until one succeeds
                    for (const method of methods) {
                      try {
                        if (method()) {
                          break;
                        }
                      } catch (error) {
                        console.warn("⚠️ [RELEASES] Method failed:", error);
                      }
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Release
                </Button>
                <div>
                  <Button
                    variant="outline"
                    onClick={refreshReleases}
                    className="mt-2"
                  >
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Refresh Database
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReleases.map((release) => (
                <Card
                  key={release.id}
                  className="overflow-hidden bg-card border-border"
                >
                  <CardContent className="p-0">
                    <div
                      className="flex items-center p-4 hover:bg-muted/50 transition-colors bg-card cursor-pointer"
                      onClick={() => handleReleaseClick(release)}
                    >
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage
                          src={release.artwork_url}
                          alt={release.title}
                        />
                        <AvatarFallback>
                          <Music className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate text-card-foreground">
                            {release.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {release.release_type}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(release.status)} text-white text-xs`}
                          >
                            {getStatusText(release.status)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {release.primary_artist} • {release.main_genre} •{" "}
                          {new Date(release.release_date).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {release.track_count} track
                            {release.track_count !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {release.total_plays.toLocaleString()} plays
                          </span>
                          <span className="font-medium text-card-foreground">
                            ${release.total_revenue.toFixed(2)}
                          </span>
                        </div>

                        {/* Sleek Audio Player */}
                        {release.tracks?.[0]?.audio_file_url && (
                          <div
                            className="mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SleekAudioPlayer
                              audioUrl={release.tracks[0].audio_file_url}
                              title={release.title}
                              artist={release.primary_artist}
                              playerId={`release-${release.id}`}
                              onPlay={() =>
                                handleTrackPlay(`release-${release.id}`)
                              }
                              onPause={() =>
                                handleTrackPause(`release-${release.id}`)
                              }
                              className="bg-muted/10 border-0"
                              key={`release-${release.id}-${release.tracks[0].audio_file_url}`}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {release.tracks && release.tracks.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReleaseExpansion(release.id)}
                            className="text-xs"
                          >
                            {expandedReleases.has(release.id) ? "Hide" : "Show"}{" "}
                            Tracks
                            <ChevronRight
                              className={`ml-1 h-3 w-3 transition-transform ${
                                expandedReleases.has(release.id)
                                  ? "rotate-90"
                                  : ""
                              }`}
                            />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReleaseClick(release);
                          }}
                          className="mr-2"
                        >
                          <Info className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRelease(release.id);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Release
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareRelease(release);
                              }}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadRelease(release);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Info
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRelease(release.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Release
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Expandable track list */}
                    {expandedReleases.has(release.id) &&
                      release.tracks &&
                      release.tracks.length > 0 && (
                        <div className="border-t bg-muted/20">
                          <div className="p-4">
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                              Tracks in this release:
                            </h4>
                            <div className="space-y-2">
                              {release.tracks
                                .sort(
                                  (a, b) =>
                                    (a.track_number || 0) -
                                    (b.track_number || 0),
                                )
                                .map((track) => (
                                  <div
                                    key={track.id}
                                    className="flex items-center justify-between py-2 px-3 bg-background rounded-md"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-muted-foreground w-6">
                                        {track.track_number || "—"}
                                      </span>
                                      <span className="font-medium text-sm">
                                        {track.title}
                                      </span>
                                      {track.duration && (
                                        <span className="text-xs text-muted-foreground">
                                          {track.duration}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>
                                        {track.plays.toLocaleString()} plays
                                      </span>
                                      <span>${track.revenue.toFixed(2)}</span>
                                      {track.audio_file_url && (
                                        <div className="w-32">
                                          <SleekAudioPlayer
                                            audioUrl={track.audio_file_url}
                                            title={track.title}
                                            artist={release.primary_artist}
                                            playerId={`track-${track.id}`}
                                            onPlay={() =>
                                              handleTrackPlay(
                                                `track-${track.id}`,
                                              )
                                            }
                                            onPause={() =>
                                              handleTrackPause(
                                                `track-${track.id}`,
                                              )
                                            }
                                            className="bg-transparent border-0 p-1 scale-75"
                                            key={`track-${track.id}-${track.audio_file_url}`}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Release Detail/Edit Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={closeDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Release
                </>
              ) : (
                <>
                  <Info className="h-5 w-5" />
                  Release Details
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edit the release information below. Changes will be saved to the database."
                : "View detailed information about this release. Click Edit to make changes."}
            </DialogDescription>
          </DialogHeader>

          {selectedRelease && (
            <div className="space-y-6">
              {!isEditMode ? (
                // View Mode
                <div className="space-y-6">
                  {/* Release Header */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={selectedRelease.artwork_url}
                        alt={selectedRelease.title}
                      />
                      <AvatarFallback>
                        <Music className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">
                        {selectedRelease.title}
                      </h2>
                      <p className="text-lg text-muted-foreground mb-2">
                        by {selectedRelease.primary_artist}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {selectedRelease.release_type}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(selectedRelease.status)} text-white`}
                        >
                          {getStatusText(selectedRelease.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedRelease.main_genre}
                        {selectedRelease.sub_genre &&
                          ` • ${selectedRelease.sub_genre}`}
                      </p>
                    </div>
                  </div>

                  {/* Audio Player Section */}
                  {selectedRelease.tracks?.[0]?.audio_file_url && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          Audio Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SleekAudioPlayer
                          audioUrl={selectedRelease.tracks[0].audio_file_url}
                          title={selectedRelease.title}
                          artist={selectedRelease.primary_artist}
                          playerId={`dialog-${selectedRelease.id}`}
                          onPlay={() =>
                            handleTrackPlay(`dialog-${selectedRelease.id}`)
                          }
                          onPause={() =>
                            handleTrackPause(`dialog-${selectedRelease.id}`)
                          }
                          key={`dialog-${selectedRelease.id}-${selectedRelease.tracks[0].audio_file_url}`}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Release Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Release Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Release Date
                          </label>
                          <p className="text-sm">
                            {new Date(
                              selectedRelease.release_date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedRelease.label && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Label
                            </label>
                            <p className="text-sm">{selectedRelease.label}</p>
                          </div>
                        )}
                        {selectedRelease.copyrights && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Copyright
                            </label>
                            <p className="text-sm">
                              {selectedRelease.copyrights}
                            </p>
                          </div>
                        )}
                        {selectedRelease.description && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Description
                            </label>
                            <p className="text-sm">
                              {selectedRelease.description}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Performance Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Total Plays
                          </span>
                          <span className="text-sm font-medium">
                            {selectedRelease.total_plays.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Total Revenue
                          </span>
                          <span className="text-sm font-medium">
                            ${selectedRelease.total_revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Track Count
                          </span>
                          <span className="text-sm font-medium">
                            {selectedRelease.track_count}
                          </span>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Platforms
                          </label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRelease.platforms.map((platform) => (
                              <Badge
                                key={platform}
                                variant="outline"
                                className="text-xs"
                              >
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tracks List */}
                  {selectedRelease.tracks &&
                    selectedRelease.tracks.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Tracks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedRelease.tracks
                              .sort(
                                (a, b) =>
                                  (a.track_number || 0) - (b.track_number || 0),
                              )
                              .map((track) => (
                                <div
                                  key={track.id}
                                  className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-md"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-6">
                                      {track.track_number || "—"}
                                    </span>
                                    <span className="font-medium text-sm">
                                      {track.title}
                                    </span>
                                    {track.duration && (
                                      <span className="text-xs text-muted-foreground">
                                        {track.duration}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>
                                      {track.plays.toLocaleString()} plays
                                    </span>
                                    <span>${track.revenue.toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </div>
              ) : (
                // Edit Mode - Matching MusicUploader structure exactly
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSaveRelease)}
                    className="space-y-6"
                  >
                    <Tabs defaultValue="release" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="release">Release Info</TabsTrigger>
                        <TabsTrigger value="track">Track Info</TabsTrigger>
                        <TabsTrigger value="distribution">
                          Distribution
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="release" className="space-y-6 pt-4">
                        <h3 className="text-lg font-medium mb-4">
                          Release Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="releaseTitle">
                              Release Title *
                            </Label>
                            <Input
                              id="releaseTitle"
                              value={form.watch("releaseTitle") || ""}
                              onChange={(e) =>
                                form.setValue("releaseTitle", e.target.value)
                              }
                              placeholder="Enter release title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="displayArtist">
                              Display Artist (Optional)
                            </Label>
                            <Input
                              id="displayArtist"
                              value={form.watch("displayArtist") || ""}
                              onChange={(e) =>
                                form.setValue("displayArtist", e.target.value)
                              }
                              placeholder="How artist should be displayed"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="label">Label (Optional)</Label>
                            <Input
                              id="label"
                              value={form.watch("label") || ""}
                              onChange={(e) =>
                                form.setValue("label", e.target.value)
                              }
                              placeholder="Enter label name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="originalReleaseDate">
                              Original Release Date (Optional)
                            </Label>
                            <Input
                              id="originalReleaseDate"
                              type="date"
                              value={form.watch("originalReleaseDate") || ""}
                              onChange={(e) =>
                                form.setValue(
                                  "originalReleaseDate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="catNumber">
                              Catalog Number (Auto-generated)
                            </Label>
                            <Input
                              id="catNumber"
                              value={form.watch("catNumber") || ""}
                              placeholder="Will be auto-generated (CAT + 5 digits)"
                              disabled={true}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="upc">UPC (Optional)</Label>
                            <Input
                              id="upc"
                              value={form.watch("upc") || ""}
                              onChange={(e) =>
                                form.setValue("upc", e.target.value)
                              }
                              placeholder="Enter UPC"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="genre">Genre *</Label>
                            <Select
                              value={form.watch("mainGenre") || ""}
                              onValueChange={(value) => {
                                form.setValue("mainGenre", value);
                                form.setValue("genre", value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select genre" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pop">Pop</SelectItem>
                                <SelectItem value="rock">Rock</SelectItem>
                                <SelectItem value="hiphop-rap">
                                  Hip Hop/Rap
                                </SelectItem>
                                <SelectItem value="rnb">R&B</SelectItem>
                                <SelectItem value="electronic">
                                  Electronic
                                </SelectItem>
                                <SelectItem value="jazz">Jazz</SelectItem>
                                <SelectItem value="classical">
                                  Classical
                                </SelectItem>
                                <SelectItem value="country">Country</SelectItem>
                                <SelectItem value="folk">Folk</SelectItem>
                                <SelectItem value="indie">Indie</SelectItem>
                                <SelectItem value="alternative">
                                  Alternative
                                </SelectItem>
                                <SelectItem value="metal">Metal</SelectItem>
                                <SelectItem value="reggae">Reggae</SelectItem>
                                <SelectItem value="latin">Latin</SelectItem>
                                <SelectItem value="world">
                                  World Music
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subGenre">Sub Genre *</Label>
                            <Select
                              value={form.watch("subGenre") || ""}
                              onValueChange={(value) =>
                                form.setValue("subGenre", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select sub genre" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pop">Pop</SelectItem>
                                <SelectItem value="rock">Rock</SelectItem>
                                <SelectItem value="hiphop">Hip Hop</SelectItem>
                                <SelectItem value="rap">Rap</SelectItem>
                                <SelectItem value="rnb">R&B</SelectItem>
                                <SelectItem value="electronic">
                                  Electronic
                                </SelectItem>
                                <SelectItem value="jazz">Jazz</SelectItem>
                                <SelectItem value="classical">
                                  Classical
                                </SelectItem>
                                <SelectItem value="country">Country</SelectItem>
                                <SelectItem value="folk">Folk</SelectItem>
                                <SelectItem value="indie">Indie</SelectItem>
                                <SelectItem value="alternative">
                                  Alternative
                                </SelectItem>
                                <SelectItem value="metal">Metal</SelectItem>
                                <SelectItem value="reggae">Reggae</SelectItem>
                                <SelectItem value="latin">Latin</SelectItem>
                                <SelectItem value="world">
                                  World Music
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="releaseType">Release Type</Label>
                            <Select
                              value={form.watch("releaseType") || ""}
                              onValueChange={(value) =>
                                form.setValue("releaseType", value as any)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select release type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="EP">EP</SelectItem>
                                <SelectItem value="Album">Album</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="releaseDate">Release Date *</Label>
                            <Input
                              id="releaseDate"
                              type="date"
                              value={form.watch("releaseDate") || ""}
                              onChange={(e) =>
                                form.setValue("releaseDate", e.target.value)
                              }
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="retailers">
                              Retailers (Optional)
                            </Label>
                            <Select
                              value=""
                              onValueChange={(value) => {
                                console.log(
                                  "🛒 [RELEASES] Adding retailer:",
                                  value,
                                );
                                const currentRetailers =
                                  form.watch("retailers") || [];
                                if (!currentRetailers.includes(value)) {
                                  const updatedRetailers = [
                                    ...currentRetailers,
                                    value,
                                  ];
                                  form.setValue("retailers", updatedRetailers);
                                  console.log(
                                    "✅ [RELEASES] Updated retailers:",
                                    updatedRetailers,
                                  );
                                }
                              }}
                            >
                              <SelectTrigger className="transition-all hover:border-primary/50 focus:border-primary">
                                <SelectValue placeholder="Add retailers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="itunes"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  iTunes
                                </SelectItem>
                                <SelectItem
                                  value="amazon"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  Amazon Music
                                </SelectItem>
                                <SelectItem
                                  value="google-play"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  Google Play
                                </SelectItem>
                                <SelectItem
                                  value="beatport"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  Beatport
                                </SelectItem>
                                <SelectItem
                                  value="traxsource"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  Traxsource
                                </SelectItem>
                                <SelectItem
                                  value="juno"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  Juno Download
                                </SelectItem>
                                <SelectItem
                                  value="bandcamp"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  Bandcamp
                                </SelectItem>
                                <SelectItem
                                  value="7digital"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  7digital
                                </SelectItem>
                                <SelectItem
                                  value="qobuz"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  Qobuz
                                </SelectItem>
                                <SelectItem
                                  value="hdtracks"
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  HDtracks
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {form.watch("retailers") &&
                              form.watch("retailers")!.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {form.watch("retailers")!.map((retailer) => (
                                    <Badge
                                      key={retailer}
                                      variant="secondary"
                                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80 transition-all hover:scale-105"
                                    >
                                      {retailer.charAt(0).toUpperCase() +
                                        retailer.slice(1).replace("-", " ")}
                                      <X
                                        className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log(
                                            "🗑️ [RELEASES] Removing retailer:",
                                            retailer,
                                          );
                                          const currentRetailers =
                                            form.watch("retailers") || [];
                                          const updatedRetailers =
                                            currentRetailers.filter(
                                              (r) => r !== retailer,
                                            );
                                          form.setValue(
                                            "retailers",
                                            updatedRetailers,
                                          );
                                          console.log(
                                            "✅ [RELEASES] Updated retailers:",
                                            updatedRetailers,
                                          );
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                              )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="exclusiveFor">
                              Exclusive For (Optional)
                            </Label>
                            <Input
                              id="exclusiveFor"
                              value={form.watch("exclusiveFor") || ""}
                              onChange={(e) =>
                                form.setValue("exclusiveFor", e.target.value)
                              }
                              placeholder="Enter exclusivity period (e.g., '2 weeks')"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowPreOrderITunes"
                              checked={
                                form.watch("allowPreOrderITunes") || false
                              }
                              onCheckedChange={(checked) =>
                                form.setValue(
                                  "allowPreOrderITunes",
                                  checked === true,
                                )
                              }
                            />
                            <Label
                              htmlFor="allowPreOrderITunes"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Allow Pre-Order on iTunes
                            </Label>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="copyrights">
                              Copyright Information (Optional)
                            </Label>
                            <Input
                              id="copyrights"
                              value={form.watch("copyrights") || ""}
                              onChange={(e) =>
                                form.setValue("copyrights", e.target.value)
                              }
                              placeholder="© 2024 Artist Name. All rights reserved."
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="track" className="space-y-6 pt-4">
                        <h3 className="text-lg font-medium mb-4">
                          Track Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="trackNumber">Track Number *</Label>
                            <Input
                              id="trackNumber"
                              type="number"
                              min="1"
                              value={form.watch("trackNumber") || 1}
                              onChange={(e) =>
                                form.setValue(
                                  "trackNumber",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="primaryArtist">
                              Primary Artist *
                            </Label>
                            <Input
                              id="primaryArtist"
                              value={form.watch("primaryArtist") || ""}
                              onChange={(e) => {
                                form.setValue("primaryArtist", e.target.value);
                                form.setValue("artist", e.target.value);
                              }}
                              placeholder="Enter primary artist name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="trackDisplayArtist">
                              Track Display Artist (Optional)
                            </Label>
                            <Input
                              id="trackDisplayArtist"
                              value={form.watch("trackDisplayArtist") || ""}
                              onChange={(e) =>
                                form.setValue(
                                  "trackDisplayArtist",
                                  e.target.value,
                                )
                              }
                              placeholder="How artist should be displayed"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="featuredArtist">
                              Featured Artist (Optional)
                            </Label>
                            <Input
                              id="featuredArtist"
                              value={form.watch("featuredArtist") || ""}
                              onChange={(e) => {
                                form.setValue("featuredArtist", e.target.value);
                                form.setValue(
                                  "trackFeaturedArtist",
                                  e.target.value,
                                );
                              }}
                              placeholder="Enter featured artist name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="trackTitle">Track Title *</Label>
                            <Input
                              id="trackTitle"
                              value={form.watch("trackTitle") || ""}
                              onChange={(e) => {
                                form.setValue("trackTitle", e.target.value);
                                form.setValue("title", e.target.value);
                              }}
                              placeholder="Enter track title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mixVersion">
                              Mix Version (Optional)
                            </Label>
                            <Input
                              id="mixVersion"
                              value={form.watch("mixVersion") || ""}
                              onChange={(e) =>
                                form.setValue("mixVersion", e.target.value)
                              }
                              placeholder="Enter mix version"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="remixer">Remixer (Optional)</Label>
                            <Input
                              id="remixer"
                              value={form.watch("remixer") || ""}
                              onChange={(e) =>
                                form.setValue("remixer", e.target.value)
                              }
                              placeholder="Enter remixer name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="publisher">
                              Publisher (Optional)
                            </Label>
                            <Input
                              id="publisher"
                              value={form.watch("publisher") || ""}
                              onChange={(e) =>
                                form.setValue("publisher", e.target.value)
                              }
                              placeholder="Enter publisher name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="lyricist">Lyricist *</Label>
                            <Input
                              id="lyricist"
                              value={form.watch("lyricist") || ""}
                              onChange={(e) =>
                                form.setValue("lyricist", e.target.value)
                              }
                              placeholder="Enter lyricist name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="composer">Composer *</Label>
                            <Input
                              id="composer"
                              value={form.watch("composer") || ""}
                              onChange={(e) =>
                                form.setValue("composer", e.target.value)
                              }
                              placeholder="Enter composer name"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">
                            Description (Optional)
                          </Label>
                          <Textarea
                            id="description"
                            value={form.watch("description") || ""}
                            onChange={(e) =>
                              form.setValue("description", e.target.value)
                            }
                            placeholder="Enter track description, story, or lyrics..."
                            rows={4}
                            maxLength={500}
                          />
                          <p className="text-xs text-muted-foreground">
                            {(form.watch("description") || "").length}/500
                            characters
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="explicit"
                              checked={form.watch("isExplicit") || false}
                              onCheckedChange={(checked) =>
                                form.setValue("isExplicit", checked === true)
                              }
                            />
                            <Label
                              htmlFor="explicit"
                              className="text-sm font-medium cursor-pointer"
                            >
                              This track contains explicit content
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="albumOnly"
                              checked={form.watch("albumOnly") || false}
                              onCheckedChange={(checked) =>
                                form.setValue("albumOnly", checked === true)
                              }
                            />
                            <Label
                              htmlFor="albumOnly"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Album Only
                            </Label>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="distribution"
                        className="space-y-6 pt-4"
                      >
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            Select Distribution Platforms
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Choose where you want your music to be available.
                          </p>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-platforms"
                              checked={platforms.every((p) =>
                                (form.watch("platforms") || []).includes(p.id),
                              )}
                              onCheckedChange={(checked) => {
                                const allPlatformIds = platforms.map(
                                  (p) => p.id,
                                );
                                if (checked) {
                                  form.setValue("platforms", allPlatformIds);
                                } else {
                                  form.setValue("platforms", []);
                                }
                              }}
                            />
                            <Label
                              htmlFor="select-all-platforms"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Select All Platforms ({platforms.length})
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(form.watch("platforms") || []).length} of{" "}
                            {platforms.length} selected
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-96 overflow-y-auto">
                          {platforms.map((platform) => {
                            const isSelected = (
                              form.watch("platforms") || []
                            ).includes(platform.id);
                            return (
                              <div
                                key={platform.id}
                                className={`
                                  p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm hover:scale-105
                                  ${
                                    isSelected
                                      ? "border-primary bg-primary/5 shadow-md"
                                      : "border-border hover:border-primary/50"
                                  }
                                `}
                                onClick={(e) => {
                                  e.preventDefault();
                                  console.log(
                                    "🎵 [RELEASES] Toggling platform:",
                                    platform.id,
                                  );
                                  const currentPlatforms =
                                    form.watch("platforms") || [];
                                  let updatedPlatforms;
                                  if (isSelected) {
                                    updatedPlatforms = currentPlatforms.filter(
                                      (p) => p !== platform.id,
                                    );
                                  } else {
                                    updatedPlatforms = [
                                      ...currentPlatforms,
                                      platform.id,
                                    ];
                                  }
                                  form.setValue("platforms", updatedPlatforms);
                                  console.log(
                                    "✅ [RELEASES] Updated platforms:",
                                    updatedPlatforms,
                                  );
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div>
                                      <h4 className="font-medium">
                                        {platform.name}
                                      </h4>
                                    </div>
                                  </div>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => {}} // Handled by parent div click
                                    className="pointer-events-none"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>
                            Selected platforms:{" "}
                            {(form.watch("platforms") || []).length}
                          </p>
                          <p>
                            Your music will be distributed to all selected
                            platforms within 24-48 hours.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </form>
                </Form>
              )}
            </div>
          )}

          <DialogFooter>
            {!isEditMode ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Release
                </Button>
                <Button variant="outline" onClick={closeDetailDialog}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  disabled={isUpdating}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(handleSaveRelease)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReleasesManager;
