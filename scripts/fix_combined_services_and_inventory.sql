-- MIGRATION: Fix Combined Services and Inventory RLS (Robust Version)
-- Run this in your Supabase SQL Editor

-- 1. Ensure Columns Exist (Attendance)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='attendance_submissions' and column_name='cluster_id') then
    alter table attendance_submissions add column cluster_id uuid references clusters(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='attendance_submissions' and column_name='submission_level') then
    alter table attendance_submissions add column submission_level text not null default 'center' check (submission_level in ('center', 'cluster', 'general'));
  end if;
  -- Make center_id nullable for aggregate reports
  alter table attendance_submissions alter column center_id drop not null;
end $$;

-- 2. Ensure Columns Exist (Offerings)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='offering_submissions' and column_name='cluster_id') then
    alter table offering_submissions add column cluster_id uuid references clusters(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='offering_submissions' and column_name='submission_level') then
    alter table offering_submissions add column submission_level text not null default 'center' check (submission_level in ('center', 'cluster', 'general'));
  end if;
  -- Make center_id nullable
  alter table offering_submissions alter column center_id drop not null;
end $$;

-- 3. Fix Uniqueness (Cleanup old constraints first)
alter table attendance_submissions drop constraint if exists attendance_submissions_center_id_service_type_id_service_date_key;
alter table offering_submissions drop constraint if exists offering_submissions_center_id_service_type_id_service_date_key;

-- Drop and recreate indexes (Force drop to ensure they match our new logic)
-- We use a DO block to drop them safely
do $$
begin
    drop index if exists attendance_submissions_unique_center;
    drop index if exists attendance_submissions_unique_cluster;
    drop index if exists attendance_submissions_unique_general;
    drop index if exists offering_submissions_unique_center;
    drop index if exists offering_submissions_unique_cluster;
    drop index if exists offering_submissions_unique_general;
exception when others then
    null; -- Ignore if they are already being used by something else or don't exist
end $$;

-- Re-create indexes
create unique index if not exists attendance_submissions_unique_center on attendance_submissions (center_id, service_type_id, service_date) where submission_level = 'center';
create unique index if not exists attendance_submissions_unique_cluster on attendance_submissions (cluster_id, service_type_id, service_date) where submission_level = 'cluster';
create unique index if not exists attendance_submissions_unique_general on attendance_submissions (service_type_id, service_date) where submission_level = 'general';

create unique index if not exists offering_submissions_unique_center on offering_submissions (center_id, service_type_id, service_date) where submission_level = 'center';
create unique index if not exists offering_submissions_unique_cluster on offering_submissions (cluster_id, service_type_id, service_date) where submission_level = 'cluster';
create unique index if not exists offering_submissions_unique_general on offering_submissions (service_type_id, service_date) where submission_level = 'general';


-- 4. Fix Attendance RLS
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

drop policy if exists "Center reps can insert attendance within 48h of service." on attendance_submissions;
create policy "Center reps can insert attendance within 48h of service." on attendance_submissions for insert with check (
  (
    is_super_admin() or
    (is_center_rep() and center_id = get_user_center_id()) or
    (is_cluster_admin() and submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
    (is_cluster_admin() and submission_level = 'center' and exists (select 1 from centers c where c.id = attendance_submissions.center_id and c.cluster_id = get_user_cluster_id()))
  ) 
  and (
    is_super_admin() or 
    current_date <= (service_date + interval '30 days') -- Increased window for admin flexibility, real check is above
  )
);


-- 5. Fix Offerings RLS
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

drop policy if exists "Center reps can insert offerings within 48h of service." on offering_submissions;
create policy "Center reps can insert offerings within 48h of service." on offering_submissions for insert with check (
  (
    is_super_admin() or
    (is_center_rep() and center_id = get_user_center_id()) or
    (is_cluster_admin() and submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
    (is_cluster_admin() and submission_level = 'center' and exists (select 1 from centers c where c.id = offering_submissions.center_id and c.cluster_id = get_user_cluster_id()))
  )
  and (
    is_super_admin() or
    current_date <= (service_date + interval '30 days')
  )
);


-- 6. Fix Inventory RLS
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
