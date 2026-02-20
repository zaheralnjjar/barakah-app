-- Create tracker_folders table
create table tracker_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add folder_id to trackers table
alter table trackers add column folder_id uuid references tracker_folders(id) on delete set null;

-- Add RLS policies for tracker_folders
alter table tracker_folders enable row level security;

create policy "Users can view their own folders"
  on tracker_folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on tracker_folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on tracker_folders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on tracker_folders for delete
  using (auth.uid() = user_id);
