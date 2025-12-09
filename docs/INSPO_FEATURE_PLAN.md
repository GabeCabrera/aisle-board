# Project: "The Muse" (Inspiration Platform Overhaul)

**Objective:** Transform the `Inspo` tool into a full-featured, social inspiration platform within Scribe & Stem, mirroring the "Board & Pin" mechanics of Pinterest but optimized for wedding logistics.

## 1. Nomenclature & Branding
To distinguish our platform while retaining familiarity:
*   **Palette** → **Board** (The container).
*   **Spark** → **Idea** (The content item). *Alternative: "Snap", "Tile", "Gem".*
*   **Explore** → **The Feed** (Global discovery).

## 2. Core Features

### A. Organization (The Board System)
*   **Multiple Boards:** Users can create unlimited boards (e.g., "Venue Ideas", "Dress Code", "Floral Vibe").
*   **Privacy Controls:**
    *   *Private:* Only visible to the couple.
    *   *Public:* Visible to the community (and "The Feed").
    *   *Shared:* Shareable via unique link (even to non-users).
*   **Cover Images:** Auto-generated from the first 4 images in the board.

### B. Discovery (The "Vibe" Engine)
*   **Semantic Search:** Search for "Rustic Barn" or "Neon Cyberpunk" and find matching Ideas from the public community.
*   **Visual Similarity:** "See more like this" (future state using embeddings).
*   **Trending Tags:** "Boho", "Modern", "Black Tie" filters.

### C. Social Mechanics
*   **Remixing (Re-pinning):**
    *   Users can "Save" any public Idea to their own Board.
    *   System tracks the `original_creator` and increments `save_count`.
*   **User Profiles:**
    *   Public profile view showing all Public Boards.
    *   "Follow" mechanic (optional for V1).

## 3. Technical Architecture

### A. Database Schema Updates
*   **`boards` table:** (Rename/Alias `palettes`)
    *   Add `views_count` (int).
    *   Add `cover_image_url` (string).
*   **`ideas` table:** (Rename/Alias `sparks`)
    *   Add `description` (text) - for search.
    *   Add `tags` (string[]) - for filtering.
    *   Add `remixed_from_id` (fk -> ideas.id).
    *   Add `author_id` (fk -> users.id).

### B. Routing Structure (App Router)
*   `/planner/inspo` → **Home:** Your Boards + Recent Saves.
*   `/planner/inspo/explore` → **The Feed:** Masonry grid of public Ideas.
*   `/planner/inspo/board/[id]` → **Board View:** Grid of Ideas in a specific board.
*   `/planner/inspo/idea/[id]` → **Detail View:** Full screen modal with comments/related.

## 4. Implementation Plan (Phased)

### Phase 1: Structure & UI (Immediate)
1.  **Refactor `InspoTool`** to use `Board` / `Idea` terminology.
2.  **Create `/planner/inspo/board/[id]`** page for deep-linking.
3.  **Implement Masonry Grid** for the "Feed" view.

### Phase 2: The "Save" Mechanic
1.  **Backend:** API to clone an Idea record to a new Board ID.
2.  **Frontend:** "Save" button on image hover → Dropdown to select Target Board.

### Phase 3: Search & Discovery
1.  **Backend:** Search endpoint using ILIKE on descriptions.
2.  **Frontend:** Search bar with tag autocomplete.

### Phase 4: Social
1.  **User Profiles:** Public handles.
2.  **Comments:** Basic commenting on Ideas.

---
**Approved by:** User
**Date:** Dec 9, 2025
