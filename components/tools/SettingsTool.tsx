"use client";

import { useSession, signOut } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldQuestion,
  AlertTriangle,
  Loader2,
  Save,
  UserPlus,
  Check,
  Mail,
  RefreshCw,
} from "lucide-react";

interface PartnerStatus {
  hasPartner: boolean;
  partner: { name: string; email: string } | null;
  pendingInvite: { email: string; createdAt: string; expiresAt: string } | null;
}

export default function SettingsTool() {
  const { data: session } = useSession();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Partner invite state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [isLoadingPartnerStatus, setIsLoadingPartnerStatus] = useState(true);

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");

  // Load initial values when session is available
  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session]);

  // Load partner status
  useEffect(() => {
    async function loadPartnerStatus() {
      try {
        const response = await fetch("/api/partner/invite");
        if (response.ok) {
          const data = await response.json();
          setPartnerStatus(data);
        }
      } catch (error) {
        console.error("Failed to load partner status:", error);
      } finally {
        setIsLoadingPartnerStatus(false);
      }
    }

    if (session?.user) {
      loadPartnerStatus();
    }
  }, [session]);

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase();

  const handleInvitePartner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerEmail) {
      toast.error("Please enter your partner's email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsInviting(true);

    try {
      const response = await fetch("/api/partner/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: partnerEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success("Invitation sent successfully!");
      setIsInviteDialogOpen(false);
      setPartnerEmail("");

      // Refresh partner status
      const statusResponse = await fetch("/api/partner/invite");
      if (statusResponse.ok) {
        setPartnerStatus(await statusResponse.json());
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async () => {
    if (!partnerStatus?.pendingInvite?.email) return;

    setIsInviting(true);

    try {
      const response = await fetch("/api/partner/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: partnerStatus.pendingInvite.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend invitation");
      }

      toast.success("Invitation resent successfully!");

      // Refresh partner status
      const statusResponse = await fetch("/api/partner/invite");
      if (statusResponse.ok) {
        setPartnerStatus(await statusResponse.json());
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          profileImage,
          socialLinks: {
            instagram,
            tiktok,
            website,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      toast.success("Profile updated successfully!");
      setIsEditProfileOpen(false);
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/settings/delete-account", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success("Account deleted. Goodbye!");
      // Sign out and redirect to home
      signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to delete account. Please try again.");
      setIsDeleting(false);
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

      {/* Account Section */}
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
          <div className="flex gap-3">
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
          </div>
        </CardContent>
      </Card>

      {/* Partner Collaboration Section */}
      <Card className="bg-white rounded-3xl border border-border shadow-soft">
        <CardHeader className="p-6 border-b border-border/70 bg-muted/20 rounded-t-3xl">
          <CardTitle className="font-serif text-xl text-foreground">Partner Collaboration</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingPartnerStatus ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : partnerStatus?.hasPartner ? (
            // Partner already joined
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{partnerStatus.partner?.name || "Partner"}</p>
                  <p className="text-sm text-muted-foreground">{partnerStatus.partner?.email}</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
          ) : partnerStatus?.pendingInvite ? (
            // Pending invite
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Invitation Pending</p>
                    <p className="text-sm text-muted-foreground">{partnerStatus.pendingInvite.email}</p>
                  </div>
                </div>
                <Button
                  onClick={handleResendInvite}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Invitation expires {new Date(partnerStatus.pendingInvite.expiresAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            // No partner, show invite option
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-lg text-foreground">Invite Partner</p>
                <p className="text-sm text-muted-foreground">
                  Share your board and plan together in real-time.
                </p>
              </div>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full shadow-soft bg-secondary hover:bg-secondary/90 text-white">
                    <UserPlus className="h-4 w-4 mr-2" /> Invite
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Invite Your Partner</DialogTitle>
                    <DialogDescription>
                      Send an invitation to your partner's email. They'll receive a link to create their account and join your wedding planner.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvitePartner} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="partnerEmail">Partner's Email</Label>
                      <Input
                        id="partnerEmail"
                        type="email"
                        placeholder="partner@example.com"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        className="rounded-lg h-10"
                        disabled={isInviting}
                        required
                      />
                    </div>
                    <DialogFooter className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteDialogOpen(false)}
                        disabled={isInviting}
                        className="rounded-full"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isInviting} className="rounded-full shadow-soft">
                        {isInviting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
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
            <Button
              variant="destructive"
              className="rounded-full shadow-soft"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-destructive">
              Delete Account Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete your
                account and remove all your data from our servers, including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Your wedding planning data (budget, guests, vendors)</li>
                <li>All boards and saved ideas</li>
                <li>Your profile and social connections</li>
                <li>Messages and conversation history</li>
              </ul>
              <p className="pt-2">
                Type <strong className="text-foreground">DELETE</strong> to confirm:
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="rounded-lg h-10 mt-2"
                disabled={isDeleting}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-full"
              onClick={() => {
                setDeleteConfirmation("");
                setIsDeleteDialogOpen(false);
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
              className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
