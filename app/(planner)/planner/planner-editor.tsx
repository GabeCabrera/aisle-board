"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PageSidebarItem } from "./page-sidebar-item";
import { PageRenderer } from "./page-renderer";
import { type Page } from "@/lib/db/schema";
import { PlannerProvider, usePlanner } from "@/lib/state";
import { validatePage } from "@/lib/templates/validation";
import {
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight,
  Home,
  Cloud,
  CloudOff,
} from "lucide-react";
import { useState } from "react";

interface PlannerEditorProps {
  plannerId: string;
  initialPages: Page[];
  displayName: string;
}

export function PlannerEditor({ plannerId, initialPages, displayName }: PlannerEditorProps) {
  return (
    <PlannerProvider plannerId={plannerId} initialPages={initialPages}>
      <PlannerEditorContent displayName={displayName} plannerId={plannerId} />
    </PlannerProvider>
  );
}

function PlannerEditorContent({ 
  displayName, 
  plannerId 
}: { 
  displayName: string; 
  plannerId: string;
}) {
  const {
    state,
    selectPage,
    updatePageFields,
    deletePage,
    reorderPages,
    selectedPage,
  } = usePlanner();

  const { pages, isSaving, pendingSaves, lastSaved } = state;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      const newPageIds = arrayMove(pages, oldIndex, newIndex).map((p) => p.id);
      await reorderPages(newPageIds);
    }
  };

  const handleFieldChange = (pageId: string, fields: Record<string, unknown>) => {
    updatePageFields(pageId, fields);
  };

  return (
    <div className="min-h-screen flex bg-warm-50">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 60 : 280 }}
        className="bg-white border-r border-warm-200 flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-warm-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link href="/" className="text-lg font-serif tracking-widest uppercase">
              Aisle
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-warm-100 rounded transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-warm-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-warm-500" />
            )}
          </button>
        </div>

        {/* Page List */}
        <div className="flex-1 overflow-y-auto p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {pages.map((page) => {
                const validation = validatePage(page);
                return (
                  <PageSidebarItem
                    key={page.id}
                    page={page}
                    isSelected={page.id === state.selectedPageId}
                    isComplete={validation.isComplete}
                    collapsed={sidebarCollapsed}
                    onClick={() => selectPage(page.id)}
                    onDelete={() => deletePage(page.id)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-warm-200 space-y-2">
          {!sidebarCollapsed && (
            <>
              <Link href="/templates?mode=add" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Page
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="ghost" size="sm" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`flex items-center gap-2 text-xs tracking-wider uppercase text-warm-500 hover:text-warm-600 transition-colors ${
              sidebarCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && "Sign Out"}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-warm-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <span className="text-sm text-warm-500">{displayName}</span>
          <div className="flex items-center gap-4">
            {/* Save Status Indicator */}
            <div className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <Cloud className="w-4 h-4 text-warm-400 animate-pulse" />
                  <span className="text-xs text-warm-400">Saving...</span>
                </>
              ) : pendingSaves.size > 0 ? (
                <>
                  <CloudOff className="w-4 h-4 text-warm-400" />
                  <span className="text-xs text-warm-400">Unsaved changes</span>
                </>
              ) : lastSaved ? (
                <>
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-warm-400">All changes saved</span>
                </>
              ) : null}
            </div>
            {selectedPage && (
              <span className="text-sm font-medium">{selectedPage.title}</span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {selectedPage && (
              <motion.div
                key={selectedPage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PageRenderer
                  page={selectedPage}
                  onFieldChange={(fields) => handleFieldChange(selectedPage.id, fields)}
                  allPages={pages}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
