import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Music,
  Building2,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  Settings,
  Globe,
  Music2,
  Play,
  Video,
  Camera,
  MessageCircle,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OnboardingData {
  role: "artist" | "label" | "contributor";
  name: string;
  artistName?: string;
  companyName?: string;
  companyType?: string;
  bio: string;
  website?: string;
  genrePreferences: string[];
  experienceLevel: string;
  goals: string[];
  collaborationInterests: string[];
  preferredPlatforms: string[];
  monthlyReleaseGoal?: number;
  hasExistingCatalog: boolean;
  marketingBudgetRange?: string;
  teamSize?: number;
  primaryMarket: string;
  // Artist-specific fields from ArtistManager
  display_name?: string;
  email?: string;
  phone?: string;
  spotify_url?: string;
  apple_music_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  soundcloud_url?: string;
  bandcamp_url?: string;
  genre?: string;
  sub_genre?: string;
  record_label?: string;
  management_company?: string;
  booking_agent?: string;
  avatar_url?: string;
}

const GENRES = [
  "Pop",
  "Hip Hop",
  "Rock",
  "Electronic",
  "R&B",
  "Country",
  "Jazz",
  "Classical",
  "Reggae",
  "Folk",
  "Blues",
  "Punk",
  "Metal",
  "Indie",
  "Alternative",
  "Funk",
  "Soul",
  "Gospel",
  "Latin",
  "World",
  "Ambient",
  "House",
  "Techno",
  "Dubstep",
];

const PLATFORMS = [
  "Spotify",
  "Apple Music",
  "YouTube Music",
  "Amazon Music",
  "Tidal",
  "Deezer",
  "SoundCloud",
  "Bandcamp",
  "Pandora",
  "iHeartRadio",
  "TikTok",
  "Instagram",
];

