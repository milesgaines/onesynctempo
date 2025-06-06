import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Music,
  AlertCircle,
  CheckCircle,
  Loader2,
  MoreVertical,
  Music2,
  Play,
  Video,
  Camera,
  MessageCircle,
  Users,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import toast from "react-hot-toast";

export interface Artist {
  id: string;
  user_id: string;
  name: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  spotify_url?: string | null;
  apple_music_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  soundcloud_url?: string | null;
  bandcamp_url?: string | null;
  genre?: string | null;
  sub_genre?: string | null;
  record_label?: string | null;
  management_company?: string | null;
  booking_agent?: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ArtistFormData {
  name: string;
  display_name: string;
  bio: string;
  website: string;
  email: string;
  phone: string;
  spotify_url: string;
  apple_music_url: string;
  youtube_url: string;
  instagram_url: string;
  twitter_url: string;
  facebook_url: string;
  soundcloud_url: string;
  bandcamp_url: string;
  genre: string;
  sub_genre: string;
  record_label: string;
  management_company: string;
  booking_agent: string;
  avatar_url: string;
}

interface ArtistManagerProps {
  onArtistSelect?: (artist: Artist) => void;
  selectedArtistId?: string;
  showSelector?: boolean;
}

const ArtistManager: React.FC<ArtistManagerProps> = ({
  onArtistSelect,
  selectedArtistId,
  showSelector = false,
}) => {
  const { user } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ArtistFormData>({
    name: "",
    display_name: "",
    bio: "",
    website: "",
    email: "",
    phone: "",
    spotify_url: "",
    apple_music_url: "",
    youtube_url: "",
    instagram_url: "",
    twitter_url: "",
    facebook_url: "",
    soundcloud_url: "",
    bandcamp_url: "",
    genre: "",
    sub_genre: "",
    record_label: "",
    management_company: "",
    booking_agent: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      loadArtists();
    }
  }, [user]);

  const loadArtists = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log("📥 [ARTIST] Loading artists for user:", user.id);

      const { data: artistsData, error } = await supabase
        .from("artists")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      console.log("📊 [ARTIST] Raw database result:", {
        data: artistsData,
        error,
        count: artistsData?.length || 0,
      });

      if (error) {
        console.error("❌ [ARTIST] Error loading artists:", error);
        setErrors([`Failed to load artists: ${error.message}`]);
        return;
      }

      // Log each artist's is_active status for debugging
      if (artistsData) {
        artistsData.forEach((artist, index) => {
          console.log(
            `🎭 [ARTIST] Artist ${index + 1}: "${artist.name}" - is_active: ${artist.is_active}`,
          );
        });
      }

      // Show all artists (including inactive ones for debugging)
      // Only filter out explicitly deleted artists (is_active === false)
      const visibleArtists = (artistsData || []).filter(
        (artist) => artist.is_active !== false,
      );

      console.log(
        `✅ [ARTIST] Total artists in DB: ${artistsData?.length || 0}`,
      );
      console.log(
        `✅ [ARTIST] Visible artists after filtering: ${visibleArtists.length}`,
      );
      console.log(
        "✅ [ARTIST] Visible artists:",
        visibleArtists.map((a) => ({ name: a.name, is_active: a.is_active })),
      );

