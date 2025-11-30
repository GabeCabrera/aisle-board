"use client";

import { type Page } from "@/lib/db/schema";
import { getTemplateById } from "@/lib/templates/registry";
import { isSharedField } from "@/lib/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Link as LinkIcon, Share2, Copy, ExternalLink, Settings, MessageSquare, Mail, Smartphone, Send, Users2, Crown, Star, GripVertical, CalendarDays, User, Users as UsersIcon, Check, Music, Mic2, ListMusic, Ban, Plane, Hotel, Map, Briefcase, FileText, Gift, Package, ShoppingBag, ScrollText, Sparkles, ChevronDown, ChevronUp, GripHorizontal } from "lucide-react";
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
                placeholder="Your names (e.g., Emma & James)"
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

  // Special rendering for task board
  if (page.templateId === "task-board") {
    return (
      <TaskBoardRenderer
        page={page}
        fields={fields}
        updateField={updateField}
        allPages={allPages}
      />
    );
  }

  // Special rendering for music & playlist
  if (page.templateId === "music-playlist") {
    return (
      <MusicPlaylistRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
    );
  }

  // Special rendering for ceremony script
  if (page.templateId === "ceremony-script") {
    return (
      <CeremonyScriptRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
    );
  }

  // Special rendering for honeymoon planner
  if (page.templateId === "honeymoon-planner") {
    return (
      <HoneymoonPlannerRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
    );
  }

  // Special rendering for registry tracker
  if (page.templateId === "registry-tracker") {
    return (
      <RegistryTrackerRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
    );
  }

  // Special rendering for gift log
  if (page.templateId === "gift-log") {
    return (
      <GiftLogRenderer
        page={page}
        fields={fields}
        updateField={updateField}
        allPages={allPages}
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

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  const taskBoardPage = allPages.find(p => p.templateId === "task-board");

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
  const allTimelineTasks: { task: string; completed: boolean }[] = [];
  sections.forEach(section => {
    const tasks = (section.tasks as Record<string, unknown>[]) || [];
    tasks.forEach(t => allTimelineTasks.push({ task: t.task as string, completed: t.completed as boolean }));
  });
  const completedTimelineTasks = allTimelineTasks.filter(t => t.completed).length;
  const pendingTimelineTasks = allTimelineTasks.filter(t => !t.completed).slice(0, 5);

  // Extract task board data
  const taskBoardFields = (taskBoardPage?.fields || {}) as Record<string, unknown>;
  const boardTasks = (taskBoardFields.tasks as { id: string; title: string; status: string; assignee: string }[]) || [];
  const totalBoardTasks = boardTasks.length;
  const completedBoardTasks = boardTasks.filter(t => t.status === "done").length;
  const inProgressBoardTasks = boardTasks.filter(t => t.status === "in-progress").length;
  const pendingBoardTasks = boardTasks.filter(t => t.status === "todo").slice(0, 5);

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
            {/* Task Board Tasks */}
            <div className="p-6 border border-warm-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm tracking-wider uppercase text-warm-500">Task Board</h3>
                </div>
                {totalBoardTasks > 0 && (
                  <span className="text-xs text-warm-500">
                    {completedBoardTasks}/{totalBoardTasks} done
                  </span>
                )}
              </div>
              {totalBoardTasks > 0 ? (
                <>
                  {/* Stats row */}
                  <div className="flex gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-warm-300 rounded-full" />
                      <span className="text-warm-500">To Do: {boardTasks.filter(t => t.status === "todo").length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                      <span className="text-warm-500">In Progress: {inProgressBoardTasks}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-warm-500">Done: {completedBoardTasks}</span>
                    </div>
                  </div>
                  {/* Pending tasks */}
                  <div className="space-y-2">
                    {pendingBoardTasks.length > 0 ? (
                      pendingBoardTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm text-warm-600">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          {task.title}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-green-600">All tasks complete! 🎉</p>
                    )}
                    {boardTasks.filter(t => t.status === "todo").length > 5 && (
                      <p className="text-xs text-warm-400 mt-2">
                        +{boardTasks.filter(t => t.status === "todo").length - 5} more to do
                      </p>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 h-1.5 bg-warm-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${totalBoardTasks > 0 ? (completedBoardTasks / totalBoardTasks) * 100 : 0}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-warm-400 italic">Add a Task Board page to track your to-dos!</p>
              )}
            </div>

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
type PartyGroup = "bridesmaids" | "groomsmen" | "others";

// Helper to get role icon
function getRoleIcon(role: string) {
  if (role === "Maid of Honor" || role === "Best Man") {
    return <Crown className="w-3 h-3 text-amber-500" />;
  }
  return null;
}

// Party Section Component - defined outside to prevent re-creation
interface PartySectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  group: PartyGroup;
  members: PartyMember[];
  roleOptions?: string[];
  onAddMember: (group: PartyGroup) => void;
  onUpdateMember: (group: PartyGroup, index: number, key: keyof PartyMember, value: string) => void;
  onRemoveMember: (group: PartyGroup, index: number) => void;
  onOpenMessage: (group: MessageGroup) => void;
}

function PartySection({
  title,
  icon,
  iconColor,
  group,
  members,
  roleOptions,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onOpenMessage,
}: PartySectionProps) {
  return (
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
              onClick={() => onOpenMessage(group)}
              className="text-xs"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Message
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onAddMember(group)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {members.length > 0 ? (
        <div className="space-y-3">
          {members.map((member, index) => (
            <div
              key={`${group}-${index}`}
              className="grid grid-cols-[1fr,0.8fr,1fr,1fr,40px] gap-2 items-center group border-b border-warm-100 pb-3"
            >
              <div className="flex items-center gap-1">
                <Input
                  value={member.name || ""}
                  onChange={(e) => onUpdateMember(group, index, "name", e.target.value)}
                  placeholder="Name"
                  className="text-sm"
                />
                {getRoleIcon(member.role)}
              </div>
              {roleOptions ? (
                <select
                  value={member.role || ""}
                  onChange={(e) => onUpdateMember(group, index, "role", e.target.value)}
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
                  onChange={(e) => onUpdateMember(group, index, "role", e.target.value)}
                  placeholder="Role"
                  className="text-sm"
                />
              )}
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-warm-400 flex-shrink-0" />
                <Input
                  value={member.email || ""}
                  onChange={(e) => onUpdateMember(group, index, "email", e.target.value)}
                  placeholder="Email"
                  className="text-sm"
                  type="email"
                />
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-warm-400 flex-shrink-0" />
                <Input
                  value={member.phone || ""}
                  onChange={(e) => onUpdateMember(group, index, "phone", e.target.value)}
                  placeholder="Phone"
                  className="text-sm"
                  type="tel"
                />
              </div>
              <button
                onClick={() => onRemoveMember(group, index)}
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
}

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
    const phones = phoneRecipients.map(r => r.phone.replace(/\D/g, "")).join(",");
    const body = encodeURIComponent(messageBody);
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

  const addMember = (group: PartyGroup) => {
    const newMember: PartyMember = { name: "", role: "", email: "", phone: "" };
    const current = (fields[group] as PartyMember[]) || [];
    updateField(group, [...current, newMember]);
  };

  const updateMember = (group: PartyGroup, index: number, key: keyof PartyMember, value: string) => {
    const current = (fields[group] as PartyMember[]) || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [key]: value };
    updateField(group, updated);
  };

  const removeMember = (group: PartyGroup, index: number) => {
    const current = (fields[group] as PartyMember[]) || [];
    updateField(group, current.filter((_, i) => i !== index));
  };

  const groupLabel: Record<MessageGroup, string> = {
    bridesmaids: "Bridesmaids",
    groomsmen: "Groomsmen",
    others: "Other Party Members",
    all: "Entire Wedding Party",
  };

  const allMembers = [...bridesmaids, ...groomsmen, ...others];

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
            onAddMember={addMember}
            onUpdateMember={updateMember}
            onRemoveMember={removeMember}
            onOpenMessage={openMessageDialog}
          />

          <PartySection
            title="Groomsmen"
            icon={<Users2 className="w-4 h-4" />}
            iconColor="text-blue-400"
            group="groomsmen"
            members={groomsmen}
            roleOptions={["Best Man", "Groomsman", "Junior Groomsman"]}
            onAddMember={addMember}
            onUpdateMember={updateMember}
            onRemoveMember={removeMember}
            onOpenMessage={openMessageDialog}
          />

          <PartySection
            title="Other Party Members"
            icon={<Star className="w-4 h-4" />}
            iconColor="text-amber-400"
            group="others"
            members={others}
            onAddMember={addMember}
            onUpdateMember={updateMember}
            onRemoveMember={removeMember}
            onOpenMessage={openMessageDialog}
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

// ============================================================================
// TASK BOARD - Post-it style task management
// ============================================================================

interface Task {
  id: string;
  title: string;
  assignee: "partner1" | "partner2" | "both" | "unassigned";
  status: "todo" | "in-progress" | "done";
  color: "yellow" | "pink" | "blue" | "green" | "purple";
  dueDate?: string;
}

interface TaskBoardRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
  allPages: Page[];
}

// Suggested tasks by budget category
const SUGGESTED_TASKS_BY_CATEGORY: Record<string, string[]> = {
  "Venue": [
    "Schedule venue tour",
    "Review and sign venue contract",
    "Confirm venue capacity",
    "Discuss layout and floor plan",
    "Confirm parking arrangements",
  ],
  "Catering": [
    "Schedule tasting appointment",
    "Finalize menu selections",
    "Confirm dietary accommodations",
    "Decide on bar package",
    "Review catering contract",
  ],
  "Photography": [
    "Review photographer portfolio",
    "Create shot list",
    "Schedule engagement photos",
    "Discuss timeline for day-of",
    "Confirm delivery timeline",
  ],
  "Videography": [
    "Review videographer samples",
    "Discuss highlight reel length",
    "Confirm audio requirements",
  ],
  "Florist": [
    "Create flower inspiration board",
    "Schedule floral consultation",
    "Finalize bouquet design",
    "Confirm centerpiece arrangements",
    "Discuss ceremony arch/decor",
  ],
  "Music / DJ": [
    "Create must-play song list",
    "Create do-not-play list",
    "Discuss ceremony music",
    "Plan first dance song",
    "Confirm MC announcements",
  ],
  "Wedding Attire": [
    "Shop for wedding dress/suit",
    "Schedule fittings",
    "Choose accessories",
    "Plan rehearsal dinner outfit",
    "Coordinate wedding party attire",
  ],
  "Hair & Makeup": [
    "Schedule hair/makeup trial",
    "Create inspiration photos",
    "Confirm day-of timeline",
    "Book wedding party appointments",
  ],
  "Invitations & Stationery": [
    "Design save-the-dates",
    "Send save-the-dates",
    "Design wedding invitations",
    "Order invitations",
    "Send invitations",
    "Design programs and menus",
  ],
  "Wedding Cake": [
    "Schedule cake tasting",
    "Choose cake flavor and filling",
    "Finalize cake design",
    "Confirm delivery/setup",
  ],
  "Decorations": [
    "Create decoration mood board",
    "Order table numbers",
    "Plan photo booth props",
    "Order signage",
  ],
  "Transportation": [
    "Book wedding party transportation",
    "Arrange guest shuttle if needed",
    "Plan getaway car",
  ],
  "Officiant": [
    "Meet with officiant",
    "Discuss ceremony structure",
    "Write/finalize vows",
    "Schedule rehearsal",
  ],
  "Wedding Rings": [
    "Shop for wedding bands",
    "Order rings (allow time for sizing)",
    "Pick up rings before wedding",
  ],
  "Favors & Gifts": [
    "Choose wedding favors",
    "Order wedding party gifts",
    "Get parent thank-you gifts",
  ],
  "Honeymoon": [
    "Research honeymoon destinations",
    "Book flights",
    "Book accommodations",
    "Plan activities",
    "Check passport expiration",
  ],
};

const POST_IT_COLORS = {
  yellow: "bg-yellow-100 border-yellow-300 hover:bg-yellow-50",
  pink: "bg-pink-100 border-pink-300 hover:bg-pink-50",
  blue: "bg-blue-100 border-blue-300 hover:bg-blue-50",
  green: "bg-green-100 border-green-300 hover:bg-green-50",
  purple: "bg-purple-100 border-purple-300 hover:bg-purple-50",
};

const POST_IT_SHADOWS = {
  yellow: "shadow-yellow-200/50",
  pink: "shadow-pink-200/50",
  blue: "shadow-blue-200/50",
  green: "shadow-green-200/50",
  purple: "shadow-purple-200/50",
};

function TaskBoardRenderer({ page, fields, updateField, allPages }: TaskBoardRendererProps) {
  const partner1Name = (fields.partner1Name as string) || "Partner 1";
  const partner2Name = (fields.partner2Name as string) || "Partner 2";
  const tasks = (fields.tasks as Task[]) || [];

  // Memoize stable rotation values for each task to prevent jitter
  const taskRotations = useMemo(() => {
    const rotations: Record<string, number> = {};
    tasks.forEach(task => {
      // Use task ID to generate a stable "random" rotation
      const hash = task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      rotations[task.id] = ((hash % 100) - 50) / 50 * 2; // Range: -2 to 2 degrees
    });
    return rotations;
  }, [tasks.map(t => t.id).join(',')]);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null);

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<Task["assignee"]>("unassigned");
  const [newTaskColor, setNewTaskColor] = useState<Task["color"]>("yellow");
  const [filterAssignee, setFilterAssignee] = useState<Task["assignee"] | "all">("all");

  // Get budget categories from budget page
  const budgetPage = allPages.find(p => p.templateId === "budget");
  const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
  const budgetItems = (budgetFields.items as Record<string, unknown>[]) || [];
  const budgetCategories = [...new Set(budgetItems.map(item => item.category as string).filter(Boolean))];

  // Get suggested tasks based on budget categories
  const getSuggestedTasks = () => {
    const suggestions: { category: string; tasks: string[] }[] = [];
    const existingTaskTitles = tasks.map(t => t.title.toLowerCase());
    
    budgetCategories.forEach(category => {
      const categoryTasks = SUGGESTED_TASKS_BY_CATEGORY[category] || [];
      const newSuggestions = categoryTasks.filter(
        task => !existingTaskTitles.includes(task.toLowerCase())
      );
      if (newSuggestions.length > 0) {
        suggestions.push({ category, tasks: newSuggestions });
      }
    });
    
    return suggestions;
  };

  const suggestedTasks = getSuggestedTasks();

  // Generate unique ID
  const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === "todo" && (filterAssignee === "all" || t.assignee === filterAssignee));
  const inProgressTasks = tasks.filter(t => t.status === "in-progress" && (filterAssignee === "all" || t.assignee === filterAssignee));
  const doneTasks = tasks.filter(t => t.status === "done" && (filterAssignee === "all" || t.assignee === filterAssignee));

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      status: "todo",
      color: newTaskColor,
    };
    
    updateField("tasks", [...tasks, newTask]);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  // Add a suggested task
  const addSuggestedTask = (title: string, category: string) => {
    // Assign a color based on category
    const colorMap: Record<string, Task["color"]> = {
      "Venue": "blue",
      "Catering": "green",
      "Photography": "purple",
      "Videography": "purple",
      "Florist": "pink",
      "Music / DJ": "yellow",
      "Wedding Attire": "pink",
      "Hair & Makeup": "pink",
      "Invitations & Stationery": "yellow",
      "Wedding Cake": "green",
      "Decorations": "purple",
      "Transportation": "blue",
      "Officiant": "blue",
      "Wedding Rings": "yellow",
      "Favors & Gifts": "green",
      "Honeymoon": "blue",
    };

    const newTask: Task = {
      id: generateId(),
      title,
      assignee: "unassigned",
      status: "todo",
      color: colorMap[category] || "yellow",
    };
    
    updateField("tasks", [...tasks, newTask]);
    toast.success(`Added: ${title}`);
  };

  // Add all suggested tasks from a category
  const addAllFromCategory = (category: string, categoryTasks: string[]) => {
    const colorMap: Record<string, Task["color"]> = {
      "Venue": "blue",
      "Catering": "green",
      "Photography": "purple",
      "Videography": "purple",
      "Florist": "pink",
      "Music / DJ": "yellow",
      "Wedding Attire": "pink",
      "Hair & Makeup": "pink",
      "Invitations & Stationery": "yellow",
      "Wedding Cake": "green",
      "Decorations": "purple",
      "Transportation": "blue",
      "Officiant": "blue",
      "Wedding Rings": "yellow",
      "Favors & Gifts": "green",
      "Honeymoon": "blue",
    };

    const newTasks: Task[] = categoryTasks.map(title => ({
      id: generateId(),
      title,
      assignee: "unassigned" as const,
      status: "todo" as const,
      color: colorMap[category] || "yellow",
    }));
    
    updateField("tasks", [...tasks, ...newTasks]);
    toast.success(`Added ${categoryTasks.length} tasks from ${category}`);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    updateField("tasks", updated);
  };

  const deleteTask = (taskId: string) => {
    updateField("tasks", tasks.filter(t => t.id !== taskId));
  };

  const moveTask = (taskId: string, newStatus: Task["status"]) => {
    updateTask(taskId, { status: newStatus });
  };

  const getAssigneeName = (assignee: Task["assignee"]) => {
    switch (assignee) {
      case "partner1": return partner1Name;
      case "partner2": return partner2Name;
      case "both": return "Both";
      default: return "Unassigned";
    }
  };

  const getAssigneeIcon = (assignee: Task["assignee"]) => {
    switch (assignee) {
      case "partner1":
      case "partner2":
        return <User className="w-3 h-3" />;
      case "both":
        return <UsersIcon className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const partner1Tasks = tasks.filter(t => t.assignee === "partner1" && t.status !== "done").length;
  const partner2Tasks = tasks.filter(t => t.assignee === "partner2" && t.status !== "done").length;

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && draggedTaskId) {
      moveTask(taskId, newStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // Post-it card component
  const PostItCard = ({ task }: { task: Task }) => {
    const isEditing = editingTask === task.id;
    const [editTitle, setEditTitle] = useState(task.title);
    const rotation = taskRotations[task.id] || 0;
    const isDragging = draggedTaskId === task.id;

    return (
      <div
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        className={`
          relative p-4 pb-10 border-2 rounded-sm
          ${POST_IT_COLORS[task.color]}
          shadow-md ${POST_IT_SHADOWS[task.color]}
          transition-all duration-200
          group
          ${isDragging ? 'opacity-50 scale-105' : ''}
          ${!isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{ 
          transform: `rotate(${rotation}deg)`,
          minHeight: '160px'
        }}
      >
        {/* Drag handle */}
        <div className="absolute top-1 right-1 text-warm-400 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs shadow-md hover:bg-red-600 z-10"
        >
          ×
        </button>

        {/* Task content */}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              updateTask(task.id, { title: editTitle });
              setEditingTask(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateTask(task.id, { title: editTitle });
                setEditingTask(null);
              }
            }}
            className="w-full bg-transparent border-none font-medium text-warm-800 focus:outline-none"
            autoFocus
          />
        ) : (
          <p
            onClick={() => setEditingTask(task.id)}
            className="font-medium text-warm-800 cursor-text min-h-[40px]"
          >
            {task.title}
          </p>
        )}

        {/* Task metadata */}
        <div className="mt-3 pt-2 border-t border-warm-200/50 flex items-center justify-between">
          {/* Assignee */}
          <div className="flex items-center gap-1 text-xs text-warm-600">
            {getAssigneeIcon(task.assignee)}
            <span>{getAssigneeName(task.assignee)}</span>
          </div>

          {/* Due date if set */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-warm-500">
              <CalendarDays className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== "todo" && (
            <button
              onClick={() => moveTask(task.id, "todo")}
              className="w-6 h-6 bg-warm-200 rounded text-warm-600 text-xs hover:bg-warm-300 flex items-center justify-center"
              title="Move to To Do"
            >
              ←
            </button>
          )}
          {task.status !== "in-progress" && (
            <button
              onClick={() => moveTask(task.id, "in-progress")}
              className="w-6 h-6 bg-amber-200 rounded text-amber-700 text-xs hover:bg-amber-300 flex items-center justify-center"
              title="Move to In Progress"
            >
              ●
            </button>
          )}
          {task.status !== "done" && (
            <button
              onClick={() => moveTask(task.id, "done")}
              className="w-6 h-6 bg-green-200 rounded text-green-700 text-xs hover:bg-green-300 flex items-center justify-center"
              title="Mark Done"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Color picker */}
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {(["yellow", "pink", "blue", "green", "purple"] as const).map((color) => (
            <button
              key={color}
              onClick={() => updateTask(task.id, { color })}
              className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                color === "yellow" ? "bg-yellow-300" :
                color === "pink" ? "bg-pink-300" :
                color === "blue" ? "bg-blue-300" :
                color === "green" ? "bg-green-300" :
                "bg-purple-300"
              } ${task.color === color ? "ring-2 ring-warm-400" : ""}`}
            />
          ))}
        </div>

        {/* Assignee picker */}
        <select
          value={task.assignee}
          onChange={(e) => updateTask(task.id, { assignee: e.target.value as Task["assignee"] })}
          className="absolute bottom-2 left-2 text-xs bg-white/50 border border-warm-200 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <option value="unassigned">Unassigned</option>
          <option value="partner1">{partner1Name}</option>
          <option value="partner2">{partner2Name}</option>
          <option value="both">Both</option>
        </select>
      </div>
    );
  };

  // Column component
  const Column = ({ 
    title, 
    tasks: columnTasks, 
    status, 
    headerColor 
  }: { 
    title: string; 
    tasks: Task[]; 
    status: Task["status"];
    headerColor: string;
  }) => {
    const isDropTarget = dragOverColumn === status;
    
    return (
      <div className="flex-1 min-w-[280px]">
        <div className={`${headerColor} rounded-t-lg px-4 py-3 flex items-center justify-between`}>
          <h3 className="font-medium text-warm-800">{title}</h3>
          <span className="text-sm text-warm-600 bg-white/50 px-2 py-0.5 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        <div 
          className={`
            bg-warm-100/50 rounded-b-lg p-4 min-h-[400px] space-y-4
            transition-colors duration-200
            ${isDropTarget ? 'bg-warm-200/70 ring-2 ring-warm-400 ring-inset' : ''}
          `}
          onDragOver={(e) => handleDragOver(e, status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          {columnTasks.map((task) => (
            <PostItCard key={task.id} task={task} />
          ))}
          {columnTasks.length === 0 && (
            <p className={`text-center text-sm py-8 italic ${isDropTarget ? 'text-warm-600' : 'text-warm-400'}`}>
              {isDropTarget ? 'Drop here!' : 'No tasks here yet'}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow-lg p-8 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
        </div>

        {/* Partner Names Setup */}
        <div className="mb-8 p-6 bg-warm-50 border border-warm-200 rounded-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-warm-600 whitespace-nowrap">Partner 1:</Label>
              <Input
                value={partner1Name === "Partner 1" ? "" : partner1Name}
                onChange={(e) => updateField("partner1Name", e.target.value || "Partner 1")}
                placeholder="Partner 1"
                className="w-32 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-warm-600 whitespace-nowrap">Partner 2:</Label>
              <Input
                value={partner2Name === "Partner 2" ? "" : partner2Name}
                onChange={(e) => updateField("partner2Name", e.target.value || "Partner 2")}
                placeholder="Partner 2"
                className="w-32 text-sm"
              />
            </div>
            <div className="flex-1" />
            {suggestedTasks.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowSuggestions(true)}
                className="mr-2"
              >
                <Star className="w-4 h-4 mr-2" />
                Get Suggestions ({suggestedTasks.reduce((acc, cat) => acc + cat.tasks.length, 0)})
              </Button>
            )}
            <Button
              onClick={() => setShowAddTask(true)}
              className="bg-warm-600 hover:bg-warm-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Stats & Filter */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-light text-warm-700">{totalTasks}</p>
              <p className="text-xs tracking-wider uppercase text-warm-500">Total</p>
            </div>
            <div className="h-8 w-px bg-warm-200" />
            <div className="text-center">
              <p className="text-xl font-light text-green-600">{completedTasks}</p>
              <p className="text-xs tracking-wider uppercase text-warm-500">Done</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-light text-warm-600">{partner1Tasks}</p>
              <p className="text-xs tracking-wider uppercase text-warm-500">{partner1Name}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-light text-warm-600">{partner2Tasks}</p>
              <p className="text-xs tracking-wider uppercase text-warm-500">{partner2Name}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-warm-500">Filter:</Label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value as Task["assignee"] | "all")}
              className="px-3 py-1.5 border border-warm-300 text-sm rounded bg-white"
            >
              <option value="all">All Tasks</option>
              <option value="partner1">{partner1Name}</option>
              <option value="partner2">{partner2Name}</option>
              <option value="both">Both</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Task Board Columns */}
        <div className="flex gap-6 overflow-x-auto pb-4">
          <Column
            title="To Do"
            tasks={todoTasks}
            status="todo"
            headerColor="bg-warm-200"
          />
          <Column
            title="In Progress"
            tasks={inProgressTasks}
            status="in-progress"
            headerColor="bg-amber-200"
          />
          <Column
            title="Done"
            tasks={doneTasks}
            status="done"
            headerColor="bg-green-200"
          />
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to yourself or your partner.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Task title */}
            <div className="space-y-2">
              <Label>What needs to be done?</Label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g., Book photographer"
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                autoFocus
              />
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <Label>Who&apos;s responsible?</Label>
              <div className="flex gap-2">
                {(["unassigned", "partner1", "partner2", "both"] as const).map((assignee) => (
                  <button
                    key={assignee}
                    onClick={() => setNewTaskAssignee(assignee)}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
                      newTaskAssignee === assignee
                        ? "border-warm-500 bg-warm-50 text-warm-700"
                        : "border-warm-200 hover:border-warm-300"
                    }`}
                  >
                    {assignee === "partner1" ? partner1Name :
                     assignee === "partner2" ? partner2Name :
                     assignee === "both" ? "Both" : "Unassigned"}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Post-it color</Label>
              <div className="flex gap-3">
                {(["yellow", "pink", "blue", "green", "purple"] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTaskColor(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      color === "yellow" ? "bg-yellow-200 border-yellow-300" :
                      color === "pink" ? "bg-pink-200 border-pink-300" :
                      color === "blue" ? "bg-blue-200 border-blue-300" :
                      color === "green" ? "bg-green-200 border-green-300" :
                      "bg-purple-200 border-purple-300"
                    } ${newTaskColor === color ? "ring-2 ring-warm-500 ring-offset-2" : "hover:scale-105"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            <Button variant="outline" onClick={() => setShowAddTask(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="flex-1 bg-warm-600 hover:bg-warm-700 text-white"
            >
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Suggested Tasks
            </DialogTitle>
            <DialogDescription>
              Based on your budget items, here are some tasks you might want to add.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {suggestedTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-warm-500">No suggestions available.</p>
                <p className="text-sm text-warm-400 mt-2">
                  Add vendors to your budget to get task suggestions!
                </p>
              </div>
            ) : (
              suggestedTasks.map(({ category, tasks: categoryTasks }) => (
                <div key={category} className="border border-warm-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-warm-700">{category}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addAllFromCategory(category, categoryTasks)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add All ({categoryTasks.length})
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {categoryTasks.map((task) => (
                      <div
                        key={task}
                        className="flex items-center justify-between py-2 px-3 bg-warm-50 rounded hover:bg-warm-100 group"
                      >
                        <span className="text-sm text-warm-600">{task}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSuggestedTask(task, category)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            <Button
              variant="outline"
              onClick={() => setShowSuggestions(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// MUSIC & PLAYLIST RENDERER
// ============================================================================

interface MusicPlaylistRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
}

function MusicPlaylistRenderer({ page, fields, updateField }: MusicPlaylistRendererProps) {
  const mustPlaySongs = (fields.mustPlaySongs as Record<string, unknown>[]) || [];
  const doNotPlaySongs = (fields.doNotPlaySongs as Record<string, unknown>[]) || [];

  const addMustPlay = () => {
    updateField("mustPlaySongs", [...mustPlaySongs, { song: "", artist: "", notes: "" }]);
  };

  const updateMustPlay = (index: number, key: string, value: string) => {
    const updated = [...mustPlaySongs];
    updated[index] = { ...updated[index], [key]: value };
    updateField("mustPlaySongs", updated);
  };

  const removeMustPlay = (index: number) => {
    updateField("mustPlaySongs", mustPlaySongs.filter((_, i) => i !== index));
  };

  const addDoNotPlay = () => {
    updateField("doNotPlaySongs", [...doNotPlaySongs, { song: "", artist: "", reason: "" }]);
  };

  const updateDoNotPlay = (index: number, key: string, value: string) => {
    const updated = [...doNotPlaySongs];
    updated[index] = { ...updated[index], [key]: value };
    updateField("doNotPlaySongs", updated);
  };

  const removeDoNotPlay = (index: number) => {
    updateField("doNotPlaySongs", doNotPlaySongs.filter((_, i) => i !== index));
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

        {/* Special Moments */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-medium text-warm-700">Special Moments</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* First Dance */}
            <div className="p-4 border border-warm-200 bg-gradient-to-br from-pink-50 to-warm-50">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-pink-500" />
                <Label className="text-warm-600">First Dance</Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={(fields.firstDanceSong as string) || ""}
                  onChange={(e) => updateField("firstDanceSong", e.target.value)}
                  placeholder="Song name"
                  className="font-medium"
                />
                <Input
                  value={(fields.firstDanceArtist as string) || ""}
                  onChange={(e) => updateField("firstDanceArtist", e.target.value)}
                  placeholder="Artist"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Parent Dance 1 */}
            <div className="p-4 border border-warm-200">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-warm-400" />
                <Label className="text-warm-600">Parent Dance 1</Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={(fields.parentDance1Song as string) || ""}
                  onChange={(e) => updateField("parentDance1Song", e.target.value)}
                  placeholder="Song name"
                />
                <Input
                  value={(fields.parentDance1Artist as string) || ""}
                  onChange={(e) => updateField("parentDance1Artist", e.target.value)}
                  placeholder="Artist"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Parent Dance 2 */}
            <div className="p-4 border border-warm-200">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-warm-400" />
                <Label className="text-warm-600">Parent Dance 2</Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={(fields.parentDance2Song as string) || ""}
                  onChange={(e) => updateField("parentDance2Song", e.target.value)}
                  placeholder="Song name"
                />
                <Input
                  value={(fields.parentDance2Artist as string) || ""}
                  onChange={(e) => updateField("parentDance2Artist", e.target.value)}
                  placeholder="Artist"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Cake Cutting & Last Dance */}
            <div className="space-y-4">
              <div className="p-4 border border-warm-200">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-warm-400" />
                  <Label className="text-warm-600">Cake Cutting</Label>
                </div>
                <Input
                  value={(fields.cakeCuttingSong as string) || ""}
                  onChange={(e) => updateField("cakeCuttingSong", e.target.value)}
                  placeholder="Song name"
                />
              </div>
              <div className="p-4 border border-warm-200">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-warm-400" />
                  <Label className="text-warm-600">Last Dance</Label>
                </div>
                <Input
                  value={(fields.lastDanceSong as string) || ""}
                  onChange={(e) => updateField("lastDanceSong", e.target.value)}
                  placeholder="Song name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ceremony Music */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Mic2 className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-medium text-warm-700">Ceremony Music</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-warm-600">Guest Arrival</Label>
              <Input
                value={(fields.guestArrivalMusic as string) || ""}
                onChange={(e) => updateField("guestArrivalMusic", e.target.value)}
                placeholder="Playlist or song"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-warm-600">Processional (Wedding Party)</Label>
              <Input
                value={(fields.processionalSong as string) || ""}
                onChange={(e) => updateField("processionalSong", e.target.value)}
                placeholder="Song name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-warm-600">Bride Entrance</Label>
              <Input
                value={(fields.brideEntranceSong as string) || ""}
                onChange={(e) => updateField("brideEntranceSong", e.target.value)}
                placeholder="Song name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-warm-600">Recessional (Exit)</Label>
              <Input
                value={(fields.recessionalSong as string) || ""}
                onChange={(e) => updateField("recessionalSong", e.target.value)}
                placeholder="Song name"
              />
            </div>
          </div>
        </div>

        {/* Must Play List */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-medium text-warm-700">Must Play</h3>
              <span className="text-sm text-warm-400">({mustPlaySongs.length})</span>
            </div>
            <Button variant="ghost" size="sm" onClick={addMustPlay}>
              <Plus className="w-4 h-4 mr-1" />
              Add Song
            </Button>
          </div>
          
          {mustPlaySongs.length > 0 ? (
            <div className="space-y-2">
              {mustPlaySongs.map((song, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded group">
                  <Music className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <Input
                    value={(song.song as string) || ""}
                    onChange={(e) => updateMustPlay(index, "song", e.target.value)}
                    placeholder="Song name"
                    className="flex-1"
                  />
                  <Input
                    value={(song.artist as string) || ""}
                    onChange={(e) => updateMustPlay(index, "artist", e.target.value)}
                    placeholder="Artist"
                    className="w-40"
                  />
                  <Input
                    value={(song.notes as string) || ""}
                    onChange={(e) => updateMustPlay(index, "notes", e.target.value)}
                    placeholder="Notes (e.g., for bouquet toss)"
                    className="w-48"
                  />
                  <button
                    onClick={() => removeMustPlay(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-6 bg-warm-50 rounded">
              No must-play songs yet. Add songs you definitely want to hear!
            </p>
          )}
        </div>

        {/* Do Not Play List */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-medium text-warm-700">Do Not Play</h3>
              <span className="text-sm text-warm-400">({doNotPlaySongs.length})</span>
            </div>
            <Button variant="ghost" size="sm" onClick={addDoNotPlay}>
              <Plus className="w-4 h-4 mr-1" />
              Add Song
            </Button>
          </div>
          
          {doNotPlaySongs.length > 0 ? (
            <div className="space-y-2">
              {doNotPlaySongs.map((song, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded group">
                  <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <Input
                    value={(song.song as string) || ""}
                    onChange={(e) => updateDoNotPlay(index, "song", e.target.value)}
                    placeholder="Song name"
                    className="flex-1"
                  />
                  <Input
                    value={(song.artist as string) || ""}
                    onChange={(e) => updateDoNotPlay(index, "artist", e.target.value)}
                    placeholder="Artist"
                    className="w-40"
                  />
                  <Input
                    value={(song.reason as string) || ""}
                    onChange={(e) => updateDoNotPlay(index, "reason", e.target.value)}
                    placeholder="Reason (optional)"
                    className="w-48"
                  />
                  <button
                    onClick={() => removeDoNotPlay(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-6 bg-warm-50 rounded">
              No banned songs yet. Add songs you want to avoid.
            </p>
          )}
        </div>

        {/* DJ Notes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-warm-500" />
            <h3 className="text-lg font-medium text-warm-700">Notes for DJ/Band</h3>
          </div>
          <Textarea
            value={(fields.djNotes as string) || ""}
            onChange={(e) => updateField("djNotes", e.target.value)}
            placeholder="Any special instructions, timing notes, or preferences for your DJ or band..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CEREMONY SCRIPT RENDERER
// ============================================================================

interface CeremonyElement {
  element: string;
  person: string;
  content: string;
  duration: string;
}

interface Reading {
  title: string;
  author: string;
  reader: string;
  text: string;
}

interface CeremonyScriptRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
}

const CEREMONY_ELEMENTS = [
  "Welcome & Opening",
  "Reading",
  "Musical Performance",
  "Vows - Partner 1",
  "Vows - Partner 2",
  "Ring Exchange",
  "Unity Candle",
  "Sand Ceremony",
  "Handfasting",
  "Wine Ceremony",
  "Ring Warming",
  "Rose Ceremony",
  "Pronouncement",
  "First Kiss",
  "Closing & Introduction",
  "Other",
];

function CeremonyScriptRenderer({ page, fields, updateField }: CeremonyScriptRendererProps) {
  const elements = (fields.elements as CeremonyElement[]) || [];
  const readings = (fields.readings as Reading[]) || [];
  const [expandedVows, setExpandedVows] = useState<"partner1" | "partner2" | null>(null);

  const addElement = () => {
    updateField("elements", [...elements, { element: "", person: "", content: "", duration: "" }]);
  };

  const updateElement = (index: number, key: string, value: string) => {
    const updated = [...elements];
    updated[index] = { ...updated[index], [key]: value };
    updateField("elements", updated);
  };

  const removeElement = (index: number) => {
    updateField("elements", elements.filter((_, i) => i !== index));
  };

  const moveElement = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === elements.length - 1) return;
    
    const updated = [...elements];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateField("elements", updated);
  };

  const addReading = () => {
    updateField("readings", [...readings, { title: "", author: "", reader: "", text: "" }]);
  };

  const updateReading = (index: number, key: string, value: string) => {
    const updated = [...readings];
    updated[index] = { ...updated[index], [key]: value };
    updateField("readings", updated);
  };

  const removeReading = (index: number) => {
    updateField("readings", readings.filter((_, i) => i !== index));
  };

  // Calculate total estimated time
  const totalMinutes = elements.reduce((total, el) => {
    const mins = parseInt(el.duration) || 0;
    return total + mins;
  }, 0);

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

        {/* Ceremony Info */}
        <div className="mb-10 p-6 bg-warm-50 border border-warm-200 rounded">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-warm-600">Officiant Name</Label>
              <Input
                value={(fields.officiantName as string) || ""}
                onChange={(e) => updateField("officiantName", e.target.value)}
                placeholder="Who will officiate?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-warm-600">Ceremony Style</Label>
              <select
                value={(fields.ceremonyStyle as string) || ""}
                onChange={(e) => updateField("ceremonyStyle", e.target.value)}
                className="w-full px-3 py-2 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white rounded"
              >
                <option value="">Select style...</option>
                <option value="Traditional">Traditional</option>
                <option value="Modern">Modern</option>
                <option value="Religious">Religious</option>
                <option value="Non-denominational">Non-denominational</option>
                <option value="Spiritual">Spiritual</option>
                <option value="Elopement">Elopement</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-warm-600">Estimated Length</Label>
              <div className="flex items-center gap-2">
                <select
                  value={(fields.estimatedLength as string) || ""}
                  onChange={(e) => updateField("estimatedLength", e.target.value)}
                  className="flex-1 px-3 py-2 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white rounded"
                >
                  <option value="">Select...</option>
                  <option value="15 minutes">15 minutes</option>
                  <option value="20 minutes">20 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="1 hour">1 hour</option>
                </select>
                {totalMinutes > 0 && (
                  <span className="text-xs text-warm-500 whitespace-nowrap">
                    ~{totalMinutes} min planned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ceremony Flow */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-medium text-warm-700">Ceremony Flow</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={addElement}>
              <Plus className="w-4 h-4 mr-1" />
              Add Element
            </Button>
          </div>

          {elements.length > 0 ? (
            <div className="space-y-2">
              {elements.map((el, index) => (
                <div key={index} className="flex items-start gap-2 p-3 border border-warm-200 rounded group bg-white hover:border-warm-300 transition-colors">
                  <div className="flex flex-col gap-1 pt-2">
                    <button
                      onClick={() => moveElement(index, "up")}
                      disabled={index === 0}
                      className="p-0.5 text-warm-400 hover:text-warm-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveElement(index, "down")}
                      disabled={index === elements.length - 1}
                      className="p-0.5 text-warm-400 hover:text-warm-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-warm-400 pt-2 w-6">{index + 1}.</span>
                  <select
                    value={el.element || ""}
                    onChange={(e) => updateElement(index, "element", e.target.value)}
                    className="w-48 px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white rounded"
                  >
                    <option value="">Select element...</option>
                    {CEREMONY_ELEMENTS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <Input
                    value={el.person || ""}
                    onChange={(e) => updateElement(index, "person", e.target.value)}
                    placeholder="Person/Reader"
                    className="w-32 text-sm"
                  />
                  <Input
                    value={el.content || ""}
                    onChange={(e) => updateElement(index, "content", e.target.value)}
                    placeholder="Notes or content"
                    className="flex-1 text-sm"
                  />
                  <Input
                    value={el.duration || ""}
                    onChange={(e) => updateElement(index, "duration", e.target.value)}
                    placeholder="Min"
                    className="w-16 text-sm text-center"
                  />
                  <button
                    onClick={() => removeElement(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-warm-50 rounded">
              <p className="text-sm text-warm-500 mb-3">No ceremony elements yet</p>
              <Button variant="outline" size="sm" onClick={addElement}>
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Element
              </Button>
            </div>
          )}
        </div>

        {/* Personal Vows */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-medium text-warm-700">Personal Vows</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-warm-200 rounded overflow-hidden">
              <button
                onClick={() => setExpandedVows(expandedVows === "partner1" ? null : "partner1")}
                className="w-full p-3 flex items-center justify-between bg-warm-50 hover:bg-warm-100 transition-colors"
              >
                <span className="font-medium text-warm-700">Partner 1 Vows</span>
                {expandedVows === "partner1" ? (
                  <ChevronUp className="w-4 h-4 text-warm-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-warm-500" />
                )}
              </button>
              {expandedVows === "partner1" && (
                <div className="p-3">
                  <Textarea
                    value={(fields.partner1Vows as string) || ""}
                    onChange={(e) => updateField("partner1Vows", e.target.value)}
                    placeholder="Write your vows here... This is a private space to draft and refine your promises."
                    rows={8}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            <div className="border border-warm-200 rounded overflow-hidden">
              <button
                onClick={() => setExpandedVows(expandedVows === "partner2" ? null : "partner2")}
                className="w-full p-3 flex items-center justify-between bg-warm-50 hover:bg-warm-100 transition-colors"
              >
                <span className="font-medium text-warm-700">Partner 2 Vows</span>
                {expandedVows === "partner2" ? (
                  <ChevronUp className="w-4 h-4 text-warm-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-warm-500" />
                )}
              </button>
              {expandedVows === "partner2" && (
                <div className="p-3">
                  <Textarea
                    value={(fields.partner2Vows as string) || ""}
                    onChange={(e) => updateField("partner2Vows", e.target.value)}
                    placeholder="Write your vows here... This is a private space to draft and refine your promises."
                    rows={8}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Readings */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-medium text-warm-700">Readings</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={addReading}>
              <Plus className="w-4 h-4 mr-1" />
              Add Reading
            </Button>
          </div>

          {readings.length > 0 ? (
            <div className="space-y-4">
              {readings.map((reading, index) => (
                <div key={index} className="p-4 border border-warm-200 rounded group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input
                        value={reading.title || ""}
                        onChange={(e) => updateReading(index, "title", e.target.value)}
                        placeholder="Title"
                        className="font-medium"
                      />
                      <Input
                        value={reading.author || ""}
                        onChange={(e) => updateReading(index, "author", e.target.value)}
                        placeholder="Author"
                      />
                      <Input
                        value={reading.reader || ""}
                        onChange={(e) => updateReading(index, "reader", e.target.value)}
                        placeholder="Reader"
                      />
                    </div>
                    <button
                      onClick={() => removeReading(index)}
                      className="p-1 ml-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Textarea
                    value={reading.text || ""}
                    onChange={(e) => updateReading(index, "text", e.target.value)}
                    placeholder="Full text of the reading..."
                    rows={4}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-6 bg-warm-50 rounded">
              No readings added yet. Add poems, passages, or quotes for your ceremony.
            </p>
          )}
        </div>

        {/* Officiant Script */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic2 className="w-5 h-5 text-warm-500" />
            <h3 className="text-lg font-medium text-warm-700">Officiant Script</h3>
          </div>
          <Textarea
            value={(fields.officiantScript as string) || ""}
            onChange={(e) => updateField("officiantScript", e.target.value)}
            placeholder="Draft the full ceremony script here, or paste one your officiant has shared..."
            rows={10}
          />
        </div>

        {/* Additional Notes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-warm-400" />
            <h3 className="text-lg font-medium text-warm-700">Additional Notes</h3>
          </div>
          <Textarea
            value={(fields.notes as string) || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Any other notes, reminders, or ideas for your ceremony..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HONEYMOON PLANNER RENDERER
// ============================================================================

interface HoneymoonPlannerRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
}

function HoneymoonPlannerRenderer({ page, fields, updateField }: HoneymoonPlannerRendererProps) {
  const flights = (fields.flights as Record<string, unknown>[]) || [];
  const accommodations = (fields.accommodations as Record<string, unknown>[]) || [];
  const activities = (fields.activities as Record<string, unknown>[]) || [];
  const packingList = (fields.packingList as Record<string, unknown>[]) || [];
  const documents = (fields.documents as Record<string, unknown>[]) || [];

  // Calculate trip duration
  const departureDate = fields.departureDate as string;
  const returnDate = fields.returnDate as string;
  const tripDays = departureDate && returnDate 
    ? Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Helper functions for each array
  const addFlight = () => {
    updateField("flights", [...flights, { airline: "", flightNumber: "", departure: "", arrival: "", date: "", confirmationCode: "" }]);
  };

  const updateFlight = (index: number, key: string, value: string) => {
    const updated = [...flights];
    updated[index] = { ...updated[index], [key]: value };
    updateField("flights", updated);
  };

  const removeFlight = (index: number) => {
    updateField("flights", flights.filter((_, i) => i !== index));
  };

  const addAccommodation = () => {
    updateField("accommodations", [...accommodations, { name: "", checkIn: "", checkOut: "", confirmationCode: "", address: "" }]);
  };

  const updateAccommodation = (index: number, key: string, value: string) => {
    const updated = [...accommodations];
    updated[index] = { ...updated[index], [key]: value };
    updateField("accommodations", updated);
  };

  const removeAccommodation = (index: number) => {
    updateField("accommodations", accommodations.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    updateField("activities", [...activities, { activity: "", date: "", time: "", confirmationCode: "", notes: "" }]);
  };

  const updateActivity = (index: number, key: string, value: string) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [key]: value };
    updateField("activities", updated);
  };

  const removeActivity = (index: number) => {
    updateField("activities", activities.filter((_, i) => i !== index));
  };

  const addPackingItem = () => {
    updateField("packingList", [...packingList, { item: "", packed: false }]);
  };

  const updatePackingItem = (index: number, key: string, value: unknown) => {
    const updated = [...packingList];
    updated[index] = { ...updated[index], [key]: value };
    updateField("packingList", updated);
  };

  const removePackingItem = (index: number) => {
    updateField("packingList", packingList.filter((_, i) => i !== index));
  };

  const addDocument = () => {
    updateField("documents", [...documents, { document: "", status: "", expirationDate: "" }]);
  };

  const updateDocument = (index: number, key: string, value: string) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [key]: value };
    updateField("documents", updated);
  };

  const removeDocument = (index: number) => {
    updateField("documents", documents.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const packedCount = packingList.filter(item => item.packed).length;

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

        {/* Destination & Overview */}
        <div className="mb-10 p-6 bg-gradient-to-br from-blue-50 to-warm-50 border border-warm-200 rounded">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Map className="w-5 h-5 text-blue-500" />
                <Label className="text-warm-600 font-medium">Destination</Label>
              </div>
              <Input
                value={(fields.destination as string) || ""}
                onChange={(e) => updateField("destination", e.target.value)}
                placeholder="Where are you going? (e.g., Bali, Indonesia)"
                className="text-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <Label className="text-warm-600 font-medium">Budget</Label>
              </div>
              <Input
                type="number"
                value={(fields.budget as string) || ""}
                onChange={(e) => updateField("budget", e.target.value)}
                placeholder="Total budget"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-warm-200">
            <div className="space-y-1">
              <Label className="text-xs text-warm-500">Departure</Label>
              <Input
                type="date"
                value={(fields.departureDate as string) || ""}
                onChange={(e) => updateField("departureDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-warm-500">Return</Label>
              <Input
                type="date"
                value={(fields.returnDate as string) || ""}
                onChange={(e) => updateField("returnDate", e.target.value)}
              />
            </div>
            <div className="col-span-2 flex items-end">
              {tripDays !== null && tripDays > 0 && (
                <div className="text-center w-full p-2 bg-white rounded">
                  <span className="text-2xl font-light text-blue-600">{tripDays}</span>
                  <span className="text-sm text-warm-500 ml-2">nights</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Flights */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-500" />
              <h3 className="text-lg font-medium text-warm-700">Flights</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={addFlight}>
              <Plus className="w-4 h-4 mr-1" />
              Add Flight
            </Button>
          </div>

          {flights.length > 0 ? (
            <div className="space-y-3">
              {flights.map((flight, index) => (
                <div key={index} className="p-4 border border-warm-200 rounded group">
                  <div className="grid grid-cols-6 gap-3">
                    <Input
                      value={(flight.airline as string) || ""}
                      onChange={(e) => updateFlight(index, "airline", e.target.value)}
                      placeholder="Airline"
                    />
                    <Input
                      value={(flight.flightNumber as string) || ""}
                      onChange={(e) => updateFlight(index, "flightNumber", e.target.value)}
                      placeholder="Flight #"
                    />
                    <Input
                      value={(flight.departure as string) || ""}
                      onChange={(e) => updateFlight(index, "departure", e.target.value)}
                      placeholder="From"
                    />
                    <Input
                      value={(flight.arrival as string) || ""}
                      onChange={(e) => updateFlight(index, "arrival", e.target.value)}
                      placeholder="To"
                    />
                    <Input
                      type="date"
                      value={(flight.date as string) || ""}
                      onChange={(e) => updateFlight(index, "date", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        value={(flight.confirmationCode as string) || ""}
                        onChange={(e) => updateFlight(index, "confirmationCode", e.target.value)}
                        placeholder="Confirmation"
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeFlight(index)}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-6 bg-warm-50 rounded">
              No flights added yet
            </p>
          )}
        </div>

        {/* Accommodations */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Hotel className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-medium text-warm-700">Accommodations</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={addAccommodation}>
              <Plus className="w-4 h-4 mr-1" />
              Add Hotel
            </Button>
          </div>

          {accommodations.length > 0 ? (
            <div className="space-y-3">
              {accommodations.map((acc, index) => (
                <div key={index} className="p-4 border border-warm-200 rounded group">
                  <div className="grid grid-cols-5 gap-3 mb-2">
                    <Input
                      value={(acc.name as string) || ""}
                      onChange={(e) => updateAccommodation(index, "name", e.target.value)}
                      placeholder="Hotel/Resort name"
                      className="col-span-2 font-medium"
                    />
                    <Input
                      type="date"
                      value={(acc.checkIn as string) || ""}
                      onChange={(e) => updateAccommodation(index, "checkIn", e.target.value)}
                      placeholder="Check In"
                    />
                    <Input
                      type="date"
                      value={(acc.checkOut as string) || ""}
                      onChange={(e) => updateAccommodation(index, "checkOut", e.target.value)}
                      placeholder="Check Out"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={(acc.confirmationCode as string) || ""}
                        onChange={(e) => updateAccommodation(index, "confirmationCode", e.target.value)}
                        placeholder="Confirmation"
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeAccommodation(index)}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <Input
                    value={(acc.address as string) || ""}
                    onChange={(e) => updateAccommodation(index, "address", e.target.value)}
                    placeholder="Address"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-6 bg-warm-50 rounded">
              No accommodations added yet
            </p>
          )}
        </div>

        {/* Activities */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-medium text-warm-700">Activities & Reservations</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={addActivity}>
              <Plus className="w-4 h-4 mr-1" />
              Add Activity
            </Button>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-warm-200 rounded group">
                  <Input
                    value={(activity.activity as string) || ""}
                    onChange={(e) => updateActivity(index, "activity", e.target.value)}
                    placeholder="Activity name"
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={(activity.date as string) || ""}
                    onChange={(e) => updateActivity(index, "date", e.target.value)}
                    className="w-36"
                  />
                  <Input
                    value={(activity.time as string) || ""}
                    onChange={(e) => updateActivity(index, "time", e.target.value)}
                    placeholder="Time"
                    className="w-24"
                  />
                  <Input
                    value={(activity.confirmationCode as string) || ""}
                    onChange={(e) => updateActivity(index, "confirmationCode", e.target.value)}
                    placeholder="Confirmation"
                    className="w-32"
                  />
                  <button
                    onClick={() => removeActivity(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-6 bg-warm-50 rounded">
              No activities planned yet. Add tours, dinners, or experiences!
            </p>
          )}
        </div>

        {/* Two Column Layout: Documents & Packing */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Travel Documents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-medium text-warm-700">Documents</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={addDocument}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-warm-200 rounded group">
                    <Input
                      value={(doc.document as string) || ""}
                      onChange={(e) => updateDocument(index, "document", e.target.value)}
                      placeholder="Document"
                      className="flex-1 text-sm"
                    />
                    <select
                      value={(doc.status as string) || ""}
                      onChange={(e) => updateDocument(index, "status", e.target.value)}
                      className="w-28 px-2 py-1.5 border border-warm-300 text-sm rounded bg-white"
                    >
                      <option value="">Status</option>
                      <option value="Have it">Have it</option>
                      <option value="Need to get">Need to get</option>
                      <option value="Applied">Applied</option>
                      <option value="Expired">Expired</option>
                    </select>
                    <button
                      onClick={() => removeDocument(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-warm-400 italic text-center py-4 bg-warm-50 rounded">
                Add passports, visas, etc.
              </p>
            )}
          </div>

          {/* Packing List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-500" />
                <h3 className="text-lg font-medium text-warm-700">Packing</h3>
                {packingList.length > 0 && (
                  <span className="text-xs text-warm-500">
                    {packedCount}/{packingList.length} packed
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={addPackingItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {packingList.length > 0 ? (
              <div className="space-y-1">
                {packingList.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-warm-200 rounded group hover:bg-warm-50">
                    <input
                      type="checkbox"
                      checked={(item.packed as boolean) || false}
                      onChange={(e) => updatePackingItem(index, "packed", e.target.checked)}
                      className="w-4 h-4 accent-teal-500"
                    />
                    <Input
                      value={(item.item as string) || ""}
                      onChange={(e) => updatePackingItem(index, "item", e.target.value)}
                      placeholder="Item"
                      className={`flex-1 text-sm border-0 bg-transparent ${item.packed ? "line-through text-warm-400" : ""}`}
                    />
                    <button
                      onClick={() => removePackingItem(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-warm-400 italic text-center py-4 bg-warm-50 rounded">
                Start your packing list!
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-10">
          <Label className="text-warm-600 mb-2 block">Notes</Label>
          <Textarea
            value={(fields.notes as string) || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Any other notes, ideas, or things to remember..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REGISTRY TRACKER RENDERER
// ============================================================================

interface RegistryTrackerRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
}

function RegistryTrackerRenderer({ page, fields, updateField }: RegistryTrackerRendererProps) {
  const registries = (fields.registries as Record<string, unknown>[]) || [];
  const items = (fields.items as Record<string, unknown>[]) || [];

  const addRegistry = () => {
    updateField("registries", [...registries, { store: "", url: "" }]);
  };

  const updateRegistry = (index: number, key: string, value: string) => {
    const updated = [...registries];
    updated[index] = { ...updated[index], [key]: value };
    updateField("registries", updated);
  };

  const removeRegistry = (index: number) => {
    updateField("registries", registries.filter((_, i) => i !== index));
  };

  const addItem = () => {
    updateField("items", [...items, { item: "", store: "", price: "", quantity: 1, received: 0, priority: "" }]);
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    updateField("items", updated);
  };

  const removeItem = (index: number) => {
    updateField("items", items.filter((_, i) => i !== index));
  };

  // Stats
  const totalItems = items.reduce((sum, item) => sum + (parseInt(String(item.quantity)) || 1), 0);
  const receivedItems = items.reduce((sum, item) => sum + (parseInt(String(item.received)) || 0), 0);
  const totalValue = items.reduce((sum, item) => {
    const price = parseFloat(String(item.price)) || 0;
    const qty = parseInt(String(item.quantity)) || 1;
    return sum + (price * qty);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="text-center p-4 bg-warm-50 border border-warm-200">
            <p className="text-2xl font-light text-warm-700">{registries.length}</p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Registries</p>
          </div>
          <div className="text-center p-4 bg-warm-50 border border-warm-200">
            <p className="text-2xl font-light text-warm-700">
              {receivedItems}<span className="text-lg text-warm-400">/{totalItems}</span>
            </p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Items Received</p>
          </div>
          <div className="text-center p-4 bg-warm-50 border border-warm-200">
            <p className="text-2xl font-light text-green-600">{formatCurrency(totalValue)}</p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Total Value</p>
          </div>
        </div>

        {/* Registries */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-medium text-warm-700">Your Registries</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={addRegistry}>
              <Plus className="w-4 h-4 mr-1" />
              Add Registry
            </Button>
          </div>

          {registries.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {registries.map((registry, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border border-warm-200 rounded group">
                  <ShoppingBag className="w-4 h-4 text-warm-400 flex-shrink-0" />
                  <Input
                    value={(registry.store as string) || ""}
                    onChange={(e) => updateRegistry(index, "store", e.target.value)}
                    placeholder="Store name"
                    className="w-32"
                  />
                  <Input
                    value={(registry.url as string) || ""}
                    onChange={(e) => updateRegistry(index, "url", e.target.value)}
                    placeholder="Registry URL"
                    className="flex-1 text-sm"
                  />
                  {(registry.url as string) && (
                    <a
                      href={(registry.url as string)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-warm-500 hover:text-warm-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => removeRegistry(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-6 bg-warm-50 rounded">
              No registries added yet. Add links to your registries!
            </p>
          )}
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-medium text-warm-700">Registry Items</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          {items.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="border-b-2 border-warm-800 pb-2 grid grid-cols-[2fr,1fr,80px,80px,80px,100px,40px] gap-2 mb-2">
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Item</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Store</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Price</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Wanted</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Received</span>
                <span className="text-[10px] tracking-wider uppercase text-warm-500">Priority</span>
                <span></span>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => {
                  const qty = parseInt(String(item.quantity)) || 1;
                  const rec = parseInt(String(item.received)) || 0;
                  const isComplete = rec >= qty;

                  return (
                    <div
                      key={index}
                      className={`border-b border-warm-200 pb-2 grid grid-cols-[2fr,1fr,80px,80px,80px,100px,40px] gap-2 items-center group ${
                        isComplete ? "bg-green-50" : ""
                      }`}
                    >
                      <Input
                        value={(item.item as string) || ""}
                        onChange={(e) => updateItem(index, "item", e.target.value)}
                        placeholder="Item name"
                        className={isComplete ? "line-through text-warm-400" : ""}
                      />
                      <Input
                        value={(item.store as string) || ""}
                        onChange={(e) => updateItem(index, "store", e.target.value)}
                        placeholder="Store"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        value={(item.price as string) || ""}
                        onChange={(e) => updateItem(index, "price", e.target.value)}
                        placeholder="$0"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        value={(item.quantity as string) || "1"}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        className="text-sm text-center"
                        min={1}
                      />
                      <Input
                        type="number"
                        value={(item.received as string) || "0"}
                        onChange={(e) => updateItem(index, "received", e.target.value)}
                        className={`text-sm text-center ${isComplete ? "text-green-600" : ""}`}
                        min={0}
                      />
                      <select
                        value={(item.priority as string) || ""}
                        onChange={(e) => updateItem(index, "priority", e.target.value)}
                        className="px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                      >
                        <option value="">Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
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
          ) : (
            <p className="text-sm text-warm-400 italic text-center py-8 bg-warm-50 rounded">
              No items tracked yet. Add items from your registries to track what you&apos;ve received!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GIFT LOG RENDERER
// ============================================================================

interface GiftLogRendererProps {
  page: Page;
  fields: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
  allPages: Page[];
}

function GiftLogRenderer({ page, fields, updateField, allPages }: GiftLogRendererProps) {
  const gifts = (fields.gifts as Record<string, unknown>[]) || [];

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
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow-lg p-8 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="text-center p-4 bg-warm-50 border border-warm-200">
            <p className="text-2xl font-light text-warm-700">{totalGifts}</p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Total Gifts</p>
          </div>
          <div className="text-center p-4 bg-green-50 border border-green-200">
            <p className="text-2xl font-light text-green-600">{thankYousSent}</p>
            <p className="text-xs tracking-wider uppercase text-green-600">Thank Yous Sent</p>
          </div>
          <div className="text-center p-4 bg-amber-50 border border-amber-200">
            <p className="text-2xl font-light text-amber-600">{thankYousPending}</p>
            <p className="text-xs tracking-wider uppercase text-amber-600">Thank Yous Pending</p>
          </div>
        </div>

        {/* Quick Stats by Event */}
        {totalGifts > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {weddingGifts.length > 0 && (
              <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
                Wedding: {weddingGifts.length}
              </span>
            )}
            {showerGifts.length > 0 && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                Bridal Shower: {showerGifts.length}
              </span>
            )}
            {engagementGifts.length > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                Engagement: {engagementGifts.length}
              </span>
            )}
            {otherGifts.length > 0 && (
              <span className="px-3 py-1 bg-warm-100 text-warm-700 text-sm rounded-full">
                Other: {otherGifts.length}
              </span>
            )}
          </div>
        )}

        {/* Add Gift Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-medium text-warm-700">Gifts Received</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={addGift}>
            <Plus className="w-4 h-4 mr-1" />
            Add Gift
          </Button>
        </div>

        {/* Gifts Table */}
        {gifts.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="border-b-2 border-warm-800 pb-2 grid grid-cols-[1.5fr,1.5fr,120px,100px,80px,1fr,40px] gap-2 mb-2">
              <span className="text-[10px] tracking-wider uppercase text-warm-500">From</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Gift</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Event</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Date</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Thank You</span>
              <span className="text-[10px] tracking-wider uppercase text-warm-500">Notes</span>
              <span></span>
            </div>

            <div className="space-y-2">
              {gifts.map((gift, index) => (
                <div
                  key={index}
                  className={`border-b border-warm-200 pb-2 grid grid-cols-[1.5fr,1.5fr,120px,100px,80px,1fr,40px] gap-2 items-center group ${
                    gift.thankYouSent ? "bg-green-50/50" : ""
                  }`}
                >
                  <Input
                    value={(gift.from as string) || ""}
                    onChange={(e) => updateGift(index, "from", e.target.value)}
                    placeholder="Who gave it?"
                  />
                  <Input
                    value={(gift.item as string) || ""}
                    onChange={(e) => updateGift(index, "item", e.target.value)}
                    placeholder="What was it?"
                  />
                  <select
                    value={(gift.event as string) || ""}
                    onChange={(e) => updateGift(index, "event", e.target.value)}
                    className="px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                  >
                    <option value="">Event...</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Bridal Shower">Bridal Shower</option>
                    <option value="Engagement Party">Engagement Party</option>
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
                    placeholder="Notes for thank you"
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
          </>
        ) : (
          <p className="text-sm text-warm-400 italic text-center py-8 bg-warm-50 rounded">
            No gifts logged yet. Add gifts as you receive them to track thank-you notes!
          </p>
        )}
      </div>
    </div>
  );
}
