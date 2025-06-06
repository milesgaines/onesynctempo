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
import { Separator } from "@/components/ui/separator";
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
  User,
  Camera,
  Save,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import { toast } from "@/components/ui/use-toast";

interface Artist {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatar_url?: string;
}

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  role: "artist" | "label" | "contributor";
  avatar_url: string;
  website?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    youtube?: string;
  };
}

const ProfileSettings: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    bio: "",
    role: "artist",
    avatar_url: "",
    website: "",
    social_links: {},
  });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newArtist, setNewArtist] = useState({
    name: "",
    email: "",
    role: "artist",
  });
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadArtists();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        setErrors(["Failed to load profile data"]);
        return;
      }

      if (profile) {
        setProfileData({
          name: profile.name || "",
          email: profile.email || user.email || "",
          bio: profile.bio || "",
          role: profile.role || "artist",
          avatar_url: profile.avatar_url || "",
          website: profile.website || "",
          social_links: profile.social_links || {},
        });
      } else {
        // Create default profile
        setProfileData({
          name: user.user_metadata?.name || "",
          email: user.email || "",
          bio: "",
          role: "artist",
          avatar_url: "",
          website: "",
          social_links: {},
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setErrors(["Failed to load profile data"]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadArtists = async () => {
    if (!user) return;

    try {
      // Load artists from user_profiles table
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("id, name, email, role, avatar_url")
        .neq("id", user.id)
        .limit(10);

      if (error) {
        console.error("Error loading artists:", error);
        return;
      }

      if (profiles) {
        setArtists(
          profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            role: profile.role,
            email: profile.email,
            avatar_url: profile.avatar_url,
          })),
        );
      }
    } catch (error) {
      console.error("Error loading artists:", error);
    }
  };

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      setErrors(["Please upload a valid image file (JPG or PNG)"]);
      return;
    }

    if (file.size > maxSize) {
      setErrors(["Image file must be smaller than 2MB"]);
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProfileData((prev) => ({
          ...prev,
          avatar_url: e.target.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
    setErrors([]);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error("User must be logged in to upload files");

    setIsUploadingAvatar(true);
    try {
      // Generate a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setErrors([]);
    setSuccess("");

    try {
      let avatarUrl = profileData.avatar_url;

      // If there's a new avatar file, upload it first
      if (avatarFile) {
        toast({
          title: "Uploading avatar...",
          description: "Please wait while we upload your profile picture.",
        });
        try {
          avatarUrl = await uploadAvatar(avatarFile);
          toast({
            title: "Success",
            description: "Avatar uploaded successfully!",
          });
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Failed to upload avatar. Please try again.",
          });
          setErrors(["Failed to upload avatar. Please try again."]);
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        name: profileData.name,
        email: profileData.email,
        bio: profileData.bio,
        role: profileData.role,
        avatar_url: avatarUrl,
        website: profileData.website,
        social_links: profileData.social_links,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      setSuccess("Profile updated successfully!");
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Reset the avatar file state
      setAvatarFile(null);

      // Refresh the user profile in AuthProvider to update avatar across the app
      await refreshUserProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrors(["Failed to save profile. Please try again."]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddArtist = async () => {
    if (!newArtist.name.trim() || !newArtist.email.trim()) {
      setErrors(["Name and email are required"]);
      return;
    }

    try {
      // In a real app, you'd create a new user account
      // For now, we'll just add to the artists list locally
      const newArtistData: Artist = {
        id: `temp-${Date.now()}`,
        name: newArtist.name,
        email: newArtist.email,
        role: newArtist.role,
      };

      setArtists((prev) => [...prev, newArtistData]);
      setNewArtist({ name: "", email: "", role: "artist" });
      setShowAddArtist(false);
      toast({
        title: "Artist Added",
        description: `${newArtist.name} added successfully!`,
      });
    } catch (error) {
      console.error("Error adding artist:", error);
      setErrors(["Failed to add artist"]);
    }
  };

  const removeArtist = (artistId: string) => {
    setArtists((prev) => prev.filter((artist) => artist.id !== artistId));
    toast({
      title: "Artist Removed",
      description: "The artist has been removed from your collaborations.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your profile information and artist collaborations
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={profileData.avatar_url}
                alt={profileData.name}
              />
              <AvatarFallback className="text-lg">
                {profileData.name.charAt(0) || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar || isSaving}
              />
              <label htmlFor="avatar-upload">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploadingAvatar || isSaving}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG or GIF. Max size 2MB.
              </p>
              {avatarFile && (
                <p className="text-xs text-primary mt-1">
                  New photo selected: {avatarFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={profileData.role}
                onValueChange={(value: "artist" | "label" | "contributor") =>
                  setProfileData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artist">Artist</SelectItem>
                  <SelectItem value="label">Label</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profileData.website}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) =>
                setProfileData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Artist Collaborations</CardTitle>
              <CardDescription>
                Manage artists you collaborate with
              </CardDescription>
            </div>
            <Dialog open={showAddArtist} onOpenChange={setShowAddArtist}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Artist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Artist</DialogTitle>
                  <DialogDescription>
                    Add a new artist to collaborate with
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="artist-name">Artist Name</Label>
                    <Input
                      id="artist-name"
                      value={newArtist.name}
                      onChange={(e) =>
                        setNewArtist((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter artist name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist-email">Email</Label>
                    <Input
                      id="artist-email"
                      type="email"
                      value={newArtist.email}
                      onChange={(e) =>
                        setNewArtist((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist-role">Role</Label>
                    <Select
                      value={newArtist.role}
                      onValueChange={(value) =>
                        setNewArtist((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artist">Artist</SelectItem>
                        <SelectItem value="producer">Producer</SelectItem>
                        <SelectItem value="songwriter">Songwriter</SelectItem>
                        <SelectItem value="vocalist">Vocalist</SelectItem>
                        <SelectItem value="instrumentalist">
                          Instrumentalist
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddArtist(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddArtist}>Add Artist</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {artists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No artists added yet</p>
              <p className="text-sm">Add artists to start collaborating</p>
            </div>
          ) : (
            <div className="space-y-4">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={artist.avatar_url} alt={artist.name} />
                      <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{artist.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {artist.email}
                      </p>
                    </div>
                    <Badge variant="secondary">{artist.role}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArtist(artist.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
