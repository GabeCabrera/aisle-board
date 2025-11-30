"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { type Page } from "@/lib/db/schema";
import { isSharedField } from "./shared-fields";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface PlannerState {
  pages: Page[];
  sharedData: Record<string, unknown>; // Global shared field values
  selectedPageId: string | null;
  isSaving: boolean;
  pendingSaves: Set<string>; // Page IDs with unsaved changes
  lastSaved: Date | null;
}

type PlannerAction =
  | { type: "SET_PAGES"; pages: Page[] }
  | { type: "SELECT_PAGE"; pageId: string | null }
  | { type: "UPDATE_PAGE_FIELDS"; pageId: string; fields: Record<string, unknown> }
  | { type: "UPDATE_SHARED_FIELD"; key: string; value: unknown }
  | { type: "DELETE_PAGE"; pageId: string }
  | { type: "REORDER_PAGES"; pageIds: string[] }
  | { type: "ADD_PAGE"; page: Page }
  | { type: "SET_SAVING"; isSaving: boolean }
  | { type: "MARK_SAVED"; pageId: string }
  | { type: "MARK_PENDING"; pageId: string };

interface PlannerContextType {
  state: PlannerState;
  // Actions
  selectPage: (pageId: string | null) => void;
  updatePageFields: (pageId: string, fields: Record<string, unknown>) => void;
  updateField: (pageId: string, key: string, value: unknown) => void;
  deletePage: (pageId: string) => Promise<void>;
  reorderPages: (pageIds: string[]) => Promise<void>;
  addPage: (page: Page) => void;
  // Computed
  selectedPage: Page | undefined;
  getSharedValue: (key: string) => unknown;
}

// ============================================================================
// HELPERS
// ============================================================================

// Extract shared field values from all pages
function extractSharedData(pages: Page[]): Record<string, unknown> {
  const shared: Record<string, unknown> = {};
  
  // Go through pages in order, later values override earlier ones
  // This means the most recently updated page's value wins
  for (const page of pages) {
    const fields = page.fields as Record<string, unknown>;
    if (!fields) continue;
    
    for (const [key, value] of Object.entries(fields)) {
      if (isSharedField(key) && value !== undefined && value !== null && value !== "") {
        shared[key] = value;
      }
    }
  }
  
  return shared;
}

// Apply shared data to a page's fields
function applySharedDataToPage(
  page: Page,
  sharedData: Record<string, unknown>
): Page {
  const fields = (page.fields as Record<string, unknown>) || {};
  const updatedFields = { ...fields };
  
  // Apply shared values to fields that exist in this page's template
  for (const [key, value] of Object.entries(sharedData)) {
    // Only apply if the field exists in this page (is defined but empty) 
    // or doesn't exist yet
    if (
      updatedFields[key] === undefined ||
      updatedFields[key] === null ||
      updatedFields[key] === ""
    ) {
      updatedFields[key] = value;
    }
  }
  
  return { ...page, fields: updatedFields };
}