      setArtists(visibleArtists);
    } catch (error) {
      console.error("❌ [ARTIST] Exception loading artists:", error);
      setErrors(["Failed to load artists"]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      display_name: "",
      bio: "",
      website: "",
      email: "",
      phone: "",
      spotify_url: "",
      apple_music_url: "",
      youtube_url: "",
      instagram_url: "",
      twitter_url: "",
      facebook_url: "",
      soundcloud_url: "",
      bandcamp_url: "",
      genre: "",
      sub_genre: "",
      record_label: "",
      management_company: "",
      booking_agent: "",
      avatar_url: "",
    });
    setEditingArtist(null);
    setErrors([]);
    setSuccess("");
  };

  const handleAddArtist = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEditArtist = (artist: Artist) => {
    setFormData({
      name: artist.name || "",
      display_name: artist.display_name || "",
      bio: artist.bio || "",
      website: artist.website || "",
      email: artist.email || "",
      phone: artist.phone || "",
      spotify_url: artist.spotify_url || "",
      apple_music_url: artist.apple_music_url || "",
      youtube_url: artist.youtube_url || "",
      instagram_url: artist.instagram_url || "",
      twitter_url: artist.twitter_url || "",
      facebook_url: artist.facebook_url || "",
      soundcloud_url: artist.soundcloud_url || "",
      bandcamp_url: artist.bandcamp_url || "",
      genre: artist.genre || "",
      sub_genre: artist.sub_genre || "",
      record_label: artist.record_label || "",
      management_company: artist.management_company || "",
      booking_agent: artist.booking_agent || "",
      avatar_url: artist.avatar_url || "",
    });
    setEditingArtist(artist);
    setShowAddDialog(true);
  };

  const handleSaveArtist = async () => {
    if (!user) return;

    // Enhanced validation for mandatory artist name
    if (!formData.name || !formData.name.trim()) {
      setErrors(["Artist name is mandatory and cannot be empty"]);
      toast.error("Artist name is mandatory and cannot be empty");
      return;
    }

    setIsSaving(true);
    setErrors([]);
    setSuccess("");

    try {
      // Prepare artist data matching exact database schema
      const artistData = {
        user_id: user.id,
        name: formData.name.trim(),
        display_name: formData.display_name?.trim() || null,
        bio: formData.bio?.trim() || null,
        website: formData.website?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        spotify_url: formData.spotify_url?.trim() || null,
        apple_music_url: formData.apple_music_url?.trim() || null,
        youtube_url: formData.youtube_url?.trim() || null,
        instagram_url: formData.instagram_url?.trim() || null,
        twitter_url: formData.twitter_url?.trim() || null,
        facebook_url: formData.facebook_url?.trim() || null,
        soundcloud_url: formData.soundcloud_url?.trim() || null,
        bandcamp_url: formData.bandcamp_url?.trim() || null,
        genre: formData.genre || null,
        sub_genre: formData.sub_genre || null,
        record_label: formData.record_label?.trim() || null,
        management_company: formData.management_company?.trim() || null,
        booking_agent: formData.booking_agent?.trim() || null,
        avatar_url: formData.avatar_url?.trim() || null,
        is_active: true,
        is_verified: false, // Default to false for new artists
      };

      console.log("🎯 [ARTIST] Saving artist data:", artistData);

      let result;
      if (editingArtist) {
        // Update existing artist
        console.log("🔄 [ARTIST] Updating artist with ID:", editingArtist.id);
        result = await supabase
          .from("artists")
          .update(artistData)
          .eq("id", editingArtist.id)
          .select()
          .single();
      } else {
        // Create new artist
        console.log("➕ [ARTIST] Creating new artist");
        result = await supabase
          .from("artists")
          .insert([artistData])
          .select()
          .single();
      }

      console.log("📊 [ARTIST] Database result:", result);

      if (result.error) {
        console.error("❌ [ARTIST] Database error:", result.error);
        throw result.error;
      }

      if (!result.data) {
        throw new Error("No data returned from database operation");
      }

      const action = editingArtist ? "updated" : "created";
      console.log(`✅ [ARTIST] Artist ${action} successfully:`, result.data);
      setSuccess(`Artist ${action} successfully!`);
      toast.success(`Artist ${action} successfully!`);

      setShowAddDialog(false);
      resetForm();
      await loadArtists();
    } catch (error) {
      console.error("❌ [ARTIST] Error saving artist:", error);

      let errorMessage = "Failed to save artist. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        const dbError = error as any;
        if (dbError.code) {
          console.error("❌ [ARTIST] Database error code:", dbError.code);
          if (dbError.code === "23505") {
            errorMessage = "An artist with this name already exists.";
          } else if (dbError.code === "42501") {
            errorMessage =
              "Permission denied. Please check your account permissions.";
          } else if (dbError.code === "23503") {
            errorMessage =
              "Invalid user reference. Please try logging out and back in.";
          } else {
            errorMessage = `Database error: ${dbError.message}`;
          }
        } else {
          errorMessage = `Error: ${dbError.message}`;
        }
      }

      setErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArtist = async (artist: Artist) => {
    if (deleteConfirmId !== artist.id) {
      setDeleteConfirmId(artist.id);
      toast.error(`Click delete again to confirm deletion of "${artist.name}"`);
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from("artists")
        .update({ is_active: false })
        .eq("id", artist.id);

      if (error) {
        throw error;
      }

      toast.success(`${artist.name} has been deleted.`);
      setDeleteConfirmId(null);
      await loadArtists();
    } catch (error) {
      console.error("Error deleting artist:", error);
      toast.error("Failed to delete artist. Please try again.");
      setDeleteConfirmId(null);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "spotify":
        return <Music2 className="h-4 w-4" />;
      case "apple":
        return <Play className="h-4 w-4" />;
      case "youtube":
        return <Video className="h-4 w-4" />;
      case "instagram":
        return <Camera className="h-4 w-4" />;
      case "twitter":
        return <MessageCircle className="h-4 w-4" />;
      case "facebook":
        return <Users className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showSelector) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Select Artist</Label>
          <Button size="sm" onClick={handleAddArtist}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
        <Select
          value={selectedArtistId}
          onValueChange={(value) => {
            const artist = artists.find((a) => a.id === value);
            if (artist && onArtistSelect) {
              onArtistSelect(artist);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an artist" />
          </SelectTrigger>
          <SelectContent>
            {artists.map((artist) => (
              <SelectItem key={artist.id} value={artist.id}>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={artist.avatar_url} alt={artist.name} />
                    <AvatarFallback className="text-xs">
                      {artist.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{artist.display_name || artist.name}</span>
                  {artist.genre && (
                    <Badge variant="secondary" className="text-xs">
                      {artist.genre}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Artist Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArtist ? "Edit Artist" : "Add New Artist"}
              </DialogTitle>
              <DialogDescription>
                {editingArtist
                  ? "Update artist information and social media links"
                  : "Create a new artist profile with social media links"}
              </DialogDescription>
            </DialogHeader>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-red-600">
                      Artist Name * <span className="text-xs">(Required)</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter artist name (required)"
                      required
                      className={
                        !formData.name.trim()
                          ? "border-red-300 focus:border-red-500"
                          : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          display_name: e.target.value,
                        }))
                      }
                      placeholder="How name should be displayed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell us about this artist..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        avatar_url: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, genre: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alternative">Alternative</SelectItem>
                        <SelectItem value="Blues">Blues</SelectItem>
                        <SelectItem value="Classical">Classical</SelectItem>
                        <SelectItem value="Country">Country</SelectItem>
                        <SelectItem value="Dance">Dance</SelectItem>
                        <SelectItem value="Electronic">Electronic</SelectItem>
                        <SelectItem value="Folk">Folk</SelectItem>
                        <SelectItem value="Funk">Funk</SelectItem>
                        <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Indie">Indie</SelectItem>
                        <SelectItem value="Jazz">Jazz</SelectItem>
                        <SelectItem value="Latin">Latin</SelectItem>
                        <SelectItem value="Metal">Metal</SelectItem>
                        <SelectItem value="Pop">Pop</SelectItem>
                        <SelectItem value="Punk">Punk</SelectItem>
                        <SelectItem value="R&B">R&B</SelectItem>
                        <SelectItem value="Reggae">Reggae</SelectItem>
                        <SelectItem value="Rock">Rock</SelectItem>
                        <SelectItem value="Soul">Soul</SelectItem>
                        <SelectItem value="Techno">Techno</SelectItem>
                        <SelectItem value="World Music">World Music</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub_genre">Sub Genre</Label>
                    <Input
                      id="sub_genre"
                      value={formData.sub_genre}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sub_genre: e.target.value,
                        }))
                      }
                      placeholder="Enter sub genre"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="artist@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    placeholder="https://artistwebsite.com"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <h4 className="font-medium">Social Media & Streaming Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spotify_url">
                      <div className="flex items-center space-x-2">
                        <Music2 className="h-4 w-4" />
                        <span>Spotify</span>
                      </div>
                    </Label>
                    <Input
                      id="spotify_url"
                      value={formData.spotify_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          spotify_url: e.target.value,
                        }))
                      }
                      placeholder="https://open.spotify.com/artist/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apple_music_url">
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4" />
                        <span>Apple Music</span>
                      </div>
                    </Label>
                    <Input
                      id="apple_music_url"
                      value={formData.apple_music_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          apple_music_url: e.target.value,
                        }))
                      }
                      placeholder="https://music.apple.com/artist/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>YouTube</span>
                      </div>
                    </Label>
                    <Input
                      id="youtube_url"
                      value={formData.youtube_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          youtube_url: e.target.value,
                        }))
                      }
                      placeholder="https://youtube.com/channel/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">
                      <div className="flex items-center space-x-2">
                        <Camera className="h-4 w-4" />
                        <span>Instagram</span>
                      </div>
                    </Label>
                    <Input
                      id="instagram_url"
                      value={formData.instagram_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          instagram_url: e.target.value,
                        }))
                      }
                      placeholder="https://instagram.com/artist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Twitter</span>
                      </div>
                    </Label>
                    <Input
                      id="twitter_url"
                      value={formData.twitter_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          twitter_url: e.target.value,
                        }))
                      }
                      placeholder="https://twitter.com/artist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Facebook</span>
                      </div>
                    </Label>
                    <Input
                      id="facebook_url"
                      value={formData.facebook_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          facebook_url: e.target.value,
                        }))
                      }
                      placeholder="https://facebook.com/artist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soundcloud_url">
                      <div className="flex items-center space-x-2">
                        <Music className="h-4 w-4" />
                        <span>SoundCloud</span>
                      </div>
                    </Label>
                    <Input
                      id="soundcloud_url"
                      value={formData.soundcloud_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          soundcloud_url: e.target.value,
                        }))
                      }
                      placeholder="https://soundcloud.com/artist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bandcamp_url">
                      <div className="flex items-center space-x-2">
                        <Music className="h-4 w-4" />
                        <span>Bandcamp</span>
                      </div>
                    </Label>
                    <Input
                      id="bandcamp_url"
                      value={formData.bandcamp_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bandcamp_url: e.target.value,
                        }))
                      }
                      placeholder="https://artist.bandcamp.com"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Professional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="record_label">Record Label</Label>
                    <Input
                      id="record_label"
                      value={formData.record_label}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          record_label: e.target.value,
                        }))
                      }
                      placeholder="Enter record label"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="management_company">Management</Label>
                    <Input
                      id="management_company"
                      value={formData.management_company}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          management_company: e.target.value,
                        }))
                      }
                      placeholder="Enter management company"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking_agent">Booking Agent</Label>
                  <Input
                    id="booking_agent"
                    value={formData.booking_agent}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        booking_agent: e.target.value,
                      }))
                    }
                    placeholder="Enter booking agent"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveArtist}
                disabled={isSaving || !formData.name.trim()}
                className={
                  !formData.name.trim() ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {editingArtist ? "Update Artist" : "Add Artist"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Artist Database</h2>
          <p className="text-muted-foreground">
            Manage your artists and their social media links
          </p>
        </div>
        <Button onClick={handleAddArtist}>
          <Plus className="h-4 w-4 mr-2" />
          Add Artist
        </Button>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {artists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Artists Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first artist profile to get started with music
              distribution
            </p>
            <Button onClick={handleAddArtist}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Artist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map((artist) => (
            <Card key={artist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={artist.avatar_url} alt={artist.name} />
                      <AvatarFallback>
                        {artist.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {artist.display_name || artist.name}
                      </CardTitle>
                      {artist.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {artist.genre}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleEditArtist(artist)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={
                          deleteConfirmId === artist.id
                            ? "text-red-600 bg-red-50"
                            : "text-red-600"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArtist(artist);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deleteConfirmId === artist.id
                          ? "Confirm Delete"
                          : "Delete Artist"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {artist.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {artist.bio}
                  </p>
                )}

                {/* Social Media Links */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {artist.spotify_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={artist.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getSocialIcon("spotify")}
                      </a>
                    </Button>
                  )}
                  {artist.apple_music_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={artist.apple_music_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getSocialIcon("apple")}
                      </a>
                    </Button>
                  )}
                  {artist.youtube_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={artist.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getSocialIcon("youtube")}
                      </a>
                    </Button>
                  )}
                  {artist.instagram_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={artist.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getSocialIcon("instagram")}
                      </a>
                    </Button>
                  )}
                  {artist.twitter_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={artist.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getSocialIcon("twitter")}
                      </a>
                    </Button>
                  )}
                  {artist.facebook_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={artist.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getSocialIcon("facebook")}
                      </a>
                    </Button>
                  )}
                </div>

                {/* Professional Info */}
                {(artist.record_label ||
                  artist.management_company ||
                  artist.booking_agent) && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {artist.record_label && <p>Label: {artist.record_label}</p>}
                    {artist.management_company && (
                      <p>Management: {artist.management_company}</p>
                    )}
                    {artist.booking_agent && (
                      <p>Booking: {artist.booking_agent}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Artist Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArtist ? "Edit Artist" : "Add New Artist"}
            </DialogTitle>
            <DialogDescription>
              {editingArtist
                ? "Update artist information and social media links"
                : "Create a new artist profile with social media links"}
            </DialogDescription>
          </DialogHeader>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-red-600">
                    Artist Name * <span className="text-xs">(Required)</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter artist name (required)"
                    required
                    className={
                      !formData.name.trim()
                        ? "border-red-300 focus:border-red-500"
                        : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display_name: e.target.value,
                      }))
                    }
                    placeholder="How name should be displayed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about this artist..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      avatar_url: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, genre: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alternative">Alternative</SelectItem>
                      <SelectItem value="Blues">Blues</SelectItem>
                      <SelectItem value="Classical">Classical</SelectItem>
                      <SelectItem value="Country">Country</SelectItem>
                      <SelectItem value="Dance">Dance</SelectItem>
                      <SelectItem value="Electronic">Electronic</SelectItem>
                      <SelectItem value="Folk">Folk</SelectItem>
                      <SelectItem value="Funk">Funk</SelectItem>
                      <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Indie">Indie</SelectItem>
                      <SelectItem value="Jazz">Jazz</SelectItem>
                      <SelectItem value="Latin">Latin</SelectItem>
                      <SelectItem value="Metal">Metal</SelectItem>
                      <SelectItem value="Pop">Pop</SelectItem>
                      <SelectItem value="Punk">Punk</SelectItem>
                      <SelectItem value="R&B">R&B</SelectItem>
                      <SelectItem value="Reggae">Reggae</SelectItem>
                      <SelectItem value="Rock">Rock</SelectItem>
                      <SelectItem value="Soul">Soul</SelectItem>
                      <SelectItem value="Techno">Techno</SelectItem>
                      <SelectItem value="World Music">World Music</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_genre">Sub Genre</Label>
                  <Input
                    id="sub_genre"
                    value={formData.sub_genre}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sub_genre: e.target.value,
                      }))
                    }
                    placeholder="Enter sub genre"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="artist@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://artistwebsite.com"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <h4 className="font-medium">Social Media & Streaming Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spotify_url">
                    <div className="flex items-center space-x-2">
                      <Music2 className="h-4 w-4" />
                      <span>Spotify</span>
                    </div>
                  </Label>
                  <Input
                    id="spotify_url"
                    value={formData.spotify_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        spotify_url: e.target.value,
                      }))
                    }
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apple_music_url">
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <span>Apple Music</span>
                    </div>
                  </Label>
                  <Input
                    id="apple_music_url"
                    value={formData.apple_music_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        apple_music_url: e.target.value,
                      }))
                    }
                    placeholder="https://music.apple.com/artist/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4" />
                      <span>YouTube</span>
                    </div>
                  </Label>
                  <Input
                    id="youtube_url"
                    value={formData.youtube_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        youtube_url: e.target.value,
                      }))
                    }
                    placeholder="https://youtube.com/channel/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">
                    <div className="flex items-center space-x-2">
                      <Camera className="h-4 w-4" />
                      <span>Instagram</span>
                    </div>
                  </Label>
                  <Input
                    id="instagram_url"
                    value={formData.instagram_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        instagram_url: e.target.value,
                      }))
                    }
                    placeholder="https://instagram.com/artist"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Twitter</span>
                    </div>
                  </Label>
                  <Input
                    id="twitter_url"
                    value={formData.twitter_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        twitter_url: e.target.value,
                      }))
                    }
                    placeholder="https://twitter.com/artist"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Facebook</span>
                    </div>
                  </Label>
                  <Input
                    id="facebook_url"
                    value={formData.facebook_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        facebook_url: e.target.value,
                      }))
                    }
                    placeholder="https://facebook.com/artist"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soundcloud_url">
                    <div className="flex items-center space-x-2">
                      <Music className="h-4 w-4" />
                      <span>SoundCloud</span>
                    </div>
                  </Label>
                  <Input
                    id="soundcloud_url"
                    value={formData.soundcloud_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        soundcloud_url: e.target.value,
                      }))
                    }
                    placeholder="https://soundcloud.com/artist"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bandcamp_url">
                    <div className="flex items-center space-x-2">
                      <Music className="h-4 w-4" />
                      <span>Bandcamp</span>
                    </div>
                  </Label>
                  <Input
                    id="bandcamp_url"
                    value={formData.bandcamp_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bandcamp_url: e.target.value,
                      }))
                    }
                    placeholder="https://artist.bandcamp.com"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Professional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="record_label">Record Label</Label>
                  <Input
                    id="record_label"
                    value={formData.record_label}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        record_label: e.target.value,
                      }))
                    }
                    placeholder="Enter record label"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="management_company">Management</Label>
                  <Input
                    id="management_company"
                    value={formData.management_company}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        management_company: e.target.value,
                      }))
                    }
                    placeholder="Enter management company"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking_agent">Booking Agent</Label>
                <Input
                  id="booking_agent"
                  value={formData.booking_agent}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      booking_agent: e.target.value,
                    }))
                  }
                  placeholder="Enter booking agent"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveArtist}
              disabled={isSaving || !formData.name.trim()}
              className={
                !formData.name.trim() ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingArtist ? "Update Artist" : "Add Artist"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtistManager;
