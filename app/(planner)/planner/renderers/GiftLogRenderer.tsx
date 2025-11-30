"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Package, ChevronDown, ChevronUp, Check } from "lucide-react";
import { type RendererWithAllPagesProps } from "./types";

export function GiftLogRenderer({ page, fields, updateField }: RendererWithAllPagesProps) {
  const gifts = (fields.gifts as Record<string, unknown>[]) || [];
  const [expandedGift, setExpandedGift] = useState<number | null>(null);

  const addGift = () => {
    updateField("gifts", [...gifts, { from: "", item: "", event: "", dateReceived: "", thankYouSent: false, notes: "" }]);
  };

  const updateGift = (index: number, key: string, value: unknown) => {
    const updated = [...gifts];
    updated[index] = { ...updated[index], [key]: value };
    updateField("gifts", updated);
  };

  const removeGift = (index: number) => {
    updateField("gifts", gifts.filter((_, i) => i !== index));
  };

  // Stats
  const totalGifts = gifts.length;
  const thankYousSent = gifts.filter(g => g.thankYouSent).length;
  const thankYousPending = totalGifts - thankYousSent;

  // Group by event
  const weddingGifts = gifts.filter(g => g.event === "Wedding");
  const showerGifts = gifts.filter(g => g.event === "Bridal Shower");
  const engagementGifts = gifts.filter(g => g.event === "Engagement Party");
  const otherGifts = gifts.filter(g => g.event === "Other" || !g.event);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-0">
      <div className="bg-white shadow-lg p-4 md:p-8 lg:p-12">
        {/* Page Header */}
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-3 md:mt-4" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-10">
          <div className="text-center p-2 md:p-4 bg-warm-50 border border-warm-200 rounded-lg">
            <p className="text-lg md:text-2xl font-light text-warm-700">{totalGifts}</p>
            <p className="text-[9px] md:text-xs tracking-wider uppercase text-warm-500">Gifts</p>
          </div>
          <div className="text-center p-2 md:p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-lg md:text-2xl font-light text-green-600">{thankYousSent}</p>
            <p className="text-[9px] md:text-xs tracking-wider uppercase text-green-600">Sent</p>
          </div>
          <div className="text-center p-2 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-lg md:text-2xl font-light text-amber-600">{thankYousPending}</p>
            <p className="text-[9px] md:text-xs tracking-wider uppercase text-amber-600">Pending</p>
          </div>
        </div>

        {/* Quick Stats by Event */}
        {totalGifts > 0 && (
          <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6">
            {weddingGifts.length > 0 && (
              <span className="px-2 md:px-3 py-1 bg-pink-100 text-pink-700 text-xs md:text-sm rounded-full">
                Wedding: {weddingGifts.length}
              </span>
            )}
            {showerGifts.length > 0 && (
              <span className="px-2 md:px-3 py-1 bg-purple-100 text-purple-700 text-xs md:text-sm rounded-full">
                Shower: {showerGifts.length}
              </span>
            )}
            {engagementGifts.length > 0 && (
              <span className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 text-xs md:text-sm rounded-full">
                Engagement: {engagementGifts.length}
              </span>
            )}
            {otherGifts.length > 0 && (
              <span className="px-2 md:px-3 py-1 bg-warm-100 text-warm-700 text-xs md:text-sm rounded-full">
                Other: {otherGifts.length}
              </span>
            )}
          </div>
        )}

        {/* Add Gift Button */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
            <h3 className="text-base md:text-lg font-medium text-warm-700">Gifts Received</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={addGift}>
            <Plus className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">Add Gift</span>
          </Button>
        </div>

        {/* Gifts */}
        {gifts.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              {/* Table Header */}
              <div className="border-b-2 border-warm-800 pb-2 grid grid-cols-[1.5fr,1.5fr,120px,100px,80px,1fr,40px] gap-2 mb-2">
                <span className="text-[10px] tracking-wider uppercase text-warm-500">From</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Gift</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Event</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Date</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Thanks</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Notes</span>
                <span></span>
              </div>

              <div className="space-y-2">
                {gifts.map((gift, index) => (
                  <div
                    key={index}
                    className={`border-b border-warm-200 pb-2 grid grid-cols-[1.5fr,1.5fr,120px,100px,80px,1fr,40px] gap-2 items-center group ${
                      gift.thankYouSent ? "bg-green-50/50 rounded" : ""
                    }`}
                  >
                    <Input
                      value={(gift.from as string) || ""}
                      onChange={(e) => updateGift(index, "from", e.target.value)}
                      placeholder="Who gave it?"
                      className="text-sm"
                    />
                    <Input
                      value={(gift.item as string) || ""}
                      onChange={(e) => updateGift(index, "item", e.target.value)}
                      placeholder="What was it?"
                      className="text-sm"
                    />
                    <select
                      value={(gift.event as string) || ""}
                      onChange={(e) => updateGift(index, "event", e.target.value)}
                      className="px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white rounded"
                    >
                      <option value="">Event...</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Bridal Shower">Bridal Shower</option>
                      <option value="Engagement Party">Engagement</option>
                      <option value="Other">Other</option>
                    </select>
                    <Input
                      type="date"
                      value={(gift.dateReceived as string) || ""}
                      onChange={(e) => updateGift(index, "dateReceived", e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={(gift.thankYouSent as boolean) || false}
                        onChange={(e) => updateGift(index, "thankYouSent", e.target.checked)}
                        className="w-5 h-5 accent-green-500"
                      />
                    </div>
                    <Input
                      value={(gift.notes as string) || ""}
                      onChange={(e) => updateGift(index, "notes", e.target.value)}
                      placeholder="Notes"
                      className="text-sm"
                    />
                    <button
                      onClick={() => removeGift(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {gifts.map((gift, index) => (
                <div
                  key={index}
                  className={`border border-warm-200 rounded-lg overflow-hidden ${
                    gift.thankYouSent ? "bg-green-50" : ""
                  }`}
                >
                  <button
                    onClick={() => setExpandedGift(expandedGift === index ? null : index)}
                    className="w-full p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Package className={`w-4 h-4 flex-shrink-0 ${gift.thankYouSent ? "text-green-500" : "text-warm-400"}`} />
                      <div className="min-w-0 text-left">
                        <span className="font-medium text-sm text-warm-700 block truncate">
                          {(gift.from as string) || "Unknown"}
                        </span>
                        <span className="text-xs text-warm-500 block truncate">
                          {(gift.item as string) || "Gift"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gift.thankYouSent === true && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {expandedGift === index ? (
                        <ChevronUp className="w-4 h-4 text-warm-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-warm-400" />
                      )}
                    </div>
                  </button>
                  
                  {expandedGift === index && (
                    <div className="p-3 pt-0 space-y-2 border-t border-warm-100">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-warm-500">From</Label>
                          <Input
                            value={(gift.from as string) || ""}
                            onChange={(e) => updateGift(index, "from", e.target.value)}
                            placeholder="Who?"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-warm-500">Gift</Label>
                          <Input
                            value={(gift.item as string) || ""}
                            onChange={(e) => updateGift(index, "item", e.target.value)}
                            placeholder="What?"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-warm-500">Event</Label>
                          <select
                            value={(gift.event as string) || ""}
                            onChange={(e) => updateGift(index, "event", e.target.value)}
                            className="w-full px-2 py-1.5 border border-warm-300 text-sm bg-white rounded"
                          >
                            <option value="">Event...</option>
                            <option value="Wedding">Wedding</option>
                            <option value="Bridal Shower">Shower</option>
                            <option value="Engagement Party">Engagement</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-warm-500">Date</Label>
                          <Input
                            type="date"
                            value={(gift.dateReceived as string) || ""}
                            onChange={(e) => updateGift(index, "dateReceived", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-warm-500">Notes</Label>
                        <Input
                          value={(gift.notes as string) || ""}
                          onChange={(e) => updateGift(index, "notes", e.target.value)}
                          placeholder="Notes for thank you"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(gift.thankYouSent as boolean) || false}
                            onChange={(e) => updateGift(index, "thankYouSent", e.target.checked)}
                            className="w-4 h-4 accent-green-500"
                          />
                          <span className="text-sm text-warm-600">Thank you sent</span>
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeGift(index)}
                          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs md:text-sm text-warm-400 italic text-center py-6 md:py-8 bg-warm-50 rounded-lg">
            No gifts logged yet. Add gifts as you receive them!
          </p>
        )}
      </div>
    </div>
  );
}
