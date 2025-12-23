
-- Create archives table
create table if not exists public.archives (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    user_id uuid not null references auth.users(id),
    label text null,
    sections text[] null,
    content jsonb not null,
    primary key (id)
);

-- Enable RLS
alter table public.archives enable row level security;

-- Create policies
create policy "Users can insert their own archives"
on public.archives for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own archives"
on public.archives for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own archives"
on public.archives for delete
to authenticated
using (auth.uid() = user_id);
