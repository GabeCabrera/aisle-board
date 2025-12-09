"use client";

import React from "react";
import { usePlannerData, formatCurrency, BudgetItem } from "@/lib/hooks/usePlannerData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Wallet, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BudgetToolProps {
  initialData?: any;
}

export default function BudgetTool({ initialData }: BudgetToolProps) {
  const router = useRouter();
  // Request only the sections needed by the BudgetTool
  const { data, loading, refetch, isFetching } = usePlannerData(["budget", "kernel", "summary"], { initialData });

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
  
  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Budget
          </h1>
          <p className="text-xl text-muted-foreground mt-2 font-light">
            Track your wedding expenses and stay on track.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 px-3 border-border hover:bg-white hover:text-primary"
            onClick={() => refetch()} 
            disabled={isFetching} 
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", isFetching && "animate-spin")} />
            {isFetching ? "Refreshing..." : "Refresh"}
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
            Tell me about your wedding expenses in chat and I'll track them here.
          </p>
          <Button onClick={() => router.push('/planner/chat')} className="rounded-full px-6 shadow-soft">
            Go to chat
          </Button>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm mb-1">Total Budget</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">
                  {budget.total > 0 ? formatCurrency(budget.total) : "Not set"}
                </h3>
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
                {/* Custom Progress Bar */}
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
                {categories.map(([category, data], index) => {
                  const percentage = budget.spent > 0 
                    ? Math.round((data.total / budget.spent) * 100) 
                    : 0;
                  
                  return (
                    <li key={category} className="flex items-center justify-between p-4 group hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium text-muted-foreground">{category}</span>
                        <p className="text-sm text-muted-foreground">
                          {data.items.length} item{data.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans font-medium text-foreground">{formatCurrency(data.total)}</p>
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
            <CardHeader className="p-6 border-b border-border/70">
              <CardTitle className="font-serif text-xl text-foreground">All Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/70">
                {budget.items.map((item, index) => {
                  const isPaidInFull = item.amountPaid >= item.totalCost;
                  
                  return (
                    <li key={item.id} className="flex items-center justify-between p-4 group hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-sans font-medium text-foreground">{item.vendor || item.category}</p>
                        <p className="text-sm text-muted-foreground">{item.notes || `Category: ${item.category}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans font-medium text-foreground">{formatCurrency(item.totalCost)}</p>
                        {item.amountPaid > 0 && (
                          <p className={cn("text-sm", isPaidInFull ? "text-green-600" : "text-muted-foreground")}>
                            {isPaidInFull ? "Paid in full" : `${formatCurrency(item.amountPaid)} paid`}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Help prompt */}
          <div className="text-center mt-4 p-4 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-sm">
              Need to add or update something?{" "}
              <Link href="/planner/chat" className="text-primary font-medium hover:underline">
                Tell me in chat
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}