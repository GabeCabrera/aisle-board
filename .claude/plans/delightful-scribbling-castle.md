# Custom Analytics Pixel Implementation

## Overview

Build a custom user behavior tracking system ("Stem Pixel") to capture granular analytics on user interactions, with an in-depth analytics dashboard in the admin panel.

**Current State:**
- Reddit Pixel exists for marketing attribution only
- Admin stats show business metrics (revenue, conversions, feature adoption)
- No granular user behavior tracking (clicks, page views, session data)

**Goal:**
- Track user behavior events client-side
- Store events in database for analysis
- Build rich analytics dashboard showing user journeys, feature usage, and engagement patterns

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  StemPixel      │────▶│  /api/analytics │────▶│ analytics_events│
│  (Client)       │     │  /track         │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                                │
        │ Batched events                                 │
        │ (every 5s or on unload)                        ▼
        │                                       ┌─────────────────┐
        └──────────────────────────────────────▶│ Admin Analytics │
                                                │ Dashboard       │
                                                └─────────────────┘
```

---

## Phase 1: Database Schema

### New Table: `analytics_events`

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (nullable for anonymous visitors)
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,  -- Generated client-side, persists across page loads

  -- Event data
  event_type TEXT NOT NULL,  -- 'page_view', 'click', 'feature_use', 'ai_message', etc.
  event_name TEXT NOT NULL,  -- Specific event: 'budget_opened', 'guest_added', etc.
  event_data JSONB DEFAULT '{}',  -- Additional context

  -- Page context
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,

  -- Device/browser info
  user_agent TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  device_type TEXT,  -- 'mobile', 'tablet', 'desktop'

  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_start TIMESTAMPTZ,
  time_on_page INTEGER,  -- milliseconds

  -- UTM parameters (for marketing attribution)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_page_path ON analytics_events(page_path);
```

**Files to modify:**
- `lib/db/schema.ts` - Add analyticsEvents table

---

## Phase 2: Client-Side Tracker

### StemPixel Library (`lib/analytics/stem-pixel.ts`)

```typescript
// Event types
type EventType = 'page_view' | 'click' | 'feature_use' | 'ai_message' | 'form_submit' | 'error';

interface AnalyticsEvent {
  eventType: EventType;
  eventName: string;
  eventData?: Record<string, unknown>;
  pagePath: string;
  pageTitle?: string;
  timestamp: number;
}

// Functions
- init(): Initialize pixel, generate/restore session ID
- trackPageView(): Auto-called on route change
- trackClick(elementId, elementText): Track button/link clicks
- trackFeatureUse(featureName, data): Track feature interactions
- trackAIMessage(messageType): Track AI chat interactions
- trackError(error): Track client-side errors
- flush(): Send batched events to server
```

### StemPixelTracker Component (`components/stem-pixel-tracker.tsx`)

Following the RedditPixelTracker pattern:
- Initialize on mount
- Listen to route changes via `usePathname()`
- Auto-track page views
- Flush events on interval (5s) and on page unload
- Access session for user/tenant IDs

**Files to create:**
- `lib/analytics/stem-pixel.ts` - Core tracking library
- `components/stem-pixel-tracker.tsx` - React component wrapper

**Files to modify:**
- `app/layout.tsx` - Add StemPixelTracker to providers

---

## Phase 3: API Endpoint

### POST `/api/analytics/track`

Receives batched events from client:

```typescript
// Request body
{
  events: AnalyticsEvent[],
  sessionId: string,
  // User info added server-side from session
}

// Response
{ success: true, count: number }
```

**Security:**
- Rate limit: 100 events per minute per session
- Validate event structure with Zod
- Sanitize event data (no PII in eventData)
- Accept both authenticated and anonymous requests

**Files to create:**
- `app/api/analytics/track/route.ts`

---

## Phase 4: Admin Analytics Dashboard

### New Admin Page: `/admin/analytics`

**Tab 1: Real-Time**
- Active users (last 5 minutes)
- Live event stream
- Current page breakdown

**Tab 2: Traffic**
- Page views over time (chart)
- Top pages by views
- Traffic sources (referrers, UTM)
- Device breakdown (mobile/tablet/desktop)
- Geographic data (if available from headers)

**Tab 3: User Behavior**
- Feature usage heatmap
- User flow/journey visualization
- Session duration distribution
- Bounce rate by page
- Most clicked elements

**Tab 4: AI Usage**
- Messages sent over time
- Tool usage breakdown
- Average session length with AI
- Free vs paid usage comparison

**Tab 5: Funnels**
- Signup → Onboarding → First Feature → Upgrade
- Custom funnel builder (stretch goal)

**Files to create:**
- `app/admin/analytics/page.tsx` - Main analytics dashboard
- `app/api/admin/analytics/route.ts` - Analytics data API
- `components/admin/analytics/*.tsx` - Dashboard components (charts, tables)

**Files to modify:**
- `app/admin/components/AdminSidebar.tsx` - Add Analytics nav item

---

## Phase 5: Event Auto-Tracking

### Automatic Events (no code required)
- `page_view` - Every route change
- `session_start` - New session detected
- `session_end` - Tab close/navigate away

### Semi-Automatic Events (data attributes)
```html
<button data-track="click" data-track-name="upgrade_cta">
  Upgrade Now
</button>
```

### Manual Events (code)
```typescript
import { stemPixel } from '@/lib/analytics/stem-pixel';

stemPixel.trackFeatureUse('budget_item_added', {
  category: 'venue',
  amount: 5000
});
```

### Pre-Built Tracking Points
Add tracking to key user actions:
- AI chat: message sent, tool executed
- Budget: item added/edited/deleted
- Guests: guest added, RSVP received
- Vendors: vendor saved, status changed
- Boards: board created, idea saved
- Settings: profile updated, partner invited

---

## Implementation Order

1. **Database** - Add analytics_events table
2. **API** - Create /api/analytics/track endpoint
3. **Client Library** - Build stem-pixel.ts
4. **Tracker Component** - Create StemPixelTracker, add to layout
5. **Admin API** - Create /api/admin/analytics for dashboard data
6. **Admin Dashboard** - Build analytics page with charts
7. **Event Integration** - Add tracking to key features

---

## Files Summary

### Create
| File | Purpose |
|------|---------|
| `lib/analytics/stem-pixel.ts` | Client-side tracking library |
| `components/stem-pixel-tracker.tsx` | React tracker component |
| `app/api/analytics/track/route.ts` | Event ingestion API |
| `app/api/admin/analytics/route.ts` | Analytics data API |
| `app/admin/analytics/page.tsx` | Admin analytics dashboard |

### Modify
| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add analyticsEvents table |
| `app/layout.tsx` | Add StemPixelTracker |
| `app/admin/components/AdminSidebar.tsx` | Add Analytics nav link |

---

## Privacy Considerations

- No PII stored in event_data
- Session IDs are random, not tied to identity until login
- Respect Do Not Track header (optional)
- Data retention: Auto-delete events older than 90 days
- GDPR: Include in privacy policy, allow data export/deletion
