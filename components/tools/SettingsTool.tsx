"use client";

import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  User,
  ShieldQuestion,
  AlertTriangle,
  Loader2,
  Save,
  Instagram,
  Globe,
  Link as LinkIcon // Using Link as a generic link icon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SettingsTool() {
  const { data: session, update } = useSession();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  const [bio, setBio] = useState((session?.user as any)?.bio || "");
  const [instagram, setInstagram] = useState((session?.user as any)?.socialLinks?.instagram || "");
  const [tiktok, setTiktok] = useState((session?.user as any)?.socialLinks?.tiktok || "");
  const [website, setWebsite] = useState((session?.user as any)?.socialLinks?.website || "");
  const [profileImage, setProfileImage] = useState((session?.user as any)?.profileImage || "");
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with session changes
  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.name || "");
      setBio((session.user as any).bio || "");
      setInstagram((session.user as any).socialLinks?.instagram || "");
      setTiktok((session.user as any).socialLinks?.tiktok || "");
      setWebsite((session.user as any).socialLinks?.website || "");
      setProfileImage((session.user as any).profileImage || "");
    }
  }, [session]);

  const userInitial = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const socialLinks = {
        instagram: instagram || undefined,
        tiktok: tiktok || undefined,
        website: website || undefined,
      };

      const response = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio,
          socialLinks,
          profileImage,
        }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        // Manually update the session to reflect changes immediately in UI
        await update({ 
                      user: { 
                      name: displayName, 
                      bio: bio, 
                      socialLinks: socialLinks,
                      profileImage: profileImage 
                    } 
                  });        setIsEditProfileOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-xl text-muted-foreground mt-2 font-light">
          Manage your account and preferences
        </p>
      </div>

      {/* Account section */}
      <Card className="bg-white rounded-3xl border border-border shadow-soft">
        <CardHeader className="p-6 border-b border-border/70 bg-muted/20 rounded-t-3xl">
          <CardTitle className="font-serif text-xl text-foreground">Account</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-lg border border-primary/20 shrink-0">
              {userInitial || "?"}
            </div>
            <div>
              <p className="font-medium text-lg text-foreground">{session?.user?.name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">
                {session?.user?.email || "No email"}
              </p>
            </div>
          </div>
          <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Edit Your Profile</DialogTitle>
                <DialogDescription>
                  Update your display name, bio, and social links.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProfileSave} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-lg h-10"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio (short description)</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about your wedding style or story..."
                    className="rounded-lg min-h-[80px]"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profileImage">Profile Image URL</Label>
                  <Input
                    id="profileImage"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://yourimage.com/profile.jpg"
                    className="rounded-lg h-10"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instagram">Instagram Username</Label>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle"
                    className="rounded-lg h-10"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tiktok">TikTok Username</Label>
                  <Input
                    id="tiktok"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@yourhandle"
                    className="rounded-lg h-10"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Personal Website/Blog</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="rounded-lg h-10"
                    disabled={isLoading}
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={isLoading} className="rounded-full">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="rounded-full shadow-soft">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Plan section */}
      <Card className="bg-white rounded-3xl border border-border shadow-soft">
        <CardHeader className="p-6 border-b border-border/70 bg-muted/20 rounded-t-3xl">
          <CardTitle className="font-serif text-xl text-foreground">Plan</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-lg text-foreground">Free Plan</p>
              <p className="text-sm text-muted-foreground">Basic features included</p>
            </div>
            <Link href="/choose-plan">
              <Button className="rounded-full shadow-soft">
                <ShieldQuestion className="h-4 w-4 mr-2" /> Upgrade
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="bg-white rounded-3xl border border-destructive/30 shadow-soft">
        <CardHeader className="p-6 border-b border-destructive/30 bg-destructive/10 rounded-t-3xl">
          <CardTitle className="font-serif text-xl text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-lg text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" className="rounded-full shadow-soft">
              <AlertTriangle className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}