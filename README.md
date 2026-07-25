# Task Manager Mobile Application - Technical Assessment

This repository contains a clean, production-ready implementation of a **Task Manager Mobile Application** built using Expo SDK 57, TypeScript, Supabase, TanStack Query v5, Zustand, AsyncStorage, and React Hook Form. It acts as a reference solution and a technical assessment task for evaluating React Native developers.


## App Link: https://expo.dev/accounts/sopnilswapon1/projects/shareviral-task-assessment/builds/b66ca511-1fe5-4cc8-8d8c-3c9702daf6dc

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
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZmR2a3hmcXR5cnRpaW1lcPrayiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NzkzMzgsImV4cCI6MjEwMDM1NTMzOH0.2pOLA0SYFjRpOvZ077d08-wy7cHkKG9XfcmyNU3qTVE
```

### 4. Database Setup (Actual Supabase Schema)
The remote Supabase schema is pre-configured with the following structure:

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

### 6. Executing Tests
Run unit tests via Jest:
```bash
npm run test
```

---

## 🏛 Architectural Decisions & Justifications

### 📦 Choice of Local Storage: AsyncStorage
We selected `@react-native-async-storage/async-storage` as our local persistence layer. While alternatives like MMKV offer faster synchronous read/writes and SQLite is suited for complex relational indexing, `AsyncStorage` is the standard, well-supported, and lightweight key-value container that perfectly fits our requirements. It handles our simple offline caching layer and local-onlystarred states without introducing native compilation dependencies or configuration bloat.

### 🔄 Choice of State Management: TanStack Query + Zustand
We decouple global server-state and local client-state entirely:
* **TanStack Query (Server State)**: Manages remote fetching, background caching, loading states, and automatic cache persistence. By wrapping standard fetches in custom `useAppQuery` and `useAppMutation` hooks driven by a custom `Fetch` requester, we gain complete control over network error formatting and timeouts.
* **Zustand (Client State)**: Manages UI state (active category filters, status filters, sorting selectors) and local-only attributes (`starredTaskIds`). Since Zustand is a local-only reactive store, it provides synchronous, fast updates without affecting network query caches.

### 🔗 Starred Flag Preservation Across Refresh
The `starred` status is stored on-device in the persisted Zustand store. When the app fetches fresh task data from the backend in the background, we preserve these local flags using the `mergeRemoteWithLocalStarred` utility:
```typescript
export function mergeRemoteWithLocalStarred(
  remoteTasks: Task[],
  starredIds: string[]
): TaskWithStarred[] {
  if (!remoteTasks) return [];
  const starredSet = new Set(starredIds);
  return remoteTasks.map((task) => ({
    ...task,
    starred: starredSet.has(task.id),
  }));
}
```
This utility is bound inside the TanStack Query `select` parameter:
```typescript
select: (data) => mergeRemoteWithLocalStarred(data, starredTaskIds)
```
This guarantees that tasks are reactively mapped to their starred status, and starred values are never overwritten during background refreshes.

### 🧪 Testing Approach
Our Jest testing targets critical custom hooks and state mapping utilities:
1. **`merge.test.ts`**: Asserts that `mergeRemoteWithLocalStarred` maps local starred statuses correctly.
2. **`useFilteredSortedTasks.test.ts`**: Exercises our search logic, category filtering, completion status, and sorting combinations outside the render tree.
3. **`useDebounce.test.ts`**: Tests search input delays using Jest’s fake timers, ensuring that updates are throttled.

### 📋 Form Management & Validation
We use `react-hook-form` to control form inputs inside task creation, edit modals, and category creation. Form fields are controlled using `<Controller>` components. Submitting fields with validation errors highlights the text box with a red border (`border-red-500`) and displays a red warning message directly below the input field, avoiding annoying popups.

---

## ⚠️ Known Limitations
* **Form Date Inputs**: The due date input uses a simple text field expecting `YYYY-MM-DD` formatting rather than a complex date-picker plugin to avoid platform-specific bugs in virtual emulators.
* **Conflict Resolution**: The app does not support offline write queues or conflict resolution. Changes are made on-device and committed directly to the remote Supabase database.

---

## 💡 What we would do differently with another day
* Add a proper native Date Picker (like `@react-native-community/datetimepicker`) for selecting task due dates.
* Implement a background sync queue using `NetInfo` and `@react-native-community/netinfo` to enqueue failed write actions (creates, updates, deletes) and play them back automatically when the device regains internet connection.
* Add skeleton loaders to screens to enhance the transitions when loading data for the first time.

---

## ## AI Usage

AI was used primarily as an implementation assistant to accelerate development.

I defined the overall architecture, project structure, state management approach, data flow, and implementation strategy. I also guided the implementation through detailed prompts, referenced patterns from my previous projects, and iteratively refined the generated code.

AI helped with:
- Generating component and screen boilerplate
- Implementing UI based on my design decisions
- Writing repetitive TypeScript interfaces and utility functions
- Refactoring code for readability
- Explaining implementation details and suggesting improvements

I was responsible for:
- Overall application architecture
- Folder structure and project organization
- State management decisions
- Offline data flow and synchronization approach
- API integration strategy
- Reviewing, modifying, and validating all generated code
- Testing and debugging the final implementation
I reviewed, modified, tested, and integrated all generated code before submission.
