"use client";

import { type Page } from "@/lib/db/schema";
import { getTemplateById } from "@/lib/templates/registry";
import { isSharedField } from "@/lib/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
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
  schema: { key: string; label: string; type: string; required?: boolean }[];
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
                ) : (
                  <Input
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
