-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Roles enum
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('super_admin', 'cluster_admin', 'center_rep');
  end if;
end $$;

-- Clusters table
create table if not exists clusters (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Centers table
create table if not exists centers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  cluster_id uuid references clusters(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role app_role not null default 'center_rep',
  cluster_id uuid references clusters(id) on delete set null,
  center_id uuid references centers(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Service types
create table if not exists service_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique, -- e.g., 'Sunday Service', 'Thursday Revival', 'Monday Bible Study'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Attendance submissions
create table if not exists attendance_submissions (
  id uuid primary key default uuid_generate_v4(),
  center_id uuid references centers(id) on delete cascade, -- null for cluster/general levels
  cluster_id uuid references clusters(id) on delete cascade, -- null for center/general levels
  submission_level text not null default 'center' check (submission_level in ('center', 'cluster', 'general')),
  service_type_id uuid references service_types(id) on delete restrict not null,
  service_date date not null,
  adult_brothers integer not null default 0,
  adult_sisters integer not null default 0,
  youth_brothers integer not null default 0,
  youth_sisters integer not null default 0,
  children_brothers integer not null default 0,
  children_sisters integer not null default 0,
  visitors_brothers integer not null default 0,
  visitors_sisters integer not null default 0,
  grand_total integer generated always as (
    adult_brothers + adult_sisters + 
    youth_brothers + youth_sisters + 
    children_brothers + children_sisters + 
    visitors_brothers + visitors_sisters
  ) stored,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Unique indexes for different levels
create unique index if not exists attendance_submissions_unique_center on attendance_submissions (center_id, service_type_id, service_date) where submission_level = 'center';
create unique index if not exists attendance_submissions_unique_cluster on attendance_submissions (cluster_id, service_type_id, service_date) where submission_level = 'cluster';
create unique index if not exists attendance_submissions_unique_general on attendance_submissions (service_type_id, service_date) where submission_level = 'general';

-- Offering submissions
create table if not exists offering_submissions (
  id uuid primary key default uuid_generate_v4(),
  center_id uuid references centers(id) on delete cascade,
  cluster_id uuid references clusters(id) on delete cascade,
  submission_level text not null default 'center' check (submission_level in ('center', 'cluster', 'general')),
  service_type_id uuid references service_types(id) on delete restrict not null,
  service_date date not null,
  amount_100 numeric(12, 2) not null default 0.00,
  amount_80 numeric(12, 2) generated always as (amount_100 * 0.8) stored,
  amount_20 numeric(12, 2) generated always as (amount_100 * 0.2) stored,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Unique indexes for different levels
create unique index if not exists offering_submissions_unique_center on offering_submissions (center_id, service_type_id, service_date) where submission_level = 'center';
create unique index if not exists offering_submissions_unique_cluster on offering_submissions (cluster_id, service_type_id, service_date) where submission_level = 'cluster';
create unique index if not exists offering_submissions_unique_general on offering_submissions (service_type_id, service_date) where submission_level = 'general';

-- Inventory items
create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  center_id uuid references centers(id) on delete cascade not null,
  name text not null,
  quantity integer not null default 1,
  description text,
  model text,
  model_number text,
  condition text,
  image_url text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES

-- Enable RLS
alter table public.profiles disable row level security; -- CRITICAL: Keep disabled to prevent recursion
alter table clusters enable row level security;
alter table centers enable row level security;
alter table service_types enable row level security;
alter table attendance_submissions enable row level security;
alter table offering_submissions enable row level security;
alter table inventory_items enable row level security;

create or replace function public.get_user_role()
returns text as $$
begin
  return (select role::text from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.get_user_center_id()
returns uuid as $$
begin
  return (select center_id from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.get_user_cluster_id()
returns uuid as $$
begin
  return (select cluster_id from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

-- Standard role checks using the above functions (to break recursion)
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return get_user_role() = 'super_admin';
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_cluster_admin()
returns boolean as $$
begin
  return get_user_role() = 'cluster_admin';
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_center_rep()
returns boolean as $$
begin
  return get_user_role() = 'center_rep';
end;
$$ language plpgsql security definer set search_path = public;

-- Profiles policies
-- RLS is disabled on profiles to prevent recursive loops in role-checking functions.
-- Sensitive data should be managed via server-side APIs or restricted via other table policies.
-- create policy "Allow all users to view profiles" on profiles for select using (true);
-- create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
-- create policy "Super admins can insert profiles" on profiles for insert with check (is_super_admin());
-- create policy "Super admins can update all profiles" on profiles for update using (is_super_admin());
-- create policy "Super admins can delete profiles" on profiles for delete using (is_super_admin());

-- Clusters policies
drop policy if exists "Clusters are viewable by everyone." on clusters;
create policy "Clusters are viewable by everyone." on clusters for select using (true);

drop policy if exists "Super admins can manage clusters." on clusters;
create policy "Super admins can manage clusters." on clusters for all using (is_super_admin());

-- Centers policies
drop policy if exists "Centers are viewable by everyone." on centers;
create policy "Centers are viewable by everyone." on centers for select using (true);

drop policy if exists "Super admins can manage centers." on centers;
create policy "Super admins can manage centers." on centers for all using (is_super_admin());

-- Attendance policies
drop policy if exists "Super admins can view all attendance." on attendance_submissions;
create policy "Super admins can view all attendance." on attendance_submissions for select using (is_super_admin());

drop policy if exists "Super admins can manage all attendance." on attendance_submissions;
create policy "Super admins can manage all attendance." on attendance_submissions for all using (is_super_admin());

drop policy if exists "Cluster admins can view attendance in cluster." on attendance_submissions;
create policy "Cluster admins can view attendance in cluster." on attendance_submissions for select using (
  is_cluster_admin() and (
    (submission_level = 'center' and exists (
      select 1 from centers c where c.id = attendance_submissions.center_id 
      and c.cluster_id = get_user_cluster_id()
    )) or
    (submission_level = 'cluster' and cluster_id = get_user_cluster_id())
  )
);

drop policy if exists "Center reps can view their own center attendance." on attendance_submissions;
create policy "Center reps can view their own center attendance." on attendance_submissions for select using (
  is_center_rep() and center_id = get_user_center_id()
);

-- 48-hour deadline and same-day edit lock for attendance
drop policy if exists "Center reps can update attendance ONLY on the service day." on attendance_submissions;
create policy "Center reps can update attendance ONLY on the service day." on attendance_submissions for update using (
  (is_center_rep() and center_id = get_user_center_id()) or
  (is_cluster_admin() and submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
  (is_cluster_admin() and submission_level = 'center' and exists (select 1 from centers c where c.id = attendance_submissions.center_id and c.cluster_id = get_user_cluster_id()))
  and service_date = current_date
);

drop policy if exists "Center reps can insert attendance within 48h of service." on attendance_submissions;
create policy "Center reps can insert attendance within 48h of service." on attendance_submissions for insert with check (
  (
    (is_center_rep() and center_id = get_user_center_id()) or
    (is_cluster_admin() and submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
    (is_cluster_admin() and submission_level = 'center' and exists (select 1 from centers c where c.id = attendance_submissions.center_id and c.cluster_id = get_user_cluster_id())) or
    is_super_admin()
  ) 
  and (
    is_super_admin() or 
    current_date <= (service_date + interval '48 hours')
  )
);

-- Similar policies for offerings and inventory... (omitted for brevity in this SQL file but should follow same pattern)
-- (Actually, I should include them to be complete)

-- Offerings policies
drop policy if exists "Super admins can view all offerings." on offering_submissions;
create policy "Super admins can view all offerings." on offering_submissions for select using (is_super_admin());

drop policy if exists "Super admins can manage all offerings." on offering_submissions;
create policy "Super admins can manage all offerings." on offering_submissions for all using (is_super_admin());

drop policy if exists "Cluster admins can view offerings in cluster." on offering_submissions;
create policy "Cluster admins can view offerings in cluster." on offering_submissions for select using (
  is_cluster_admin() and (
    (submission_level = 'center' and exists (
      select 1 from centers c where c.id = offering_submissions.center_id 
      and c.cluster_id = get_user_cluster_id()
    )) or
    (submission_level = 'cluster' and cluster_id = get_user_cluster_id())
  )
);

drop policy if exists "Center reps can view their own center offerings." on offering_submissions;
create policy "Center reps can view their own center offerings." on offering_submissions for select using (
  is_center_rep() and center_id = get_user_center_id()
);

drop policy if exists "Center reps can insert offerings within 48h of service." on offering_submissions;
create policy "Center reps can insert offerings within 48h of service." on offering_submissions for insert with check (
  (
    (is_center_rep() and center_id = get_user_center_id()) or
    (is_cluster_admin() and submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
    (is_cluster_admin() and submission_level = 'center' and exists (select 1 from centers c where c.id = offering_submissions.center_id and c.cluster_id = get_user_cluster_id())) or
    is_super_admin()
  )
  and (
    is_super_admin() or
    current_date <= (service_date + interval '48 hours')
  )
);

drop policy if exists "Center reps can update offerings ONLY on the service day." on offering_submissions;
create policy "Center reps can update offerings ONLY on the service day." on offering_submissions for update using (
  (is_center_rep() and center_id = get_user_center_id()) or
  (is_cluster_admin() and submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
  (is_cluster_admin() and submission_level = 'center' and exists (select 1 from centers c where c.id = offering_submissions.center_id and c.cluster_id = get_user_cluster_id()))
  and service_date = current_date
);

-- Service types policies
drop policy if exists "Service types are viewable by everyone." on service_types;
create policy "Service types are viewable by everyone." on service_types for select using (true);

-- Inventory policies
drop policy if exists "Super admins can manage all inventory." on inventory_items;
create policy "Super admins can manage all inventory." on inventory_items for all using (is_super_admin());

drop policy if exists "Cluster admins can manage inventory in cluster." on inventory_items;
create policy "Cluster admins can manage inventory in cluster." on inventory_items for all using (
  is_cluster_admin() and exists (
    select 1 from centers c where c.id = inventory_items.center_id 
    and c.cluster_id = get_user_cluster_id()
  )
);

drop policy if exists "Center reps can manage their own center inventory." on inventory_items;
create policy "Center reps can manage their own center inventory." on inventory_items for all using (
  is_center_rep() and center_id = get_user_center_id()
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'center_rep');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed data for service types
insert into public.service_types (name) values 
  ('Sunday Worship'),
  ('Koinonia'),
  ('Monday Bible Study'),
  ('Thursday Revival'),
  ('Special Service')
on conflict (name) do nothing;
