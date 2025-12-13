# Deprecated Code Removal Tracker

## ✅ COMPLETED - December 5, 2025

### Removed Deprecated Template System
- `/app/(planner)/` - entire template-based UI
- `/app/api/planner/create/` - template creation API
- `/app/api/planner/pages/` - template pages CRUD
- `/app/api/planner/reorder/` - template reordering
- `/lib/templates/` - template registry system
- `/lib/state/planner-context.tsx` - old planner state
- `/app/admin/templates/` - admin template manager

### Consolidated Tool Pages into Modals
Moved from route pages to modal components:
- `/app/(chat)/budget/page.tsx` → `/components/tools/BudgetTool.tsx`
- `/app/(chat)/dashboard/page.tsx` → `/components/tools/DashboardTool.tsx`
- `/app/(chat)/guests/page.tsx` → `/components/tools/GuestsTool.tsx`
- `/app/(chat)/vendors/page.tsx` → `/components/tools/VendorsTool.tsx`
- `/app/(chat)/timeline/page.tsx` → `/components/tools/TimelineTool.tsx`
- `/app/(chat)/checklist/page.tsx` → `/components/tools/ChecklistTool.tsx`
- `/app/(chat)/inspo/page.tsx` → `/components/tools/InspoTool.tsx`
- `/app/(chat)/settings/page.tsx` → `/components/tools/SettingsTool.tsx`

These are now loaded dynamically in AppShell modals, not accessible as standalone routes.

### Fixed Build Issues
- Lazy-loaded Resend client in `/lib/email/index.ts` to avoid build errors without API key
- Updated Google Calendar callback redirects from `/planner` to `/`

### Current Route Count: 53 (down from 61)

## KEPT (still needed)
- `/app/api/planner/data/` - dashboard data API (used by tool components)
- `/lib/hooks/usePlannerData.ts` - hook used by tool components
- All database tables (data storage still needed)

## Architecture Notes
- Main chat interface: `/app/(chat)/page.tsx`
- Tool modals: Opened via AppShell Tools dropdown
- Components: `/components/tools/*.tsx`
- AppShell imports: `@/components/tools/{ToolName}Tool`
