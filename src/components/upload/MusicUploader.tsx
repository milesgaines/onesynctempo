import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "@/components/ui/confetti";
import {
  Check,
  ChevronRight,
  Cloud,
  FileAudio,
  Image,
  Info,
  Loader2,
  Music,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AudioVisualizer } from "@/components/ui/audio-visualizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useAuth } from "../auth/AuthProvider";
import ArtistManager, { Artist } from "../artists/ArtistManager";
import toast, { Toaster } from "react-hot-toast";

interface MusicUploaderProps {
  onComplete?: (data: UploadData) => void;
  initialData?: Partial<UploadData>;
}

interface UploadData {
  // Basic fields (existing)
  title: string;
  artist: string;
  genre: string;
  releaseDate: string;
  description: string;
  audioFiles: File[];
  artwork: File | null;
  platforms: string[];
  isExplicit: boolean;
  releaseType: "single" | "release" | "Album" | "EP" | "Single";
  trackOrder?: number[];
  trackId?: string;
  audioUrls?: string[];
  artworkUrl?: string;
  timestamp?: number;

  // Release Info Fields
  releaseTitle: string;
  primaryArtist: string;
  displayArtist?: string;
  featuredArtist?: string;
  label?: string;
  catNumber: string;
  mainGenre: string;
  subGenre: string;
  upc?: string;
  countries?: string[];
  isWorldwide?: boolean;
  originalReleaseDate?: string;
  copyrights?: string;
  releaseNotes?: string;
  retailers?: string[];
  exclusiveFor?: string;
  allowPreOrderITunes?: boolean;

  // Track Info Fields
  trackNumber: number;
  trackDisplayArtist?: string;
  trackFeaturedArtist?: string;
  trackTitle: string;
  mixVersion?: string;
  remixer?: string;
  publisher?: string;
  contributors?: string[];
  lyricist: string;
  composer: string;
  albumOnly?: boolean;
}

interface UploadError {
  message: string;
  field?: string;
}

