-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- Create categories table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text not null default '#3b82f6', -- default blue hex
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default ''::text,
  completed boolean default false not null,
  category_id uuid references public.categories(id) on delete set null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
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
insert into public.categories (id, name, color) values
  ('e112d46e-117d-4dfb-8d7b-944a990ec821', 'Work', '#ef4444'),    -- Red
  ('b1300994-3759-4de9-bf39-b9d9c2282245', 'Personal', '#10b981'),-- Green
  ('d178e6be-2be3-488f-9e79-bc012586a117', 'Shopping', '#f59e0b'),-- Yellow
  ('a823e20e-6f81-4204-9467-3e114de93389', 'Health', '#8b5cf6');  -- Purple

-- Insert Seed Data (Tasks)
insert into public.tasks (title, description, completed, category_id, due_date) values
  ('Prepare design system presentation', 'Compile Figma frames and create slides for client review.', false, 'e112d46e-117d-4dfb-8d7b-944a990ec821', now() + interval '1 day'),
  ('Weekly grocery shopping', 'Buy fruits, almond milk, coffee beans, and eggs.', false, 'd178e6be-2be3-488f-9e79-bc012586a117', now() + interval '2 days'),
  ('Refactor State Management', 'Replace prop drilling with Zustand and TanStack query in task app.', true, 'e112d46e-117d-4dfb-8d7b-944a990ec821', now() - interval '2 hours'),
  ('Morning Cardio Session', 'Run 5km at easy pace and stretch.', false, 'a823e20e-6f81-4204-9467-3e114de93389', now() + interval '10 hours'),
  ('Call Mom', 'Check-in and catch up on weekend plans.', false, 'b1300994-3759-4de9-bf39-b9d9c2282245', null);
