"use client";

import { type Page } from "@/lib/db/schema";
import { getTemplateById } from "@/lib/templates/registry";
import { isSharedField } from "@/lib/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Link as LinkIcon, Share2, Copy, ExternalLink, Settings, MessageSquare, Mail, Smartphone, Send, Users2, Crown, Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageRendererProps {
  page: Page;
  onFieldChange: (fields: Record<string, unknown>) => void;
  allPages?: Page[]; // For cross-template data aggregation
}

export function PageRenderer({ page, onFieldChange, allPages = [] }: PageRendererProps) {
  const template = getTemplateById(page.templateId);
  const fields = page.fields as Record<string, unknown>;

  if (!template) {
    return (
      <div className="text-center text-warm-500 py-12">
        Template not found
      </div>
    );
  }

  const updateField = (key: string, value: unknown) => {
    onFieldChange({ ...fields, [key]: value });
  };

  // Special rendering for cover page
  if (page.templateId === "cover") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg aspect-[8.5/11] p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-px bg-warm-400 mb-8" />
          
          <h1 className="text-5xl font-serif font-light tracking-widest uppercase mb-2">
            Wedding
          </h1>
          <p className="text-sm tracking-[0.4em] uppercase text-warm-500 mb-8">
            Planner
          </p>
          
          <div className="w-16 h-px bg-warm-400 mb-12" />
          
          <div className="w-full max-w-xs space-y-8">
            <div>
              <FieldLabel label="Names" fieldKey="names" />
              <Input
                value={(fields.names as string) || ""}
                onChange={(e) => updateField("names", e.target.value)}
                className="text-center"
                placeholder="Sarah & Gabe"
              />
            </div>
            <div>
              <FieldLabel label="Wedding Date" fieldKey="weddingDate" />
              <Input
                type="date"
                value={(fields.weddingDate as string) || ""}
                onChange={(e) => updateField("weddingDate", e.target.value)}
                className="text-center"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Special rendering for budget page
  if (page.templateId === "budget") {
    return (
      <BudgetRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
    );
  }

  // Special rendering for guest list page
  if (page.templateId === "guest-list") {
    return (
      <GuestListRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
    );
  }

  // Special rendering for wedding overview dashboard
  if (page.templateId === "overview") {
    return (
      <OverviewRenderer
        page={page}
        fields={fields}
        updateField={updateField}
        allPages={allPages}
      />
    );
  }

  // Special rendering for wedding party with messaging
  if (page.templateId === "wedding-party") {
    return (
      <WeddingPartyRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-lg p-8 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
        </div>

        {/* Fields */}
        <div className="space-y-8">
          {template.fields.map((field) => (
            <div key={field.key}>
              {field.type === "text" && (
                <div className="space-y-2">
                  <FieldLabel label={field.label} fieldKey={field.key} />
                  <Input
                    value={(fields[field.key] as string) || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              )}

              {field.type === "date" && (
                <div className="space-y-2">
                  <FieldLabel label={field.label} fieldKey={field.key} />
                  <Input
                    type="date"
                    value={(fields[field.key] as string) || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                </div>
              )}

              {field.type === "number" && (
                <div className="space-y-2">
                  <FieldLabel label={field.label} fieldKey={field.key} />
                  <Input
                    type="number"
                    value={(fields[field.key] as string) || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}

              {field.type === "textarea" && (
                <div className="space-y-2">
                  <FieldLabel label={field.label} fieldKey={field.key} />
                  <Textarea
                    value={(fields[field.key] as string) || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    rows={5}
                  />
                </div>
              )}

              {field.type === "checkbox" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(fields[field.key] as boolean) || false}
                    onChange={(e) => updateField(field.key, e.target.checked)}
                    className="w-4 h-4 border border-warm-400 rounded-none accent-warm-400"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              )}

              {field.type === "select" && field.options && (
                <div className="space-y-2">
                  <FieldLabel label={field.label} fieldKey={field.key} />
                  <select
                    value={(fields[field.key] as string) || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {field.type === "array" && field.arrayItemSchema && (
                <ArrayField
                  label={field.label}
                  schema={field.arrayItemSchema}
                  value={(fields[field.key] as Record<string, unknown>[]) || []}
                  onChange={(newValue) => updateField(field.key, newValue)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Budget-specific renderer with totals
interface BudgetRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
}

const BUDGET_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Florist",
  "Music / DJ",
  "Wedding Attire",
  "Hair & Makeup",
  "Invitations & Stationery",
  "Wedding Cake",
  "Decorations",
  "Transportation",
  "Officiant",
  "Wedding Rings",
  "Favors & Gifts",
  "Honeymoon",
  "Other",
];

function BudgetRenderer({ page, fields, updateField }: BudgetRendererProps) {
  const items = (fields.items as Record<string, unknown>[]) || [];
  const totalBudget = parseFloat((fields.totalBudget as string) || "0") || 0;

  // Calculate totals
  const totalCost = items.reduce((sum, item) => {
    return sum + (parseFloat((item.totalCost as string) || "0") || 0);
  }, 0);

  const totalPaid = items.reduce((sum, item) => {
    return sum + (parseFloat((item.amountPaid as string) || "0") || 0);
  }, 0);

  const totalRemaining = totalCost - totalPaid;
  const budgetRemaining = totalBudget - totalCost;

  const addItem = () => {
    const newItem = {
      category: "",
      vendor: "",
      totalCost: "",
      amountPaid: "",
      notes: "",
    };
    updateField("items", [...items, newItem]);
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    updateField("items", updated);
  };

  const removeItem = (index: number) => {
    updateField("items", items.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg p-8 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
        </div>

        {/* Budget Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 p-6 bg-warm-50 border border-warm-200">
          <div className="text-center">
            <p className="text-xs tracking-wider uppercase text-warm-500 mb-1">Total Budget</p>
            <Input
              type="number"
              value={(fields.totalBudget as string) || ""}
              onChange={(e) => updateField("totalBudget", e.target.value)}
              placeholder="0"
              className="text-center text-lg font-light"
            />
          </div>
          <div className="text-center">
            <p className="text-xs tracking-wider uppercase text-warm-500 mb-1">Total Cost</p>
            <p className="text-2xl font-light text-warm-700 py-2">{formatCurrency(totalCost)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs tracking-wider uppercase text-warm-500 mb-1">Total Paid</p>
            <p className="text-2xl font-light text-green-600 py-2">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs tracking-wider uppercase text-warm-500 mb-1">Still Owed</p>
            <p className={`text-2xl font-light py-2 ${totalRemaining > 0 ? "text-amber-600" : "text-green-600"}`}>
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>

        {/* Budget vs Actual */}
        {totalBudget > 0 && (
          <div className="mb-10 p-4 border border-warm-200 bg-warm-50/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-warm-600">Budget Progress</span>
              <span className={`text-sm font-medium ${budgetRemaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                {budgetRemaining >= 0 
                  ? `${formatCurrency(budgetRemaining)} under budget` 
                  : `${formatCurrency(Math.abs(budgetRemaining))} over budget`
                }
              </span>
            </div>
            <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  totalCost <= totalBudget ? "bg-green-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min((totalCost / totalBudget) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Add Item Button */}
        <div className="flex justify-between items-center mb-6">
          <Label>Budget Items</Label>
          <Button variant="ghost" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <>
            {/* Table Header */}
            <div className="border-b-2 border-warm-800 pb-2 grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,1fr,40px] gap-2 mb-2">
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Category</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Vendor</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Total Cost</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Paid</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Remaining</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Notes</span>
              <span></span>
            </div>

            {/* Table Rows */}
            <div className="space-y-2">
              {items.map((item, index) => {
                const itemTotalCost = parseFloat((item.totalCost as string) || "0") || 0;
                const itemAmountPaid = parseFloat((item.amountPaid as string) || "0") || 0;
                const itemRemaining = itemTotalCost - itemAmountPaid;

                return (
                  <div
                    key={index}
                    className="border-b border-warm-200 pb-2 grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,1fr,40px] gap-2 items-center group"
                  >
                    <select
                      value={(item.category as string) || ""}
                      onChange={(e) => updateItem(index, "category", e.target.value)}
                      className="px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                    >
                      <option value="">Select...</option>
                      {BUDGET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <Input
                      value={(item.vendor as string) || ""}
                      onChange={(e) => updateItem(index, "vendor", e.target.value)}
                      className="text-sm"
                      placeholder="Vendor name"
                    />
                    <Input
                      type="number"
                      value={(item.totalCost as string) || ""}
                      onChange={(e) => updateItem(index, "totalCost", e.target.value)}
                      className="text-sm"
                      placeholder="0"
                    />
                    <Input
                      type="number"
                      value={(item.amountPaid as string) || ""}
                      onChange={(e) => updateItem(index, "amountPaid", e.target.value)}
                      className="text-sm"
                      placeholder="0"
                    />
                    <div className={`text-sm px-2 py-1.5 ${itemRemaining > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {formatCurrency(itemRemaining)}
                    </div>
                    <Input
                      value={(item.notes as string) || ""}
                      onChange={(e) => updateItem(index, "notes", e.target.value)}
                      className="text-sm"
                      placeholder="Notes"
                    />
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {items.length === 0 && (
          <p className="text-sm text-warm-400 italic text-center py-8">
            No budget items yet. Click &quot;Add Item&quot; to start tracking your expenses.
          </p>
        )}
      </div>
    </div>
  );
}

// Field label component with shared field indicator
function FieldLabel({ label, fieldKey }: { label: string; fieldKey: string }) {
  const isShared = isSharedField(fieldKey);

  return (
    <div className="flex items-center gap-2 mb-2">
      <Label>{label}</Label>
      {isShared && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">
                <LinkIcon className="w-3 h-3 text-warm-400" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">Synced across all pages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface ArrayFieldProps {
  label: string;
  schema: { key: string; label: string; type: string; required?: boolean; options?: string[] }[];
  value: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
}

function ArrayField({ label, schema, value, onChange }: ArrayFieldProps) {
  const addItem = () => {
    const newItem: Record<string, unknown> = {};
    schema.forEach((field) => {
      newItem[field.key] = field.type === "checkbox" ? false : "";
    });
    onChange([...value, newItem]);
  };

  const updateItem = (index: number, key: string, newValue: unknown) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [key]: newValue };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button variant="ghost" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Table Header */}
      {value.length > 0 && (
        <div className="border-b-2 border-warm-800 pb-2 grid gap-2" 
             style={{ gridTemplateColumns: `repeat(${schema.length}, 1fr) 40px` }}>
          {schema.map((field) => (
            <span key={field.key} className="text-[10px] tracking-wider uppercase text-warm-500">
              {field.label}
            </span>
          ))}
          <span></span>
        </div>
      )}

      {/* Table Rows */}
      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="border-b border-warm-200 pb-2 grid gap-2 items-center group"
            style={{ gridTemplateColumns: `repeat(${schema.length}, 1fr) 40px` }}
          >
            {schema.map((field) => (
              <div key={field.key}>
                {field.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={(item[field.key] as boolean) || false}
                    onChange={(e) => updateItem(index, field.key, e.target.checked)}
                    className="w-4 h-4 border border-warm-400 accent-warm-400"
                  />
                ) : field.type === "select" && field.options ? (
                  <select
                    value={(item[field.key] as string) || ""}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                    className="w-full px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                  >
                    <option value="">Select...</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    value={(item[field.key] as string) || ""}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                    className="text-sm"
                  />
                )}
              </div>
            ))}
            <button
              onClick={() => removeItem(index)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-warm-400 italic text-center py-4">
          No items yet. Click &quot;Add&quot; to get started.
        </p>
      )}
    </div>
  );
}

// Guest List renderer with RSVP link management
interface GuestListRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
}

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface RsvpFormData {
  id: string;
  slug: string;
  isActive: boolean;
  fields: Record<string, boolean>;
  mealOptions: string[];
}

const RSVP_FIELD_OPTIONS = [
  { key: "name", label: "Name", description: "Guest's full name", required: true },
  { key: "email", label: "Email", description: "Email address" },
  { key: "phone", label: "Phone", description: "Phone number" },
  { key: "address", label: "Address", description: "Mailing address for invitations" },
  { key: "attending", label: "RSVP Status", description: "Will they be attending?" },
  { key: "mealChoice", label: "Meal Choice", description: "Dinner selection (requires meal options)" },
  { key: "dietaryRestrictions", label: "Dietary Restrictions", description: "Allergies or dietary needs" },
  { key: "plusOne", label: "Plus One", description: "Are they bringing a guest?" },
  { key: "plusOneName", label: "Plus One Name", description: "Name of their guest" },
  { key: "plusOneMeal", label: "Plus One Meal", description: "Meal choice for their guest" },
  { key: "songRequest", label: "Song Request", description: "What song gets them dancing?" },
  { key: "notes", label: "Notes", description: "Additional comments or well-wishes" },
];

function GuestListRenderer({ page, fields, updateField }: GuestListRendererProps) {
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

// ============================================================================
// WEDDING OVERVIEW DASHBOARD
// ============================================================================

import { Calendar, MapPin, Clock, Users, DollarSign, Heart, Phone, Palette, CheckCircle2 } from "lucide-react";

interface OverviewRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
  allPages: Page[];
}

function OverviewRenderer({ page, fields, updateField, allPages }: OverviewRendererProps) {
  // Get data from other pages
  const coverPage = allPages.find(p => p.templateId === "cover");
  const budgetPage = allPages.find(p => p.templateId === "budget");
  const guestListPage = allPages.find(p => p.templateId === "guest-list");
  const weddingPartyPage = allPages.find(p => p.templateId === "wedding-party");
  const timelinePage = allPages.find(p => p.templateId === "timeline");

  // Extract data from cover page
  const coverFields = (coverPage?.fields || {}) as Record<string, unknown>;
  const weddingDate = coverFields.weddingDate as string;
  const coupleNames = coverFields.names as string;

  // Calculate days until wedding
  const daysUntil = weddingDate ? Math.ceil(
    (new Date(weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ) : null;

  // Extract budget data
  const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
  const budgetItems = (budgetFields.items as Record<string, unknown>[]) || [];
  const totalBudget = parseFloat((budgetFields.totalBudget as string) || "0") || 0;
  const totalSpent = budgetItems.reduce((sum, item) => {
    return sum + (parseFloat((item.totalCost as string) || "0") || 0);
  }, 0);
  const totalPaid = budgetItems.reduce((sum, item) => {
    return sum + (parseFloat((item.amountPaid as string) || "0") || 0);
  }, 0);

  // Extract guest data
  const guestFields = (guestListPage?.fields || {}) as Record<string, unknown>;
  const guests = (guestFields.guests as Record<string, unknown>[]) || [];
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter(g => g.rsvp === true).length;

  // Extract wedding party data
  const partyFields = (weddingPartyPage?.fields || {}) as Record<string, unknown>;
  const bridesmaids = (partyFields.bridesmaids as Record<string, unknown>[]) || [];
  const groomsmen = (partyFields.groomsmen as Record<string, unknown>[]) || [];
  const weddingPartySize = bridesmaids.length + groomsmen.length;

  // Extract timeline tasks
  const timelineFields = (timelinePage?.fields || {}) as Record<string, unknown>;
  const sections = (timelineFields.sections as Record<string, unknown>[]) || [];
  const allTasks: { task: string; completed: boolean }[] = [];
  sections.forEach(section => {
    const tasks = (section.tasks as Record<string, unknown>[]) || [];
    tasks.forEach(t => allTasks.push({ task: t.task as string, completed: t.completed as boolean }));
  });
  const completedTasks = allTasks.filter(t => t.completed).length;
  const pendingTasks = allTasks.filter(t => !t.completed).slice(0, 5);

  // Color palette
  const colorPalette = (fields.colorPalette as Record<string, unknown>[]) || [];
  
  // Emergency contacts
  const emergencyContacts = (fields.emergencyContacts as Record<string, unknown>[]) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const addColor = () => {
    updateField("colorPalette", [...colorPalette, { color: "", hex: "#" }]);
  };

  const updateColor = (index: number, key: string, value: string) => {
    const updated = [...colorPalette];
    updated[index] = { ...updated[index], [key]: value };
    updateField("colorPalette", updated);
  };

  const removeColor = (index: number) => {
    updateField("colorPalette", colorPalette.filter((_, i) => i !== index));
  };

  const addContact = () => {
    updateField("emergencyContacts", [...emergencyContacts, { name: "", role: "", phone: "" }]);
  };

  const updateContact = (index: number, key: string, value: string) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [key]: value };
    updateField("emergencyContacts", updated);
  };

  const removeContact = (index: number) => {
    updateField("emergencyContacts", emergencyContacts.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow-lg p-8 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-light tracking-wide">
            {coupleNames || "Wedding Overview"}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
          {weddingDate && (
            <p className="text-warm-500 mt-4">{formatDate(weddingDate)}</p>
          )}
        </div>

        {/* Countdown & Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {/* Days Until */}
          <div className="text-center p-6 bg-gradient-to-br from-rose-50 to-warm-50 border border-warm-200">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-rose-400" />
            {daysUntil !== null ? (
              <>
                <p className="text-3xl font-light text-warm-700">
                  {daysUntil > 0 ? daysUntil : daysUntil === 0 ? "Today!" : "Married!"}
                </p>
                <p className="text-xs tracking-wider uppercase text-warm-500">
                  {daysUntil > 0 ? "Days to Go" : daysUntil === 0 ? "It's Today!" : "Days Ago"}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-light text-warm-400">—</p>
                <p className="text-xs tracking-wider uppercase text-warm-500">Set date on cover</p>
              </>
            )}
          </div>

          {/* Guests */}
          <div className="text-center p-6 bg-warm-50 border border-warm-200">
            <Users className="w-6 h-6 mx-auto mb-2 text-warm-400" />
            <p className="text-3xl font-light text-warm-700">
              {confirmedGuests}<span className="text-lg text-warm-400">/{totalGuests}</span>
            </p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Guests Confirmed</p>
          </div>

          {/* Budget */}
          <div className="text-center p-6 bg-warm-50 border border-warm-200">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-light text-warm-700">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-xs tracking-wider uppercase text-warm-500">
              of {formatCurrency(totalBudget)} paid
            </p>
          </div>

          {/* Wedding Party */}
          <div className="text-center p-6 bg-warm-50 border border-warm-200">
            <Heart className="w-6 h-6 mx-auto mb-2 text-pink-400" />
            <p className="text-3xl font-light text-warm-700">{weddingPartySize}</p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Wedding Party</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Ceremony Details */}
            <div className="p-6 border border-warm-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-warm-400" />
                <h3 className="text-sm tracking-wider uppercase text-warm-500">Ceremony</h3>
              </div>
              <div className="space-y-3">
                <Input
                  value={(fields.ceremonyVenue as string) || ""}
                  onChange={(e) => updateField("ceremonyVenue", e.target.value)}
                  placeholder="Venue name"
                  className="font-medium"
                />
                <Input
                  value={(fields.ceremonyAddress as string) || ""}
                  onChange={(e) => updateField("ceremonyAddress", e.target.value)}
                  placeholder="Address"
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warm-400" />
                  <Input
                    value={(fields.ceremonyTime as string) || ""}
                    onChange={(e) => updateField("ceremonyTime", e.target.value)}
                    placeholder="Time (e.g., 4:00 PM)"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Reception Details */}
            <div className="p-6 border border-warm-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-warm-400" />
                <h3 className="text-sm tracking-wider uppercase text-warm-500">Reception</h3>
              </div>
              <div className="space-y-3">
                <Input
                  value={(fields.receptionVenue as string) || ""}
                  onChange={(e) => updateField("receptionVenue", e.target.value)}
                  placeholder="Venue name"
                  className="font-medium"
                />
                <Input
                  value={(fields.receptionAddress as string) || ""}
                  onChange={(e) => updateField("receptionAddress", e.target.value)}
                  placeholder="Address"
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warm-400" />
                  <Input
                    value={(fields.receptionTime as string) || ""}
                    onChange={(e) => updateField("receptionTime", e.target.value)}
                    placeholder="Time (e.g., 6:00 PM)"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Theme & Colors */}
            <div className="p-6 border border-warm-200">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-warm-400" />
                <h3 className="text-sm tracking-wider uppercase text-warm-500">Theme & Colors</h3>
              </div>
              <div className="space-y-4">
                <Input
                  value={(fields.theme as string) || ""}
                  onChange={(e) => updateField("theme", e.target.value)}
                  placeholder="Wedding theme or style (e.g., Rustic Garden)"
                />
                
                {/* Color Swatches */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Color Palette</Label>
                    <Button variant="ghost" size="sm" onClick={addColor}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Color
                    </Button>
                  </div>
                  
                  {colorPalette.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {colorPalette.map((color, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                          <div
                            className="w-10 h-10 border border-warm-200 cursor-pointer"
                            style={{ backgroundColor: (color.hex as string) || "#f5f5f4" }}
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "color";
                              input.value = (color.hex as string) || "#f5f5f4";
                              input.onchange = (e) => updateColor(index, "hex", (e.target as HTMLInputElement).value);
                              input.click();
                            }}
                          />
                          <div className="flex flex-col">
                            <Input
                              value={(color.color as string) || ""}
                              onChange={(e) => updateColor(index, "color", e.target.value)}
                              placeholder="Name"
                              className="text-xs h-6 w-20"
                            />
                            <span className="text-[10px] text-warm-400 font-mono">
                              {(color.hex as string) || "#"}
                            </span>
                          </div>
                          <button
                            onClick={() => removeColor(index)}
                            className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-warm-400 italic">Click &quot;Add Color&quot; to start your palette</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Tasks */}
            {allTasks.length > 0 && (
              <div className="p-6 border border-warm-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="text-sm tracking-wider uppercase text-warm-500">Tasks</h3>
                  </div>
                  <span className="text-xs text-warm-500">
                    {completedTasks}/{allTasks.length} done
                  </span>
                </div>
                <div className="space-y-2">
                  {pendingTasks.length > 0 ? (
                    pendingTasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-warm-600">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        {task.task}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-green-600">All tasks complete! 🎉</p>
                  )}
                  {allTasks.length > 5 && pendingTasks.length > 0 && (
                    <p className="text-xs text-warm-400 mt-2">
                      +{allTasks.filter(t => !t.completed).length - 5} more tasks
                    </p>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-1.5 bg-warm-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Day-Of Contacts */}
            <div className="p-6 border border-warm-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-warm-400" />
                  <h3 className="text-sm tracking-wider uppercase text-warm-500">Day-Of Contacts</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={addContact}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {emergencyContacts.length > 0 ? (
                  emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          value={(contact.name as string) || ""}
                          onChange={(e) => updateContact(index, "name", e.target.value)}
                          placeholder="Name"
                          className="text-sm"
                        />
                        <Input
                          value={(contact.role as string) || ""}
                          onChange={(e) => updateContact(index, "role", e.target.value)}
                          placeholder="Role"
                          className="text-sm"
                        />
                        <Input
                          value={(contact.phone as string) || ""}
                          onChange={(e) => updateContact(index, "phone", e.target.value)}
                          placeholder="Phone"
                          className="text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeContact(index)}
                        className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-warm-400 italic">Add important contacts for the big day</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="p-6 border border-warm-200">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm tracking-wider uppercase text-warm-500">Quick Notes</h3>
              </div>
              <Textarea
                value={(fields.notes as string) || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Jot down important reminders, inspiration, or ideas..."
                rows={4}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WEDDING PARTY WITH MESSAGING
// ============================================================================

interface PartyMember {
  name: string;
  role: string;
  email: string;
  phone: string;
}

interface WeddingPartyRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
}

type MessageGroup = "bridesmaids" | "groomsmen" | "others" | "all";

function WeddingPartyRenderer({ page, fields, updateField }: WeddingPartyRendererProps) {
  const bridesmaids = (fields.bridesmaids as PartyMember[]) || [];
  const groomsmen = (fields.groomsmen as PartyMember[]) || [];
  const others = (fields.others as PartyMember[]) || [];

  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageGroup, setMessageGroup] = useState<MessageGroup>("all");
  const [messageType, setMessageType] = useState<"email" | "text">("email");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  // Get recipients based on group
  const getRecipients = (group: MessageGroup): PartyMember[] => {
    switch (group) {
      case "bridesmaids":
        return bridesmaids;
      case "groomsmen":
        return groomsmen;
      case "others":
        return others;
      case "all":
        return [...bridesmaids, ...groomsmen, ...others];
    }
  };

  const recipients = getRecipients(messageGroup);
  const emailRecipients = recipients.filter(r => r.email);
  const phoneRecipients = recipients.filter(r => r.phone);

  const openMessageDialog = (group: MessageGroup) => {
    setMessageGroup(group);
    setShowMessageDialog(true);
  };

  const sendEmail = () => {
    const emails = emailRecipients.map(r => r.email).join(",");
    const subject = encodeURIComponent(messageSubject);
    const body = encodeURIComponent(messageBody);
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Email client opened!");
    setShowMessageDialog(false);
    setMessageSubject("");
    setMessageBody("");
  };

  const sendText = () => {
    // For SMS, we'll create individual links or a combined one
    const phones = phoneRecipients.map(r => r.phone.replace(/\D/g, "")).join(",");
    const body = encodeURIComponent(messageBody);
    // Note: SMS to multiple recipients works differently on different platforms
    // This opens the native SMS app
    window.open(`sms:${phones}?body=${body}`, "_blank");
    toast.success("Messages app opened!");
    setShowMessageDialog(false);
    setMessageBody("");
  };

  const copyEmails = () => {
    const emails = emailRecipients.map(r => r.email).join(", ");
    navigator.clipboard.writeText(emails);
    toast.success("Emails copied to clipboard!");
  };

  const copyPhones = () => {
    const phones = phoneRecipients.map(r => r.phone).join(", ");
    navigator.clipboard.writeText(phones);
    toast.success("Phone numbers copied to clipboard!");
  };

  const addMember = (group: "bridesmaids" | "groomsmen" | "others") => {
    const newMember: PartyMember = { name: "", role: "", email: "", phone: "" };
    const current = (fields[group] as PartyMember[]) || [];
    updateField(group, [...current, newMember]);
  };

  const updateMember = (group: "bridesmaids" | "groomsmen" | "others", index: number, key: keyof PartyMember, value: string) => {
    const current = (fields[group] as PartyMember[]) || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [key]: value };
    updateField(group, updated);
  };

  const removeMember = (group: "bridesmaids" | "groomsmen" | "others", index: number) => {
    const current = (fields[group] as PartyMember[]) || [];
    updateField(group, current.filter((_, i) => i !== index));
  };

  const getRoleIcon = (role: string) => {
    if (role === "Maid of Honor" || role === "Best Man") {
      return <Crown className="w-3 h-3 text-amber-500" />;
    }
    return null;
  };

  const groupLabel: Record<MessageGroup, string> = {
    bridesmaids: "Bridesmaids",
    groomsmen: "Groomsmen",
    others: "Other Party Members",
    all: "Entire Wedding Party",
  };

  const PartySection = ({
    title,
    icon,
    iconColor,
    group,
    members,
    roleOptions,
  }: {
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    group: "bridesmaids" | "groomsmen" | "others";
    members: PartyMember[];
    roleOptions?: string[];
  }) => (
    <div className="p-6 border border-warm-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={iconColor}>{icon}</div>
          <h3 className="text-sm tracking-wider uppercase text-warm-500">{title}</h3>
          <span className="text-xs text-warm-400">({members.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {members.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openMessageDialog(group)}
              className="text-xs"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Message
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => addMember(group)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {members.length > 0 ? (
        <div className="space-y-3">
          {members.map((member, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr,0.8fr,1fr,1fr,40px] gap-2 items-center group border-b border-warm-100 pb-3"
            >
              <div className="flex items-center gap-1">
                <Input
                  value={member.name || ""}
                  onChange={(e) => updateMember(group, index, "name", e.target.value)}
                  placeholder="Name"
                  className="text-sm"
                />
                {getRoleIcon(member.role)}
              </div>
              {roleOptions ? (
                <select
                  value={member.role || ""}
                  onChange={(e) => updateMember(group, index, "role", e.target.value)}
                  className="px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                >
                  <option value="">Role...</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={member.role || ""}
                  onChange={(e) => updateMember(group, index, "role", e.target.value)}
                  placeholder="Role"
                  className="text-sm"
                />
              )}
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-warm-400 flex-shrink-0" />
                <Input
                  value={member.email || ""}
                  onChange={(e) => updateMember(group, index, "email", e.target.value)}
                  placeholder="Email"
                  className="text-sm"
                  type="email"
                />
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-warm-400 flex-shrink-0" />
                <Input
                  value={member.phone || ""}
                  onChange={(e) => updateMember(group, index, "phone", e.target.value)}
                  placeholder="Phone"
                  className="text-sm"
                  type="tel"
                />
              </div>
              <button
                onClick={() => removeMember(group, index)}
                className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-warm-400 italic text-center py-4">
          No {title.toLowerCase()} yet. Click &quot;Add&quot; to get started.
        </p>
      )}
    </div>
  );

  const allMembers = [...bridesmaids, ...groomsmen, ...others];
  const totalWithEmail = allMembers.filter(m => m.email).length;
  const totalWithPhone = allMembers.filter(m => m.phone).length;

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

        {/* Quick Stats & Message All */}
        <div className="mb-8 p-6 bg-gradient-to-br from-pink-50 to-warm-50 border border-warm-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-light text-warm-700">{allMembers.length}</p>
                <p className="text-xs tracking-wider uppercase text-warm-500">Total Members</p>
              </div>
              <div className="h-8 w-px bg-warm-200" />
              <div className="text-center">
                <p className="text-lg font-light text-warm-600">{bridesmaids.length}</p>
                <p className="text-[10px] tracking-wider uppercase text-warm-400">Bridesmaids</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-light text-warm-600">{groomsmen.length}</p>
                <p className="text-[10px] tracking-wider uppercase text-warm-400">Groomsmen</p>
              </div>
              {others.length > 0 && (
                <div className="text-center">
                  <p className="text-lg font-light text-warm-600">{others.length}</p>
                  <p className="text-[10px] tracking-wider uppercase text-warm-400">Others</p>
                </div>
              )}
            </div>
            {allMembers.length > 0 && (
              <Button
                onClick={() => openMessageDialog("all")}
                className="bg-warm-600 hover:bg-warm-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Message All ({allMembers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Party Sections */}
        <div className="space-y-6">
          <PartySection
            title="Bridesmaids"
            icon={<Heart className="w-4 h-4" />}
            iconColor="text-pink-400"
            group="bridesmaids"
            members={bridesmaids}
            roleOptions={["Maid of Honor", "Bridesmaid", "Junior Bridesmaid"]}
          />

          <PartySection
            title="Groomsmen"
            icon={<Users2 className="w-4 h-4" />}
            iconColor="text-blue-400"
            group="groomsmen"
            members={groomsmen}
            roleOptions={["Best Man", "Groomsman", "Junior Groomsman"]}
          />

          <PartySection
            title="Other Party Members"
            icon={<Star className="w-4 h-4" />}
            iconColor="text-amber-400"
            group="others"
            members={others}
          />
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-warm-500" />
              Message {groupLabel[messageGroup]}
            </DialogTitle>
            <DialogDescription>
              Send a message to {recipients.length} member{recipients.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Recipients preview */}
            <div className="p-3 bg-warm-50 rounded text-sm">
              <p className="text-warm-500 mb-1">Recipients:</p>
              <p className="text-warm-700">
                {recipients.map(r => r.name || "Unnamed").join(", ") || "No recipients"}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-warm-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {emailRecipients.length} with email
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  {phoneRecipients.length} with phone
                </span>
              </div>
            </div>

            {/* Message type toggle */}
            <div className="flex gap-2">
              <Button
                variant={messageType === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setMessageType("email")}
                disabled={emailRecipients.length === 0}
                className={messageType === "email" ? "bg-warm-600" : ""}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email ({emailRecipients.length})
              </Button>
              <Button
                variant={messageType === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setMessageType("text")}
                disabled={phoneRecipients.length === 0}
                className={messageType === "text" ? "bg-warm-600" : ""}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Text ({phoneRecipients.length})
              </Button>
            </div>

            {/* Email form */}
            {messageType === "email" && (
              <>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Wedding party update!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Hey everyone! Just wanted to share some exciting updates..."
                    rows={5}
                  />
                </div>
              </>
            )}

            {/* Text form */}
            {messageType === "text" && (
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Hey! Quick update about the wedding..."
                  rows={4}
                />
                <p className="text-xs text-warm-400">
                  Note: Group texting support varies by device. You may need to send individually.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            {messageType === "email" ? (
              <>
                <Button variant="outline" onClick={copyEmails} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Emails
                </Button>
                <Button
                  onClick={sendEmail}
                  disabled={emailRecipients.length === 0 || !messageBody}
                  className="flex-1 bg-warm-600 hover:bg-warm-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Open Email
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={copyPhones} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Numbers
                </Button>
                <Button
                  onClick={sendText}
                  disabled={phoneRecipients.length === 0 || !messageBody}
                  className="flex-1 bg-warm-600 hover:bg-warm-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Open Messages
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
