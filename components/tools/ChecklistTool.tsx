"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RefreshCw, 
  CheckCircle, 
  Lock, 
  Search, 
  Minus, // For skipped/horizontal rule
  ChevronDown, // For accordion expand
  Hourglass, // For researching
  Circle // For not_started
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Interfaces (These are already defined in the original file, copy-pasting for clarity)
interface Decision {
  id: string;
  name: string;
  displayName: string;
  category: string;
  status: string;
  isRequired: boolean;
  isSkipped: boolean;
  choiceName?: string;
  choiceAmount?: number;
  lockReason?: string;
  lockDetails?: string;
}

interface DecisionProgress {
  total: number;
  locked: number;
  decided: number;
  researching: number;
  notStarted: number;
  percentComplete: number;
}

const categoryLabels: Record<string, string> = {
  foundation: "Foundation",
  venue: "Venue",
  vendors: "Vendors",
  attire: "Attire",
  ceremony: "Ceremony",
  reception: "Reception",
  guests: "Guests & Invitations",
  logistics: "Logistics",
  legal: "Legal",
  honeymoon: "Honeymoon",
};

const categoryOrder = Object.keys(categoryLabels);

function DecisionRow({ decision }: { decision: Decision }) {
  const StatusIcon = () => {
    if (decision.isSkipped) return <Minus className="h-4 w-4 text-muted-foreground/50" />;
    switch (decision.status) {
      case "locked": return <Lock className="h-4 w-4 text-green-600" />;
      case "decided": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "researching": return <Hourglass className="h-4 w-4 text-amber-500" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground/70" />;
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center py-3 px-4 border-b last:border-b-0 border-border/70",
        decision.isSkipped && "opacity-60"
      )}
    >
      <div className="flex items-center w-6 shrink-0">
        <StatusIcon />
      </div>
      <div className="flex-1 ml-3">
        <p className={cn(
          "font-medium text-foreground",
          decision.isSkipped && "line-through text-muted-foreground"
        )}>
          {decision.displayName}
          {decision.isRequired && !decision.isSkipped && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </p>
        {(decision.choiceName || decision.lockDetails) && (
          <p className="text-sm text-muted-foreground">
            {decision.choiceName || decision.lockDetails}
          </p>
        )}
      </div>
      {decision.choiceAmount && (
        <p className="text-sm text-foreground ml-4">
          ${(decision.choiceAmount / 100).toLocaleString()}
        </p>
      )}
    </div>
  );
}

interface ChecklistToolProps {
  initialData?: any;
}

export default function ChecklistTool({ initialData }: ChecklistToolProps) {
  const [decisions, setDecisions] = useState<Decision[]>(initialData?.decisions?.list || []);
  const [progress, setProgress] = useState<DecisionProgress | null>(initialData?.decisions?.progress || null);
  const [loading, setLoading] = useState(!initialData?.decisions);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (initialData?.decisions) {
        setLoading(false);
        return;
    }

    const loadDecisions = async () => {
      try {
        const res = await fetch("/api/decisions");
        const data = await res.json();
        if (data.decisions) {
          setDecisions(data.decisions);
          setProgress(data.progress);
        }
      } catch (e) {
        console.error("Failed to load decisions:", e);
      } finally {
        setLoading(false);
      }
    };
    loadDecisions();
  }, [initialData]);

  const byCategory = decisions.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, Decision[]>);

  const getFilteredDecisions = (categoryDecisions: Decision[]) => {
    if (filter === "all") return categoryDecisions;
    if (filter === "todo") return categoryDecisions.filter(d => d.status === "not_started" && !d.isSkipped);
    if (filter === "done") return categoryDecisions.filter(d => (d.status === "decided" || d.status === "locked") && !d.isSkipped);
    return categoryDecisions;
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Wedding Checklist
          </h1>
          {progress && (
            <p className="text-xl text-muted-foreground mt-2 font-light">
              {progress.decided} of {progress.total} decisions complete
            </p>
          )}
        </div>
      </div>

      {/* Progress Card */}
      {progress && (
        <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Overall Progress</p>
              <p className="font-medium text-foreground">{progress.percentComplete}%</p>
            </div>
            {/* Custom Progress Bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
            <div className="flex justify-around mt-4 text-center text-sm">
              <div className="flex flex-col items-center">
                <Lock className="h-4 w-4 text-green-600 mb-1" />
                <span className="font-medium">{progress.locked}</span>
                <span className="text-muted-foreground">Locked</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mb-1" />
                <span className="font-medium">{progress.decided - progress.locked}</span>
                <span className="text-muted-foreground">Decided</span>
              </div>
              <div className="flex flex-col items-center">
                <Hourglass className="h-4 w-4 text-amber-500 mb-1" />
                <span className="font-medium">{progress.researching}</span>
                <span className="text-muted-foreground">Researching</span>
              </div>
              <div className="flex flex-col items-center">
                <Circle className="h-4 w-4 text-muted-foreground/70 mb-1" />
                <span className="font-medium">{progress.notStarted}</span>
                <span className="text-muted-foreground">To-Do</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-4">
        {(["all", "todo", "done"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full px-4",
              filter === f ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted/30"
            )}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Categories Accordions */}
      <div className="space-y-4">
        {categoryOrder.map(category => {
          const categoryDecisions = getFilteredDecisions(byCategory[category] || []);
          if (categoryDecisions.length === 0) return null;

          const isCategoryExpanded = expandedCategory === category;

          return (
            <Card key={category} className="bg-white rounded-3xl border border-border shadow-soft">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedCategory(isCategoryExpanded ? null : category)}
              >
                <CardTitle className="font-serif text-xl text-foreground">{categoryLabels[category] || category}</CardTitle>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-300",
                  isCategoryExpanded && "rotate-180"
                )} />
              </div>
              <AnimatePresence>
                {isCategoryExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/70">
                        {categoryDecisions.map(decision => (
                          <DecisionRow key={decision.id} decision={decision} />
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}