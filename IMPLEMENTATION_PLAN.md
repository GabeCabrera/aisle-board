# Scribe & Stem - Fix & Feature Implementation Plan

## Phase 1: Fix Planning Analysis Logic
**Objective:** `analyze_planning_gaps` tool incorrectly reports "no venue booked" even when a venue is listed as "booked".
- [ ] **Refactor Analysis Logic:** In `lib/ai/executor.ts`, update the `bookedVendors` filtering to be case-insensitive and robust.
- [ ] **Test:** Create `lib/ai/__tests__/analysis.test.ts` to mock database responses and verify the analysis output correctly identifies booked vendors.

## Phase 2: Fix Budget Ghost Entries & Robust Deletion
**Objective:** "Ghost" budget items (like the $70 rings) persist because exact ID matching fails.
- [ ] **Enhance `delete_budget_item`:** Implement the same fuzzy matching and "undefined ID" handling logic that was added to `delete_vendor`.
- [ ] **Self-Healing List:** Update `budget_overview` (or the get budget logic) to filter out corrupt entries automatically.
- [ ] **Test:** Create `lib/ai/__tests__/budget.test.ts` to verify deletion by category/name works even with messy data.

## Phase 3: Implement Seating Chart Tool
**Objective:** "Seating chart tool" is missing but referenced in marketing.
- [ ] **Database Schema:** Ensure we can store tables/seats. We can likely use the `pages` table with a `seating-chart` templateId.
- [ ] **Backend Tools:** Add `add_table`, `remove_table`, `assign_seat` tools to `lib/ai/tools.ts` and `executor.ts`.
- [ ] **Frontend UI:** Create `components/tools/SeatingTool.tsx` to visualize tables and guests.
- [ ] **Integration:** Register tool in `browser-context.tsx` and `shared-components.tsx`.

## Phase 4: Direct Checklist Editing
**Objective:** Users can't check off items directly; they have to go through "decisions".
- [ ] **New Tool:** Add `update_checklist_item` to allow toggling status of standard checklist items directly.
- [ ] **Test:** Verify updates persist to the `task-board` or `decisions` table.

## Phase 5: Final Verification
- [ ] **Run Suite:** Execute `npm test` to ensure all new tests pass.
- [ ] **Build:** Execute `pnpm run build` to ensure no type errors or build failures.