const GOALS = {
  artist: [
    "Build a fanbase",
    "Generate revenue",
    "Get playlist placements",
    "Tour opportunities",
    "Collaborate with other artists",
    "Sign with a label",
    "Sync licensing",
    "Brand partnerships",
  ],
  label: [
    "Discover new talent",
    "Expand catalog",
    "Increase market share",
    "Global distribution",
    "Playlist networking",
    "Brand development",
    "Revenue optimization",
    "A&R insights",
  ],
  contributor: [
    "Find collaboration opportunities",
    "Showcase skills",
    "Build portfolio",
    "Network with artists",
    "Earn from contributions",
    "Learn new techniques",
    "Get credited work",
    "Join projects",
  ],
};

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, refreshUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    role: "artist",
    name: "",
    bio: "",
    genrePreferences: [],
    experienceLevel: "",
    goals: [],
    collaborationInterests: [],
    preferredPlatforms: [],
    hasExistingCatalog: false,
    primaryMarket: "",
    // Initialize artist fields
    display_name: "",
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

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    if (user && open) {
      setData((prev) => ({
        ...prev,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "",
      }));
    }
  }, [user, open]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log(
        "🎯 [ONBOARDING] Starting onboarding completion for user:",
        user.id,
      );
      console.log("🎯 [ONBOARDING] Data to save:", data);

      // First, ensure user_profiles table has required fields
      const updateData = {
        id: user.id,
        name: data.name,
        email: user.email, // Use auth email as primary
        bio: data.bio || null,
        role: data.role,
        website: data.website || null,
        avatar_url: data.avatar_url || null,
        artist_name: data.artistName || null,
        company_name: data.companyName || null,
        company_type: data.companyType || null,
        genre_preferences: data.genrePreferences || [],
        experience_level: data.experienceLevel || null,
        goals: data.goals || [],
        collaboration_interests: data.collaborationInterests || [],
        preferred_platforms: data.preferredPlatforms || [],
        monthly_release_goal: data.monthlyReleaseGoal || null,
        has_existing_catalog: data.hasExistingCatalog || false,
        marketing_budget_range: data.marketingBudgetRange || null,
        team_size: data.teamSize || null,
        primary_market: data.primaryMarket || null,
        onboarding_completed: true,
        onboarding_step: totalSteps,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add missing required fields from UserProfile interface
        total_earnings: 0,
        available_balance: 0,
        pending_payments: 0,
        created_at: new Date().toISOString(),
      };

      console.log("🎯 [ONBOARDING] Upserting user profile:", updateData);
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(updateData);

      if (profileError) {
        console.error("❌ [ONBOARDING] Profile upsert error:", profileError);
        throw profileError;
      }

      console.log("✅ [ONBOARDING] User profile updated successfully");

      // If user is an artist, also create an artist record
      if (data.role === "artist" && data.artistName?.trim()) {
        console.log(
          "🎨 [ONBOARDING] Creating artist record for:",
          data.artistName,
        );

        const artistData = {
          user_id: user.id,
          name: data.artistName.trim(),
          display_name: data.display_name?.trim() || data.artistName.trim(),
          bio: data.bio?.trim() || null,
          website: data.website?.trim() || null,
          email: data.email?.trim() || user.email || null,
          phone: data.phone?.trim() || null,
          spotify_url: data.spotify_url?.trim() || null,
          apple_music_url: data.apple_music_url?.trim() || null,
          youtube_url: data.youtube_url?.trim() || null,
          instagram_url: data.instagram_url?.trim() || null,
          twitter_url: data.twitter_url?.trim() || null,
          facebook_url: data.facebook_url?.trim() || null,
          soundcloud_url: data.soundcloud_url?.trim() || null,
          bandcamp_url: data.bandcamp_url?.trim() || null,
          genre: data.genre?.trim() || data.genrePreferences[0] || null,
          sub_genre: data.sub_genre?.trim() || data.genrePreferences[1] || null,
          record_label: data.record_label?.trim() || null,
          management_company: data.management_company?.trim() || null,
          booking_agent: data.booking_agent?.trim() || null,
          avatar_url: data.avatar_url?.trim() || null,
          is_active: true,
          is_verified: false,
        };

        console.log("🎨 [ONBOARDING] Artist data to insert:", artistData);
        const { error: artistError } = await supabase
          .from("artists")
          .insert([artistData]);

        if (artistError) {
          console.error("❌ [ONBOARDING] Artist creation error:", artistError);
          // Don't throw here - we still want the user profile to be created
          toast({
            variant: "destructive",
            title: "Warning",
            description:
              "Profile created but artist record failed. You can add artist details later in settings.",
          });
        } else {
          console.log("✅ [ONBOARDING] Artist record created successfully");
        }
      }

      console.log("🔄 [ONBOARDING] Refreshing user profile");
      await refreshUserProfile();

      console.log("✅ [ONBOARDING] Onboarding completed successfully");
      toast({
        title: "Welcome to OneSync! 🎉",
        description:
          "Your profile has been set up successfully. Let's start your music journey!",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("❌ [ONBOARDING] Error completing onboarding:", error);

      let errorMessage = "Failed to complete onboarding. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        const dbError = error as any;
        if (dbError.code) {
          console.error("❌ [ONBOARDING] Database error code:", dbError.code);
          if (dbError.code === "23505") {
            errorMessage = "An account with this information already exists.";
          } else if (dbError.code === "23503") {
            errorMessage =
              "Invalid user reference. Please try logging out and back in.";
          } else if (dbError.code === "42501") {
            errorMessage =
              "Permission denied. Please check your account permissions.";
          } else {
            errorMessage = `Database error: ${dbError.message}`;
          }
        } else {
          errorMessage = `Error: ${dbError.message}`;
        }
      }

      toast({
        variant: "destructive",
        title: "Onboarding Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  const renderRoleSelection = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground">
          Choose Your Role
        </h3>
        <p className="text-muted-foreground">
          Select the option that best describes you
        </p>
      </div>

      <div className="grid gap-3">
        {[
          {
            role: "artist" as const,
            icon: Music,
            title: "Artist",
            description: "Create and distribute your music",
          },
          {
            role: "label" as const,
            icon: Building2,
            title: "Label",
            description: "Manage artists and releases",
          },
          {
            role: "contributor" as const,
            icon: Users,
            title: "Contributor",
            description: "Collaborate on music projects",
          },
        ].map(({ role, icon: Icon, title, description }) => (
          <Card
            key={role}
            className={`cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
              data.role === role
                ? "ring-2 ring-primary bg-accent/30"
                : "hover:shadow-sm"
            }`}
            onClick={() => setData({ ...data, role })}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{title}</h4>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {data.role === role && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Settings className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground">
          Basic Information
        </h3>
        <p className="text-muted-foreground">Tell us about yourself</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        {data.role === "artist" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="artistName">
                Artist Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="artistName"
                value={data.artistName || ""}
                onChange={(e) =>
                  setData({ ...data, artistName: e.target.value })
                }
                placeholder="Your stage name or artist alias"
                className={
                  !data.artistName?.trim()
                    ? "border-red-300 focus:border-red-500"
                    : ""
                }
              />
              {!data.artistName?.trim() && (
                <p className="text-sm text-red-500">Artist name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={data.display_name || ""}
                onChange={(e) =>
                  setData({ ...data, display_name: e.target.value })
                }
                placeholder="How name should be displayed"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="avatar_upload">Profile Picture</Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-2 border-dashed border-muted-foreground/30">
                    {data.avatar_url ? (
                      <AvatarImage
                        src={data.avatar_url}
                        alt="Profile picture"
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {data.avatar_url && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                      onClick={() => setData({ ...data, avatar_url: "" })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      id="avatar_upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            console.log(
                              "📸 [ONBOARDING] Uploading avatar:",
                              file.name,
                            );

                            // Validate file type and size
                            const validTypes = [
                              "image/jpeg",
                              "image/png",
                              "image/jpg",
                              "image/webp",
                            ];
                            const maxSize = 2 * 1024 * 1024; // 2MB

                            if (!validTypes.includes(file.type)) {
                              toast({
                                variant: "destructive",
                                title: "Invalid File Type",
                                description:
                                  "Please upload a JPG, PNG, or WebP image.",
                              });
                              return;
                            }

                            if (file.size > maxSize) {
                              toast({
                                variant: "destructive",
                                title: "File Too Large",
                                description:
                                  "Please upload an image smaller than 2MB.",
                              });
                              return;
                            }

                            const fileExt = file.name.split(".").pop();
                            const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
                            const filePath = `avatars/${fileName}`;

                            const { error: uploadError } =
                              await supabase.storage
                                .from("avatars")
                                .upload(filePath, file, {
                                  cacheControl: "3600",
                                  upsert: true,
                                });

                            if (uploadError) {
                              console.error(
                                "❌ [ONBOARDING] Error uploading avatar:",
                                uploadError,
                              );
                              toast({
                                variant: "destructive",
                                title: "Upload Failed",
                                description:
                                  "Failed to upload avatar. Please try again.",
                              });
                              return;
                            }

                            const {
                              data: { publicUrl },
                            } = supabase.storage
                              .from("avatars")
                              .getPublicUrl(filePath);

                            console.log(
                              "✅ [ONBOARDING] Avatar uploaded successfully:",
                              publicUrl,
                            );
                            setData({ ...data, avatar_url: publicUrl });

                            toast({
                              title: "Success",
                              description: "Avatar uploaded successfully!",
                            });
                          } catch (error) {
                            console.error(
                              "❌ [ONBOARDING] Error processing avatar upload:",
                              error,
                            );
                            toast({
                              variant: "destructive",
                              title: "Upload Error",
                              description:
                                "An error occurred while uploading your avatar.",
                            });
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 border-dashed border-2 hover:bg-accent/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {data.avatar_url ? "Change Picture" : "Upload Picture"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email || ""}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="artist@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={data.phone || ""}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select
                  value={data.genre || ""}
                  onValueChange={(value) => setData({ ...data, genre: value })}
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
                  value={data.sub_genre || ""}
                  onChange={(e) =>
                    setData({ ...data, sub_genre: e.target.value })
                  }
                  placeholder="Enter sub genre"
                />
              </div>
            </div>

            {/* Social Media & Streaming Links */}
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
                    value={data.spotify_url || ""}
                    onChange={(e) =>
                      setData({ ...data, spotify_url: e.target.value })
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
                    value={data.apple_music_url || ""}
                    onChange={(e) =>
                      setData({ ...data, apple_music_url: e.target.value })
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
                    value={data.youtube_url || ""}
                    onChange={(e) =>
                      setData({ ...data, youtube_url: e.target.value })
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
                    value={data.instagram_url || ""}
                    onChange={(e) =>
                      setData({ ...data, instagram_url: e.target.value })
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
                    value={data.twitter_url || ""}
                    onChange={(e) =>
                      setData({ ...data, twitter_url: e.target.value })
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
                    value={data.facebook_url || ""}
                    onChange={(e) =>
                      setData({ ...data, facebook_url: e.target.value })
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
                    value={data.soundcloud_url || ""}
                    onChange={(e) =>
                      setData({ ...data, soundcloud_url: e.target.value })
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
                    value={data.bandcamp_url || ""}
                    onChange={(e) =>
                      setData({ ...data, bandcamp_url: e.target.value })
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
                    value={data.record_label || ""}
                    onChange={(e) =>
                      setData({ ...data, record_label: e.target.value })
                    }
                    placeholder="Enter record label"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="management_company">Management</Label>
                  <Input
                    id="management_company"
                    value={data.management_company || ""}
                    onChange={(e) =>
                      setData({ ...data, management_company: e.target.value })
                    }
                    placeholder="Enter management company"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking_agent">Booking Agent</Label>
                <Input
                  id="booking_agent"
                  value={data.booking_agent || ""}
                  onChange={(e) =>
                    setData({ ...data, booking_agent: e.target.value })
                  }
                  placeholder="Enter booking agent"
                />
              </div>
            </div>
          </>
        )}

        {data.role === "label" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={data.companyName || ""}
                onChange={(e) =>
                  setData({ ...data, companyName: e.target.value })
                }
                placeholder="Your label or company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyType">Company Type</Label>
              <Select
                value={data.companyType || ""}
                onValueChange={(value) =>
                  setData({ ...data, companyType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent_label">
                    Independent Label
                  </SelectItem>
                  <SelectItem value="major_label">Major Label</SelectItem>
                  <SelectItem value="distribution_company">
                    Distribution Company
                  </SelectItem>
                  <SelectItem value="management_company">
                    Management Company
                  </SelectItem>
                  <SelectItem value="publishing_company">
                    Publishing Company
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="bio">
            Bio <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            placeholder={`Tell us about your ${data.role === "artist" ? "music and style" : data.role === "label" ? "label and vision" : "skills and experience"}...`}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">
            Website <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="website"
            value={data.website || ""}
            onChange={(e) => setData({ ...data, website: e.target.value })}
            placeholder="https://your-website.com"
          />
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Music className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground">
          Music Preferences
        </h3>
        <p className="text-muted-foreground">
          Select your favorite genres and experience level
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Favorite Genres</Label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {data.genrePreferences.length}/5 selected
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={
                  data.genrePreferences.includes(genre) ? "default" : "outline"
                }
                className={`cursor-pointer justify-center py-2 px-3 transition-all duration-200 hover:scale-105`}
                onClick={() => {
                  if (data.genrePreferences.includes(genre)) {
                    setData({
                      ...data,
                      genrePreferences: data.genrePreferences.filter(
                        (g) => g !== genre,
                      ),
                    });
                  } else if (data.genrePreferences.length < 5) {
                    setData({
                      ...data,
                      genrePreferences: [...data.genrePreferences, genre],
                    });
                  }
                }}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select
            value={data.experienceLevel}
            onValueChange={(value) =>
              setData({ ...data, experienceLevel: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">
                Beginner - Just starting out
              </SelectItem>
              <SelectItem value="intermediate">
                Intermediate - Some experience
              </SelectItem>
              <SelectItem value="advanced">
                Advanced - Very experienced
              </SelectItem>
              <SelectItem value="professional">
                Professional - Industry veteran
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground">
          Goals & Platforms
        </h3>
        <p className="text-muted-foreground">What do you want to achieve?</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Your Goals</Label>
          <div className="grid gap-2">
            {GOALS[data.role].map((goal) => (
              <div
                key={goal}
                className={`cursor-pointer p-3 rounded-lg border transition-all duration-200 hover:bg-accent/50 ${
                  data.goals.includes(goal)
                    ? "bg-accent border-primary"
                    : "border-border hover:border-muted-foreground/50"
                }`}
                onClick={() =>
                  setData({
                    ...data,
                    goals: toggleArrayItem(data.goals, goal),
                  })
                }
              >
                <div className="flex items-center space-x-3">
                  {data.goals.includes(goal) ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground"></div>
                  )}
                  <span className="text-sm">{goal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Preferred Platforms</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLATFORMS.map((platform) => (
              <Badge
                key={platform}
                variant={
                  data.preferredPlatforms.includes(platform)
                    ? "default"
                    : "outline"
                }
                className="cursor-pointer justify-center py-2 px-3 transition-all duration-200 hover:scale-105"
                onClick={() =>
                  setData({
                    ...data,
                    preferredPlatforms: toggleArrayItem(
                      data.preferredPlatforms,
                      platform,
                    ),
                  })
                }
              >
                {platform}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinalDetails = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Globe className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground">
          Final Details
        </h3>
        <p className="text-muted-foreground">Complete your profile setup</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="primaryMarket">Primary Market</Label>
          <Select
            value={data.primaryMarket}
            onValueChange={(value) =>
              setData({ ...data, primaryMarket: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your primary market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north_america">North America</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
              <SelectItem value="asia_pacific">Asia Pacific</SelectItem>
              <SelectItem value="latin_america">Latin America</SelectItem>
              <SelectItem value="africa">Africa</SelectItem>
              <SelectItem value="middle_east">Middle East</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.role === "artist" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="monthlyReleaseGoal">Monthly Release Goal</Label>
              <Select
                value={data.monthlyReleaseGoal?.toString() || ""}
                onValueChange={(value) =>
                  setData({ ...data, monthlyReleaseGoal: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How often do you plan to release?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 release per month</SelectItem>
                  <SelectItem value="2">2 releases per month</SelectItem>
                  <SelectItem value="4">1 release per week</SelectItem>
                  <SelectItem value="8">2+ releases per week</SelectItem>
                  <SelectItem value="0">No fixed schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketingBudget">Marketing Budget</Label>
              <Select
                value={data.marketingBudgetRange || ""}
                onValueChange={(value) =>
                  setData({ ...data, marketingBudgetRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your marketing budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_500">Under $500</SelectItem>
                  <SelectItem value="500_2000">$500 - $2,000</SelectItem>
                  <SelectItem value="2000_5000">$2,000 - $5,000</SelectItem>
                  <SelectItem value="5000_10000">$5,000 - $10,000</SelectItem>
                  <SelectItem value="over_10000">Over $10,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {data.role === "label" && (
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size</Label>
            <Select
              value={data.teamSize?.toString() || ""}
              onValueChange={(value) =>
                setData({ ...data, teamSize: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="How many people are on your team?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Just me</SelectItem>
                <SelectItem value="2">2-5 people</SelectItem>
                <SelectItem value="6">6-10 people</SelectItem>
                <SelectItem value="11">11-25 people</SelectItem>
                <SelectItem value="26">25+ people</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-3 p-3 rounded-lg border">
          <input
            type="checkbox"
            id="hasExistingCatalog"
            checked={data.hasExistingCatalog}
            onChange={(e) =>
              setData({ ...data, hasExistingCatalog: e.target.checked })
            }
            className="w-4 h-4 rounded border-border"
          />
          <Label htmlFor="hasExistingCatalog" className="cursor-pointer">
            I have existing music to upload
          </Label>
        </div>
      </div>
    </div>
  );

  const steps = [
    renderRoleSelection,
    renderBasicInfo,
    renderPreferences,
    renderGoals,
    renderFinalDetails,
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.role !== "";
      case 1:
        const basicInfoValid = data.name.trim() !== "";
        if (data.role === "artist") {
          return basicInfoValid && data.artistName?.trim() !== "";
        }
        return basicInfoValid;
      case 2:
        return data.genrePreferences.length > 0 && data.experienceLevel !== "";
      case 3:
        return data.goals.length > 0 && data.preferredPlatforms.length > 0;
      case 4:
        return data.primaryMarket !== "";
      default:
        return false;
    }
  };

  // Debug function to log current state
  const debugCurrentState = () => {
    console.log("🐛 [ONBOARDING] Current step:", currentStep);
    console.log("🐛 [ONBOARDING] Can proceed:", canProceed());
    console.log("🐛 [ONBOARDING] Current data:", data);
    console.log("🐛 [ONBOARDING] User:", user?.email);
  };

  // Call debug function when step changes
  useEffect(() => {
    debugCurrentState();
  }, [currentStep, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold">
                Welcome to OneSync
              </DialogTitle>
              <DialogDescription className="mt-1">
                Step {currentStep + 1} of {totalSteps}
              </DialogDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </DialogHeader>

        <div className="py-6">{steps[currentStep]()}</div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep === totalSteps - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Setup</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