// ============================================================================
// REDUCER
// ============================================================================

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "SET_PAGES": {
      const sharedData = extractSharedData(action.pages);
      return {
        ...state,
        pages: action.pages,
        sharedData,
        selectedPageId: action.pages[0]?.id ?? null,
      };
    }

    case "SELECT_PAGE": {
      return { ...state, selectedPageId: action.pageId };
    }

    case "UPDATE_PAGE_FIELDS": {
      // Update the specific page
      const updatedPages = state.pages.map((p) =>
        p.id === action.pageId
          ? { ...p, fields: action.fields, updatedAt: new Date() }
          : p
      );

      // Check if any shared fields were updated
      const newSharedData = { ...state.sharedData };
      let sharedFieldsChanged = false;

      for (const [key, value] of Object.entries(action.fields)) {
        if (isSharedField(key) && value !== state.sharedData[key]) {
          newSharedData[key] = value;
          sharedFieldsChanged = true;
        }
      }

      // If shared fields changed, propagate to all pages
      let finalPages = updatedPages;
      if (sharedFieldsChanged) {
        finalPages = updatedPages.map((p) => {
          if (p.id === action.pageId) return p; // Skip the page we just updated
          
          const fields = (p.fields as Record<string, unknown>) || {};
          const updatedFields = { ...fields };
          let pageNeedsUpdate = false;

          for (const [key, value] of Object.entries(newSharedData)) {
            if (isSharedField(key) && fields[key] !== value) {
              updatedFields[key] = value;
              pageNeedsUpdate = true;
            }
          }

          return pageNeedsUpdate
            ? { ...p, fields: updatedFields, updatedAt: new Date() }
            : p;
        });
      }

      return {
        ...state,
        pages: finalPages,
        sharedData: newSharedData,
        pendingSaves: new Set([...state.pendingSaves, action.pageId]),
      };
    }

    case "UPDATE_SHARED_FIELD": {
      const newSharedData = { ...state.sharedData, [action.key]: action.value };
      
      // Propagate to all pages that use this field
      const updatedPages = state.pages.map((p) => {
        const fields = (p.fields as Record<string, unknown>) || {};
        if (fields[action.key] !== undefined || isSharedField(action.key)) {
          return {
            ...p,
            fields: { ...fields, [action.key]: action.value },
            updatedAt: new Date(),
          };
        }
        return p;
      });

      return {
        ...state,
        pages: updatedPages,
        sharedData: newSharedData,
        pendingSaves: new Set(updatedPages.map((p) => p.id)),
      };
    }

    case "DELETE_PAGE": {
      const newPages = state.pages.filter((p) => p.id !== action.pageId);
      const newSelectedId =
        state.selectedPageId === action.pageId
          ? newPages[0]?.id ?? null
          : state.selectedPageId;

      return {
        ...state,
        pages: newPages,
        selectedPageId: newSelectedId,
      };
    }

    case "REORDER_PAGES": {
      const pageMap = new Map(state.pages.map((p) => [p.id, p]));
      const reorderedPages = action.pageIds
        .map((id) => pageMap.get(id))
        .filter((p): p is Page => p !== undefined);

      return { ...state, pages: reorderedPages };
    }

    case "ADD_PAGE": {
      // Apply shared data to new page
      const pageWithSharedData = applySharedDataToPage(action.page, state.sharedData);
      return {
        ...state,
        pages: [...state.pages, pageWithSharedData],
        selectedPageId: action.page.id,
      };
    }

    case "SET_SAVING": {
      return { ...state, isSaving: action.isSaving };
    }

    case "MARK_SAVED": {
      const newPending = new Set(state.pendingSaves);
      newPending.delete(action.pageId);
      return {
        ...state,
        pendingSaves: newPending,
        lastSaved: new Date(),
      };
    }

    case "MARK_PENDING": {
      return {
        ...state,
        pendingSaves: new Set([...state.pendingSaves, action.pageId]),
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const PlannerContext = createContext<PlannerContextType | null>(null);

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used within a PlannerProvider");
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface PlannerProviderProps {
  children: React.ReactNode;
  initialPages: Page[];
  plannerId: string;
}

export function PlannerProvider({
  children,
  initialPages,
  plannerId,
}: PlannerProviderProps) {
  const sharedData = extractSharedData(initialPages);
  
  const [state, dispatch] = useReducer(plannerReducer, {
    pages: initialPages,
    sharedData,
    selectedPageId: initialPages[0]?.id ?? null,
    isSaving: false,
    pendingSaves: new Set(),
    lastSaved: null,
  });

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, Record<string, unknown>>>(new Map());

  // Auto-save with debouncing
  const saveToDatabase = useCallback(async () => {
    if (pendingUpdatesRef.current.size === 0) return;

    dispatch({ type: "SET_SAVING", isSaving: true });

    const updates = new Map(pendingUpdatesRef.current);
    pendingUpdatesRef.current.clear();

    try {
      // Save all pending updates
      const savePromises = Array.from(updates.entries()).map(
        async ([pageId, fields]) => {
          const response = await fetch("/api/planner/pages/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageId, fields }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save page ${pageId}`);
          }

          dispatch({ type: "MARK_SAVED", pageId });
          return pageId;
        }
      );

      await Promise.all(savePromises);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save some changes");
      
      // Re-add failed updates to pending
      updates.forEach((fields, pageId) => {
        pendingUpdatesRef.current.set(pageId, fields);
      });
    } finally {
      dispatch({ type: "SET_SAVING", isSaving: false });
    }
  }, []);

  // Debounced save trigger
  const triggerSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveToDatabase, 800); // 800ms debounce
  }, [saveToDatabase]);

  // Actions
  const selectPage = useCallback((pageId: string | null) => {
    dispatch({ type: "SELECT_PAGE", pageId });
  }, []);

  const updatePageFields = useCallback(
    (pageId: string, fields: Record<string, unknown>) => {
      dispatch({ type: "UPDATE_PAGE_FIELDS", pageId, fields });
      
      // Queue for saving
      pendingUpdatesRef.current.set(pageId, fields);
      
      // Also queue any pages that had shared fields updated
      const page = state.pages.find((p) => p.id === pageId);
      if (page) {
        for (const key of Object.keys(fields)) {
          if (isSharedField(key)) {
            // Find other pages that might have this shared field
            state.pages.forEach((p) => {
              if (p.id !== pageId) {
                const pFields = (p.fields as Record<string, unknown>) || {};
                if (key in pFields || p.templateId === "cover" || p.templateId === "overview") {
                  const updatedFields = { ...pFields, [key]: fields[key] };
                  pendingUpdatesRef.current.set(p.id, updatedFields);
                }
              }
            });
          }
        }
      }
      
      triggerSave();
    },
    [state.pages, triggerSave]
  );

  const updateField = useCallback(
    (pageId: string, key: string, value: unknown) => {
      const page = state.pages.find((p) => p.id === pageId);
      if (!page) return;

      const currentFields = (page.fields as Record<string, unknown>) || {};
      const newFields = { ...currentFields, [key]: value };
      updatePageFields(pageId, newFields);
    },
    [state.pages, updatePageFields]
  );

  const deletePage = useCallback(async (pageId: string) => {
    if (state.pages.length <= 1) {
      toast.error("You must have at least one page");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this page?");
    if (!confirmed) return;

    dispatch({ type: "DELETE_PAGE", pageId });

    try {
      await fetch("/api/planner/pages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      toast.success("Page deleted");
    } catch (error) {
      toast.error("Failed to delete page");
    }
  }, [state.pages.length]);

  const reorderPages = useCallback(async (pageIds: string[]) => {
    dispatch({ type: "REORDER_PAGES", pageIds });

    try {
      await fetch("/api/planner/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plannerId, pageIds }),
      });
    } catch (error) {
      toast.error("Failed to save page order");
    }
  }, [plannerId]);

  const addPage = useCallback((page: Page) => {
    dispatch({ type: "ADD_PAGE", page });
  }, []);

  const getSharedValue = useCallback(
    (key: string) => state.sharedData[key],
    [state.sharedData]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending changes before unmounting
      if (pendingUpdatesRef.current.size > 0) {
        saveToDatabase();
      }
    };
  }, [saveToDatabase]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingUpdatesRef.current.size > 0) {
        e.preventDefault();
        e.returnValue = "";
        saveToDatabase();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveToDatabase]);

  const selectedPage = state.pages.find((p) => p.id === state.selectedPageId);

  const value: PlannerContextType = {
    state,
    selectPage,
    updatePageFields,
    updateField,
    deletePage,
    reorderPages,
    addPage,
    selectedPage,
    getSharedValue,
  };

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  );
}
