"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, Phone, Mail, Globe, MapPin, FileText, 
  CheckCircle2, Clock, AlertCircle, ExternalLink, Copy,
  Building2, User, Calendar, DollarSign, ChevronDown, ChevronUp,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { type RendererWithAllPagesProps, type Vendor, type BudgetItem } from "./types";
import { formatCurrency, BUDGET_CATEGORIES } from "./shared";

export function VendorContactsRenderer({ page, fields, updateField, allPages }: RendererWithAllPagesProps) {
  // Ensure vendors is always an array
  const rawVendors = fields.vendors;
  const vendors: Vendor[] = Array.isArray(rawVendors) ? rawVendors : [];
  
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Get budget page data for importing vendors
  const budgetPage = allPages.find(p => p.templateId === "budget");
  const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
  const rawBudgetItems = budgetFields.items;
  const budgetItems: BudgetItem[] = Array.isArray(rawBudgetItems) ? rawBudgetItems : [];

  // Find vendors from budget that aren't already in vendor contacts
  const importableVendors = budgetItems.filter(item => {
    if (!item.vendor) return false;
    return !vendors.some(v => 
      v.company?.toLowerCase() === item.vendor?.toLowerCase() &&
      v.category === item.category
    );
  });

  // Generate unique ID
  const generateId = () => `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addVendor = () => {
    const newVendor: Vendor = {
      id: generateId(),
      category: "",
      company: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      contractStatus: "none",
      depositPaid: false,
      notes: "",
    };
    updateField("vendors", [...vendors, newVendor]);
  };

  const importFromBudget = (budgetItem: BudgetItem) => {
    const newVendor: Vendor = {
      id: generateId(),
      category: budgetItem.category || "",
      company: budgetItem.vendor || "",
      contactName: budgetItem.contactName || "",
      email: budgetItem.contactEmail || "",
      phone: budgetItem.contactPhone || "",
      website: "",
      address: "",
      contractStatus: budgetItem.contractStatus || "none",
      depositPaid: (parseFloat(budgetItem.amountPaid || "0") || 0) > 0,
      notes: budgetItem.notes || "",
      totalCost: parseFloat(budgetItem.totalCost || "0") || 0,
      amountPaid: parseFloat(budgetItem.amountPaid || "0") || 0,
    };
    updateField("vendors", [...vendors, newVendor]);
    toast.success(`Imported ${budgetItem.vendor || budgetItem.category}`);
  };

  const importAllFromBudget = () => {
    const newVendors = importableVendors.map(item => ({
      id: generateId(),
      category: item.category || "",
      company: item.vendor || "",
      contactName: item.contactName || "",
      email: item.contactEmail || "",
      phone: item.contactPhone || "",
      website: "",
      address: "",
      contractStatus: item.contractStatus || "none",
      depositPaid: (parseFloat(item.amountPaid || "0") || 0) > 0,
      notes: item.notes || "",
      totalCost: parseFloat(item.totalCost || "0") || 0,
      amountPaid: parseFloat(item.amountPaid || "0") || 0,
    }));
    updateField("vendors", [...vendors, ...newVendors]);
    toast.success(`Imported ${newVendors.length} vendors`);
    setShowImportDialog(false);
  };

  const updateVendor = (index: number, key: string, value: unknown) => {
    const updated = [...vendors];
    updated[index] = { ...updated[index], [key]: value };
    updateField("vendors", updated);
  };

  const removeVendor = (index: number) => {
    updateField("vendors", vendors.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case "signed": return "text-green-600 bg-green-50 border-green-200";
      case "pending": return "text-amber-600 bg-amber-50 border-amber-200";
      case "completed": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-warm-400 bg-warm-50 border-warm-200";
    }
  };

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case "signed": return <CheckCircle2 className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Group vendors by category
  const vendorsByCategory = vendors.reduce((acc, vendor) => {
    const cat = vendor.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(vendor);
    return acc;
  }, {} as Record<string, Vendor[]>);

  // Stats
  const totalVendors = vendors.length;
  const signedContracts = vendors.filter(v => v.contractStatus === "signed" || v.contractStatus === "completed").length;
  const pendingContracts = vendors.filter(v => v.contractStatus === "pending").length;

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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-warm-50 border border-warm-200 rounded-lg">
            <p className="text-2xl font-light text-warm-700">{totalVendors}</p>
            <p className="text-xs tracking-wider uppercase text-warm-500">Total Vendors</p>
          </div>
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-2xl font-light text-green-600">{signedContracts}</p>
            <p className="text-xs tracking-wider uppercase text-green-600">Contracts Signed</p>
          </div>
          <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-2xl font-light text-amber-600">{pendingContracts}</p>
            <p className="text-xs tracking-wider uppercase text-amber-600">Pending</p>
          </div>
        </div>

        {/* Import from Budget */}
        {importableVendors.length > 0 && (
          <div className="mb-8 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-800">Import from Budget</h3>
                  <p className="text-sm text-blue-600">
                    {importableVendors.length} vendor{importableVendors.length !== 1 ? "s" : ""} found in your budget
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowImportDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Import Vendors
              </Button>
            </div>
          </div>
        )}

        {/* Add Vendor Button */}
        <div className="flex justify-between items-center mb-6">
          <Label>Your Vendors</Label>
          <Button variant="ghost" size="sm" onClick={addVendor}>
            <Plus className="w-4 h-4 mr-1" />
            Add Vendor
          </Button>
        </div>

        {/* Vendors List */}
        {vendors.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(vendorsByCategory).map(([category, categoryVendors]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-warm-500 mb-3 uppercase tracking-wider">
                  {category} ({categoryVendors.length})
                </h3>
                <div className="space-y-3">
                  {categoryVendors.map((vendor) => {
                    const index = vendors.findIndex(v => v.id === vendor.id);
                    const isExpanded = expandedVendor === vendor.id;

                    return (
                      <div
                        key={vendor.id}
                        className="border border-warm-200 rounded-lg overflow-hidden hover:border-warm-300 transition-colors"
                      >
                        {/* Main Row */}
                        <div className="p-4 bg-white">
                          <div className="flex items-center gap-4">
                            {/* Expand/Collapse */}
                            <button
                              onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}
                              className="p-1 hover:bg-warm-100 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-warm-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-warm-500" />
                              )}
                            </button>

                            {/* Icon */}
                            <div className="w-10 h-10 bg-warm-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-warm-500" />
                            </div>

                            {/* Company Name */}
                            <div className="flex-1 min-w-0">
                              <Input
                                value={vendor.company || ""}
                                onChange={(e) => updateVendor(index, "company", e.target.value)}
                                className="font-medium border-0 px-0 focus:ring-0 text-lg"
                                placeholder="Company name"
                              />
                              <div className="flex items-center gap-4 mt-1">
                                {vendor.contactName && (
                                  <span className="text-sm text-warm-500 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {vendor.contactName}
                                  </span>
                                )}
                                {vendor.phone && (
                                  <button 
                                    onClick={() => copyToClipboard(vendor.phone, "Phone")}
                                    className="text-sm text-warm-500 hover:text-warm-700 flex items-center gap-1"
                                  >
                                    <Phone className="w-3 h-3" />
                                    {vendor.phone}
                                  </button>
                                )}
                                {vendor.email && (
                                  <a 
                                    href={`mailto:${vendor.email}`}
                                    className="text-sm text-warm-500 hover:text-warm-700 flex items-center gap-1"
                                  >
                                    <Mail className="w-3 h-3" />
                                    {vendor.email}
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Contract Status */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getContractStatusColor(vendor.contractStatus)}`}>
                              {getContractStatusIcon(vendor.contractStatus)}
                              <select
                                value={vendor.contractStatus || "none"}
                                onChange={(e) => updateVendor(index, "contractStatus", e.target.value)}
                                className="bg-transparent border-none text-sm focus:outline-none cursor-pointer font-medium"
                              >
                                <option value="none">No Contract</option>
                                <option value="pending">Pending</option>
                                <option value="signed">Signed</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>

                            {/* Budget info if available */}
                            {(vendor.totalCost !== undefined && vendor.totalCost > 0) && (
                              <div className="text-right">
                                <p className="text-sm font-medium text-warm-700">
                                  {formatCurrency(vendor.totalCost)}
                                </p>
                                <p className="text-xs text-warm-400">
                                  {formatCurrency(vendor.amountPaid || 0)} paid
                                </p>
                              </div>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => removeVendor(index)}
                              className="p-2 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="p-4 bg-warm-50 border-t border-warm-200">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Contact Info */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-warm-600">Contact Details</h4>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs">Category</Label>
                                  <select
                                    value={vendor.category || ""}
                                    onChange={(e) => updateVendor(index, "category", e.target.value)}
                                    className="w-full px-3 py-2 border border-warm-300 rounded text-sm focus:outline-none focus:border-warm-500 bg-white"
                                  >
                                    <option value="">Select category...</option>
                                    {BUDGET_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">Contact Name</Label>
                                  <Input
                                    value={vendor.contactName || ""}
                                    onChange={(e) => updateVendor(index, "contactName", e.target.value)}
                                    placeholder="Primary contact"
                                    className="text-sm"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">Email</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={vendor.email || ""}
                                      onChange={(e) => updateVendor(index, "email", e.target.value)}
                                      placeholder="email@example.com"
                                      type="email"
                                      className="text-sm flex-1"
                                    />
                                    {vendor.email && (
                                      <>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => copyToClipboard(vendor.email, "Email")}
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                        <a href={`mailto:${vendor.email}`}>
                                          <Button variant="outline" size="sm">
                                            <Mail className="w-3 h-3" />
                                          </Button>
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">Phone</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={vendor.phone || ""}
                                      onChange={(e) => updateVendor(index, "phone", e.target.value)}
                                      placeholder="(555) 123-4567"
                                      type="tel"
                                      className="text-sm flex-1"
                                    />
                                    {vendor.phone && (
                                      <>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => copyToClipboard(vendor.phone, "Phone")}
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                        <a href={`tel:${vendor.phone}`}>
                                          <Button variant="outline" size="sm">
                                            <Phone className="w-3 h-3" />
                                          </Button>
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Additional Info */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-warm-600">Additional Information</h4>

                                <div className="space-y-2">
                                  <Label className="text-xs">Website</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={vendor.website || ""}
                                      onChange={(e) => updateVendor(index, "website", e.target.value)}
                                      placeholder="https://..."
                                      className="text-sm flex-1"
                                    />
                                    {vendor.website && (
                                      <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">
                                          <ExternalLink className="w-3 h-3" />
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">Address</Label>
                                  <Input
                                    value={vendor.address || ""}
                                    onChange={(e) => updateVendor(index, "address", e.target.value)}
                                    placeholder="Full address"
                                    className="text-sm"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">Notes</Label>
                                  <Textarea
                                    value={vendor.notes || ""}
                                    onChange={(e) => updateVendor(index, "notes", e.target.value)}
                                    placeholder="Additional notes, contract details, etc."
                                    rows={3}
                                    className="text-sm"
                                  />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                  <input
                                    type="checkbox"
                                    id={`deposit-${vendor.id}`}
                                    checked={vendor.depositPaid || false}
                                    onChange={(e) => updateVendor(index, "depositPaid", e.target.checked)}
                                    className="w-4 h-4 accent-green-500"
                                  />
                                  <Label htmlFor={`deposit-${vendor.id}`} className="text-sm cursor-pointer">
                                    Deposit paid
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-warm-50 rounded-lg">
            <Building2 className="w-12 h-12 mx-auto text-warm-300 mb-4" />
            <p className="text-warm-500 mb-2">No vendors yet</p>
            <p className="text-sm text-warm-400 mb-4">
              {importableVendors.length > 0 
                ? "Import vendors from your budget or add them manually"
                : "Add your first vendor to get started"
              }
            </p>
            <div className="flex gap-3 justify-center">
              {importableVendors.length > 0 && (
                <Button onClick={() => setShowImportDialog(true)} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Import from Budget
                </Button>
              )}
              <Button onClick={addVendor}>
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              Import from Budget
            </DialogTitle>
            <DialogDescription>
              Select vendors to import from your budget tracker
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {importableVendors.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 border border-warm-200 rounded-lg hover:bg-warm-50"
              >
                <div>
                  <p className="font-medium text-warm-700">{item.vendor || "Unnamed"}</p>
                  <p className="text-sm text-warm-500">{item.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.totalCost && (
                    <span className="text-sm text-warm-500">
                      {formatCurrency(parseFloat(item.totalCost) || 0)}
                    </span>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => importFromBudget(item)}
                  >
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            <Button variant="outline" onClick={() => setShowImportDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={importAllFromBudget}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Import All ({importableVendors.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
