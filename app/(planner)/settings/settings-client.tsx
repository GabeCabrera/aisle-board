"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Bell, 
  Download,
  Trash2,
  LogOut,
  CreditCard,
  Mail,
  Lock,
  Palette
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SettingsClientProps {
  user: {
    name: string | null;
    email: string;
  };
  tenant: {
    displayName: string;
    weddingDate: Date | null;
    plan: string;
  };
}

export function SettingsClient({ user, tenant }: SettingsClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState(tenant.displayName);
  const [weddingDate, setWeddingDate] = useState(
    tenant.weddingDate ? new Date(tenant.weddingDate).toISOString().split("T")[0] : ""
  );
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, weddingDate: weddingDate || null }),
      });

      if (!response.ok) throw new Error("Failed to save");
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }
      
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aisle-planner-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      toast.success("Data exported");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and all your wedding planning data will be permanently lost."
    );
    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );
    if (doubleConfirm !== "DELETE") {
      toast.error("Account deletion cancelled");
      return;
    }

    setIsLoading(true);
    try {
      await fetch("/api/settings/delete-account", { method: "POST" });
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to delete account");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <main className="min-h-screen bg-warm-50/30">
      {/* Header */}
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-warm-500 hover:text-warm-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-serif tracking-wider uppercase">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Section */}
        <section className="bg-white border border-warm-200 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-warm-500" />
            <h2 className="text-sm font-medium tracking-wider uppercase text-warm-700">
              Profile
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Names</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sarah & James"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-warm-50 text-warm-500"
              />
              <p className="text-xs text-warm-400">Contact support to change your email</p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="bg-warm-600 hover:bg-warm-700 text-white"
            >
              Save Profile
            </Button>
          </div>
        </section>

        {/* Wedding Date Section */}
        <section className="bg-white border border-warm-200 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-warm-500" />
            <h2 className="text-sm font-medium tracking-wider uppercase text-warm-700">
              Wedding Date
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weddingDate">Date</Label>
              <Input
                id="weddingDate"
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
              />
              <p className="text-xs text-warm-400">
                This helps us show relevant timelines and countdowns
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="bg-warm-600 hover:bg-warm-700 text-white"
            >
              Save Date
            </Button>
          </div>
        </section>

        {/* Password Section */}
        <section className="bg-white border border-warm-200 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-warm-500" />
            <h2 className="text-sm font-medium tracking-wider uppercase text-warm-700">
              Change Password
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isLoading || !currentPassword || !newPassword}
              variant="outline"
            >
              Change Password
            </Button>
          </div>
        </section>

        {/* Plan Section */}
        <section className="bg-white border border-warm-200 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-warm-500" />
            <h2 className="text-sm font-medium tracking-wider uppercase text-warm-700">
              Your Plan
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-warm-700 capitalize">{tenant.plan}</p>
              <p className="text-sm text-warm-500">
                {tenant.plan === "complete" 
                  ? "Lifetime access to all features" 
                  : "Basic features with PDF downloads"
                }
              </p>
            </div>
            {tenant.plan === "free" && (
              <Link href="/choose-plan">
                <Button className="bg-warm-600 hover:bg-warm-700 text-white">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Export Data Section */}
        <section className="bg-white border border-warm-200 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-5 h-5 text-warm-500" />
            <h2 className="text-sm font-medium tracking-wider uppercase text-warm-700">
              Export Data
            </h2>
          </div>

          <p className="text-sm text-warm-600 mb-4">
            Download all your wedding planning data as a JSON file.
          </p>

          <Button onClick={handleExportData} disabled={isLoading} variant="outline">
            Export My Data
          </Button>
        </section>

        {/* Sign Out */}
        <section className="bg-white border border-warm-200 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <LogOut className="w-5 h-5 text-warm-500" />
            <h2 className="text-sm font-medium tracking-wider uppercase text-warm-700">
              Sign Out
            </h2>
          </div>

          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </section>

        {/* Danger Zone */}
        <section className="bg-white border border-red-200 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-medium tracking-wider uppercase text-red-600">
              Danger Zone
            </h2>
          </div>

          <p className="text-sm text-warm-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <Button 
            onClick={handleDeleteAccount} 
            disabled={isLoading}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Delete Account
          </Button>
        </section>
      </div>
    </main>
  );
}
