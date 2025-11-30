"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Tag, 
  Percent,
  DollarSign,
  Calendar,
  Hash,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiscountConfig {
  enabled: boolean;
  type: "percentage" | "fixed";
  value: number;
  code?: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
}

export default function SettingsPage() {
  const [discount, setDiscount] = useState<DiscountConfig>({
    enabled: false,
    type: "percentage",
    value: 0,
    currentUses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDiscount = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/manage-x7k9/discount");
      const data = await res.json();
      setDiscount(data);
    } catch (error) {
      console.error("Failed to fetch discount:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscount();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/manage-x7k9/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discount),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      const data = await res.json();
      setDiscount(data.discount);
      setMessage({ type: "success", text: "Discount settings saved!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetUses = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/manage-x7k9/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...discount, resetUses: true }),
      });
      
      if (!res.ok) throw new Error("Failed to reset");
      
      const data = await res.json();
      setDiscount(data.discount);
      setMessage({ type: "success", text: "Usage counter reset!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to reset counter" });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate preview pricing
  const originalPrice = 29;
  let discountedPrice = originalPrice;
  if (discount.enabled && discount.value > 0) {
    if (discount.type === "percentage") {
      discountedPrice = originalPrice - (originalPrice * discount.value / 100);
    } else {
      discountedPrice = originalPrice - (discount.value / 100);
    }
    discountedPrice = Math.max(0, discountedPrice);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-warm-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-warm-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manage-x7k9" className="text-warm-500 hover:text-warm-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-serif tracking-wider uppercase">Settings</h1>
                <p className="text-xs text-warm-400">Discount & Pricing</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-green-50 border border-green-200 text-green-700" 
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Discount Settings Card */}
        <div className="bg-white border border-warm-200 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-warm-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-medium text-warm-800">Discount Settings</h2>
                  <p className="text-sm text-warm-500">Configure pricing discounts for new customers</p>
                </div>
              </div>
              
              {/* Enable Toggle */}
              <button
                onClick={() => setDiscount(d => ({ ...d, enabled: !d.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  discount.enabled ? "bg-purple-600" : "bg-warm-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    discount.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className={`p-6 space-y-6 ${!discount.enabled ? "opacity-50 pointer-events-none" : ""}`}>
            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Discount Type
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setDiscount(d => ({ ...d, type: "percentage" }))}
                  className={`flex-1 p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                    discount.type === "percentage" 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                >
                  <Percent className={`w-5 h-5 ${discount.type === "percentage" ? "text-purple-600" : "text-warm-400"}`} />
                  <div className="text-left">
                    <p className={`font-medium ${discount.type === "percentage" ? "text-purple-700" : "text-warm-700"}`}>
                      Percentage
                    </p>
                    <p className="text-xs text-warm-500">e.g., 20% off</p>
                  </div>
                </button>
                <button
                  onClick={() => setDiscount(d => ({ ...d, type: "fixed" }))}
                  className={`flex-1 p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                    discount.type === "fixed" 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                >
                  <DollarSign className={`w-5 h-5 ${discount.type === "fixed" ? "text-purple-600" : "text-warm-400"}`} />
                  <div className="text-left">
                    <p className={`font-medium ${discount.type === "fixed" ? "text-purple-700" : "text-warm-700"}`}>
                      Fixed Amount
                    </p>
                    <p className="text-xs text-warm-500">e.g., $5 off</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                {discount.type === "percentage" ? "Percentage Off" : "Amount Off (in dollars)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={discount.type === "percentage" ? 100 : 2900}
                  value={discount.type === "percentage" ? discount.value : discount.value / 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDiscount(d => ({ 
                      ...d, 
                      value: d.type === "percentage" ? val : val * 100 
                    }));
                  }}
                  className="w-full px-4 py-3 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={discount.type === "percentage" ? "20" : "5"}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400">
                  {discount.type === "percentage" ? "%" : "USD"}
                </span>
              </div>
            </div>

            {/* Promo Code */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Promo Code (optional)
              </label>
              <input
                type="text"
                value={discount.code || ""}
                onChange={(e) => setDiscount(d => ({ ...d, code: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-3 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                placeholder="WEDDING20"
              />
              <p className="text-xs text-warm-400 mt-1">
                Leave empty to apply discount automatically to all customers
              </p>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Expiration Date (optional)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={discount.expiresAt?.slice(0, 16) || ""}
                  onChange={(e) => setDiscount(d => ({ ...d, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                  className="w-full px-4 py-3 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400 pointer-events-none" />
              </div>
            </div>

            {/* Max Uses */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Maximum Uses (optional)
              </label>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    value={discount.maxUses || ""}
                    onChange={(e) => setDiscount(d => ({ ...d, maxUses: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-4 py-3 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="100"
                  />
                  <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400 pointer-events-none" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-warm-50 rounded-lg border border-warm-200">
                  <span className="text-sm text-warm-600">Used:</span>
                  <span className="font-medium text-warm-800">{discount.currentUses}</span>
                  {discount.currentUses > 0 && (
                    <button
                      onClick={handleResetUses}
                      className="text-xs text-purple-600 hover:text-purple-700 underline ml-2"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-warm-400 mt-1">
                Leave empty for unlimited uses
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="p-6 bg-warm-50 border-t border-warm-200">
            <h3 className="text-sm font-medium text-warm-700 mb-4">Pricing Preview</h3>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-warm-500 mb-1">Original</p>
                <p className={`text-2xl font-light ${discount.enabled ? "text-warm-400 line-through" : "text-warm-800"}`}>
                  $29
                </p>
              </div>
              {discount.enabled && discount.value > 0 && (
                <>
                  <div className="text-warm-300">→</div>
                  <div className="text-center">
                    <p className="text-xs text-green-600 mb-1">
                      {discount.type === "percentage" ? `${discount.value}% off` : `$${discount.value / 100} off`}
                    </p>
                    <p className="text-2xl font-light text-green-600">
                      ${discountedPrice.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {discount.enabled && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                <p className="text-sm text-purple-700">
                  <strong>Active:</strong>{" "}
                  {discount.code ? `Code "${discount.code}" required` : "Applied automatically"}{" "}
                  {discount.expiresAt && `• Expires ${new Date(discount.expiresAt).toLocaleDateString()}`}{" "}
                  {discount.maxUses && `• ${discount.maxUses - discount.currentUses} uses remaining`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-warm-400 mt-6 text-center">
          Note: Discount settings are stored in memory and will reset on server redeploy.
          For persistent discounts, consider using Stripe Coupons.
        </p>
      </div>
    </main>
  );
}
