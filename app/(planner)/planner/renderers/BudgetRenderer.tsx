"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp, DollarSign, Calendar, FileText, CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type BaseRendererProps, type BudgetItem, type Payment } from "./types";
import { formatCurrency, BUDGET_CATEGORIES } from "./shared";

export function BudgetRenderer({ page, fields, updateField }: BaseRendererProps) {
  // Ensure items is always an array
  const rawItems = fields.items;
  const items: BudgetItem[] = Array.isArray(rawItems) ? rawItems : [];
  
  const totalBudget = parseFloat((fields.totalBudget as string) || "0") || 0;
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentItemIndex, setPaymentItemIndex] = useState<number | null>(null);
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    method: "",
    notes: "",
  });

  // Generate unique ID
  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Calculate totals
  const totalCost = items.reduce((sum, item) => {
    return sum + (parseFloat(item.totalCost || "0") || 0);
  }, 0);

  const totalPaid = items.reduce((sum, item) => {
    return sum + (parseFloat(item.amountPaid || "0") || 0);
  }, 0);

  const totalRemaining = totalCost - totalPaid;
  const budgetRemaining = totalBudget - totalCost;

  // Get upcoming payments (items with due dates in next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const upcomingPayments = items.filter(item => {
    const depositDue = item.depositDueDate ? new Date(item.depositDueDate) : null;
    const finalDue = item.finalPaymentDueDate ? new Date(item.finalPaymentDueDate) : null;
    const itemPaid = parseFloat(item.amountPaid || "0") || 0;
    const itemTotal = parseFloat(item.totalCost || "0") || 0;
    
    if (itemPaid >= itemTotal) return false; // Already paid in full
    
    return (depositDue && depositDue >= today && depositDue <= thirtyDaysFromNow) ||
           (finalDue && finalDue >= today && finalDue <= thirtyDaysFromNow);
  });

  // Items by category for pie chart effect
  const categoryTotals = items.reduce((acc, item) => {
    const cat = item.category || "Other";
    const cost = parseFloat(item.totalCost || "0") || 0;
    acc[cat] = (acc[cat] || 0) + cost;
    return acc;
  }, {} as Record<string, number>);

  const addItem = () => {
    const newItem: BudgetItem = {
      id: generateId(),
      category: "",
      vendor: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      totalCost: "",
      amountPaid: "",
      notes: "",
      payments: [],
      contractStatus: "none",
      depositDueDate: "",
      finalPaymentDueDate: "",
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

  const openPaymentDialog = (index: number) => {
    setPaymentItemIndex(index);
    setNewPayment({
      amount: "",
      date: new Date().toISOString().split('T')[0],
      method: "",
      notes: "",
    });
    setShowPaymentDialog(true);
  };

  const addPayment = () => {
    if (paymentItemIndex === null || !newPayment.amount) return;
    
    const item = items[paymentItemIndex];
    const payment: Payment = {
      id: generateId(),
      amount: newPayment.amount || "",
      date: newPayment.date || "",
      method: newPayment.method || "",
      notes: newPayment.notes || "",
    };
    
    const existingPayments = item.payments || [];
    const totalPayments = existingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const newTotal = totalPayments + (parseFloat(payment.amount) || 0);
    
    updateItem(paymentItemIndex, "payments", [...existingPayments, payment]);
    updateItem(paymentItemIndex, "amountPaid", newTotal.toString());
    
    setShowPaymentDialog(false);
    setPaymentItemIndex(null);
  };

  const removePayment = (itemIndex: number, paymentId: string) => {
    const item = items[itemIndex];
    const updatedPayments = (item.payments || []).filter(p => p.id !== paymentId);
    const newTotal = updatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    updateItem(itemIndex, "payments", updatedPayments);
    updateItem(itemIndex, "amountPaid", newTotal.toString());
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case "signed": return "text-green-600 bg-green-50";
      case "pending": return "text-amber-600 bg-amber-50";
      case "completed": return "text-blue-600 bg-blue-50";
      default: return "text-warm-400 bg-warm-50";
    }
  };

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case "signed": return <CheckCircle2 className="w-3 h-3" />;
      case "pending": return <Clock className="w-3 h-3" />;
      case "completed": return <CheckCircle2 className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
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

        {/* Budget Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-warm-50 border border-warm-200">
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

        {/* Budget vs Actual Progress */}
        {totalBudget > 0 && (
          <div className="mb-8 p-4 border border-warm-200 bg-warm-50/50">
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

        {/* Upcoming Payments Alert */}
        {upcomingPayments.length > 0 && (
          <div className="mb-8 p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-medium text-amber-800">Upcoming Payments</h3>
            </div>
            <div className="space-y-2">
              {upcomingPayments.slice(0, 3).map((item, idx) => {
                const itemPaid = parseFloat(item.amountPaid || "0") || 0;
                const itemTotal = parseFloat(item.totalCost || "0") || 0;
                const remaining = itemTotal - itemPaid;
                const dueDate = item.depositDueDate || item.finalPaymentDueDate;
                
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">{item.vendor || item.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-600 font-medium">{formatCurrency(remaining)} due</span>
                      {dueDate && (
                        <span className="text-amber-500 text-xs">
                          {new Date(dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="mb-8 p-4 border border-warm-200">
            <h3 className="text-sm font-medium text-warm-600 mb-4">Spending by Category</h3>
            <div className="space-y-2">
              {Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-sm text-warm-600 w-36 truncate">{category}</span>
                      <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-warm-400 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-warm-500 w-24 text-right">{formatCurrency(amount)}</span>
                      <span className="text-xs text-warm-400 w-12 text-right">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Add Item Button */}
        <div className="flex justify-between items-center mb-6">
          <Label>Vendors & Expenses</Label>
          <Button variant="ghost" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Vendor
          </Button>
        </div>

        {/* Items List */}
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item, index) => {
              const itemTotalCost = parseFloat(item.totalCost || "0") || 0;
              const itemAmountPaid = parseFloat(item.amountPaid || "0") || 0;
              const itemRemaining = itemTotalCost - itemAmountPaid;
              const isExpanded = expandedItem === item.id;
              const paymentPercentage = itemTotalCost > 0 ? (itemAmountPaid / itemTotalCost) * 100 : 0;

              return (
                <div
                  key={item.id || index}
                  className="border border-warm-200 rounded-lg overflow-hidden"
                >
                  {/* Main Row */}
                  <div className="p-4 bg-white">
                    <div className="flex items-center gap-4">
                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="p-1 hover:bg-warm-100 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-warm-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-warm-500" />
                        )}
                      </button>

                      {/* Category */}
                      <select
                        value={item.category || ""}
                        onChange={(e) => updateItem(index, "category", e.target.value)}
                        className="w-40 px-2 py-1.5 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white rounded"
                      >
                        <option value="">Category...</option>
                        {BUDGET_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      {/* Vendor Name */}
                      <Input
                        value={item.vendor || ""}
                        onChange={(e) => updateItem(index, "vendor", e.target.value)}
                        className="flex-1"
                        placeholder="Vendor name"
                      />

                      {/* Contract Status */}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getContractStatusColor(item.contractStatus || "none")}`}>
                        {getContractStatusIcon(item.contractStatus || "none")}
                        <select
                          value={item.contractStatus || "none"}
                          onChange={(e) => updateItem(index, "contractStatus", e.target.value)}
                          className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="none">No Contract</option>
                          <option value="pending">Pending</option>
                          <option value="signed">Signed</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      {/* Cost */}
                      <div className="flex items-center gap-1 w-28">
                        <DollarSign className="w-4 h-4 text-warm-400" />
                        <Input
                          type="number"
                          value={item.totalCost || ""}
                          onChange={(e) => updateItem(index, "totalCost", e.target.value)}
                          className="text-sm"
                          placeholder="0"
                        />
                      </div>

                      {/* Paid */}
                      <div className="w-24 text-right">
                        <span className={`text-sm font-medium ${itemRemaining > 0 ? "text-amber-600" : "text-green-600"}`}>
                          {formatCurrency(itemAmountPaid)}
                        </span>
                        <span className="text-xs text-warm-400 block">
                          / {formatCurrency(itemTotalCost)}
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Payment Progress Bar */}
                    {itemTotalCost > 0 && (
                      <div className="mt-3 ml-10">
                        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              paymentPercentage >= 100 ? "bg-green-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 bg-warm-50 border-t border-warm-200">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Contact Info */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-warm-600">Contact Information</h4>
                          <Input
                            value={item.contactName || ""}
                            onChange={(e) => updateItem(index, "contactName", e.target.value)}
                            placeholder="Contact name"
                            className="text-sm"
                          />
                          <Input
                            value={item.contactEmail || ""}
                            onChange={(e) => updateItem(index, "contactEmail", e.target.value)}
                            placeholder="Email"
                            type="email"
                            className="text-sm"
                          />
                          <Input
                            value={item.contactPhone || ""}
                            onChange={(e) => updateItem(index, "contactPhone", e.target.value)}
                            placeholder="Phone"
                            type="tel"
                            className="text-sm"
                          />
                        </div>

                        {/* Payment Dates */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-warm-600">Payment Schedule</h4>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-warm-400" />
                            <span className="text-sm text-warm-500 w-24">Deposit Due:</span>
                            <Input
                              type="date"
                              value={item.depositDueDate || ""}
                              onChange={(e) => updateItem(index, "depositDueDate", e.target.value)}
                              className="text-sm flex-1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-warm-400" />
                            <span className="text-sm text-warm-500 w-24">Final Due:</span>
                            <Input
                              type="date"
                              value={item.finalPaymentDueDate || ""}
                              onChange={(e) => updateItem(index, "finalPaymentDueDate", e.target.value)}
                              className="text-sm flex-1"
                            />
                          </div>
                          <Input
                            value={item.notes || ""}
                            onChange={(e) => updateItem(index, "notes", e.target.value)}
                            placeholder="Notes"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Payment History */}
                      <div className="mt-6 pt-4 border-t border-warm-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-warm-600">Payment History</h4>
                          <Button variant="outline" size="sm" onClick={() => openPaymentDialog(index)}>
                            <CreditCard className="w-3 h-3 mr-1" />
                            Log Payment
                          </Button>
                        </div>
                        
                        {(item.payments || []).length > 0 ? (
                          <div className="space-y-2">
                            {(item.payments || []).map((payment) => (
                              <div 
                                key={payment.id} 
                                className="flex items-center justify-between p-2 bg-white rounded border border-warm-100 group"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-green-600">
                                    {formatCurrency(parseFloat(payment.amount) || 0)}
                                  </span>
                                  <span className="text-xs text-warm-500">
                                    {payment.date ? new Date(payment.date).toLocaleDateString() : "No date"}
                                  </span>
                                  {payment.method && (
                                    <span className="text-xs text-warm-400 bg-warm-100 px-2 py-0.5 rounded">
                                      {payment.method}
                                    </span>
                                  )}
                                  {payment.notes && (
                                    <span className="text-xs text-warm-400 italic">
                                      {payment.notes}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => removePayment(index, payment.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-warm-400 italic">No payments logged yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-warm-400 italic text-center py-8">
            No vendors yet. Click &quot;Add Vendor&quot; to start tracking your expenses.
          </p>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              Log Payment
            </DialogTitle>
            <DialogDescription>
              {paymentItemIndex !== null && items[paymentItemIndex] && (
                <>Record a payment for {items[paymentItemIndex].vendor || items[paymentItemIndex].category}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-warm-400" />
                <Input
                  type="number"
                  value={newPayment.amount || ""}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newPayment.date || ""}
                onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                value={newPayment.method || ""}
                onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded text-sm focus:outline-none focus:border-warm-500"
              >
                <option value="">Select method...</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Venmo">Venmo</option>
                <option value="PayPal">PayPal</option>
                <option value="Zelle">Zelle</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={newPayment.notes || ""}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="e.g., Deposit, Final payment"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm-200">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={addPayment}
              disabled={!newPayment.amount}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Log Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
