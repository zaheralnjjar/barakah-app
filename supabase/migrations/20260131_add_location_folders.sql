-- Create location folders table
create table if not exists location_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text default 'folder',
  color text default '#3b82f6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add folder_id to saved_locations
alter table saved_locations 
add column if not exists folder_id uuid references location_folders(id) on delete set null;

-- Add RLS policies for folders
alter table location_folders enable row level security;

create policy "Users can view own folders"
  on location_folders for select
  using (auth.uid() = user_id);

create policy "Users can insert own folders"
  on location_folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own folders"
  on location_folders for update
  using (auth.uid() = user_id);

create policy "Users can delete own folders"
  on location_folders for delete
  using (auth.uid() = user_id);
