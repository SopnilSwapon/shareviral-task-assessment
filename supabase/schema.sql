-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- Create categories table (Actual Remote Schema)
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table (Actual Remote Schema)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default ''::text,
  status text not null default 'open', -- 'open' or 'done'
  category_id uuid references public.categories(id) on delete set null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.tasks enable row level security;

-- Create policy for public read/write access (for development/assessment purposes)
create policy "Allow public access to categories" on public.categories
  for all using (true) with check (true);

create policy "Allow public access to tasks" on public.tasks
  for all using (true) with check (true);

-- Insert Seed Data (Categories)
insert into public.categories (id, name) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Work'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Personal'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Study'),
  ('a1b2c3d4-0000-0000-0000-000000000004', 'Shopping');

-- Insert Seed Data (8 Tasks)
insert into public.tasks (id, title, description, status, category_id, due_date, created_at) values
  ('d01ebeb5-e25a-4704-9c3f-8ddd2c0f5c62', 'Complete React Native Task', 'Finish task assessment for ShareViral', 'open', 'a1b2c3d4-0000-0000-0000-000000000001', now() + interval '1 day', now() - interval '7 hours'),
  ('e5f8cebe-abc9-4ced-bddc-5626cd7fb7f8', 'Review PRs', 'Check pending pull requests in repository', 'done', 'a1b2c3d4-0000-0000-0000-000000000001', now() - interval '1 day', now() - interval '6 hours'),
  ('40a93dc3-041c-4dfb-85a9-f4b563f6d63e', 'Gym workout', 'Leg day workout session', 'open', 'a1b2c3d4-0000-0000-0000-000000000002', now(), now() - interval '5 hours'),
  ('c0b14925-35b8-4734-b696-102a5cac73f4', 'Read React Native Docs', 'Learn about TurboModules and Fabric', 'open', 'a1b2c3d4-0000-0000-0000-000000000003', now() + interval '3 days', now() - interval '4 hours'),
  ('ec54f0b9-6e57-437b-8a0e-58cf3189e682', 'Database Optimization', 'Write proper indexes for Supabase tables', 'done', 'a1b2c3d4-0000-0000-0000-000000000001', now() - interval '3 days', now() - interval '3 hours'),
  ('a1a0ac0a-fd5a-4832-80e2-223c0cb899f3', 'Clean room', 'Organize desk and clothes', 'done', 'a1b2c3d4-0000-0000-0000-000000000002', now() - interval '2 days', now() - interval '2 hours'),
  ('08c36b58-b451-441e-b966-0c4870956d10', 'TypeScript Practice', 'Solve generic types challenges', 'open', 'a1b2c3d4-0000-0000-0000-000000000003', now() + interval '4 days', now() - interval '1 hour'),
  ('f7e91d24-3450-482a-bc90-9c2b8c9d4e5a', 'Weekly Groceries', 'Buy milk, eggs, bread, and fruits', 'open', 'a1b2c3d4-0000-0000-0000-000000000004', now() + interval '2 days', now());
