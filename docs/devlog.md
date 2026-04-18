# Development Log

### 2024-11-15: Firebase Migration
- **Feature**: Full Firebase (Firestore & Auth) Integration.
- **Decision**: Migrated from Supabase to Firebase to leverage Firestore's real-time capabilities and simplified authentication.
- **Impact**: Improved real-time data synchronization and simplified backend management.
- **Complexity**: Refactored `store.ts` to use Firebase SDK and updated all data operations to Firestore equivalents.

### 2024-11-10: Database Migration
- **Feature**: Full Supabase Integration (Legacy).
- **Decision**: Chose Supabase (PostgreSQL) over MongoDB to leverage relational integrity for Attendance/Usher links.
- **Impact**: All data is now persistent across sessions and devices.
- **Complexity**: Implemented a "Queue & Push" sync logic in `store.ts` to maintain the app's promise of 100% availability during service headcounts.

### 2024-11-05: Branding Engine
- **Feature**: Global Dictionary.
- **Impact**: Allowed the app to be white-labeled for multiple denominations.