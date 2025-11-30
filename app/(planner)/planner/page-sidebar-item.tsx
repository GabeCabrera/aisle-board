"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Page } from "@/lib/db/schema";
import { getTemplateById } from "@/lib/templates/registry";
import {
  GripVertical,
  Pencil,
  Trash2,
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
  Kanban,
  Gift,
  Package,
  Plane,
  Music,
  ScrollText,
} from "lucide-react";

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
  Kanban,
  Gift,
  Package,
  Plane,
  Music,
  ScrollText,
};

interface PageSidebarItemProps {
  page: Page;
  isSelected: boolean;
  isComplete: boolean;
  collapsed: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function PageSidebarItem({
  page,
  isSelected,
  isComplete,
  collapsed,
  onClick,
  onDelete,
}: PageSidebarItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const template = getTemplateById(page.templateId);
  const Icon = template ? iconMap[template.icon] || StickyNote : StickyNote;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors mb-1
        ${isSelected ? "bg-warm-100" : "hover:bg-warm-50"}
        ${collapsed ? "justify-center" : ""}
      `}
      onClick={onClick}
    >
      {/* Drag Handle */}
      {!collapsed && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3 h-3 text-warm-400" />
        </div>
      )}

      {/* Icon */}
      <Icon className="w-4 h-4 text-warm-500 flex-shrink-0" />

      {/* Title & Status */}
      {!collapsed && (
        <>
          <span className="flex-1 text-sm text-warm-700 truncate">{page.title}</span>

          {/* Completion Indicator */}
          {!isComplete && (
            <span title="In progress">
              <Pencil className="w-3 h-3 text-warm-400" />
            </span>
          )}

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </>
      )}

      {/* Collapsed incomplete indicator */}
      {collapsed && !isComplete && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-warm-400 rounded-full" />
      )}
    </div>
  );
}