const MusicUploader: React.FC<MusicUploaderProps> = ({
  onComplete = () => {},
  initialData = {},
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [formData, setFormData] = useState<UploadData>({
    // Basic fields (existing)
    title: initialData.title || "",
    artist: initialData.artist || "",
    genre: initialData.genre || "",
    releaseDate:
      initialData.releaseDate || new Date().toISOString().split("T")[0],
    description: initialData.description || "",
    audioFiles: initialData.audioFiles || [],
    artwork: initialData.artwork || null,
    platforms: initialData.platforms || ["spotify", "apple", "youtube"],
    isExplicit: initialData.isExplicit || false,
    releaseType: initialData.releaseType || "single",

    // Release Info Fields
    releaseTitle: initialData.releaseTitle || "",
    primaryArtist: initialData.primaryArtist || "",
    displayArtist: initialData.displayArtist || "",
    featuredArtist: initialData.featuredArtist || "",
    label: initialData.label || "",
    catNumber: initialData.catNumber || "", // Will be auto-generated
    mainGenre: initialData.mainGenre || "",
    subGenre: initialData.subGenre || "",
    upc: initialData.upc || "",
    countries: initialData.countries || [],
    isWorldwide: initialData.isWorldwide || false,
    originalReleaseDate: initialData.originalReleaseDate || "",
    copyrights: initialData.copyrights || "",
    releaseNotes: initialData.releaseNotes || "",
    retailers: initialData.retailers || [],
    exclusiveFor: initialData.exclusiveFor || "",
    allowPreOrderITunes: initialData.allowPreOrderITunes || false,

    // Track Info Fields
    trackNumber: initialData.trackNumber || 1,
    trackDisplayArtist: initialData.trackDisplayArtist || "",
    trackFeaturedArtist: initialData.trackFeaturedArtist || "",
    trackTitle: initialData.trackTitle || "",
    mixVersion: initialData.mixVersion || "",
    remixer: initialData.remixer || "",
    publisher: initialData.publisher || "",
    contributors: initialData.contributors || [],
    lyricist: initialData.lyricist || "",
    composer: initialData.composer || "",
    albumOnly: initialData.albumOnly || false,
  });

  const [artworkPreview, setArtworkPreview] = useState<string>("");
  const [audioFileName, setAudioFileName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedPrimaryArtist, setSelectedPrimaryArtist] =
    useState<Artist | null>(null);
  const [selectedFeaturedArtist, setSelectedFeaturedArtist] =
    useState<Artist | null>(null);
  const [showPrimaryArtistManager, setShowPrimaryArtistManager] =
    useState<boolean>(false);
  const [showFeaturedArtistManager, setShowFeaturedArtistManager] =
    useState<boolean>(false);

  const steps = [
    { title: "Audio Upload", icon: <FileAudio className="h-5 w-5" /> },
    { title: "Release Info", icon: <Music className="h-5 w-5" /> },
    { title: "Track Info", icon: <Music className="h-5 w-5" /> },
    { title: "Artwork", icon: <Image className="h-5 w-5" /> },
    { title: "Distribution", icon: <Cloud className="h-5 w-5" /> },
    { title: "Review", icon: <Info className="h-5 w-5" /> },
  ];

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
    { id: "audiomack", name: "Audiomack" },
    { id: "napster", name: "Napster" },
    { id: "iheartradio", name: "iHeartRadio" },
    { id: "shazam", name: "Shazam" },
    { id: "anghami", name: "Anghami" },
    { id: "boomplay", name: "Boomplay" },
    { id: "jiosaavn", name: "JioSaavn" },
    { id: "gaana", name: "Gaana" },
    { id: "wynk", name: "Wynk Music" },
    { id: "hungama", name: "Hungama Music" },
    { id: "resso", name: "Resso" },
    { id: "yandex", name: "Yandex Music" },
    { id: "vk", name: "VK Music" },
    { id: "qq", name: "QQ Music" },
    { id: "netease", name: "NetEase Cloud Music" },
    { id: "kugou", name: "Kugou Music" },
    { id: "kuwo", name: "Kuwo Music" },
    { id: "joox", name: "JOOX" },
    { id: "kkbox", name: "KKBOX" },
    { id: "melon", name: "Melon" },
    { id: "bugs", name: "Bugs Music" },
    { id: "genie", name: "Genie Music" },
    { id: "flo", name: "FLO" },
    { id: "line", name: "LINE Music" },
    { id: "recochoku", name: "Recochoku" },
    { id: "mora", name: "mora" },
    { id: "7digital", name: "7digital" },
    { id: "beatport", name: "Beatport" },
    { id: "traxsource", name: "Traxsource" },
    { id: "juno", name: "Juno Download" },
    { id: "qobuz", name: "Qobuz" },
    { id: "hdtracks", name: "HDtracks" },
    { id: "presto", name: "Presto Music" },
    { id: "naxos", name: "Naxos Music Library" },
    { id: "classicsonline", name: "Classics Online HD" },
    { id: "primephonic", name: "Primephonic" },
  ];

  const clearErrors = () => setErrors([]);

  const addError = (message: string, field?: string) => {
    setErrors((prev) => [...prev, { message, field }]);
  };

  const validateFile = (file: File, type: "audio" | "image"): boolean => {
    if (!file) return false;
    if (type === "audio") {
      // Accept more audio formats to improve user experience
      const validTypes = [
        "audio/wav",
        "audio/mpeg",
        "audio/mp3",
        "audio/x-wav",
      ];
      const validExtensions = [".wav", ".mp3"];
      const maxSize = 50 * 1024 * 1024; // 50MB

      const hasValidType =
        validTypes.includes(file.type) ||
        validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (!hasValidType) {
        addError("Please upload a WAV or MP3 file", "audioFile");
        return false;
      }

      if (file.size > maxSize) {
        addError("Audio file must be smaller than 50MB", "audioFile");
        return false;
      }
    } else if (type === "image") {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      const hasValidType =
        validTypes.includes(file.type) ||
        validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (!hasValidType) {
        addError(
          "Please upload a valid image file (JPG, PNG or WebP)",
          "artwork",
        );
        return false;
      }

      if (file.size > maxSize) {
        addError("Image file must be smaller than 10MB", "artwork");
        return false;
      }
    }

    return true;
  };

  const handleAudioFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      clearErrors();
      if (e.target.files) {
        const files = Array.from(e.target.files);
        if (formData.releaseType === "single" && files.length > 1) {
          toast.error("Only one file can be uploaded for singles");
          return;
        }

        const validFiles = files.filter((file) => validateFile(file, "audio"));
        if (validFiles.length > 0) {
          setFormData((prev) => ({
            ...prev,
            audioFiles:
              formData.releaseType === "single" ? [validFiles[0]] : validFiles,
          }));
          setAudioFileName(validFiles.map((f) => f.name).join(", "));
          toast.success(
            `${validFiles.length} WAV file(s) uploaded successfully!`,
          );
        }
      }
    },
    [formData.releaseType],
  );

  const handleArtworkChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      clearErrors();
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (validateFile(file, "image")) {
          setFormData((prev) => ({ ...prev, artwork: file }));
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setArtworkPreview(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
          toast.success("Artwork uploaded successfully!");
        }
      }
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      clearErrors();

      if (!user) {
        toast.error("Please log in to upload files");
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter(
        (file) =>
          file.type === "audio/wav" ||
          file.type === "audio/mpeg" ||
          file.type === "audio/mp3" ||
          file.type === "audio/x-wav" ||
          file.name.toLowerCase().endsWith(".wav") ||
          file.name.toLowerCase().endsWith(".mp3"),
      );

      if (audioFiles.length === 0) {
        toast.error("Please upload WAV or MP3 files");
        return;
      }

      if (formData.releaseType === "single" && audioFiles.length > 1) {
        toast.error("Only one file can be uploaded for singles");
        return;
      }

      const validFiles = audioFiles.filter((file) =>
        validateFile(file, "audio"),
      );
      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          audioFiles:
            formData.releaseType === "single" ? [validFiles[0]] : validFiles,
        }));
        setAudioFileName(validFiles.map((f) => f.name).join(", "));
        toast.success(
          `${validFiles.length} audio file(s) uploaded successfully!`,
        );
      }
    },
    [formData.releaseType, user],
  );

  const handlePlatformToggle = useCallback((platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }, []);

  const handleSelectAll = useCallback(() => {
    const allPlatformIds = platforms.map((p) => p.id);
    const isAllSelected = allPlatformIds.every((id) =>
      formData.platforms.includes(id),
    );

    setFormData((prev) => ({
      ...prev,
      platforms: isAllSelected ? [] : allPlatformIds,
    }));
  }, [formData.platforms, platforms]);

  const uploadFileToSupabase = async (
    file: File,
    bucket: string,
    path: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> => {
    if (!user) {
      throw new Error("User must be logged in to upload files");
    }

    console.log(`📤 [UPLOAD] Starting upload to ${bucket}/${path}`);

    try {
      // Upload the file directly - buckets should already exist in Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          onUploadProgress: (progress) => {
            const progressPercentage = Math.round(
              (progress.loaded / file.size) * 100,
            );
            if (onProgress) onProgress(progressPercentage);
          },
        });

      if (error) {
        console.error("❌ [UPLOAD] Upload failed:", error);
        // Enhanced error handling for common Supabase storage errors
        if (error.message?.includes("duplicate key")) {
          console.log(
            "🔄 [UPLOAD] File already exists, attempting to overwrite...",
          );
          // File already exists, try to remove and re-upload
          await supabase.storage.from(bucket).remove([path]);
          const retryResult = await supabase.storage
            .from(bucket)
            .upload(path, file, {
              cacheControl: "3600",
              upsert: true,
              onUploadProgress: (progress) => {
                const progressPercentage = Math.round(
                  (progress.loaded / file.size) * 100,
                );
                if (onProgress) onProgress(progressPercentage);
              },
            });

          if (retryResult.error) {
            throw retryResult.error;
          }

          if (!retryResult.data) {
            throw new Error("No data returned from retry upload");
          }

          const { data: retryUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(retryResult.data.path);

          console.log(
            `✅ [UPLOAD] File uploaded successfully after retry: ${retryUrlData.publicUrl}`,
          );
          return retryUrlData.publicUrl;
        }
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from upload");
      }

      // Get public URL with error handling
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to generate public URL for uploaded file");
      }

      console.log(
        `✅ [UPLOAD] File uploaded successfully: ${urlData.publicUrl}`,
      );
      return urlData.publicUrl;
    } catch (error) {
      console.error("❌ [UPLOAD] Upload error:", error);
      // Enhanced error messages for better debugging
      if (error instanceof Error) {
        if (error.message.includes("413")) {
          throw new Error(
            "File too large. Please reduce file size and try again.",
          );
        } else if (error.message.includes("401")) {
          throw new Error(
            "Authentication failed. Please log out and log back in.",
          );
        } else if (error.message.includes("403")) {
          throw new Error(
            "Permission denied. Please check your account permissions.",
          );
        } else if (error.message.includes("network")) {
          throw new Error(
            "Network error. Please check your internet connection.",
          );
        }
      }
      throw error;
    }
  };

  const validateStep = (step: number): boolean => {
    clearErrors();

    switch (step) {
      case 0:
        if (formData.audioFiles.length === 0) {
          addError("Please upload audio file(s)", "audioFile");
          return false;
        }
        if (
          formData.releaseType === "single" &&
          formData.audioFiles.length > 1
        ) {
          addError("Only one file can be uploaded for singles", "audioFile");
          return false;
        }
        return true;

      case 1: // Release Info
        let isReleaseValid = true;
        if (!formData.releaseTitle.trim()) {
          addError("Release title is required", "releaseTitle");
          isReleaseValid = false;
        }

        // Catalog number is now auto-generated, no validation needed
        if (!formData.mainGenre.trim()) {
          addError("Main genre is required", "mainGenre");
          isReleaseValid = false;
        }
        if (!formData.subGenre.trim()) {
          addError("Sub genre is required", "subGenre");
          isReleaseValid = false;
        }
        if (!formData.releaseDate) {
          addError("Release date is required", "releaseDate");
          isReleaseValid = false;
        }
        if (
          !formData.isWorldwide &&
          (!formData.countries || formData.countries.length === 0)
        ) {
          addError(
            "Please select at least one country or choose Worldwide",
            "countries",
          );
          isReleaseValid = false;
        }
        return isReleaseValid;

      case 2: // Track Info
        let isTrackValid = true;
        if (!formData.trackTitle.trim()) {
          addError("Track title is required", "trackTitle");
          isTrackValid = false;
        }
        if (!selectedPrimaryArtist || !selectedPrimaryArtist.id) {
          addError("Primary artist must be selected", "primaryArtist");
          isTrackValid = false;
        }
        if (!formData.lyricist.trim()) {
          addError("Lyricist is required", "lyricist");
          isTrackValid = false;
        }
        if (!formData.composer.trim()) {
          addError("Composer is required", "composer");
          isTrackValid = false;
        }
        return isTrackValid;

      case 3: // Artwork
        if (!formData.artwork) {
          addError("Please upload artwork for your track", "artwork");
          return false;
        }
        return true;

      case 4: // Distribution
        if (formData.platforms.length === 0) {
          addError(
            "Please select at least one distribution platform",
            "platforms",
          );
          return false;
        }
        return true;

      case 5: // Review
        return (
          validateStep(0) &&
          validateStep(1) &&
          validateStep(2) &&
          validateStep(3) &&
          validateStep(4)
        );

      default:
        return true;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log("🚀 [UPLOAD] Starting submission process");
    clearErrors();

    if (!user) {
      toast.error("You must be logged in to upload music");
      return;
    }

    // Validate all steps before submission
    const allStepsValid = [
      validateStep(0), // Audio files
      validateStep(1), // Release info
      validateStep(2), // Track info
      validateStep(3), // Artwork
      validateStep(4), // Distribution
    ].every(Boolean);

    if (!allStepsValid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    // Additional validation for critical fields
    if (!selectedPrimaryArtist?.id) {
      addError("Primary artist must be selected", "primaryArtist");
      toast.error("Primary artist must be selected");
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);
    setUploadProgress(0);

    const uploadToast = toast.loading("Starting upload...");

    try {
      // Generate unique identifier for this track
      const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const userFolder = user.id;

      setUploadProgress(5);
      toast.loading("Uploading audio files...", { id: uploadToast });

      // Upload audio files
      const audioUrls = await Promise.all(
        formData.audioFiles.map(async (audioFile, index) => {
          const sanitizedAudioName = audioFile.name.replace(
            /[^a-zA-Z0-9.-]/g,
            "_",
          );
          const audioPath = `${userFolder}/${trackId}/audio/${index}_${sanitizedAudioName}`;

          return await uploadFileToSupabase(
            audioFile,
            "tracks",
            audioPath,
            (fileProgress) => {
              const overallProgress = Math.min(
                70,
                5 +
                  Math.round((index / formData.audioFiles.length) * 65) +
                  Math.round(
                    (fileProgress / 100) * (65 / formData.audioFiles.length),
                  ),
              );
              setUploadProgress(overallProgress);
            },
          );
        }),
      );

      console.log(`✅ [UPLOAD] Audio files uploaded:`, audioUrls);
      setUploadProgress(75);

      // Upload artwork
      toast.loading("Uploading artwork...", { id: uploadToast });
      let artworkUrl = null;

      if (formData.artwork) {
        const sanitizedArtworkName = formData.artwork.name.replace(
          /[^a-zA-Z0-9.-]/g,
          "_",
        );
        const artworkPath = `${userFolder}/${trackId}/artwork/${sanitizedArtworkName}`;

        artworkUrl = await uploadFileToSupabase(
          formData.artwork,
          "artwork",
          artworkPath,
          (fileProgress) => {
            const overallProgress = Math.min(
              85,
              75 + Math.round(fileProgress * 0.1),
            );
            setUploadProgress(overallProgress);
          },
        );
        console.log(`✅ [UPLOAD] Artwork uploaded:`, artworkUrl);
      }

      setUploadProgress(90);
      toast.loading("Saving track data to database...", { id: uploadToast });

      // Prepare track data for database insertion - matching exact schema
      const trackData = {
        // Required fields
        user_id: user.id,
        title:
          formData.trackTitle?.trim() || formData.title?.trim() || "Untitled",
        artist: selectedPrimaryArtist
          ? selectedPrimaryArtist.display_name || selectedPrimaryArtist.name
          : "Unknown Artist",
        artist_id: selectedPrimaryArtist?.id || null,
        genre:
          formData.mainGenre?.trim() || formData.genre?.trim() || "Unknown",
        release_date: formData.releaseDate,

        // Optional basic fields
        description: formData.description?.trim() || null,
        is_explicit: formData.isExplicit || false,
        audio_file_url: audioUrls[0] || null,
        audio_file_urls: audioUrls.length > 1 ? audioUrls : null,
        artwork_url: artworkUrl,
        artwork_name: formData.artwork?.name || null,
        platforms: formData.platforms || [],
        status: "pending",
        plays: 0,
        revenue: 0,

        // Release Info Fields - exact schema match
        release_title: formData.releaseTitle?.trim() || null,
        primary_artist: selectedPrimaryArtist
          ? selectedPrimaryArtist.display_name || selectedPrimaryArtist.name
          : null,
        display_artist: formData.displayArtist?.trim() || null,
        featured_artist: selectedFeaturedArtist
          ? selectedFeaturedArtist.display_name || selectedFeaturedArtist.name
          : null,
        label: formData.label?.trim() || null,
        cat_number: null, // Will be auto-generated by database trigger
        main_genre: formData.mainGenre?.trim() || null,
        sub_genre: formData.subGenre?.trim() || null,
        release_type:
          formData.releaseType === "single"
            ? "Single"
            : formData.releaseType === "release"
              ? "Album"
              : formData.releaseType || null,
        upc: formData.upc?.trim() || null,
        countries: formData.isWorldwide ? null : formData.countries || null,
        is_worldwide: formData.isWorldwide || false,
        original_release_date: formData.originalReleaseDate || null,
        copyrights: formData.copyrights?.trim() || null,
        release_notes: formData.releaseNotes?.trim() || null,
        retailers:
          formData.retailers && formData.retailers.length > 0
            ? formData.retailers
            : null,
        exclusive_for: formData.exclusiveFor?.trim() || null,
        allow_preorder_itunes: formData.allowPreOrderITunes || false,

        // Track Info Fields - exact schema match
        track_number: formData.trackNumber || 1,
        track_display_artist: formData.trackDisplayArtist?.trim() || null,
        track_featured_artist: selectedFeaturedArtist
          ? selectedFeaturedArtist.display_name || selectedFeaturedArtist.name
          : null,
        mix_version: formData.mixVersion?.trim() || null,
        remixer: formData.remixer?.trim() || null,
        track_main_genre: formData.mainGenre?.trim() || null,
        track_sub_genre: formData.subGenre?.trim() || null,
        publisher: formData.publisher?.trim() || null,
        contributors:
          formData.contributors && formData.contributors.length > 0
            ? formData.contributors
            : null,
        lyricist: formData.lyricist?.trim() || null,
        composer: formData.composer?.trim() || null,
        album_only: formData.albumOnly || false,

        // Additional schema fields with defaults
        duration: null, // Will be calculated later if needed
        country: null, // Single country field if needed
        artist_id: selectedPrimaryArtist?.id || null, // Fixed: Use selected artist ID
        isrc: null, // International Standard Recording Code
        exclusive_on_shop: false,
        price_tiers: null,
        track_price_tiers: null,
      };

      console.log("💾 [UPLOAD] Inserting track data:", trackData);
      console.log("🔍 [UPLOAD] Track data keys:", Object.keys(trackData));
      console.log(
        "🔍 [UPLOAD] Track data values:",
        Object.values(trackData).map((v) => typeof v),
      );

      // Insert track into database with comprehensive error handling
      const { data: track, error: insertError } = await supabase
        .from("tracks")
        .insert([trackData])
        .select()
        .single();

      console.log("📊 [UPLOAD] Database insert result:", {
        data: track,
        error: insertError,
      });

      if (insertError) {
        console.error("❌ [UPLOAD] Database insert error:", insertError);
        console.error("❌ [UPLOAD] Error details:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });

        let errorMessage = `Database insert failed: ${insertError.message}`;
        if (insertError.code === "23505") {
          errorMessage = "A track with this information already exists.";
        } else if (insertError.code === "23503") {
          errorMessage =
            "Invalid reference data. Please check your form inputs.";
        } else if (insertError.code === "42501") {
          errorMessage =
            "Permission denied. Please check your account permissions.";
        }

        throw new Error(errorMessage);
      }

      if (!track) {
        throw new Error("No track data returned from database");
      }

      console.log("✅ [UPLOAD] Track saved to database:", track);
      setUploadProgress(100);

      // Show success message
      toast.success(
        `🎉 "${formData.trackTitle || formData.title}" uploaded successfully!`,
        {
          id: uploadToast,
          duration: 6000,
        },
      );

      // Show confetti
      setShowConfetti(true);

      // Create Intercom ticket for full release upload
      try {
        console.log("🎫 [INTERCOM] Creating ticket for release upload");
        const { data: ticketResponse, error: ticketError } =
          await supabase.functions.invoke(
            "supabase-functions-create-intercom-ticket",
            {
              body: {
                releaseData: {
                  releaseTitle: formData.releaseTitle,
                  trackTitle: formData.trackTitle || formData.title,
                  primaryArtist: selectedPrimaryArtist
                    ? selectedPrimaryArtist.display_name ||
                      selectedPrimaryArtist.name
                    : formData.artist,
                  artist: formData.artist,
                  mainGenre: formData.mainGenre || formData.genre,
                  genre: formData.genre,
                  releaseDate: formData.releaseDate,
                  releaseType: formData.releaseType,
                  platforms: formData.platforms,
                  trackNumber: formData.trackNumber,
                  featuredArtist: selectedFeaturedArtist
                    ? selectedFeaturedArtist.display_name ||
                      selectedFeaturedArtist.name
                    : null,
                  isExplicit: formData.isExplicit,
                  description: formData.description,
                  label: formData.label,
                  upc: formData.upc,
                  isWorldwide: formData.isWorldwide,
                  countries: formData.countries,
                  copyrights: formData.copyrights,
                  audioFiles: formData.audioFiles.map((f) => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                  })), // Don't send actual file objects
                  artwork: formData.artwork
                    ? {
                        name: formData.artwork.name,
                        size: formData.artwork.size,
                        type: formData.artwork.type,
                      }
                    : null,
                  title: formData.title,
                },
                userData: {
                  id: user.id,
                  name:
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    "User",
                  email: user.email,
                },
              },
            },
          );

        if (ticketError) {
          console.error("❌ [INTERCOM] Failed to create ticket:", ticketError);
        } else {
          console.log(
            "✅ [INTERCOM] Ticket created successfully:",
            ticketResponse,
          );
        }
      } catch (ticketError) {
        console.error("❌ [INTERCOM] Error creating ticket:", ticketError);
        // Don't fail the upload if ticket creation fails
      }

      // Dispatch events for other components
      if (typeof window !== "undefined") {
        const trackDetail = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          release_date: track.release_date,
          description: track.description,
          audio_file_url: track.audio_file_url,
          artwork_url: track.artwork_url,
          platforms: track.platforms,
          is_explicit: track.is_explicit,
          plays: track.plays,
          revenue: track.revenue,
          status: track.status,
          created_at: track.created_at,
          updated_at: track.updated_at,
          user_id: track.user_id,
          audio_file_urls: audioUrls,
          duration: "3:45",
          album: track.title,
        };

        window.dispatchEvent(
          new CustomEvent("track-uploaded", {
            detail: {
              trackId: track.id,
              track: trackDetail,
              audioUrls,
              artworkUrl,
            },
          }),
        );

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("refresh-tracks"));
        }, 500);
      }

      // Reset form and close modal after delay
      setTimeout(() => {
        setCurrentStep(0);
        setFormData({
          // Basic fields
          title: "",
          artist: "",
          genre: "",
          releaseDate: new Date().toISOString().split("T")[0],
          description: "",
          audioFiles: [],
          artwork: null,
          platforms: ["spotify", "apple", "youtube"],
          isExplicit: false,
          releaseType: "single",

          // Release Info Fields
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

          // Track Info Fields
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
        });
        setArtworkPreview("");
        setAudioFileName("");
        setShowConfetti(false);

        // Call onComplete callback
        onComplete({
          ...formData,
          trackId: track.id,
          audioUrls,
          artworkUrl,
          timestamp: Date.now(),
        });
      }, 3000);
    } catch (error) {
      console.error("❌ [UPLOAD] Upload failed:", error);

      let errorMessage = "Upload failed. Please try again.";
      if (error instanceof Error) {
        if (
          error.message.includes("storage") ||
          error.message.includes("File upload")
        ) {
          errorMessage =
            "File upload failed. Please check your internet connection and try again.";
        } else if (
          error.message.includes("database") ||
          error.message.includes("insert") ||
          error.message.includes("Database insert failed")
        ) {
          errorMessage = "Database error. Please try again or contact support.";
        } else if (error.message.includes("Authentication failed")) {
          errorMessage =
            "Authentication failed. Please log out and log back in.";
        } else if (error.message.includes("Permission denied")) {
          errorMessage =
            "Permission denied. Please check your account permissions.";
        } else if (error.message.includes("File too large")) {
          errorMessage =
            "File too large. Please reduce file size and try again.";
        } else if (error.message.includes("Network error")) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else {
          errorMessage = `Upload error: ${error.message}`;
        }
      }

      toast.error(errorMessage, { id: uploadToast, duration: 8000 });
      addError(errorMessage);

      // Reset form state on error to prevent stuck states
      setCurrentStep(Math.max(0, currentStep - 1)); // Go back one step to allow user to fix issues
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const nextStep = () => {
    if (isUploading || isProcessing) return;
    if (currentStep >= steps.length - 1) return;

    clearErrors();
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      // Scroll to top of modal content
      setTimeout(() => {
        const modalContent = document.querySelector(
          '[role="dialog"] .overflow-y-auto',
        );
        if (modalContent) {
          modalContent.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    }
  };

  const prevStep = () => {
    if (isUploading || isProcessing) return;
    if (currentStep > 0) {
      clearErrors();
      setCurrentStep(currentStep - 1);
      // Scroll to top of modal content
      setTimeout(() => {
        const modalContent = document.querySelector(
          '[role="dialog"] .overflow-y-auto',
        );
        if (modalContent) {
          modalContent.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <div className="bg-background">
      <Toaster position="top-right" />
      {showConfetti && (
        <Confetti
          duration={4000}
          pieces={150}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      <Card className="w-full max-w-4xl mx-auto bg-background border shadow-lg overflow-hidden relative contain-layout">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Upload Your Music
            </CardTitle>
            <CardDescription>
              Complete the steps below to upload and distribute your track
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center flex-1 text-center"
              >
                <div className="flex items-center w-full max-w-[100px] sm:max-w-full mx-auto">
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all
                      ${
                        index < currentStep
                          ? "bg-primary text-primary-foreground"
                          : index === currentStep
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-1 sm:mx-2 ${
                        index < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center ${
                    index === currentStep
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="relative">
          <div className="h-[80px] mb-6 flex items-start">
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="w-full origin-top"
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-[600px] overflow-y-auto"
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Release Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={
                          formData.releaseType === "single"
                            ? "default"
                            : "outline"
                        }
                        className="w-full h-24 space-y-2"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            releaseType: "single",
                          }))
                        }
                      >
                        <Music className="h-8 w-8" />
                        <div>Single</div>
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.releaseType === "release"
                            ? "default"
                            : "outline"
                        }
                        className="w-full h-24 space-y-2"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            releaseType: "release",
                          }))
                        }
                      >
                        <Music className="h-8 w-8" />
                        <div>Release</div>
                      </Button>
                    </div>
                  </div>
                  <div
                    className={`
                      flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg 
                      transition-all cursor-pointer group
                      ${
                        isDragOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 bg-muted/5"
                      }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("audio-file")?.click()
                    }
                  >
                    <div className="relative">
                      <FileAudio className="h-16 w-16 text-muted-foreground mb-4 group-hover:text-primary transition-colors duration-300" />
                      <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Upload className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Upload Audio File
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Drag and drop your WAV file
                      {formData.releaseType === "release" ? "s" : ""} here, or
                      click to browse
                    </p>
                    <Input
                      id="audio-file"
                      type="file"
                      accept="audio/wav,.wav"
                      className="hidden"
                      multiple={formData.releaseType === "release"}
                      onChange={handleAudioFileChange}
                    />
                    <Button variant="outline" type="button">
                      <Upload className="mr-2 h-4 w-4" />
                      Select Audio File
                    </Button>
                    {audioFileName && (
                      <div className="mt-4 space-y-2">
                        <div className="text-sm flex items-center text-primary">
                          <FileAudio className="h-4 w-4 mr-2" />
                          <span>{audioFileName}</span>
                        </div>
                        <div className="w-full h-10 flex items-center justify-center">
                          <AudioVisualizer
                            className="w-full"
                            barCount={32}
                            height={30}
                            playing={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Supported formats: WAV or MP3 (max 50MB)</p>
                    <p>
                      •{" "}
                      {formData.releaseType === "single"
                        ? "Only one file can be uploaded for singles"
                        : "Multiple files can be uploaded for releases"}
                    </p>
                    <p>
                      • Ensure your audio is properly mastered and ready for
                      distribution
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium mb-4">
                    Release Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="releaseTitle">Release Title *</Label>
                      <Input
                        id="releaseTitle"
                        value={formData.releaseTitle}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            releaseTitle: e.target.value,
                          }))
                        }
                        placeholder="Enter release title"
                        className={
                          errors.some((e) => e.field === "releaseTitle")
                            ? "border-destructive"
                            : ""
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayArtist">
                        Display Artist (Optional)
                      </Label>
                      <Input
                        id="displayArtist"
                        value={formData.displayArtist}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            displayArtist: e.target.value,
                          }))
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
                        value={formData.label}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                        placeholder="Enter label name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originalReleaseDate">
                        Original Release Date (Optional)
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !formData.originalReleaseDate &&
                              "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.originalReleaseDate ? (
                              format(
                                new Date(formData.originalReleaseDate),
                                "PPP",
                              )
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              formData.originalReleaseDate
                                ? new Date(formData.originalReleaseDate)
                                : undefined
                            }
                            onSelect={(date) => {
                              setFormData((prev) => ({
                                ...prev,
                                originalReleaseDate: date
                                  ? format(date, "yyyy-MM-dd")
                                  : "",
                              }));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="catNumber">
                        Catalog Number (Auto-generated)
                      </Label>
                      <Input
                        id="catNumber"
                        value={formData.catNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            catNumber: e.target.value,
                          }))
                        }
                        placeholder="Will be auto-generated (CAT + 5 digits)"
                        disabled={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upc">UPC (Optional)</Label>
                      <Input
                        id="upc"
                        value={formData.upc}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            upc: e.target.value,
                          }))
                        }
                        placeholder="Enter UPC"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre *</Label>
                      <Select
                        value={formData.mainGenre}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            mainGenre: value,
                            genre: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          className={
                            errors.some((e) => e.field === "mainGenre")
                              ? "border-destructive"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pop">Pop</SelectItem>
                          <SelectItem value="rock">Rock</SelectItem>
                          <SelectItem value="hiphop-rap">
                            Hip Hop/Rap
                          </SelectItem>
                          <SelectItem value="rnb">R&B</SelectItem>
                          <SelectItem value="electronic">Electronic</SelectItem>
                          <SelectItem value="jazz">Jazz</SelectItem>
                          <SelectItem value="classical">Classical</SelectItem>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="folk">Folk</SelectItem>
                          <SelectItem value="indie">Indie</SelectItem>
                          <SelectItem value="alternative">
                            Alternative
                          </SelectItem>
                          <SelectItem value="metal">Metal</SelectItem>
                          <SelectItem value="reggae">Reggae</SelectItem>
                          <SelectItem value="latin">Latin</SelectItem>
                          <SelectItem value="world">World Music</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subGenre">Sub Genre *</Label>
                      <Select
                        value={formData.subGenre}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            subGenre: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          className={
                            errors.some((e) => e.field === "subGenre")
                              ? "border-destructive"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select sub genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pop">Pop</SelectItem>
                          <SelectItem value="rock">Rock</SelectItem>
                          <SelectItem value="hiphop">Hip Hop</SelectItem>
                          <SelectItem value="rap">Rap</SelectItem>
                          <SelectItem value="rnb">R&B</SelectItem>
                          <SelectItem value="electronic">Electronic</SelectItem>
                          <SelectItem value="jazz">Jazz</SelectItem>
                          <SelectItem value="classical">Classical</SelectItem>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="folk">Folk</SelectItem>
                          <SelectItem value="indie">Indie</SelectItem>
                          <SelectItem value="alternative">
                            Alternative
                          </SelectItem>
                          <SelectItem value="metal">Metal</SelectItem>
                          <SelectItem value="reggae">Reggae</SelectItem>
                          <SelectItem value="latin">Latin</SelectItem>
                          <SelectItem value="world">World Music</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="releaseType">Release Type</Label>
                      <Select
                        value={formData.releaseType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            releaseType: value as any,
                          }))
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !formData.releaseDate && "text-muted-foreground"
                            } ${
                              errors.some((e) => e.field === "releaseDate")
                                ? "border-destructive"
                                : ""
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.releaseDate ? (
                              format(new Date(formData.releaseDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              formData.releaseDate
                                ? new Date(formData.releaseDate)
                                : undefined
                            }
                            onSelect={(date) => {
                              setFormData((prev) => ({
                                ...prev,
                                releaseDate: date
                                  ? format(date, "yyyy-MM-dd")
                                  : "",
                              }));
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="countries">Countries</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isWorldwide"
                            checked={formData.isWorldwide}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                isWorldwide: checked === true,
                                countries:
                                  checked === true ? [] : prev.countries,
                              }))
                            }
                          />
                          <Label
                            htmlFor="isWorldwide"
                            className="text-sm font-medium"
                          >
                            Worldwide Release
                          </Label>
                        </div>
                      </div>
                      {!formData.isWorldwide && (
                        <Select
                          value={
                            formData.countries?.length
                              ? formData.countries[0]
                              : undefined
                          }
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              countries: [...(prev.countries || []), value],
                            }))
                          }
                          disabled={formData.isWorldwide}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select countries" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="ca">Canada</SelectItem>
                            <SelectItem value="au">Australia</SelectItem>
                            <SelectItem value="de">Germany</SelectItem>
                            <SelectItem value="fr">France</SelectItem>
                            <SelectItem value="jp">Japan</SelectItem>
                            <SelectItem value="br">Brazil</SelectItem>
                            <SelectItem value="mx">Mexico</SelectItem>
                            <SelectItem value="in">India</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {!formData.isWorldwide &&
                        formData.countries &&
                        formData.countries.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.countries.map((country) => (
                              <Badge
                                key={country}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {country.toUpperCase()}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      countries: prev.countries?.filter(
                                        (c) => c !== country,
                                      ),
                                    }))
                                  }
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="copyrights">Copyrights (Optional)</Label>
                      <Input
                        id="copyrights"
                        value={formData.copyrights}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            copyrights: e.target.value,
                          }))
                        }
                        placeholder="Enter copyright information"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="releaseNotes">
                      Release Notes (Optional)
                    </Label>
                    <Textarea
                      id="releaseNotes"
                      value={formData.releaseNotes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          releaseNotes: e.target.value,
                        }))
                      }
                      placeholder="Enter release notes"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allowPreOrderITunes"
                        checked={formData.allowPreOrderITunes}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            allowPreOrderITunes: checked === true,
                          }))
                        }
                      />
                      <Label
                        htmlFor="allowPreOrderITunes"
                        className="text-sm font-medium"
                      >
                        Allow Pre-Order on iTunes
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exclusiveFor">
                        Exclusive For (Optional)
                      </Label>
                      <Input
                        id="exclusiveFor"
                        value={formData.exclusiveFor}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            exclusiveFor: e.target.value,
                          }))
                        }
                        placeholder="Enter exclusivity period"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
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
                        value={formData.trackNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            trackNumber: parseInt(e.target.value) || 1,
                          }))
                        }
                        className={
                          errors.some((e) => e.field === "trackNumber")
                            ? "border-destructive"
                            : ""
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryArtist">Primary Artist *</Label>
                      {showPrimaryArtistManager ? (
                        <div className="border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Select Artist
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPrimaryArtistManager(false)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                          <ArtistManager
                            showSelector={true}
                            selectedArtistId={selectedPrimaryArtist?.id}
                            onArtistSelect={(artist) => {
                              setSelectedPrimaryArtist(artist);
                              setFormData((prev) => ({
                                ...prev,
                                primaryArtist:
                                  artist.display_name || artist.name,
                                artist: artist.display_name || artist.name,
                              }));
                              setShowPrimaryArtistManager(false);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            id="primaryArtist"
                            value={
                              selectedPrimaryArtist
                                ? selectedPrimaryArtist.display_name ||
                                  selectedPrimaryArtist.name
                                : ""
                            }
                            placeholder="Select primary artist"
                            readOnly
                            className={
                              errors.some((e) => e.field === "primaryArtist")
                                ? "border-destructive"
                                : ""
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPrimaryArtistManager(true)}
                            className="shrink-0"
                          >
                            {selectedPrimaryArtist ? "Change" : "Select"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackDisplayArtist">
                        Track Display Artist (Optional)
                      </Label>
                      <Input
                        id="trackDisplayArtist"
                        value={formData.trackDisplayArtist}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            trackDisplayArtist: e.target.value,
                          }))
                        }
                        placeholder="How artist should be displayed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="featuredArtist">
                        Featured Artist (Optional)
                      </Label>
                      {showFeaturedArtistManager ? (
                        <div className="border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Select Artist
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowFeaturedArtistManager(false)
                              }
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                          <ArtistManager
                            showSelector={true}
                            selectedArtistId={selectedFeaturedArtist?.id}
                            onArtistSelect={(artist) => {
                              setSelectedFeaturedArtist(artist);
                              setFormData((prev) => ({
                                ...prev,
                                featuredArtist:
                                  artist.display_name || artist.name,
                                trackFeaturedArtist:
                                  artist.display_name || artist.name,
                              }));
                              setShowFeaturedArtistManager(false);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            id="featuredArtist"
                            value={
                              selectedFeaturedArtist
                                ? selectedFeaturedArtist.display_name ||
                                  selectedFeaturedArtist.name
                                : ""
                            }
                            placeholder="Select featured artist"
                            readOnly
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFeaturedArtistManager(true)}
                            className="shrink-0"
                          >
                            {selectedFeaturedArtist ? "Change" : "Select"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackTitle">Track Title *</Label>
                      <Input
                        id="trackTitle"
                        value={formData.trackTitle}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            trackTitle: e.target.value,
                            // Also update the legacy title field for compatibility
                            title: e.target.value,
                          }))
                        }
                        placeholder="Enter track title"
                        className={
                          errors.some((e) => e.field === "trackTitle")
                            ? "border-destructive"
                            : ""
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mixVersion">Mix Version (Optional)</Label>
                      <Input
                        id="mixVersion"
                        value={formData.mixVersion}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            mixVersion: e.target.value,
                          }))
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
                        value={formData.remixer}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            remixer: e.target.value,
                          }))
                        }
                        placeholder="Enter remixer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publisher">Publisher (Optional)</Label>
                      <Input
                        id="publisher"
                        value={formData.publisher}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            publisher: e.target.value,
                          }))
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
                        value={formData.lyricist}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lyricist: e.target.value,
                          }))
                        }
                        placeholder="Enter lyricist name"
                        className={
                          errors.some((e) => e.field === "lyricist")
                            ? "border-destructive"
                            : ""
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="composer">Composer *</Label>
                      <Input
                        id="composer"
                        value={formData.composer}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            composer: e.target.value,
                          }))
                        }
                        placeholder="Enter composer name"
                        className={
                          errors.some((e) => e.field === "composer")
                            ? "border-destructive"
                            : ""
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter track description, story, or lyrics..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="explicit"
                        checked={formData.isExplicit}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            isExplicit: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor="explicit" className="text-sm font-medium">
                        This track contains explicit content
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="albumOnly"
                        checked={formData.albumOnly}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            albumOnly: checked === true,
                          }))
                        }
                      />
                      <Label
                        htmlFor="albumOnly"
                        className="text-sm font-medium"
                      >
                        Album Only
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-xs">
                      <AspectRatio
                        ratio={1 / 1}
                        className="bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25"
                      >
                        {artworkPreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={artworkPreview}
                              alt="Artwork preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  artwork: null,
                                }));
                                setArtworkPreview("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() =>
                              document.getElementById("artwork")?.click()
                            }
                          >
                            <Image className="h-12 w-12 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground text-center px-4">
                              Click to upload artwork
                            </p>
                          </div>
                        )}
                      </AspectRatio>
                    </div>

                    <div className="mt-6">
                      <Input
                        id="artwork"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        className="hidden"
                        onChange={handleArtworkChange}
                      />
                      <Label htmlFor="artwork" className="cursor-pointer">
                        <Button variant="outline" type="button">
                          <Upload className="mr-2 h-4 w-4" />
                          {artworkPreview ? "Change Artwork" : "Upload Artwork"}
                        </Button>
                      </Label>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">Artwork requirements:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Square image (1:1 ratio)</li>
                      <li>Minimum 3000 x 3000 pixels for best quality</li>
                      <li>JPG or PNG format only</li>
                      <li>Maximum file size: 10MB</li>
                      <li>
                        High resolution and professional quality recommended
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
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
                        id="select-all"
                        checked={platforms.every((p) =>
                          formData.platforms.includes(p.id),
                        )}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label
                        htmlFor="select-all"
                        className="text-sm font-medium"
                      >
                        Select All Platforms ({platforms.length})
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formData.platforms.length} of {platforms.length} selected
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-96 overflow-y-auto">
                    {platforms.slice(0, 20).map((platform) => (
                      <div
                        key={platform.id}
                        className={`
                          p-4 border rounded-lg cursor-pointer transition-all
                          ${
                            formData.platforms.includes(platform.id)
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50 hover:shadow-sm"
                          }
                        `}
                        onClick={() => handlePlatformToggle(platform.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-medium">{platform.name}</h4>
                            </div>
                          </div>
                          <Checkbox
                            checked={formData.platforms.includes(platform.id)}
                            onCheckedChange={() =>
                              handlePlatformToggle(platform.id)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Selected platforms: {formData.platforms.length}</p>
                    <p>
                      Your music will be distributed to all selected platforms
                      within 24-48 hours.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  {!user && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please log in to upload and distribute your music
                      </AlertDescription>
                    </Alert>
                  )}

                  <h3 className="text-lg font-medium">
                    Review Your Submission
                  </h3>

                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/20">
                      <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all hover:bg-muted/50"
                      >
                        Track Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="artwork"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all hover:bg-muted/50"
                      >
                        Artwork
                      </TabsTrigger>
                      <TabsTrigger
                        value="distribution"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all hover:bg-muted/50"
                      >
                        Distribution
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Release Title
                            </p>
                            <p className="text-base font-medium">
                              {formData.releaseTitle}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Primary Artist
                            </p>
                            <p className="text-base">
                              {selectedPrimaryArtist
                                ? selectedPrimaryArtist.display_name ||
                                  selectedPrimaryArtist.name
                                : "Not selected"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Track Title
                            </p>
                            <p className="text-base font-medium">
                              {formData.trackTitle || formData.title}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Featured Artist
                            </p>
                            <p className="text-base">
                              {selectedFeaturedArtist
                                ? selectedFeaturedArtist.display_name ||
                                  selectedFeaturedArtist.name
                                : "None"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Main Genre / Sub Genre
                            </p>
                            <p className="text-base capitalize">
                              {formData.mainGenre} / {formData.subGenre}
                            </p>
                          </div>
                          <div></div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Release Date
                            </p>
                            <p className="text-base">
                              {new Date(
                                formData.releaseDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Audio File
                            </p>
                            <p className="text-base">
                              {formData.audioFiles
                                .map((f) => f.name)
                                .join(", ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Content Rating
                            </p>
                            <p className="text-base">
                              {formData.isExplicit ? "Explicit" : "Clean"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Catalog Number
                            </p>
                            <p className="text-base">{formData.catNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Release Type
                            </p>
                            <p className="text-base">{formData.releaseType}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Track Number
                            </p>
                            <p className="text-base">{formData.trackNumber}</p>
                          </div>
                        </div>
                      </div>
                      {formData.description && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Description
                          </p>
                          <p className="text-base">{formData.description}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="artwork" className="pt-4">
                      <div className="flex justify-center">
                        <div className="w-48 h-48">
                          <AspectRatio
                            ratio={1 / 1}
                            className="bg-muted rounded-lg overflow-hidden"
                          >
                            {artworkPreview ? (
                              <img
                                src={artworkPreview}
                                alt="Artwork preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </AspectRatio>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="distribution" className="pt-4">
                      <div>
                        <h4 className="font-medium mb-3">
                          Selected Platforms ({formData.platforms.length}):
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {formData.platforms.map((platformId) => {
                            const platform = platforms.find(
                              (p) => p.id === platformId,
                            );
                            return platform ? (
                              <div
                                key={platformId}
                                className="flex items-center space-x-2 p-2 bg-muted rounded-md"
                              >
                                <span className="text-sm font-medium">
                                  {platform.name}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {isUploading && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {uploadProgress < 40
                              ? "Uploading audio files..."
                              : uploadProgress < 80
                                ? "Uploading artwork..."
                                : uploadProgress < 100
                                  ? "Saving to database..."
                                  : "Complete!"}
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              console.log("Back button clicked");
              prevStep();
            }}
            disabled={currentStep === 0 || isUploading}
          >
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => {
                console.log("Next button clicked");
                nextStep();
              }}
              disabled={isUploading}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                console.log("Submit button clicked");
                handleSubmit();
              }}
              disabled={isUploading || isProcessing || !user}
              className="min-w-[120px]"
            >
              {isUploading || isProcessing ? (
                <>
                  <img
                    src="/spinning-loader.png"
                    alt="Loading"
                    className="mr-2 h-4 w-4 animate-spin brightness-150"
                  />
                  {isProcessing ? "Processing..." : "Uploading..."}
                </>
              ) : !user ? (
                "Please Log In"
              ) : (
                "Submit & Upload"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default MusicUploader;
