-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Table: New Muslims (المهتدين)
create table if not exists new_muslims (
    id uuid primary key default uuid_generate_v4(),
    full_name text not null,
    arabic_name text,
    phone text,
    email text,
    nationality text,
    language text default 'Portuguese',
    gender text check (gender in ('male', 'female')),
    birth_date date, -- Added for Age sorting
    address text,    -- Added for Residence filtering
    conversion_date date,
    status text check (status in ('active', 'inactive', 'graduated', 'moved')) default 'active',
    level text check (level in ('beginner', 'elementary', 'intermediate', 'advanced')) default 'beginner',
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. Table: Learning Progress (التقدم التعليمي)
create table if not exists learning_progress (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references new_muslims(id) on delete cascade,
    subject text not null, 
    topic text not null,
    status text check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
    grade integer check (grade between 1 and 5),
    completed_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- 3. Table: Attendance Log (سجل الحضور)
create table if not exists attendance_log (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references new_muslims(id) on delete cascade,
    visit_date date default current_date,
    type text check (type in ('prayer', 'class', 'friday_prayer', 'visit', 'consultation')),
    notes text,
    created_at timestamp with time zone default now()
);

-- 4. Table: Appointments (المواعيد)
create table if not exists student_appointments (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references new_muslims(id) on delete cascade,
    appointment_date timestamp with time zone not null,
    duration_minutes integer default 30,
    type text not null,
    subject text,
    status text check (status in ('scheduled', 'completed', 'cancelled', 'no_show')) default 'scheduled',
    is_synced_to_calendar boolean default false, -- Integration with Barakah Calendar
    created_at timestamp with time zone default now()
);

-- 5. Table: Certificates (الشهادات) - NEW
create table if not exists certificates (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references new_muslims(id) on delete cascade,
    title text not null, -- e.g., 'Shahada Certificate', 'Level 1 Completion'
    issue_date date default current_date,
    file_url text,
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table new_muslims enable row level security;
alter table learning_progress enable row level security;
alter table attendance_log enable row level security;
alter table student_appointments enable row level security;
alter table certificates enable row level security;

-- Policies
create policy "Allow all actions for authenticated users" on new_muslims for all using (auth.role() = 'authenticated');
create policy "Allow all actions for authenticated users" on learning_progress for all using (auth.role() = 'authenticated');
create policy "Allow all actions for authenticated users" on attendance_log for all using (auth.role() = 'authenticated');
create policy "Allow all actions for authenticated users" on student_appointments for all using (auth.role() = 'authenticated');
create policy "Allow all actions for authenticated users" on certificates for all using (auth.role() = 'authenticated');

-- --- SAMPLE DATA ---

insert into new_muslims (full_name, arabic_name, nationality, status, level, conversion_date, birth_date, address) values
('Ricardo Silva', 'Abdul Rahman', 'Brazil', 'active', 'elementary', '2023-11-15', '1990-05-20', 'Sao Paulo, Centro'),
('Camila Santos', 'Aysha', 'Brazil', 'active', 'beginner', '2024-01-20', '1995-08-10', 'Sao Paulo, Zona Sul'),
('John Smith', 'Yahya', 'USA', 'graduated', 'advanced', '2022-05-10', '1985-03-15', 'Rio de Janeiro');
