"use client";

import { useEffect, useState } from "react";

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

const categoryOrder = [
  "foundation",
  "venue", 
  "vendors",
  "attire",
  "ceremony",
  "reception",
  "guests",
  "logistics",
  "legal",
  "honeymoon",
];

export default function ChecklistPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [progress, setProgress] = useState<DecisionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadDecisions();
  }, []);

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

  // Group by category
  const byCategory = decisions.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, Decision[]>);

  // Filter decisions
  const filteredCategories = categoryOrder.filter(cat => byCategory[cat]?.length > 0);

  const getFilteredDecisions = (categoryDecisions: Decision[]) => {
    if (filter === "all") return categoryDecisions;
    if (filter === "todo") return categoryDecisions.filter(d => d.status === "not_started" && !d.isSkipped);
    if (filter === "done") return categoryDecisions.filter(d => d.status === "decided" || d.status === "locked");
    return categoryDecisions;
  };

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-1">Wedding Checklist</h1>
          {progress && (
            <p className="text-ink-soft">
              {progress.decided} of {progress.total} complete ({progress.percentComplete}%)
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-ink-soft">{progress.locked} locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <span className="text-ink-soft">{progress.decided - progress.locked} decided</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-ink-soft">{progress.researching} researching</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-300" />
              <span className="text-ink-soft">{progress.notStarted} to do</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "All" },
          { value: "todo", label: "To do" },
          { value: "done", label: "Done" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-rose-500 text-white"
                : "bg-white border border-stone-200 text-ink-soft hover:border-rose-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {filteredCategories.map(category => {
          const categoryDecisions = getFilteredDecisions(byCategory[category] || []);
          if (categoryDecisions.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
                <h2 className="font-medium text-ink">{categoryLabels[category] || category}</h2>
              </div>
              <div className="divide-y divide-stone-100">
                {categoryDecisions.map(decision => (
                  <DecisionRow key={decision.id} decision={decision} onUpdate={loadDecisions} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {decisions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-soft">No decisions yet. Start chatting to build your checklist!</p>
        </div>
      )}
    </div>
  );
}

function DecisionRow({ decision, onUpdate }: { decision: Decision; onUpdate: () => void }) {
  const statusIcon = () => {
    if (decision.isSkipped) {
      return <span className="text-stone-400 text-lg">—</span>;
    }
    switch (decision.status) {
      case "locked":
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
      case "decided":
        return (
          <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "researching":
        return (
          <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        );
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-stone-300" />;
    }
  };

  return (
    <div className={`px-6 py-4 flex items-center gap-4 ${decision.isSkipped ? "opacity-50" : ""}`}>
      {statusIcon()}
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${decision.isSkipped ? "line-through text-stone-400" : "text-ink"}`}>
          {decision.displayName}
          {decision.isRequired && !decision.isSkipped && (
            <span className="text-rose-500 ml-1">*</span>
          )}
        </p>
        {decision.choiceName && (
          <p className="text-sm text-ink-soft truncate">{decision.choiceName}</p>
        )}
        {decision.status === "locked" && decision.lockDetails && (
          <p className="text-xs text-green-600 mt-1">{decision.lockDetails}</p>
        )}
      </div>
      {decision.choiceAmount && (
        <p className="text-sm font-medium text-ink">
          ${(decision.choiceAmount / 100).toLocaleString()}
        </p>
      )}
    </div>
  );
}
