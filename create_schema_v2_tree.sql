-- Notes V2 Schema (Tree Structure)

-- 1. Folders Table (Recursive)
create table if not exists public.folders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    parent_id uuid references public.folders(id) on delete cascade, -- Recursive relationship
    name text not null,
    icon text default 'Folder', -- Lucide icon name
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for folders
create index folders_user_id_idx on public.folders(user_id);
create index folders_parent_id_idx on public.folders(parent_id);


-- 2. Notes Advanced Table
create table if not exists public.notes_advanced (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    
    -- Relationship
    folder_id uuid references public.folders(id) on delete set null,
    
    -- Content
    title text default 'Untitled',
    content text default '', -- Stores HTML/JSON for Rich Text
    
    -- Metadata
    is_pinned boolean default false,
    -- Removed is_locked/lock_pin as requested
    tags text[] default array[]::text[],
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for notes
create index notes_advanced_user_id_idx on public.notes_advanced(user_id);
create index notes_advanced_folder_id_idx on public.notes_advanced(folder_id);


-- 3. RLS Policies
alter table public.folders enable row level security;
alter table public.notes_advanced enable row level security;

-- Folders Policies
create policy "Users can view their own folders"
    on public.folders for select using (auth.uid() = user_id);

create policy "Users can create their own folders"
    on public.folders for insert with check (auth.uid() = user_id);

create policy "Users can update their own folders"
    on public.folders for update using (auth.uid() = user_id);

create policy "Users can delete their own folders"
    on public.folders for delete using (auth.uid() = user_id);

-- Notes Policies
create policy "Users can view their own notes_advanced"
    on public.notes_advanced for select using (auth.uid() = user_id);

create policy "Users can create their own notes_advanced"
    on public.notes_advanced for insert with check (auth.uid() = user_id);

create policy "Users can update their own notes_advanced"
    on public.notes_advanced for update using (auth.uid() = user_id);

create policy "Users can delete their own notes_advanced"
    on public.notes_advanced for delete using (auth.uid() = user_id);

-- 4. Triggers for updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at_folders before update on public.folders
    for each row execute procedure moddatetime (updated_at);

create trigger handle_updated_at_notes before update on public.notes_advanced
    for each row execute procedure moddatetime (updated_at);
