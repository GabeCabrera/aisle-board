"use client";

import React, { useState } from "react";
import { usePlannerData, formatCurrency, BudgetItem, PlannerData } from "@/lib/hooks/usePlannerData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, Wallet, AlertTriangle, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BudgetToolProps {
  initialData?: PlannerData;
}

const BUDGET_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Florist",
  "Music/DJ",
  "Attire",
  "Hair & Makeup",
  "Invitations",
  "Decor",
  "Transportation",
  "Officiant",
  "Cake",
  "Favors",
  "Rentals",
  "Other",
];

interface BudgetFormData {
  category: string;
  vendor: string;
  totalCost: string;
  amountPaid: string;
  notes: string;
}

const initialFormData: BudgetFormData = {
  category: "",
  vendor: "",
  totalCost: "",
  amountPaid: "",
  notes: "",
};

export default function BudgetTool({ initialData }: BudgetToolProps) {
  const { data, loading, refetch, isFetching } = usePlannerData(["budget", "kernel", "summary"], { initialData });
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>(initialFormData);
  const [totalBudgetInput, setTotalBudgetInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  const budget = data?.budget;
  const hasData = budget && budget.items && budget.items.length > 0;
  const isOverBudget = budget && budget.total > 0 && budget.spent > budget.total;

  const byCategory = (budget?.items || []).reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = { total: 0, paid: 0, items: [] };
    acc[cat].total += item.totalCost || 0;
    acc[cat].paid += item.amountPaid || 0;
    acc[cat].items.push(item);
    return acc;
  }, {} as Record<string, { total: number; paid: number; items: BudgetItem[] }>);

  const categories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      vendor: item.vendor || "",
      totalCost: item.totalCost.toString(),
      amountPaid: item.amountPaid.toString(),
      notes: item.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const openBudgetModal = () => {
    setTotalBudgetInput(budget?.total ? budget.total.toString() : "");
    setIsBudgetModalOpen(true);
  };

  const handleAddItem = async () => {
    if (!formData.category || !formData.totalCost) {
      toast.error("Please fill in category and total cost");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/budget/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          vendor: formData.vendor || undefined,
          totalCost: parseFloat(formData.totalCost),
          amountPaid: parseFloat(formData.amountPaid) || 0,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      toast.success("Budget item added");
      setIsAddModalOpen(false);
      setFormData(initialFormData);
      refetch();
    } catch {
      toast.error("Failed to add budget item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !formData.category || !formData.totalCost) {
      toast.error("Please fill in category and total cost");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/budget/items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          vendor: formData.vendor || undefined,
          totalCost: parseFloat(formData.totalCost),
          amountPaid: parseFloat(formData.amountPaid) || 0,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      toast.success("Budget item updated");
      setIsEditModalOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
      refetch();
    } catch {
      toast.error("Failed to update budget item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/budget/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      toast.success("Budget item deleted");
      refetch();
    } catch {
      toast.error("Failed to delete budget item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetTotalBudget = async () => {
    const value = parseFloat(totalBudgetInput);
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/budget/total", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBudget: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update budget");
      }

      toast.success("Total budget updated");
      setIsBudgetModalOpen(false);
      refetch();
    } catch {
      toast.error("Failed to update total budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form component for reuse
  const BudgetItemForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          required
        >
          <option value="">Select category...</option>
          {BUDGET_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Vendor Name</label>
        <Input
          name="vendor"
          value={formData.vendor}
          onChange={handleInputChange}
          placeholder="e.g., Grand Ballroom, John's Photography"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Total Cost *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              name="totalCost"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.totalCost}
              onChange={handleInputChange}
              placeholder="0.00"
              className="pl-7 h-11"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount Paid</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              name="amountPaid"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.amountPaid}
              onChange={handleInputChange}
              placeholder="0.00"
              className="pl-7 h-11"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Input
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Any additional details..."
        />
      </div>

      <DialogFooter className="pt-4">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
  
  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight">
            Budget
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2 font-light">
            Track your wedding expenses and stay on track.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-9 sm:h-8 px-3 border-border hover:bg-white hover:text-primary"
            onClick={() => refetch()} 
            disabled={isFetching} 
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", isFetching && "animate-spin")} />
            <span className="hidden sm:inline">{isFetching ? "Refreshing..." : "Refresh"}</span>
            <span className="sm:hidden">{isFetching ? "..." : "Refresh"}</span>
          </Button>
          <Button
            size="sm"
            className="rounded-full h-9 sm:h-8 px-4"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {!hasData ? (
        /* Empty state */
        <Card className="text-center p-8 border-dashed border-muted-foreground/30 shadow-none bg-canvas">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-primary" data-testid="empty-budget-icon" />
          </div>
          <CardTitle className="font-serif text-2xl text-foreground mb-2">No budget items yet</CardTitle>
          <p className="text-muted-foreground mb-6">
            Start tracking your wedding expenses by adding your first budget item.
          </p>
          <Button onClick={openAddModal} className="rounded-full px-6 shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Item
          </Button>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card 
              className="hover:shadow-lifted transition-all duration-300 cursor-pointer"
              onClick={openBudgetModal}
            >
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm mb-1">Total Budget</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">
                  {budget.total > 0 ? formatCurrency(budget.total) : "Not set"}
                </h3>
                <p className="text-xs text-primary mt-1">Click to edit</p>
              </CardContent>
            </Card>
            <Card className={cn(
              "hover:shadow-lifted transition-all duration-300",
              isOverBudget && "bg-destructive/10 border-destructive/20"
            )}>
              <CardContent className="p-6">
                <p className={cn("text-sm mb-1", isOverBudget ? "text-destructive" : "text-muted-foreground")}>Allocated</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">
                  {formatCurrency(budget.spent)}
                </h3>
                {budget.total > 0 && (
                  <p className={cn("text-sm mt-1", isOverBudget ? "text-destructive/80" : "text-muted-foreground")}>
                    {budget.percentUsed}% of budget
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm mb-1">Paid So Far</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">
                  {formatCurrency(budget.paid)}
                </h3>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm mb-1">Still Owed</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">
                  {formatCurrency(budget.remaining)}
                </h3>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {budget.total > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-muted-foreground text-sm">Budget used</p>
                  <p className={cn("font-medium", isOverBudget ? "text-destructive" : "text-foreground")}>
                    {budget.percentUsed}%
                  </p>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000 ease-out",
                      isOverBudget ? "bg-destructive" : budget.percentUsed > 90 ? "bg-primary" : "bg-primary/70"
                    )}
                    style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                  />
                </div>
                {isOverBudget && (
                  <div className="flex items-center text-destructive text-sm mt-3 p-2 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Over budget by {formatCurrency(budget.spent - budget.total)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="p-6 border-b border-border/70">
              <CardTitle className="font-serif text-xl text-foreground">By Category</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/70">
                {categories.map(([category, catData]) => {
                  const percentage = budget.spent > 0 
                    ? Math.round((catData.total / budget.spent) * 100) 
                    : 0;
                  
                  return (
                    <li key={category} className="flex items-center justify-between p-4 group hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium text-muted-foreground">{category}</span>
                        <p className="text-sm text-muted-foreground">
                          {catData.items.length} item{catData.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans font-medium text-foreground">{formatCurrency(catData.total)}</p>
                        <p className="text-sm text-muted-foreground">{percentage}% of total</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* All Items */}
          <Card>
            <CardHeader className="p-6 border-b border-border/70 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-xl text-foreground">All Items</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full h-8 px-3"
                onClick={openAddModal}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/70">
                {budget.items.map((item) => {
                  const isPaidInFull = item.amountPaid >= item.totalCost;
                  const isDeleting = deletingId === item.id;
                  
                  return (
                    <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 group hover:bg-muted/30 transition-colors gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-medium text-foreground truncate">{item.vendor || item.category}</p>
                        <p className="text-sm text-muted-foreground truncate">{item.notes || `Category: ${item.category}`}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-sans font-medium text-foreground">{formatCurrency(item.totalCost)}</p>
                          {item.amountPaid > 0 && (
                            <p className={cn("text-sm", isPaidInFull ? "text-green-600" : "text-muted-foreground")}>
                              {isPaidInFull ? "Paid in full" : `${formatCurrency(item.amountPaid)} paid`}
                            </p>
                          )}
                        </div>
                        {/* Always visible on mobile, hover on desktop */}
                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0"
                            onClick={() => openEditModal(item)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Item Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
            <DialogDescription>
              Track a new wedding expense.
            </DialogDescription>
          </DialogHeader>
          <BudgetItemForm onSubmit={handleAddItem} submitLabel="Add Item" />
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Budget Item</DialogTitle>
            <DialogDescription>
              Update this expense.
            </DialogDescription>
          </DialogHeader>
          <BudgetItemForm onSubmit={handleUpdateItem} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Set Total Budget Modal */}
      <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Total Budget</DialogTitle>
            <DialogDescription>
              What&apos;s your overall wedding budget?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="100"
                min="0"
                value={totalBudgetInput}
                onChange={(e) => setTotalBudgetInput(e.target.value)}
                placeholder="e.g., 25000"
                className="pl-7 text-lg h-12"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleSetTotalBudget}
                disabled={isSubmitting}
                className="w-full h-12"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Budget
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
