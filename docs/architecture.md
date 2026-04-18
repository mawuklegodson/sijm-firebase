# System Architecture

## Overview
Salvation In Jesus Ministry CMS is a progressive web application (PWA) with an offline-first data synchronization strategy.

## Tech Stack
- **Database**: PostgreSQL (via Supabase)
- **State Management**: React Context & Hooks + Supabase Real-time.
- **Offline Strategy**: LocalStorage Queue + Sync Middleware.

## Data Schema
We use a relational model:
1. **Profiles**: Linked to Supabase Auth `uid`.
2. **Attendance**: Time-series log of church headcounts.
3. **First Timers**: CRM-style tracking for retention.
4. **Settings**: Centralized JSON blob for white-labeling.

## Hybrid Data Strategy
To ensure the system works even in low-signal areas (e.g., basement sanctuaries):
1. User interacts with UI.
2. Store attempts to write to Supabase.
3. If fail (offline), data is written to `localStorage` with a `pending` flag.
4. UI displays a "Sync Required" banner.
5. When `navigator.onLine` fires, a push reconciliation happens.