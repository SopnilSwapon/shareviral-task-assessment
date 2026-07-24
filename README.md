# Task Manager Mobile Application - Mid-Level Technical Assessment

This repository contains a clean, production-ready implementation of a **Task Manager Mobile Application** built using Expo, TypeScript, Supabase, TanStack Query v5, Zustand, and AsyncStorage. It acts as a reference solution and a technical assessment task for evaluating mid-level React Native developers.

---

## 🛠 Tech Stack & Core Architecture

* **Framework**: Expo SDK 57 (using Expo Router for stack and tab-based routing)
* **Primary Database & API**: Supabase JS Client (`@supabase/supabase-js`)
* **Global Server/Cache State**: TanStack Query v5
* **Global Local Client State**: Zustand v5
* **Offline Cache Persistence**: `@react-native-async-storage/async-storage`
* **Utilities**: Custom hooks for search debouncing and filtered/sorted calculations, `@react-native-community/netinfo` for network connectivity detection
* **Testing**: Jest + React Native Testing Library

---

## ⚡ Setup & Installation

### 1. Prerequisites
* Install Node.js (v18+)
* Install Expo Go on your mobile device (iOS/Android) or set up a simulator.

### 2. Install Dependencies
Clone the repository and install npm dependencies:
```bash
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Create a `.env` file at the root of the project and insert your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://gcfdvkxfqtyrtiimeprq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZmR2a3hmcXR5cnRpaW1lcHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NzkzMzgsImV4cCI6MjEwMDM1NTMzOH0.2pOLA0SYFjRpOvZ077d08-wy7cHkKG9XfcmyNU3qTVE
```

### 4. Database Setup (Actual Supabase Schema)
The remote Supabase schema is pre-configured with the following structure (RLS is configured for public access in development):

```sql
-- Categories table schema
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table schema
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default ''::text,
  status text not null default 'open', -- 'open' or 'done'
  category_id uuid references public.categories(id) on delete set null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 5. Running the Application
Start the Expo Metro Bundler:
```bash
npm run start
```
* Press `i` to launch in the iOS Simulator.
* Press `a` to launch in the Android Emulator.
* Scan the QR code with your Expo Go app to test on physical devices.

### 6. Executing Tests
Run unit tests via Jest:
```bash
npm run test
```

---

## 🏛 Architectural Decisions & Justifications

### 📦 Choice of AsyncStorage
For React Native applications, `AsyncStorage` acts as the standard, lightweight key-value storage engine. In our offline-first architecture, it serves two main purposes:
1. **Zustand Persistence**: Storing the device-only `starredTaskIds` so that the user's selected tasks remain starred across app cycles.
2. **React Query Cache Storage**: On cold boot, the query client retrieves cached task and category lists instantly from storage and renders them before network synchronization is triggered.

### 🔄 Choice of Zustand + TanStack Query
We decouple server-state and client-state entirely:
* **TanStack Query (Server State)**: Manages remote fetching, background caching, loading states, error boundaries, automatic re-tries, and cache invalidation.
* **Zustand (Client State)**: Manages UI state (active category filters, status filters, sorting selectors) and local-only attributes (starred IDs list). By keeping these out of the query cache, Zustand provides synchronous, blazing-fast updates.

### 🔗 Schema Constraints & Local Color Merging
To align with the remote Supabase database constraints:
1. **Task Status Mapping**: We map the Boolean `completed` state to the database `status` string column (`'open'` / `'done'`) inside view files and mutations, matching the server's enum.
2. **Category Colors Mapping**: Since the remote `categories` table lacks a `color` column, we assign colors deterministically in the client using a hashing function of the category's name (`getCategoryColor`). This keeps the UI vibrant without altering the remote schema.
3. **Local Starred Preservation**: The `starred` status is stored on-device in Zustand. We run `mergeRemoteWithLocalStarred(remoteTasks, starredTaskIds)` within the TanStack Query `select` option to reactively merge remote data with local stars.

### 🧪 Testing Strategy
Our Jest testing targets core utility functions and custom hooks to validate application integrity:
1. **`merge.test.ts`**: Asserts that `mergeRemoteWithLocalStarred` maps local starred statuses correctly.
2. **`useFilteredSortedTasks.test.ts`**: Exercises our search logic, category filtering, completion status, and sorting combinations.
3. **`useDebounce.test.ts`**: Tests search input delays using Jest’s fake timers, ensuring that updates are throttled.

All tests are written using async rendering structures, making them compatible with React 19 and `@testing-library/react-native` v14.
