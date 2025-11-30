"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  categoryLabels,
  timelineLabels,
  type TemplateDefinition,
  type TimelineFilter,
  type TemplateCategory,
} from "@/lib/templates/registry";
import {
  Book,
  LayoutDashboard,
  DollarSign,
  Users,
  Contact,
  CalendarCheck,
  Heart,
  Circle,
  Clock,
  StickyNote,
  ArrowLeft,
  Check,
  Sparkles,
  Lock,
  Crown,
  FileText,
  MapPin,
  Camera,
  Music,
  Utensils,
  Gift,
  Package,
  Plane,
  Home,
  Star,
  CheckCircle,
  List,
  Clipboard,
  Kanban,
  ScrollText,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useDiscount } from "@/components/price-display";

// Map ALL template icons to their Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Book,
  LayoutDashboard,
  DollarSign,
  Users,
  Contact,
  CalendarCheck,
  Heart,
  Circle,
  Clock,
  StickyNote,
  FileText,
  MapPin,
  Camera,
  Music,
  Utensils,
  Gift,
  Package,
  Plane,
  Home,
  Star,
  CheckCircle,
  List,
  Clipboard,
  Kanban,
  ScrollText,
};

interface TemplateMarketplaceProps {
  isAddingPages?: boolean;
  existingTemplateIds?: string[];
  userPlan?: "free" | "complete";
  templates: TemplateDefinition[];
}

