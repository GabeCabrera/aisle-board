# Scribe & Stem - Wedding Planning Platform

## Big Picture Architecture

Scribe & Stem is a wedding planning platform that helps couples organize budgets, guest lists, vendors, timelines, RSVPs, and decisions in one workspace.

### Core Domain Model
```
Tenant (couple's workspace) → Users (2 per tenant) → Wedding Kernel (couple profile) → Pages (data storage)
```

- **Tenant**: Represents a couple's wedding workspace
- **User**: Individual account linked to a tenant. Email + password auth
- **Wedding Kernel**: Stores couple's profile, preferences, and planning context
- **Pages**: JSONB storage for structured data (budget items, guests, vendors, etc.)
- **Decisions**: Wedding planning decision tracker with lock capability

### Request Flow
1. User interacts with planning tools (budget, guests, vendors, timeline)
2. APIs validate access and persist updates
3. UI re-renders with the latest data

## Project Structure
```
/app
  /(auth)           # Login, forgot-password, reset-password routes
  /(onboarding)     # Plan selection, payment, welcome
  /api              # API routes
    /calendar       # Google Calendar integration
    /planner/data   # Data API for dashboard views
    /stripe         # Payment processing
/components
  /ui               # Primitives (Button, Input, Dialog)
  /layout           # AppShell with modal-based navigation
  /artifacts        # Artifact renderers
  /providers        # Auth provider
/lib
  /db               # Drizzle ORM schema and queries
    schema.ts       # Database schema (source of truth)
    queries.ts      # Query helpers
  /auth
    config.ts       # NextAuth configuration
  /decisions        # Decision tracking logic
  /calendar         # Google Calendar integration
  /hooks            # React hooks (usePlannerData)
```

## Key Files
- `lib/db/schema.ts` - Drizzle schema (source of truth for data model)
- `lib/decisions.ts` - Decision tracking logic
- `lib/auth/config.ts` - NextAuth configuration
- `middleware.ts` - Route protection

## Database (Vercel Postgres + Drizzle)
Run migrations: `pnpm db:push`
Generate types: `pnpm db:generate`
Studio: `pnpm db:studio`

### Important Patterns
- All queries are tenant-scoped. Never query without `tenantId` filter
- Use `lib/db/queries.ts` helpers, not raw Drizzle in components
- Data is stored in `pages` table as JSONB keyed by templateId

## Authentication Flow
1. User signs up or logs in
2. Choose plan (Free / Subscription)
3. Redirected to welcome page
4. Planner dashboard becomes home

## Pricing Model
- **Free**: Core planning tools with standard limits
- **Stem**: $12/month or $99/year (subscription via Stripe)
  - Expanded limits and premium features

## Google Calendar Integration
Located in `/lib/calendar/` and `/app/api/calendar/google/`:
- OAuth flow creates dedicated wedding calendar
- Bidirectional sync engine
- Partner sharing via calendar link

Environment variables:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/google/callback
```

## Dev Commands
```bash
pnpm dev           # Start dev server (localhost:3000)
pnpm build         # Production build
pnpm db:push       # Push schema to database
pnpm db:studio     # Open Drizzle Studio
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check
```

## Environment Variables
```
DATABASE_URL=        # Vercel Postgres connection string
NEXTAUTH_SECRET=     # Random string for session encryption
NEXTAUTH_URL=        # Base URL
STRIPE_SECRET_KEY=   # Stripe API key
STRIPE_PRICE_MONTHLY= # Stripe monthly price ID
STRIPE_PRICE_YEARLY=  # Stripe yearly price ID
```

## Conventions
- Use `cn()` from `lib/utils` for conditional classnames
- Prefer server components; use `'use client'` only when needed
- API routes return `{ data?, error? }` shape
- Toast notifications via `sonner`
- Mobile-first design approach

## Design System
- Fonts: System fonts (Apple system fonts on iOS/Mac)
- Colors: Warm neutral palette with rose accents
- Styling: Minimal, elegant, calming aesthetic
- Animations: Subtle, purposeful (typewriter, breathing logo)
