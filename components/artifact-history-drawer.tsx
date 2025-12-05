"use client";

import { useState, useEffect } from "react";
import { X, Clock, ChevronRight, BarChart3, Users, Calendar, ListChecks, Sparkles, Timer, ClipboardList, Store } from "lucide-react";
import { Artifact } from "@/components/artifacts";
import { cn } from "@/lib/utils";

interface ArtifactHistoryItem {
  id: string;
  type: string;
  data: unknown;
  timestamp: Date;
  messagePreview?: string;
}

interface ArtifactHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts: ArtifactHistoryItem[];
}

// Map artifact types to icons and labels
const artifactMeta: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  budget_overview: { icon: BarChart3, label: "Budget Overview", color: "text-emerald-500" },
  budget_category: { icon: BarChart3, label: "Budget Category", color: "text-emerald-500" },
  guest_list: { icon: Users, label: "Guest List", color: "text-blue-500" },
  guest_stats: { icon: Users, label: "Guest Stats", color: "text-blue-500" },
  timeline: { icon: Timer, label: "Timeline", color: "text-purple-500" },
  calendar: { icon: Calendar, label: "Calendar", color: "text-orange-500" },
  vendor_list: { icon: Store, label: "Vendors", color: "text-pink-500" },
  vendor_comparison: { icon: Store, label: "Vendor Comparison", color: "text-pink-500" },
  checklist: { icon: ListChecks, label: "Checklist", color: "text-amber-500" },
  checklist_full: { icon: ClipboardList, label: "Decision Checklist", color: "text-amber-500" },
  countdown: { icon: Sparkles, label: "Countdown", color: "text-rose-500" },
  wedding_summary: { icon: Sparkles, label: "Wedding Summary", color: "text-rose-500" },
  planning_gaps: { icon: Sparkles, label: "Planning Gaps", color: "text-indigo-500" },
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function ArtifactHistoryDrawer({ isOpen, onClose, artifacts }: ArtifactHistoryDrawerProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactHistoryItem | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Reset selection when closing
      setTimeout(() => {
        setSelectedArtifact(null);
        setIsAnimating(false);
      }, 300);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedArtifact) {
          setSelectedArtifact(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, selectedArtifact]);

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full max-w-md transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div
          className="h-full flex flex-col"
          style={{
            background: "linear-gradient(180deg, #FDFCFA 0%, #F8F6F3 100%)",
            boxShadow: "-8px 0 32px -4px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-warm-200">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FAF0EE 0%, #F5E1DD 100%)",
                  boxShadow: "0 2px 8px -2px rgba(212, 166, 156, 0.3)",
                }}
              >
                <Clock className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="font-serif text-lg text-ink">Recent Artifacts</h2>
                <p className="text-xs text-ink-soft">{artifacts.length} items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {artifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(135deg, #F2EFEA 0%, #E8E4DD 100%)",
                  }}
                >
                  <Clock className="w-8 h-8 text-stone-300" />
                </div>
                <p className="text-ink-soft mb-2">No artifacts yet</p>
                <p className="text-sm text-stone-400">
                  Ask your planner to show your budget, guests, or timeline to see them here.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {artifacts.map((artifact) => {
                  const meta = artifactMeta[artifact.type] || {
                    icon: Sparkles,
                    label: artifact.type,
                    color: "text-stone-500",
                  };
                  const Icon = meta.icon;

                  return (
                    <button
                      key={artifact.id}
                      onClick={() => setSelectedArtifact(artifact)}
                      className="w-full text-left p-4 rounded-xl transition-all duration-200 group"
                      style={{
                        background: "linear-gradient(135deg, #FFFFFF 0%, #FDFCFA 100%)",
                        boxShadow: "0 2px 8px -2px rgba(61, 56, 51, 0.08), 0 1px 2px rgba(61, 56, 51, 0.04)",
                        border: "1px solid rgba(61, 56, 51, 0.06)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 16px -4px rgba(212, 166, 156, 0.2), 0 2px 4px rgba(212, 166, 156, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(212, 166, 156, 0.2)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 2px 8px -2px rgba(61, 56, 51, 0.08), 0 1px 2px rgba(61, 56, 51, 0.04)";
                        e.currentTarget.style.borderColor = "rgba(61, 56, 51, 0.06)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            "bg-gradient-to-br from-stone-50 to-stone-100"
                          )}
                        >
                          <Icon className={cn("w-5 h-5", meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink truncate">{meta.label}</p>
                          <p className="text-xs text-stone-400">{getRelativeTime(artifact.timestamp)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-rose-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Artifact Preview Modal */}
      {selectedArtifact && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedArtifact(null)}
          />
          <div className="fixed inset-4 md:inset-8 z-[70] overflow-hidden rounded-2xl animate-in zoom-in-95 fade-in duration-200">
            <div
              className="h-full flex flex-col"
              style={{
                background: "linear-gradient(180deg, #FDFCFA 0%, #F8F6F3 100%)",
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
                <div className="flex items-center gap-3">
                  {(() => {
                    const meta = artifactMeta[selectedArtifact.type] || {
                      icon: Sparkles,
                      label: selectedArtifact.type,
                      color: "text-stone-500",
                    };
                    const Icon = meta.icon;
                    return (
                      <>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, #FAF0EE 0%, #F5E1DD 100%)",
                          }}
                        >
                          <Icon className={cn("w-4 h-4", meta.color)} />
                        </div>
                        <div>
                          <h3 className="font-medium text-ink">{meta.label}</h3>
                          <p className="text-xs text-stone-400">
                            {getRelativeTime(selectedArtifact.timestamp)}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <Artifact type={selectedArtifact.type} data={selectedArtifact.data} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Trigger button component
export function ArtifactHistoryButton({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className="relative p-3 rounded-xl transition-all duration-200 group"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FDFCFA 100%)",
        boxShadow: "0 4px 12px -2px rgba(61, 56, 51, 0.1), 0 2px 4px -1px rgba(61, 56, 51, 0.06)",
        border: "1px solid rgba(61, 56, 51, 0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 16px -4px rgba(212, 166, 156, 0.25), 0 4px 8px -2px rgba(212, 166, 156, 0.15)";
        e.currentTarget.style.borderColor = "rgba(212, 166, 156, 0.3)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px -2px rgba(61, 56, 51, 0.1), 0 2px 4px -1px rgba(61, 56, 51, 0.06)";
        e.currentTarget.style.borderColor = "rgba(61, 56, 51, 0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      title="View artifact history"
    >
      <Clock className="w-5 h-5 text-stone-400 group-hover:text-rose-400 transition-colors" />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-medium flex items-center justify-center text-white"
          style={{
            background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
            boxShadow: "0 2px 4px rgba(244, 63, 94, 0.4)",
          }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
