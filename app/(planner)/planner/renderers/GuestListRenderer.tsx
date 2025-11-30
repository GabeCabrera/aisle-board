"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Share2, Copy, ExternalLink, Settings } from "lucide-react";
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
    if (key === "name") return; // Name is always required
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
  };

  const updateGuest = (index: number, key: string, value: unknown) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [key]: value };
    updateField("guests", updated);
  };

  const removeGuest = (index: number) => {
    updateField("guests", guests.filter((_, i) => i !== index));
  };

  // Calculate stats
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.rsvp === true).length;
  const pendingGuests = totalGuests - confirmedGuests;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow-lg p-8 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
        </div>

        {/* RSVP Link Section */}
        <div className="mb-10 p-6 bg-warm-50 border border-warm-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-warm-500" />
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
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
              <Button onClick={() => setShowRsvpSetup(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Create Link
              </Button>
            )}
          </div>
          {rsvpForm && (
            <div className="mt-4 pt-4 border-t border-warm-200">
              <div className="flex items-center gap-2 text-sm text-warm-600">
                <span className="font-mono bg-warm-100 px-2 py-1 text-xs">
                  {typeof window !== "undefined" ? `${window.location.origin}/rsvp/${rsvpForm.slug}` : `/rsvp/${rsvpForm.slug}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="text-center p-4 bg-warm-50 border border-warm-200">
            <p className="text-2xl font-light text-warm-700">{totalGuests}</p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Total Guests</p>
          </div>
          <div className="text-center p-4 bg-green-50 border border-green-200">
            <p className="text-2xl font-light text-green-600">{confirmedGuests}</p>
            <p className="text-xs tracking-wider uppercase text-green-600">Confirmed</p>
          </div>
          <div className="text-center p-4 bg-amber-50 border border-amber-200">
            <p className="text-2xl font-light text-amber-600">{pendingGuests}</p>
            <p className="text-xs tracking-wider uppercase text-amber-600">Pending</p>
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
        <div className="flex justify-between items-center mb-6">
          <Label>Guests</Label>
          <Button variant="ghost" size="sm" onClick={addGuest}>
            <Plus className="w-4 h-4 mr-1" />
            Add Guest
          </Button>
        </div>

        {/* Guests Table */}
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

        {guests.length === 0 && (
          <p className="text-sm text-warm-400 italic text-center py-8">
            No guests yet. Add guests manually or share your RSVP link to collect responses.
          </p>
        )}
      </div>

      {/* RSVP Setup Dialog (Initial Creation) */}
      <Dialog open={showRsvpSetup} onOpenChange={setShowRsvpSetup}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>We Need Your Address</DialogTitle>
            <DialogDescription>
              Choose what information to collect from your guests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Field toggles */}
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

            {/* Meal options */}
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
                        className="inline-flex items-center gap-1 px-2 py-1 bg-warm-100 text-warm-700 text-sm"
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

      {/* Settings Dialog (Edit Existing) */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Your Form</DialogTitle>
            <DialogDescription>
              Update what information you collect from guests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Field toggles */}
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

            {/* Meal options */}
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
                        className="inline-flex items-center gap-1 px-2 py-1 bg-warm-100 text-warm-700 text-sm"
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
