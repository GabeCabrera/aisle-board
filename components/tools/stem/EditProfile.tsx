"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Camera,
  Instagram,
  Globe,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  displayName: string;
  weddingDate: Date | null;
  slug: string;
  bio: string | null;
  socialLinks: {
    instagram?: string;
    website?: string;
    tiktok?: string;
  };
  profileImage: string | null;
  messagingEnabled: boolean;
  profileVisibility: string | null;
}

interface EditProfileProps {
  profile: ProfileData;
}

export function EditProfile({ profile }: EditProfileProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [profileImage, setProfileImage] = useState(profile.profileImage || "");
  const [weddingDate, setWeddingDate] = useState(
    profile.weddingDate
      ? new Date(profile.weddingDate).toISOString().split("T")[0]
      : ""
  );
  const [instagram, setInstagram] = useState(profile.socialLinks?.instagram || "");
  const [website, setWebsite] = useState(profile.socialLinks?.website || "");
  const [tiktok, setTiktok] = useState(profile.socialLinks?.tiktok || "");
  const [messagingEnabled, setMessagingEnabled] = useState(profile.messagingEnabled);
  const [profileVisibility, setProfileVisibility] = useState(
    profile.profileVisibility || "public"
  );

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim() || null,
          profileImage: profileImage.trim() || null,
          weddingDate: weddingDate || null,
          socialLinks: {
            instagram: instagram.trim() || undefined,
            website: website.trim() || undefined,
            tiktok: tiktok.trim() || undefined,
          },
          messagingEnabled,
          profileVisibility,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save profile");
      }

      toast.success("Profile saved successfully!");
      router.push("/planner/stem/profile");
      router.refresh();
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/planner/stem/profile")}
            className="pl-0 hover:pl-2 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
          </Button>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full px-6 shadow-soft"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      <div>
        <h1 className="font-serif text-4xl text-foreground tracking-tight">
          Edit Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Update how others see you on Stem
        </p>
      </div>

      {/* Profile Image */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-serif text-primary border-4 border-white shadow-lifted overflow-hidden relative">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="profileImage">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="profileImage"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  className="rounded-xl"
                />
                <Button variant="outline" size="icon" className="rounded-xl shrink-0">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a URL to your profile photo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Emma & James"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              This is how you&apos;ll appear to other users
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="Tell others about your wedding vision..."
              className="rounded-xl resize-none min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weddingDate">Wedding Date</Label>
            <Input
              id="weddingDate"
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
            </Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="yourhandle (without @)"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok" className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
              TikTok
            </Label>
            <Input
              id="tiktok"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="yourhandle (without @)"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Website
            </Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourweddingsite.com"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="visibility">Profile Visibility</Label>
            <Select value={profileVisibility} onValueChange={setProfileVisibility}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                <SelectItem value="followers">Followers Only - Only followers can see</SelectItem>
                <SelectItem value="private">Private - Only you can see</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="messaging">Allow Direct Messages</Label>
              <p className="text-xs text-muted-foreground">
                Let other users send you messages
              </p>
            </div>
            <Switch
              id="messaging"
              checked={messagingEnabled}
              onCheckedChange={setMessagingEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end gap-3 pt-4 pb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/planner/stem/profile")}
          className="rounded-full px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full px-8 shadow-soft"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </div>
  );
}
