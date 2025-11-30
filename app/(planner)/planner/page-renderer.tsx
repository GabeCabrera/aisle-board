"use client";

import { type Page } from "@/lib/db/schema";
import { getTemplateById } from "@/lib/templates/registry";
import { isSharedField } from "@/lib/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Link as LinkIcon, Share2, Copy, ExternalLink, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageRendererProps {
  page: Page;
  onFieldChange: (fields: Record<string, unknown>) => void;
}

export function PageRenderer({ page, onFieldChange }: PageRendererProps) {
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

function GuestListRenderer({ page, fields, updateField }: GuestListRendererProps) {
  const guests = (fields.guests as Record<string, unknown>[]) || [];
  const [rsvpForm, setRsvpForm] = useState<{ slug: string; isActive: boolean } | null>(null);
  const [isLoadingRsvp, setIsLoadingRsvp] = useState(true);
  const [showRsvpSetup, setShowRsvpSetup] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // Fetch existing RSVP form
  useEffect(() => {
    const fetchRsvpForm = async () => {
      try {
        const response = await fetch(`/api/rsvp/create?pageId=${page.id}`);
        if (response.ok) {
          const data = await response.json();
          setRsvpForm(data);
        }
      } catch (error) {
        console.error("Failed to fetch RSVP form:", error);
      } finally {
        setIsLoadingRsvp(false);
      }
    };
    fetchRsvpForm();
  }, [page.id]);

  const createRsvpLink = async () => {
    setIsCreatingLink(true);
    try {
      const response = await fetch("/api/rsvp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          title: "RSVP",
          fields: {
            name: true,
            email: true,
            phone: true,
            address: true,
            attending: true,
            mealChoice: false,
            dietaryRestrictions: true,
            plusOne: true,
            plusOneName: true,
            plusOneMeal: false,
            songRequest: false,
            notes: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRsvpForm(data);
        toast.success("RSVP link created!");
        setShowRsvpSetup(false);
      } else {
        throw new Error("Failed to create");
      }
    } catch (error) {
      toast.error("Failed to create RSVP link");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const copyLink = () => {
    if (rsvpForm) {
      const link = `${window.location.origin}/rsvp/${rsvpForm.slug}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    }
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

      {/* RSVP Setup Dialog */}
      <Dialog open={showRsvpSetup} onOpenChange={setShowRsvpSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>We Need Your Address</DialogTitle>
            <DialogDescription>
              Create a shareable link for guests to send you their details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-warm-600 mb-4">
              Your guests will be able to share:
            </p>
            <ul className="text-sm text-warm-600 space-y-1 mb-6">
              <li>• Their name & contact info</li>
              <li>• Mailing address</li>
              <li>• RSVP status</li>
              <li>• Dietary restrictions</li>
              <li>• Plus one details</li>
              <li>• Notes & well-wishes</li>
            </ul>
            <p className="text-xs text-warm-500">
              Responses will automatically appear in your guest list.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowRsvpSetup(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={createRsvpLink} 
              disabled={isCreatingLink}
              className="flex-1 bg-warm-600 hover:bg-warm-700 text-white"
            >
              {isCreatingLink ? "Creating..." : "Create Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
