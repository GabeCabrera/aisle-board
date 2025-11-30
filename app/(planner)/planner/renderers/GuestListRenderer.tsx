"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Share2, Copy, ExternalLink, Settings, ChevronDown, ChevronUp, Check, X, Gift, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { type BaseRendererProps, type RsvpFormData } from "./types";
import { RSVP_FIELD_OPTIONS, UpgradePrompt, UPGRADE_SUGGESTIONS } from "./shared";
import { useUserPlan } from "../context";
import { LayoutGrid } from "lucide-react";

export function GuestListRenderer({ page, fields, updateField }: BaseRendererProps) {
  const { isFree } = useUserPlan();
  const guests = (fields.guests as Record<string, unknown>[]) || [];
  const [rsvpForm, setRsvpForm] = useState<RsvpFormData | null>(null);
  const [isLoadingRsvp, setIsLoadingRsvp] = useState(true);
  const [showRsvpSetup, setShowRsvpSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [expandedGuest, setExpandedGuest] = useState<number | null>(null);
  
  // Form field settings
  const [formFields, setFormFields] = useState<Record<string, boolean>>({
    name: true,
    email: true,
    phone: false,
    address: true,
    attending: true,
    mealChoice: false,
    dietaryRestrictions: false,
    plusOne: false,
    plusOneName: false,
    plusOneMeal: false,
    songRequest: false,
    notes: true,
  });
  const [mealOptions, setMealOptions] = useState<string[]>([]);
  const [newMealOption, setNewMealOption] = useState("");

  // Fetch existing RSVP form
  useEffect(() => {
    const fetchRsvpForm = async () => {
      try {
        const response = await fetch(`/api/rsvp/create?pageId=${page.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setRsvpForm(data);
            setFormFields(data.fields || {});
            setMealOptions(data.mealOptions || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch RSVP form:", error);
      } finally {
        setIsLoadingRsvp(false);
      }
    };
    fetchRsvpForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  const createOrUpdateRsvpForm = async (isNew: boolean = false) => {
    if (isNew) setIsCreatingLink(true);
    else setIsSavingSettings(true);
    
    try {
      const response = await fetch("/api/rsvp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          title: "RSVP",
          fields: formFields,
          mealOptions: mealOptions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRsvpForm(data);
        toast.success(isNew ? "Link created!" : "Settings saved!");
        if (isNew) setShowRsvpSetup(false);
        else setShowSettings(false);
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      toast.error(isNew ? "Failed to create link" : "Failed to save settings");
    } finally {
      setIsCreatingLink(false);
      setIsSavingSettings(false);
    }
  };

  const copyLink = () => {
    if (rsvpForm) {
      const link = `${window.location.origin}/rsvp/${rsvpForm.slug}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    }
  };

  const toggleField = (key: string) => {
    if (key === "name") return;
    setFormFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addMealOption = () => {
    if (newMealOption.trim() && !mealOptions.includes(newMealOption.trim())) {
      setMealOptions([...mealOptions, newMealOption.trim()]);
      setNewMealOption("");
    }
  };

  const removeMealOption = (option: string) => {
    setMealOptions(mealOptions.filter(o => o !== option));
  };

  const addGuest = () => {
    const newGuest = {
      name: "",
      email: "",
      phone: "",
      address: "",
      rsvp: false,
      meal: "",
      giftReceived: false,
      thankYouSent: false,
    };
    updateField("guests", [...guests, newGuest]);
    setExpandedGuest(guests.length);
  };

  const updateGuest = (index: number, key: string, value: unknown) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [key]: value };
    updateField("guests", updated);
  };

  const removeGuest = (index: number) => {
    updateField("guests", guests.filter((_, i) => i !== index));
    if (expandedGuest === index) setExpandedGuest(null);
  };

  // Calculate stats
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.rsvp === true).length;
  const pendingGuests = totalGuests - confirmedGuests;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow-lg p-4 sm:p-6 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
        </div>

        {/* RSVP Link Section */}
        <div className="mb-6 md:mb-10 p-4 md:p-6 bg-warm-50 border border-warm-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <Share2 className="w-5 h-5 text-warm-500 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h3 className="font-medium text-warm-700">We Need Your Address</h3>
                <p className="text-sm text-warm-500">
                  Share a link for guests to send you their details
                </p>
              </div>
            </div>
            {isLoadingRsvp ? (
              <span className="text-sm text-warm-400">Loading...</span>
            ) : rsvpForm ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Customize</span>
                </Button>
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copy Link</span>
                </Button>
                <a
                  href={`/rsvp/${rsvpForm.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-warm-500 hover:text-warm-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <Button onClick={() => setShowRsvpSetup(true)} className="w-full sm:w-auto">
                <Share2 className="w-4 h-4 mr-2" />
                Create Link
              </Button>
            )}
          </div>
          {rsvpForm && (
            <div className="mt-4 pt-4 border-t border-warm-200">
              <div className="text-sm text-warm-600 break-all">
                <span className="font-mono bg-warm-100 px-2 py-1 text-xs rounded">
                  {typeof window !== "undefined" ? `${window.location.origin}/rsvp/${rsvpForm.slug}` : `/rsvp/${rsvpForm.slug}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-10">
          <div className="text-center p-3 md:p-4 bg-warm-50 border border-warm-200 rounded-lg">
            <p className="text-xl md:text-2xl font-light text-warm-700">{totalGuests}</p>
            <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500">Total</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xl md:text-2xl font-light text-green-600">{confirmedGuests}</p>
            <p className="text-[10px] md:text-xs tracking-wider uppercase text-green-600">Confirmed</p>
          </div>
          <div className="text-center p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xl md:text-2xl font-light text-amber-600">{pendingGuests}</p>
            <p className="text-[10px] md:text-xs tracking-wider uppercase text-amber-600">Pending</p>
          </div>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {isFree && confirmedGuests > 0 && (
          <UpgradePrompt
            variant="banner"
            title={UPGRADE_SUGGESTIONS.seatingChart.title}
            description={UPGRADE_SUGGESTIONS.seatingChart.description}
            featureName={UPGRADE_SUGGESTIONS.seatingChart.featureName}
            icon={<LayoutGrid className="w-5 h-5 text-purple-600" />}
          />
        )}

        {/* Add Guest Button */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <Label className="text-base">Guests</Label>
          <Button variant="outline" size="sm" onClick={addGuest}>
            <Plus className="w-4 h-4 mr-1" />
            Add Guest
          </Button>
        </div>

        {/* Guests - Desktop Table View */}
        <div className="hidden lg:block">
          {guests.length > 0 && (
            <>
              {/* Table Header */}
              <div className="border-b-2 border-warm-800 pb-2 grid grid-cols-[1.5fr,1fr,1fr,1.5fr,60px,80px,60px,60px,40px] gap-2 mb-2">
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Name</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Email</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Phone</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Address</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">RSVP</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Meal</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Gift</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Thanks</span>
                <span></span>
              </div>

              {/* Table Rows */}
              <div className="space-y-2">
                {guests.map((guest, index) => (
                  <div
                    key={index}
                    className="border-b border-warm-200 pb-2 grid grid-cols-[1.5fr,1fr,1fr,1.5fr,60px,80px,60px,60px,40px] gap-2 items-center group"
                  >
                    <Input
                      value={(guest.name as string) || ""}
                      onChange={(e) => updateGuest(index, "name", e.target.value)}
                      className="text-sm"
                      placeholder="Name"
                    />
                    <Input
                      value={(guest.email as string) || ""}
                      onChange={(e) => updateGuest(index, "email", e.target.value)}
                      className="text-sm"
                      placeholder="Email"
                    />
                    <Input
                      value={(guest.phone as string) || ""}
                      onChange={(e) => updateGuest(index, "phone", e.target.value)}
                      className="text-sm"
                      placeholder="Phone"
                    />
                    <Input
                      value={(guest.address as string) || ""}
                      onChange={(e) => updateGuest(index, "address", e.target.value)}
                      className="text-sm"
                      placeholder="Address"
                    />
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={(guest.rsvp as boolean) || false}
                        onChange={(e) => updateGuest(index, "rsvp", e.target.checked)}
                        className="w-4 h-4 border border-warm-400 accent-warm-400"
                      />
                    </div>
                    <Input
                      value={(guest.meal as string) || ""}
                      onChange={(e) => updateGuest(index, "meal", e.target.value)}
                      className="text-sm"
                      placeholder="Meal"
                    />
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={(guest.giftReceived as boolean) || false}
                        onChange={(e) => updateGuest(index, "giftReceived", e.target.checked)}
                        className="w-4 h-4 border border-warm-400 accent-warm-400"
                      />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={(guest.thankYouSent as boolean) || false}
                        onChange={(e) => updateGuest(index, "thankYouSent", e.target.checked)}
                        className="w-4 h-4 border border-warm-400 accent-warm-400"
                      />
                    </div>
                    <button
                      onClick={() => removeGuest(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Guests - Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {guests.map((guest, index) => {
            const isExpanded = expandedGuest === index;
            const guestName = (guest.name as string) || "New Guest";
            const hasRsvp = guest.rsvp === true;
            
            return (
              <div
                key={index}
                className="border border-warm-200 rounded-lg overflow-hidden bg-white"
              >
                {/* Card Header - Always Visible */}
                <button
                  onClick={() => setExpandedGuest(isExpanded ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      hasRsvp ? "bg-green-100" : "bg-warm-100"
                    }`}>
                      {hasRsvp ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-sm font-medium text-warm-500">
                          {guestName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-warm-800 truncate">
                        {guestName || "Unnamed Guest"}
                      </p>
                      <p className="text-xs text-warm-500">
                        {hasRsvp ? "Confirmed" : "Pending RSVP"}
                        {typeof guest.meal === 'string' && guest.meal && ` • ${guest.meal}`}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-warm-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-warm-400 flex-shrink-0" />
                  )}
                </button>

                {/* Card Body - Expandable */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-warm-100">
                    <div className="pt-4 space-y-3">
                      <div>
                        <Label className="text-xs text-warm-500">Name</Label>
                        <Input
                          value={(guest.name as string) || ""}
                          onChange={(e) => updateGuest(index, "name", e.target.value)}
                          placeholder="Guest name"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-warm-500">Email</Label>
                        <Input
                          type="email"
                          value={(guest.email as string) || ""}
                          onChange={(e) => updateGuest(index, "email", e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-warm-500">Phone</Label>
                        <Input
                          type="tel"
                          value={(guest.phone as string) || ""}
                          onChange={(e) => updateGuest(index, "phone", e.target.value)}
                          placeholder="(555) 555-5555"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-warm-500">Address</Label>
                        <Input
                          value={(guest.address as string) || ""}
                          onChange={(e) => updateGuest(index, "address", e.target.value)}
                          placeholder="Mailing address"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-warm-500">Meal Choice</Label>
                        <Input
                          value={(guest.meal as string) || ""}
                          onChange={(e) => updateGuest(index, "meal", e.target.value)}
                          placeholder="e.g., Chicken, Fish, Vegetarian"
                        />
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => updateGuest(index, "rsvp", !guest.rsvp)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          guest.rsvp
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-warm-50 border-warm-200 text-warm-500"
                        }`}
                      >
                        <Check className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">RSVP</span>
                      </button>
                      
                      <button
                        onClick={() => updateGuest(index, "giftReceived", !guest.giftReceived)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          guest.giftReceived
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : "bg-warm-50 border-warm-200 text-warm-500"
                        }`}
                      >
                        <Gift className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">Gift</span>
                      </button>
                      
                      <button
                        onClick={() => updateGuest(index, "thankYouSent", !guest.thankYouSent)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          guest.thankYouSent
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-warm-50 border-warm-200 text-warm-500"
                        }`}
                      >
                        <Mail className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">Thanks</span>
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => removeGuest(index)}
                      className="w-full py-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                    >
                      Remove Guest
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {guests.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <p className="text-sm text-warm-400 italic mb-4">
              No guests yet. Add guests manually or share your RSVP link.
            </p>
            <Button variant="outline" onClick={addGuest}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Guest
            </Button>
          </div>
        )}
      </div>

      {/* RSVP Setup Dialog */}
      <Dialog open={showRsvpSetup} onOpenChange={setShowRsvpSetup}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>We Need Your Address</DialogTitle>
            <DialogDescription>
              Choose what information to collect from your guests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-warm-700">Information to collect:</p>
              {RSVP_FIELD_OPTIONS.map((field) => (
                <div key={field.key} className="flex items-center justify-between py-2 border-b border-warm-100">
                  <div>
                    <p className="text-sm font-medium text-warm-700">
                      {field.label}
                      {field.required && <span className="text-warm-400 ml-1">(required)</span>}
                    </p>
                    <p className="text-xs text-warm-500">{field.description}</p>
                  </div>
                  <Switch
                    checked={formFields[field.key] || false}
                    onCheckedChange={() => toggleField(field.key)}
                    disabled={field.required}
                  />
                </div>
              ))}
            </div>

            {formFields.mealChoice && (
              <div className="space-y-3 pt-4 border-t border-warm-200">
                <p className="text-sm font-medium text-warm-700">Meal Options</p>
                <p className="text-xs text-warm-500">Add the meal choices for your reception</p>
                <div className="flex gap-2">
                  <Input
                    value={newMealOption}
                    onChange={(e) => setNewMealOption(e.target.value)}
                    placeholder="e.g., Chicken, Fish, Vegetarian"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMealOption())}
                  />
                  <Button variant="outline" onClick={addMealOption}>Add</Button>
                </div>
                {mealOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mealOptions.map((option) => (
                      <span
                        key={option}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-warm-100 text-warm-700 text-sm rounded"
                      >
                        {option}
                        <button
                          onClick={() => removeMealOption(option)}
                          className="text-warm-400 hover:text-warm-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            <Button variant="outline" onClick={() => setShowRsvpSetup(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => createOrUpdateRsvpForm(true)} 
              disabled={isCreatingLink}
              className="flex-1 bg-warm-600 hover:bg-warm-700 text-white"
            >
              {isCreatingLink ? "Creating..." : "Create Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Your Form</DialogTitle>
            <DialogDescription>
              Update what information you collect from guests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-warm-700">Information to collect:</p>
              {RSVP_FIELD_OPTIONS.map((field) => (
                <div key={field.key} className="flex items-center justify-between py-2 border-b border-warm-100">
                  <div>
                    <p className="text-sm font-medium text-warm-700">
                      {field.label}
                      {field.required && <span className="text-warm-400 ml-1">(required)</span>}
                    </p>
                    <p className="text-xs text-warm-500">{field.description}</p>
                  </div>
                  <Switch
                    checked={formFields[field.key] || false}
                    onCheckedChange={() => toggleField(field.key)}
                    disabled={field.required}
                  />
                </div>
              ))}
            </div>

            {formFields.mealChoice && (
              <div className="space-y-3 pt-4 border-t border-warm-200">
                <p className="text-sm font-medium text-warm-700">Meal Options</p>
                <p className="text-xs text-warm-500">Add the meal choices for your reception</p>
                <div className="flex gap-2">
                  <Input
                    value={newMealOption}
                    onChange={(e) => setNewMealOption(e.target.value)}
                    placeholder="e.g., Chicken, Fish, Vegetarian"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMealOption())}
                  />
                  <Button variant="outline" onClick={addMealOption}>Add</Button>
                </div>
                {mealOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mealOptions.map((option) => (
                      <span
                        key={option}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-warm-100 text-warm-700 text-sm rounded"
                      >
                        {option}
                        <button
                          onClick={() => removeMealOption(option)}
                          className="text-warm-400 hover:text-warm-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => createOrUpdateRsvpForm(false)} 
              disabled={isSavingSettings}
              className="flex-1 bg-warm-600 hover:bg-warm-700 text-white"
            >
              {isSavingSettings ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
