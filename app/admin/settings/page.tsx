"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Hash,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  Gift,
  Copy,
  UserPlus,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  type: "percentage" | "fixed" | "free";
  value: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New promo code form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCode, setNewCode] = useState({
    code: "",
    description: "",
    type: "percentage" as "percentage" | "fixed" | "free",
    value: 0,
    maxUses: "",
    expiresAt: "",
  });

  // Upgrade user form
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes");
      const data = await res.json();
      setPromoCodes(data.codes || []);
    } catch (error) {
      console.error("Failed to fetch promo codes:", error);
      toast.error("Failed to load promo codes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleCreateCode = async () => {
    if (!newCode.code.trim()) {
      toast.error("Code is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCode),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create code");
      }
      
      toast.success(`Created promo code: ${data.code.code}`);
      setPromoCodes([data.code, ...promoCodes]);
      setNewCode({
        code: "",
        description: "",
        type: "percentage",
        value: 0,
        maxUses: "",
        expiresAt: "",
      });
      setShowNewForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create code");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (code: PromoCode) => {
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: code.id, isActive: !code.isActive }),
      });
      
      if (!res.ok) throw new Error("Failed to update");
      
      setPromoCodes(promoCodes.map(c => 
        c.id === code.id ? { ...c, isActive: !c.isActive } : c
      ));
      toast.success(`${code.code} ${code.isActive ? "deactivated" : "activated"}`);
    } catch (error) {
      toast.error("Failed to update code");
    }
  };

  const handleUpgradeClick = () => {
    if (!upgradeEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setShowUpgradeDialog(true);
  };

  const confirmUpgradeUser = async () => {
    setShowUpgradeDialog(false);
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/admin/users/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: upgradeEmail }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to upgrade user");
      }
      
      toast.success(data.message);
      setUpgradeEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upgrade user");
    } finally {
      setIsUpgrading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "free": return "Free Membership";
      case "percentage": return "Percentage Off";
      case "fixed": return "Fixed Amount Off";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "free": return "bg-green-100 text-green-700";
      case "percentage": return "bg-blue-100 text-blue-700";
      case "fixed": return "bg-purple-100 text-purple-700";
      default: return "bg-warm-100 text-warm-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-warm-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif tracking-wider uppercase text-warm-800">
            Discounts & Upgrades
          </h1>
          <p className="text-warm-500 mt-1">
            Manage promo codes and grant free memberships
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Promo Code
        </Button>
      </div>

      {/* Upgrade User Card */}
      <div className="bg-white border border-warm-200 rounded-lg mb-8">
        <div className="p-6 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-medium text-warm-800">Grant Free Membership</h2>
              <p className="text-sm text-warm-500">Upgrade an existing user to the Complete plan</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex gap-4">
            <input
              type="email"
              value={upgradeEmail}
              onChange={(e) => setUpgradeEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Button
              onClick={handleUpgradeClick}
              disabled={isUpgrading || !upgradeEmail.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpgrading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Upgrade to Complete
            </Button>
          </div>
          <p className="text-xs text-warm-400 mt-2">
            This permanently upgrades the user&apos;s account. Great for influencers, partners, and friends.
          </p>
        </div>
      </div>

      {/* Upgrade Confirmation Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently upgrade <strong>{upgradeEmail}</strong> to the Complete plan for free. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpgradeUser}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Confirm Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Promo Code Form */}
      {showNewForm && (
        <div className="bg-white border border-warm-200 rounded-lg mb-8">
          <div className="p-6 border-b border-warm-100">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-warm-800">Create New Promo Code</h2>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-warm-400 hover:text-warm-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Code
              </label>
              <input
                type="text"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                placeholder="WEDDING20"
                className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Internal Description (optional)
              </label>
              <input
                type="text"
                value={newCode.description}
                onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                placeholder="e.g., For TikTok influencer @weddingvibes"
                className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Discount Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setNewCode({ ...newCode, type: "free", value: 100 })}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    newCode.type === "free" 
                      ? "border-green-500 bg-green-50" 
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                >
                  <Gift className={`w-5 h-5 mb-2 ${newCode.type === "free" ? "text-green-600" : "text-warm-400"}`} />
                  <p className={`font-medium text-sm ${newCode.type === "free" ? "text-green-700" : "text-warm-700"}`}>
                    Free Membership
                  </p>
                  <p className="text-xs text-warm-500">Grants Complete plan</p>
                </button>
                <button
                  onClick={() => setNewCode({ ...newCode, type: "percentage" })}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    newCode.type === "percentage" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                >
                  <Percent className={`w-5 h-5 mb-2 ${newCode.type === "percentage" ? "text-blue-600" : "text-warm-400"}`} />
                  <p className={`font-medium text-sm ${newCode.type === "percentage" ? "text-blue-700" : "text-warm-700"}`}>
                    Percentage
                  </p>
                  <p className="text-xs text-warm-500">e.g., 20% off</p>
                </button>
                <button
                  onClick={() => setNewCode({ ...newCode, type: "fixed" })}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    newCode.type === "fixed" 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                >
                  <DollarSign className={`w-5 h-5 mb-2 ${newCode.type === "fixed" ? "text-purple-600" : "text-warm-400"}`} />
                  <p className={`font-medium text-sm ${newCode.type === "fixed" ? "text-purple-700" : "text-warm-700"}`}>
                    Fixed Amount
                  </p>
                  <p className="text-xs text-warm-500">e.g., $5 off</p>
                </button>
              </div>
            </div>

            {/* Value (only for percentage/fixed) */}
            {newCode.type !== "free" && (
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  {newCode.type === "percentage" ? "Percentage Off" : "Amount Off ($)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={newCode.type === "percentage" ? 100 : 29}
                    value={newCode.type === "fixed" ? newCode.value / 100 : newCode.value}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewCode({ 
                        ...newCode, 
                        value: newCode.type === "fixed" ? val * 100 : val 
                      });
                    }}
                    className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={newCode.type === "percentage" ? "20" : "5"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400">
                    {newCode.type === "percentage" ? "%" : "USD"}
                  </span>
                </div>
              </div>
            )}

            {/* Max Uses */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Maximum Uses (optional)
              </label>
              <input
                type="number"
                min="1"
                value={newCode.maxUses}
                onChange={(e) => setNewCode({ ...newCode, maxUses: e.target.value })}
                placeholder="Leave empty for unlimited"
                className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Expiration Date (optional)
              </label>
              <input
                type="datetime-local"
                value={newCode.expiresAt}
                onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
                className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-warm-100">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCode} disabled={isSaving}>
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Code
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Codes List */}
      <div className="bg-white border border-warm-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-medium text-warm-800">Promo Codes</h2>
              <p className="text-sm text-warm-500">
                {promoCodes.length} code{promoCodes.length !== 1 ? "s" : ""} created
              </p>
            </div>
          </div>
        </div>

        {promoCodes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-warm-300 mx-auto mb-4" />
            <p className="text-warm-500">No promo codes yet</p>
            <p className="text-sm text-warm-400 mt-1">
              Create your first promo code to offer discounts or free memberships
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {promoCodes.map((code) => (
              <div key={code.id} className={`p-4 ${!code.isActive ? "bg-warm-50 opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-warm-800">
                          {code.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-warm-400 hover:text-warm-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(code.type)}`}>
                          {getTypeLabel(code.type)}
                        </span>
                        {!code.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-warm-200 text-warm-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      {code.description && (
                        <p className="text-sm text-warm-500 mt-1">{code.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {code.type !== "free" && (
                      <div className="text-right">
                        <p className="text-warm-400 text-xs">Discount</p>
                        <p className="font-medium text-warm-700">
                          {code.type === "percentage" ? `${code.value}%` : `$${code.value / 100}`}
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-warm-400 text-xs">Uses</p>
                      <p className="font-medium text-warm-700">
                        {code.currentUses}{code.maxUses ? ` / ${code.maxUses}` : ""}
                      </p>
                    </div>
                    {code.expiresAt && (
                      <div className="text-right">
                        <p className="text-warm-400 text-xs">Expires</p>
                        <p className={`font-medium ${new Date(code.expiresAt) < new Date() ? "text-red-500" : "text-warm-700"}`}>
                          {new Date(code.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleToggleActive(code)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        code.isActive ? "bg-green-500" : "bg-warm-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          code.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How Promo Codes Work</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• <strong>Free Membership</strong> codes grant the Complete plan instantly when used</li>
          <li>• <strong>Percentage/Fixed</strong> codes apply discounts at checkout</li>
          <li>• Codes are case-insensitive (WEDDING20 = wedding20)</li>
          <li>• Set max uses to limit how many times a code can be redeemed</li>
          <li>• Deactivate codes anytime without deleting them</li>
        </ul>
      </div>
    </div>
  );
}
