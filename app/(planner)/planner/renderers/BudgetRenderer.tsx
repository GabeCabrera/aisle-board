"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, ChevronDown, ChevronUp, DollarSign, CreditCard, 
  AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Sparkles,
  PieChart, ArrowRight, Lightbulb, ExternalLink, Phone, Mail,
  Calendar, FileText, MoreHorizontal, Receipt
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type RendererWithAllPagesProps, type BudgetItem, type Payment } from "./types";
import { formatCurrency, BUDGET_CATEGORIES, UpgradePrompt, UPGRADE_SUGGESTIONS, RelatedTemplates, TemplateLink } from "./shared";
import { useUserPlan } from "../context";
import { Contact } from "lucide-react";

// ============================================================================
// TYPICAL WEDDING BUDGET PERCENTAGES (Industry Standard)
// ============================================================================
const TYPICAL_PERCENTAGES: Record<string, { percent: number; description: string }> = {
  "Venue": { percent: 30, description: "Usually 25-35% of budget" },
  "Catering": { percent: 25, description: "Usually 20-30% of budget" },
  "Photography": { percent: 10, description: "Usually 8-12% of budget" },
  "Videography": { percent: 5, description: "Usually 4-8% of budget" },
  "Florist": { percent: 8, description: "Usually 6-10% of budget" },
  "Music / DJ": { percent: 5, description: "Usually 4-8% of budget" },
  "Wedding Attire": { percent: 5, description: "Usually 3-7% of budget" },
  "Hair & Makeup": { percent: 3, description: "Usually 2-4% of budget" },
  "Invitations & Stationery": { percent: 2, description: "Usually 1-3% of budget" },
  "Wedding Cake": { percent: 2, description: "Usually 1-3% of budget" },
  "Decorations": { percent: 3, description: "Usually 2-5% of budget" },
  "Transportation": { percent: 2, description: "Usually 1-3% of budget" },
  "Officiant": { percent: 1, description: "Usually 0.5-1.5% of budget" },
  "Wedding Rings": { percent: 3, description: "Usually 2-4% of budget" },
  "Favors & Gifts": { percent: 2, description: "Usually 1-3% of budget" },
  "Honeymoon": { percent: 10, description: "Usually 8-15% of budget" },
  "Other": { percent: 5, description: "Buffer for extras" },
};

// Category colors for the donut chart
const CATEGORY_COLORS: Record<string, string> = {
  "Venue": "#f472b6", // pink
  "Catering": "#fb923c", // orange
  "Photography": "#a78bfa", // purple
  "Videography": "#818cf8", // indigo
  "Florist": "#4ade80", // green
  "Music / DJ": "#facc15", // yellow
  "Wedding Attire": "#f9a8d4", // light pink
  "Hair & Makeup": "#fda4af", // rose
  "Invitations & Stationery": "#93c5fd", // light blue
  "Wedding Cake": "#fdba74", // light orange
  "Decorations": "#86efac", // light green
  "Transportation": "#67e8f9", // cyan
  "Officiant": "#c4b5fd", // light purple
  "Wedding Rings": "#fcd34d", // amber
  "Favors & Gifts": "#a5b4fc", // light indigo
  "Honeymoon": "#2dd4bf", // teal
  "Other": "#d1d5db", // gray
};

