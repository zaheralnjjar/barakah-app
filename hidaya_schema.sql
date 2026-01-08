-- Create hidaya_notes table
create table if not exists hidaya_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text,
  type text default 'quick',
  is_secure boolean default false,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create hidaya_appointments table
create table if not exists hidaya_appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  date date,
  time time,
  reminder_minutes integer default 15,
  is_completed boolean default false,
  location text,
  notes text,
  preparatory_task_ids text[],
  linked_task_ids text[],
  created_at timestamptz default now()
);

-- Enable RLS
alter table hidaya_notes enable row level security;
alter table hidaya_appointments enable row level security;

-- Create policies
create policy "Users can view their own hidaya notes" on hidaya_notes
  for select using (auth.uid() = user_id);
create policy "Users can insert their own hidaya notes" on hidaya_notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own hidaya notes" on hidaya_notes
  for update using (auth.uid() = user_id);
create policy "Users can delete their own hidaya notes" on hidaya_notes
  for delete using (auth.uid() = user_id);

create policy "Users can view their own hidaya appointments" on hidaya_appointments
  for select using (auth.uid() = user_id);
create policy "Users can insert their own hidaya appointments" on hidaya_appointments
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own hidaya appointments" on hidaya_appointments
  for update using (auth.uid() = user_id);
create policy "Users can delete their own hidaya appointments" on hidaya_appointments
  for delete using (auth.uid() = user_id);
