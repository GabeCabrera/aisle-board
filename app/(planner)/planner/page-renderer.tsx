"use client";

import { type Page } from "@/lib/db/schema";
import { getTemplateById } from "@/lib/templates/registry";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

// Import all renderers
import {
  FieldLabel,
  CoverPageRenderer,
  BudgetRenderer,
  GuestListRenderer,
  OverviewRenderer,
  WeddingPartyRenderer,
  TaskBoardRenderer,
  MusicPlaylistRenderer,
  CeremonyScriptRenderer,
  HoneymoonPlannerRenderer,
  RegistryTrackerRenderer,
  GiftLogRenderer,
  VendorContactsRenderer,
  DayOfScheduleRenderer,
  SeatingChartRenderer,
} from "./renderers";

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
      <CoverPageRenderer
        page={page}
        fields={fields}
        updateField={updateField}
      />
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

  // Special rendering for wedding overview dashboard (uses context, no allPages needed)
  if (page.templateId === "overview") {
    return (
      <OverviewRenderer
        page={page}
        fields={fields}
        updateField={updateField}
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

  // Special rendering for vendor contacts
  if (page.templateId === "vendor-contacts") {
    return (
      <VendorContactsRenderer
        page={page}
        fields={fields}
        updateField={updateField}
        allPages={allPages}
      />
    );
  }

  // Special rendering for day-of schedule
  if (page.templateId === "day-of-schedule") {
    return (
      <DayOfScheduleRenderer
        page={page}
        fields={fields}
        updateField={updateField}
        allPages={allPages}
      />
    );
  }

  // Special rendering for seating chart
  if (page.templateId === "seating-chart") {
    return (
      <SeatingChartRenderer
        page={page}
        fields={fields}
        updateField={updateField}
        allPages={allPages}
      />
    );
  }

  // Default generic renderer for templates without custom renderers
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

// Array field component for generic templates
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