// ============================================================================
// DONUT CHART COMPONENT
// ============================================================================
function DonutChart({ 
  data, 
  size = 200, 
  strokeWidth = 32,
  centerContent 
}: { 
  data: { category: string; amount: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = data.map((item) => {
    const percentage = item.amount / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset * circumference;
    currentOffset += percentage;
    
    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="relative w-full max-w-[220px] aspect-square mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f5f5f4"
          strokeWidth={strokeWidth}
        />
        {/* Data segments */}
        {segments.map((segment, index) => (
          <circle
            key={segment.category}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{ 
              transitionDelay: `${index * 50}ms`,
            }}
          />
        ))}
      </svg>
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {centerContent}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MINI PROGRESS BAR
// ============================================================================
function MiniProgress({ 
  value, 
  max, 
  color = "bg-green-500",
  showLabel = true 
}: { 
  value: number; 
  max: number; 
  color?: string;
  showLabel?: boolean;
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] text-warm-400 text-right">{Math.round(percentage)}% paid</p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function BudgetRenderer({ page, fields, updateField, allPages }: RendererWithAllPagesProps) {
  const { isFree } = useUserPlan();
  const rawItems = fields.items;
  const items: BudgetItem[] = Array.isArray(rawItems) ? rawItems : [];
  
  const totalBudget = parseFloat((fields.totalBudget as string) || "0") || 0;
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentItemIndex, setPaymentItemIndex] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<"list" | "insights">("list");
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    method: "",
    notes: "",
  });

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ============================================================================
  // CALCULATIONS
  // ============================================================================
  const calculations = useMemo(() => {
    const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.totalCost || "0") || 0), 0);
    const totalPaid = items.reduce((sum, item) => sum + (parseFloat(item.amountPaid || "0") || 0), 0);
    const totalRemaining = totalCost - totalPaid;
    const budgetRemaining = totalBudget - totalCost;
    const paymentProgress = totalCost > 0 ? (totalPaid / totalCost) * 100 : 0;
    const budgetUsed = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;

    // Category breakdown
    const categoryTotals = items.reduce((acc, item) => {
      const cat = item.category || "Other";
      const cost = parseFloat(item.totalCost || "0") || 0;
      const paid = parseFloat(item.amountPaid || "0") || 0;
      if (!acc[cat]) acc[cat] = { cost: 0, paid: 0 };
      acc[cat].cost += cost;
      acc[cat].paid += paid;
      return acc;
    }, {} as Record<string, { cost: number; paid: number }>);

    // Upcoming payments
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingPayments = items.filter(item => {
      const depositDue = item.depositDueDate ? new Date(item.depositDueDate) : null;
      const finalDue = item.finalPaymentDueDate ? new Date(item.finalPaymentDueDate) : null;
      const itemPaid = parseFloat(item.amountPaid || "0") || 0;
      const itemTotal = parseFloat(item.totalCost || "0") || 0;
      if (itemPaid >= itemTotal) return false;
      return (depositDue && depositDue >= today && depositDue <= thirtyDaysFromNow) ||
             (finalDue && finalDue >= today && finalDue <= thirtyDaysFromNow);
    });

    // Donut chart data
    const chartData = Object.entries(categoryTotals)
      .filter(([_, data]) => data.cost > 0)
      .map(([category, data]) => ({
        category,
        amount: data.cost,
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"],
      }))
      .sort((a, b) => b.amount - a.amount);

    // Smart insights
    const insights: { type: "warning" | "success" | "tip"; message: string }[] = [];
    
    if (budgetRemaining < 0) {
      insights.push({ type: "warning", message: `You're ${formatCurrency(Math.abs(budgetRemaining))} over budget. Consider reviewing your allocations.` });
    } else if (budgetUsed > 90) {
      insights.push({ type: "warning", message: `You've used ${Math.round(budgetUsed)}% of your budget. Leave some buffer for unexpected costs.` });
    }

    // Check category percentages against typical
    Object.entries(categoryTotals).forEach(([category, data]) => {
      const typical = TYPICAL_PERCENTAGES[category];
      if (typical && totalBudget > 0) {
        const actualPercent = (data.cost / totalBudget) * 100;
        if (actualPercent > typical.percent * 1.5) {
          insights.push({ 
            type: "tip", 
            message: `${category} is ${Math.round(actualPercent)}% of your budget (typical: ${typical.percent}%). You might find savings here.` 
          });
        }
      }
    });

    if (paymentProgress >= 100) {
      insights.push({ type: "success", message: "All vendors are fully paid! You're all set." });
    } else if (paymentProgress >= 75) {
      insights.push({ type: "success", message: `Great progress! ${Math.round(paymentProgress)}% of vendor costs are paid.` });
    }

    if (upcomingPayments.length > 0) {
      const totalDue = upcomingPayments.reduce((sum, item) => {
        const remaining = (parseFloat(item.totalCost || "0") || 0) - (parseFloat(item.amountPaid || "0") || 0);
        return sum + remaining;
      }, 0);
      insights.push({ type: "tip", message: `${formatCurrency(totalDue)} in payments due within 30 days.` });
    }

    return {
      totalCost,
      totalPaid,
      totalRemaining,
      budgetRemaining,
      paymentProgress,
      budgetUsed,
      categoryTotals,
      upcomingPayments,
      chartData,
      insights,
    };
  }, [items, totalBudget]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
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
    setExpandedItem(newItem.id);
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

  const getStatusBadge = (item: BudgetItem) => {
    const paid = parseFloat(item.amountPaid || "0") || 0;
    const total = parseFloat(item.totalCost || "0") || 0;
    
    if (paid >= total && total > 0) {
      return { label: "Paid", color: "bg-green-100 text-green-700 border-green-200" };
    }
    if (paid > 0) {
      return { label: "Partial", color: "bg-amber-100 text-amber-700 border-amber-200" };
    }
    if (item.contractStatus === "signed") {
      return { label: "Booked", color: "bg-blue-100 text-blue-700 border-blue-200" };
    }
    return { label: "Pending", color: "bg-warm-100 text-warm-600 border-warm-200" };
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow-lg">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 md:p-10 border-b border-warm-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-100/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-100/30 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-light tracking-wide text-warm-800">
                  {page.title}
                </h2>
                <p className="text-warm-500 text-xs sm:text-sm mt-1">Track every dollar of your wedding</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-white/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveView("list")}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                    activeView === "list" 
                      ? "bg-white shadow-sm text-warm-800" 
                      : "text-warm-500 hover:text-warm-700"
                  }`}
                >
                  Vendors
                </button>
                <button
                  onClick={() => setActiveView("insights")}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                    activeView === "insights" 
                      ? "bg-white shadow-sm text-warm-800" 
                      : "text-warm-500 hover:text-warm-700"
                  }`}
                >
                  Insights
                </button>
              </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mb-1">Total Budget</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-warm-400" />
                  <Input
                    type="number"
                    value={(fields.totalBudget as string) || ""}
                    onChange={(e) => updateField("totalBudget", e.target.value)}
                    placeholder="0"
                    className="text-xl md:text-2xl font-light bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                  />
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mb-1">Allocated</p>
                <p className="text-xl md:text-2xl font-light text-warm-700">{formatCurrency(calculations.totalCost)}</p>
                {totalBudget > 0 && (
                  <p className="text-[10px] text-warm-400">{Math.round(calculations.budgetUsed)}% of budget</p>
                )}
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mb-1">Paid</p>
                <p className="text-xl md:text-2xl font-light text-green-600">{formatCurrency(calculations.totalPaid)}</p>
                <MiniProgress value={calculations.totalPaid} max={calculations.totalCost} color="bg-green-500" />
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mb-1">Remaining</p>
                <p className={`text-xl md:text-2xl font-light ${calculations.budgetRemaining >= 0 ? "text-teal-600" : "text-red-600"}`}>
                  {formatCurrency(Math.abs(calculations.budgetRemaining))}
                </p>
                <div className="flex items-center gap-1 text-[10px]">
                  {calculations.budgetRemaining >= 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3 text-teal-500" />
                      <span className="text-teal-600">under budget</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3 h-3 text-red-500" />
                      <span className="text-red-600">over budget</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Insights Banner */}
        {calculations.insights.length > 0 && (
          <div className="px-6 md:px-10 py-4 bg-warm-50 border-b border-warm-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warm-700 mb-1">Smart Insights</p>
                <div className="space-y-1">
                  {calculations.insights.slice(0, 2).map((insight, idx) => (
                    <p key={idx} className={`text-sm ${
                      insight.type === "warning" ? "text-amber-700" :
                      insight.type === "success" ? "text-green-700" :
                      "text-warm-600"
                    }`}>
                      {insight.type === "warning" && "⚠️ "}
                      {insight.type === "success" && "✓ "}
                      {insight.type === "tip" && "💡 "}
                      {insight.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6 md:p-10">
          {activeView === "insights" ? (
            // ============================================================================
            // INSIGHTS VIEW
            // ============================================================================
            <div className="space-y-8">
              {/* Donut Chart & Legend */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                <div className="w-full md:w-auto flex justify-center">
                  {calculations.chartData.length > 0 ? (
                    <DonutChart 
                      data={calculations.chartData}
                      size={220}
                      strokeWidth={36}
                      centerContent={
                        <div className="text-center">
                          <p className="text-xl md:text-2xl font-light text-warm-800">
                            {formatCurrency(calculations.totalCost)}
                          </p>
                          <p className="text-[10px] md:text-xs text-warm-500">Total Allocated</p>
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-full bg-warm-100 flex items-center justify-center">
                      <p className="text-warm-400 text-xs md:text-sm text-center px-6 md:px-8">Add vendors to see your budget breakdown</p>
                    </div>
                  )}
                </div>
                
                <div className="w-full md:flex-1 space-y-2">
                  <h3 className="font-medium text-warm-800 mb-3 md:mb-4 text-sm md:text-base">Spending by Category</h3>
                  {calculations.chartData.length > 0 ? (
                    calculations.chartData.map((item) => {
                      const percentage = calculations.totalCost > 0 
                        ? (item.amount / calculations.totalCost) * 100 
                        : 0;
                      const typical = TYPICAL_PERCENTAGES[item.category];
                      const categoryData = calculations.categoryTotals[item.category];
                      
                      return (
                        <div key={item.category} className="group">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="flex-1 text-sm text-warm-700 truncate">{item.category}</span>
                            <span className="text-sm font-medium text-warm-800">{formatCurrency(item.amount)}</span>
                            <span className="text-xs text-warm-400 w-12 text-right">{Math.round(percentage)}%</span>
                          </div>
                          {/* Typical percentage hint */}
                          {typical && totalBudget > 0 && (
                            <div className="ml-6 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[10px] text-warm-400">
                                {typical.description}
                                {percentage > typical.percent * 1.3 && (
                                  <span className="text-amber-500 ml-1">• Higher than typical</span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-warm-400 italic">No categories yet</p>
                  )}
                </div>
              </div>

              {/* Budget Recommendations */}
              {totalBudget > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="font-medium text-warm-800">Recommended Budget Allocation</h3>
                  </div>
                  <p className="text-sm text-warm-600 mb-4">
                    Based on your ${formatCurrency(totalBudget)} budget, here's a typical breakdown:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(TYPICAL_PERCENTAGES)
                      .filter(([_, data]) => data.percent >= 5)
                      .slice(0, 8)
                      .map(([category, data]) => {
                        const recommended = (totalBudget * data.percent) / 100;
                        const actual = calculations.categoryTotals[category]?.cost || 0;
                        const diff = actual - recommended;
                        
                        return (
                          <div key={category} className="bg-white/70 rounded-lg p-3">
                            <p className="text-xs text-warm-500 truncate">{category}</p>
                            <p className="text-lg font-light text-warm-800">{formatCurrency(recommended)}</p>
                            <p className="text-[10px] text-warm-400">{data.percent}% typical</p>
                            {actual > 0 && (
                              <p className={`text-[10px] mt-1 ${diff > 0 ? "text-amber-600" : "text-green-600"}`}>
                                {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)} from actual
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Upcoming Payments */}
              {calculations.upcomingPayments.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <h3 className="font-medium text-warm-800">Payments Due (Next 30 Days)</h3>
                  </div>
                  <div className="space-y-3">
                    {calculations.upcomingPayments.map((item, idx) => {
                      const remaining = (parseFloat(item.totalCost || "0") || 0) - (parseFloat(item.amountPaid || "0") || 0);
                      const dueDate = item.depositDueDate || item.finalPaymentDueDate;
                      return (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3">
                          <div>
                            <p className="font-medium text-warm-800">{item.vendor || item.category}</p>
                            {dueDate && (
                              <p className="text-xs text-warm-500">
                                Due {new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            )}
                          </div>
                          <p className="text-lg font-medium text-amber-700">{formatCurrency(remaining)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ============================================================================
            // LIST VIEW
            // ============================================================================
            <div className="space-y-6">
              {/* Upgrade Prompt */}
              {isFree && items.length > 0 && (
                <UpgradePrompt
                  variant="banner"
                  title={UPGRADE_SUGGESTIONS.vendorContacts.title}
                  description={UPGRADE_SUGGESTIONS.vendorContacts.description}
                  featureName={UPGRADE_SUGGESTIONS.vendorContacts.featureName}
                  icon={<Contact className="w-5 h-5 text-purple-600" />}
                />
              )}

              {/* Add Vendor Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-warm-800">Vendors & Expenses</h3>
                  <p className="text-xs text-warm-500">{items.length} vendor{items.length !== 1 ? "s" : ""} tracked</p>
                </div>
                <Button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vendor
                </Button>
              </div>

              {/* Vendor Cards */}
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const itemTotalCost = parseFloat(item.totalCost || "0") || 0;
                    const itemAmountPaid = parseFloat(item.amountPaid || "0") || 0;
                    const itemRemaining = itemTotalCost - itemAmountPaid;
                    const isExpanded = expandedItem === item.id;
                    const status = getStatusBadge(item);

                    return (
                      <div
                        key={item.id || index}
                        className={`border rounded-xl overflow-hidden transition-all ${
                          isExpanded ? "border-green-300 shadow-lg" : "border-warm-200 hover:border-warm-300"
                        }`}
                      >
                        {/* Card Header */}
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                          className="w-full p-3 sm:p-4 text-left bg-white hover:bg-warm-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            {/* Category Color Dot */}
                            <div 
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${CATEGORY_COLORS[item.category || "Other"]}20` }}
                            >
                              <div 
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                                style={{ backgroundColor: CATEGORY_COLORS[item.category || "Other"] }}
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                <p className="font-medium text-warm-800 text-sm sm:text-base truncate">
                                  {item.vendor || "Unnamed Vendor"}
                                </p>
                                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-warm-500 truncate">{item.category || "No category"}</p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="font-medium text-warm-800 text-sm sm:text-base">{formatCurrency(itemTotalCost)}</p>
                              {itemRemaining > 0 && itemTotalCost > 0 && (
                                <p className="text-[10px] sm:text-xs text-amber-600">{formatCurrency(itemRemaining)} due</p>
                              )}
                            </div>

                            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-warm-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                          </div>

                          {/* Mini Progress */}
                          {itemTotalCost > 0 && (
                            <div className="mt-3 h-1 bg-warm-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${itemAmountPaid >= itemTotalCost ? "bg-green-500" : "bg-amber-400"}`}
                                style={{ width: `${Math.min((itemAmountPaid / itemTotalCost) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-warm-50/30 border-t border-warm-100">
                            <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                              {/* Basic Info Grid */}
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-warm-500">Category</Label>
                                  <select
                                    value={item.category || ""}
                                    onChange={(e) => updateItem(index, "category", e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="">Select category...</option>
                                    {BUDGET_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div>
                                  <Label className="text-xs text-warm-500">Vendor Name</Label>
                                  <Input
                                    value={item.vendor || ""}
                                    onChange={(e) => updateItem(index, "vendor", e.target.value)}
                                    placeholder="Vendor name"
                                    className="mt-1 bg-white"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs text-warm-500">Total Cost</Label>
                                  <div className="relative mt-1">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                                    <Input
                                      type="number"
                                      value={item.totalCost || ""}
                                      onChange={(e) => updateItem(index, "totalCost", e.target.value)}
                                      placeholder="0.00"
                                      className="pl-8 bg-white"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs text-warm-500">Contract Status</Label>
                                  <select
                                    value={item.contractStatus || "none"}
                                    onChange={(e) => updateItem(index, "contractStatus", e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                                  >
                                    <option value="none">No Contract</option>
                                    <option value="pending">Pending Signature</option>
                                    <option value="signed">Signed ✓</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </div>

                              {/* Contact Info */}
                              <div className="bg-white rounded-lg p-3 sm:p-4 border border-warm-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                  <p className="text-sm font-medium text-warm-700">Contact Info</p>
                                  <TemplateLink 
                                    templateId="vendor-contacts" 
                                    allPages={allPages}
                                    className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                                  >
                                    View all vendors <ArrowRight className="w-3 h-3" />
                                  </TemplateLink>
                                </div>
                                <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
                                  <Input
                                    value={item.contactName || ""}
                                    onChange={(e) => updateItem(index, "contactName", e.target.value)}
                                    placeholder="Contact name"
                                    className="text-sm"
                                  />
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                                    <Input
                                      type="email"
                                      value={item.contactEmail || ""}
                                      onChange={(e) => updateItem(index, "contactEmail", e.target.value)}
                                      placeholder="Email"
                                      className="pl-9 text-sm"
                                    />
                                  </div>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                                    <Input
                                      type="tel"
                                      value={item.contactPhone || ""}
                                      onChange={(e) => updateItem(index, "contactPhone", e.target.value)}
                                      placeholder="Phone"
                                      className="pl-9 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Payment Schedule */}
                              <div className="bg-white rounded-lg p-4 border border-warm-100">
                                <p className="text-sm font-medium text-warm-700 mb-3">Payment Schedule</p>
                                <div className="grid md:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-warm-400">Deposit Due</Label>
                                    <Input
                                      type="date"
                                      value={item.depositDueDate || ""}
                                      onChange={(e) => updateItem(index, "depositDueDate", e.target.value)}
                                      className="mt-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-warm-400">Final Payment Due</Label>
                                    <Input
                                      type="date"
                                      value={item.finalPaymentDueDate || ""}
                                      onChange={(e) => updateItem(index, "finalPaymentDueDate", e.target.value)}
                                      className="mt-1 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Payment History */}
                              <div className="bg-white rounded-lg p-3 sm:p-4 border border-warm-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                  <div>
                                    <p className="text-sm font-medium text-warm-700">Payment History</p>
                                    <p className="text-xs text-warm-500">
                                      {formatCurrency(itemAmountPaid)} of {formatCurrency(itemTotalCost)} paid
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); openPaymentDialog(index); }}
                                    className="text-green-600 border-green-200 hover:bg-green-50 w-full sm:w-auto"
                                  >
                                    <Receipt className="w-4 h-4 mr-1" />
                                    Log Payment
                                  </Button>
                                </div>
                                
                                {(item.payments || []).length > 0 ? (
                                  <div className="space-y-2">
                                    {(item.payments || []).map((payment) => (
                                      <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                        <div className="flex items-center gap-3">
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                          <div>
                                            <span className="font-medium text-green-700">{formatCurrency(parseFloat(payment.amount) || 0)}</span>
                                            {payment.method && (
                                              <span className="text-xs text-green-600 ml-2">via {payment.method}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {payment.date && (
                                            <span className="text-xs text-warm-500">
                                              {new Date(payment.date).toLocaleDateString()}
                                            </span>
                                          )}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); removePayment(index, payment.id); }}
                                            className="p-1 text-warm-400 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-warm-400 italic text-center py-4 bg-warm-50 rounded-lg">
                                    No payments logged yet
                                  </p>
                                )}
                              </div>

                              {/* Notes */}
                              <div>
                                <Label className="text-xs text-warm-500">Notes</Label>
                                <Input
                                  value={item.notes || ""}
                                  onChange={(e) => updateItem(index, "notes", e.target.value)}
                                  placeholder="Any notes about this vendor..."
                                  className="mt-1 bg-white"
                                />
                              </div>

                              {/* Delete Button */}
                              <div className="pt-3 border-t border-warm-200 flex justify-end">
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove Vendor
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-warm-50 rounded-xl border-2 border-dashed border-warm-200">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-warm-800 mb-2">Start Tracking Your Budget</h3>
                  <p className="text-sm text-warm-500 mb-6 max-w-sm mx-auto">
                    Add your vendors and expenses to see beautiful breakdowns and smart insights.
                  </p>
                  <Button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Vendor
                  </Button>
                </div>
              )}

              {/* Related Templates */}
              <RelatedTemplates 
                templateIds={["vendor-contacts", "task-board", "honeymoon-planner"]} 
                allPages={allPages}
                title="Related"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span>Log Payment</span>
                {paymentItemIndex !== null && items[paymentItemIndex] && (
                  <p className="text-sm font-normal text-warm-500">
                    {items[paymentItemIndex].vendor || items[paymentItemIndex].category}
                  </p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label>Amount *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                <Input
                  type="number"
                  value={newPayment.amount || ""}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-8 text-lg"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newPayment.date || ""}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Method</Label>
                <select
                  value={newPayment.method || ""}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-warm-200 rounded-lg text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                  <option value="Venmo">Venmo</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={newPayment.notes || ""}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="e.g., Deposit, Final payment"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={addPayment}
              disabled={!newPayment.amount}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Log Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