export function TemplateMarketplace({
  isAddingPages = false,
  existingTemplateIds = [],
  userPlan = "free",
  templates: allTemplates,
}: TemplateMarketplaceProps) {
  const router = useRouter();
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showStarterPackDialog, setShowStarterPackDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { finalPrice, hasDiscount, discountText } = useDiscount();

  const starterPackTemplates = allTemplates.filter((t) => t.suggestedInStarterPack);
  const freeTemplates = allTemplates.filter((t) => t.isFree);

  const filteredTemplates = allTemplates.filter((template) => {
    if (selectedTimeline !== "all" && !template.timelineFilters.includes(selectedTimeline)) {
      return false;
    }
    if (selectedCategory !== "all" && template.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Helper to check if template is free
  const checkIsTemplateFree = (templateId: string) => {
    const template = allTemplates.find((t) => t.id === templateId);
    return template?.isFree ?? false;
  };

  // Sort templates: free first for free users
  const sortedTemplates = userPlan === "free" 
    ? [...filteredTemplates].sort((a, b) => {
        const aFree = a.isFree;
        const bFree = b.isFree;
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;
        return 0;
      })
    : filteredTemplates;

  const toggleTemplate = (templateId: string) => {
    // Check if user can select this template
    if (userPlan === "free" && !checkIsTemplateFree(templateId)) {
      setShowUpgradeDialog(true);
      return;
    }

    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const selectStarterPack = () => {
    // Filter out templates that already exist and that user has access to
    const starterIds = starterPackTemplates
      .map((t) => t.id)
      .filter((id) => !existingTemplateIds.includes(id))
      .filter((id) => userPlan === "complete" || checkIsTemplateFree(id));
    setSelectedTemplates(starterIds);
    setShowStarterPackDialog(false);
    toast.success("Starter pack selected!");
  };

  const handleSubmit = async () => {
    if (selectedTemplates.length === 0) {
      toast.error("Please select at least one template");
      return;
    }

    setIsCreating(true);

    try {
      const endpoint = isAddingPages ? "/api/planner/pages/add" : "/api/planner/create";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateIds: selectedTemplates }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success(isAddingPages ? "Pages added!" : "Your planner is ready!");
      router.push("/planner");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const freeTemplateCount = freeTemplates.length;
  const totalTemplateCount = allTemplates.length;

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={isAddingPages ? "/planner" : "/"}
            className="flex items-center gap-2 text-warm-500 hover:text-warm-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs tracking-wider uppercase">
              {isAddingPages ? "Back to Planner" : "Back"}
            </span>
          </Link>

          <h1 className="text-lg font-serif tracking-wide">
            {isAddingPages ? "Add More Pages" : "Choose Your Templates"}
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-sm text-warm-500">
              {selectedTemplates.length} selected
            </span>
            <Button
              onClick={handleSubmit}
              disabled={selectedTemplates.length === 0 || isCreating}
              size="sm"
            >
              {isCreating
                ? "Saving..."
                : isAddingPages
                ? "Add Pages"
                : "Create Planner"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Upgrade Banner for Free Users */}
        {userPlan === "free" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-warm-100 to-warm-50 border border-warm-200 p-6 mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Crown className="w-6 h-6 text-warm-500" />
              <div>
                <h3 className="font-medium text-warm-700">
                  You have access to {freeTemplateCount} templates
                </h3>
                <p className="text-sm text-warm-500">
                  Upgrade to Complete for all {totalTemplateCount} templates and unlimited features.
                </p>
              </div>
            </div>
            <Link href="/choose-plan">
              <Button variant="outline" className="border-warm-400">
                {hasDiscount ? (
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Upgrade — ${finalPrice.toFixed(0)}
                  </span>
                ) : (
                  "Upgrade — $29"
                )}
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Starter Pack Banner - only show for new planners */}
        {!isAddingPages && userPlan === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-warm-300 p-6 mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Sparkles className="w-6 h-6 text-warm-400" />
              <div>
                <h3 className="font-medium text-warm-700">Not sure where to start?</h3>
                <p className="text-sm text-warm-500">
                  Our starter pack includes the essential templates most couples need.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowStarterPackDialog(true)}>
              View Starter Pack
            </Button>
          </motion.div>
        )}

        {/* Info for adding pages */}
        {isAddingPages && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warm-100 border border-warm-200 p-4 mb-8 text-center"
          >
            <p className="text-sm text-warm-600">
              You can add multiple copies of the same template — great for extra guest list pages!
            </p>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Timeline Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-wider uppercase text-warm-500">Timeline:</span>
            <select
              value={selectedTimeline}
              onChange={(e) => setSelectedTimeline(e.target.value as TimelineFilter | "all")}
              className="text-sm border border-warm-300 bg-white px-3 py-1.5 focus:outline-none focus:border-warm-500"
            >
              <option value="all">All Timelines</option>
              {Object.entries(timelineLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-wider uppercase text-warm-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | "all")}
              className="text-sm border border-warm-300 bg-white px-3 py-1.5 focus:outline-none focus:border-warm-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplates.includes(template.id)}
              alreadyHasTemplate={existingTemplateIds.includes(template.id)}
              isLocked={userPlan === "free" && !template.isFree}
              onToggle={() => toggleTemplate(template.id)}
              delay={index * 0.05}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-warm-500">No templates match your filters.</p>
          </div>
        )}
      </div>

      {/* Starter Pack Dialog */}
      <Dialog open={showStarterPackDialog} onOpenChange={setShowStarterPackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Starter Pack</DialogTitle>
            <DialogDescription>
              These templates cover the essentials for most weddings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-4">
            {starterPackTemplates.map((template) => {
              const Icon = iconMap[template.icon] || StickyNote;
              return (
                <div key={template.id} className="flex items-center gap-3 text-sm">
                  <Icon className="w-4 h-4 text-warm-400" />
                  <span>{template.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowStarterPackDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={selectStarterPack} className="flex-1">
              Select All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-warm-500" />
              Upgrade to Complete
            </DialogTitle>
            <DialogDescription>
              This template is available with the Complete plan.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <p className="text-sm text-warm-600 mb-4">
              Get access to all {totalTemplateCount} templates, vendor tracking, seating charts, 
              and everything you need to plan your perfect wedding.
            </p>
            <div className="text-center">
              {hasDiscount ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded mb-2">
                    <Tag className="w-3 h-3" />
                    {discountText}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-light text-green-600">${finalPrice.toFixed(0)}</p>
                    <p className="text-lg text-warm-400 line-through">$29</p>
                  </div>
                </>
              ) : (
                <p className="text-2xl font-light text-warm-700">$29</p>
              )}
              <p className="text-xs text-warm-500">one-time payment</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="flex-1">
              Maybe Later
            </Button>
            <Link href="/choose-plan" className="flex-1">
              <Button className="w-full bg-warm-600 hover:bg-warm-700 text-white">
                Upgrade Now
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

interface TemplateCardProps {
  template: TemplateDefinition;
  isSelected: boolean;
  alreadyHasTemplate: boolean;
  isLocked: boolean;
  onToggle: () => void;
  delay: number;
}

function TemplateCard({
  template,
  isSelected,
  alreadyHasTemplate,
  isLocked,
  onToggle,
  delay,
}: TemplateCardProps) {
  const Icon = iconMap[template.icon] || StickyNote;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onToggle}
      className={`
        bg-white border p-6 cursor-pointer transition-all duration-200 relative
        ${isLocked ? "opacity-75" : ""}
        ${isSelected ? "border-warm-400 shadow-md" : "border-warm-200 hover:border-warm-300"}
      `}
    >
      {/* Custom badge */}
      {template.isCustom && (
        <div className="absolute top-2 left-2 text-[9px] tracking-wider uppercase px-2 py-0.5 bg-warm-500 text-white">
          New
        </div>
      )}

      {/* Locked badge */}
      {isLocked && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] tracking-wider uppercase px-2 py-0.5 bg-warm-200 text-warm-600">
          <Lock className="w-3 h-3" />
          Complete
        </div>
      )}

      {/* Already has badge */}
      {alreadyHasTemplate && !isLocked && (
        <div className="absolute top-2 right-2 text-[9px] tracking-wider uppercase px-2 py-0.5 bg-warm-200 text-warm-600">
          Already Added
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <Icon className={`w-6 h-6 ${isLocked ? "text-warm-300" : "text-warm-400"}`} />
        {!isLocked && (
          <div
            className={`
              w-5 h-5 border flex items-center justify-center transition-colors
              ${isSelected ? "bg-warm-400 border-warm-400" : "border-warm-300"}
            `}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}
        {isLocked && (
          <Lock className="w-4 h-4 text-warm-400" />
        )}
      </div>

      <h3 className={`font-medium mb-1 ${isLocked ? "text-warm-500" : "text-warm-700"}`}>
        {template.name}
      </h3>
      <p className={`text-sm mb-4 ${isLocked ? "text-warm-400" : "text-warm-500"}`}>
        {template.description}
      </p>

      <div className="flex flex-wrap gap-1">
        {template.timelineFilters.slice(0, 2).map((filter) => (
          <span
            key={filter}
            className={`text-[10px] tracking-wider uppercase px-2 py-0.5 ${
              isLocked ? "bg-warm-50 text-warm-400" : "bg-warm-100 text-warm-500"
            }`}
          >
            {timelineLabels[filter].replace(" Out", "")}
          </span>
        ))}
        {template.timelineFilters.length > 2 && (
          <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 ${
            isLocked ? "bg-warm-50 text-warm-400" : "bg-warm-100 text-warm-500"
          }`}>
            +{template.timelineFilters.length - 2}
          </span>
        )}
      </div>
    </motion.div>
  );
}
