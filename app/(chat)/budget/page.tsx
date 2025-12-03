"use client";

import { usePlannerData, formatCurrency, BudgetItem } from "@/lib/hooks/usePlannerData";

// Category colors for visual distinction
const categoryColors: Record<string, { bg: string; text: string }> = {
  venue: { bg: "bg-blue-50", text: "text-blue-700" },
  catering: { bg: "bg-orange-50", text: "text-orange-700" },
  photography: { bg: "bg-purple-50", text: "text-purple-700" },
  videography: { bg: "bg-pink-50", text: "text-pink-700" },
  florist: { bg: "bg-green-50", text: "text-green-700" },
  music: { bg: "bg-yellow-50", text: "text-yellow-700" },
  dj: { bg: "bg-yellow-50", text: "text-yellow-700" },
  band: { bg: "bg-yellow-50", text: "text-yellow-700" },
  attire: { bg: "bg-rose-50", text: "text-rose-700" },
  dress: { bg: "bg-rose-50", text: "text-rose-700" },
  suit: { bg: "bg-slate-50", text: "text-slate-700" },
  cake: { bg: "bg-amber-50", text: "text-amber-700" },
  invitations: { bg: "bg-teal-50", text: "text-teal-700" },
  stationery: { bg: "bg-teal-50", text: "text-teal-700" },
  transportation: { bg: "bg-indigo-50", text: "text-indigo-700" },
  decor: { bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
  officiant: { bg: "bg-sky-50", text: "text-sky-700" },
  hair: { bg: "bg-red-50", text: "text-red-700" },
  makeup: { bg: "bg-red-50", text: "text-red-700" },
  rentals: { bg: "bg-cyan-50", text: "text-cyan-700" },
  favors: { bg: "bg-lime-50", text: "text-lime-700" },
};

function getCategoryStyle(category: string) {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(categoryColors)) {
    if (key.includes(k)) return v;
  }
  return { bg: "bg-stone-50", text: "text-stone-700" };
}

export default function BudgetPage() {
  const { data, loading } = usePlannerData();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const budget = data?.budget;
  const hasData = budget && budget.items.length > 0;
  const isOverBudget = budget && budget.total > 0 && budget.spent > budget.total;

  // Group items by category for summary
  const byCategory = (budget?.items || []).reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = { total: 0, paid: 0, items: [] };
    acc[cat].total += item.totalCost || 0;
    acc[cat].paid += item.amountPaid || 0;
    acc[cat].items.push(item);
    return acc;
  }, {} as Record<string, { total: number; paid: number; items: BudgetItem[] }>);

  const categories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink mb-1">Budget</h1>
        <p className="text-ink-soft">Track your wedding expenses</p>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-medium text-ink text-xl mb-2">No budget items yet</h2>
          <p className="text-ink-soft mb-6">
            Tell me about your wedding expenses in chat and I&apos;ll track them here.
          </p>
          <a 
            href="/c" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Go to chat
          </a>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Budget */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Total Budget</p>
              <p className="text-2xl font-serif text-ink">
                {budget.total > 0 ? formatCurrency(budget.total) : "Not set"}
              </p>
            </div>

            {/* Allocated */}
            <div className={`rounded-2xl border p-5 ${isOverBudget ? "bg-red-50 border-red-200" : "bg-white border-stone-200"}`}>
              <p className={`text-sm mb-1 ${isOverBudget ? "text-red-600" : "text-ink-soft"}`}>Allocated</p>
              <p className={`text-2xl font-serif ${isOverBudget ? "text-red-700" : "text-ink"}`}>
                {formatCurrency(budget.spent)}
              </p>
              {budget.total > 0 && (
                <p className={`text-xs mt-1 ${isOverBudget ? "text-red-600" : "text-ink-faint"}`}>
                  {budget.percentUsed}% of budget
                </p>
              )}
            </div>

            {/* Paid */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Paid So Far</p>
              <p className="text-2xl font-serif text-green-600">
                {formatCurrency(budget.paid)}
              </p>
            </div>

            {/* Remaining */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Still Owed</p>
              <p className="text-2xl font-serif text-ink">
                {formatCurrency(budget.remaining)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {budget.total > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-ink-soft">Budget used</span>
                <span className={isOverBudget ? "text-red-600 font-medium" : "text-ink-soft"}>
                  {budget.percentUsed}%
                </span>
              </div>
              <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget 
                      ? "bg-red-500" 
                      : budget.percentUsed > 90 
                        ? "bg-amber-500" 
                        : "bg-gradient-to-r from-rose-400 to-rose-500"
                  }`}
                  style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                />
              </div>
              {isOverBudget && (
                <p className="text-sm text-red-600 mt-2">
                  Over budget by {formatCurrency(budget.spent - budget.total)}
                </p>
              )}
            </div>
          )}

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="font-medium text-ink">By Category</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {categories.map(([category, data]) => {
                const style = getCategoryStyle(category);
                const percentage = budget.spent > 0 
                  ? Math.round((data.total / budget.spent) * 100) 
                  : 0;
                
                return (
                  <div key={category} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
                          {category}
                        </span>
                        <span className="text-xs text-ink-faint">
                          {data.items.length} item{data.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-ink">{formatCurrency(data.total)}</p>
                        <p className="text-xs text-ink-faint">{percentage}% of total</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${style.bg.replace("50", "400")}`}
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: style.text.replace("text-", "").replace("700", "400")
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Items */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="font-medium text-ink">All Items</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {budget.items.map((item) => {
                const style = getCategoryStyle(item.category);
                const isPaidInFull = item.amountPaid >= item.totalCost;
                
                return (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {item.category}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">
                        {item.vendor || item.category}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-ink-faint truncate">{item.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-ink">{formatCurrency(item.totalCost)}</p>
                      {item.amountPaid > 0 && (
                        <p className={`text-xs ${isPaidInFull ? "text-green-600" : "text-ink-faint"}`}>
                          {isPaidInFull ? "Paid in full" : `${formatCurrency(item.amountPaid)} paid`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Help prompt */}
          <div className="mt-6 p-4 bg-stone-50 rounded-xl text-center">
            <p className="text-sm text-ink-soft">
              Need to add or update something?{" "}
              <a href="/c" className="text-rose-600 hover:text-rose-700 font-medium">
                Tell me in chat
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
