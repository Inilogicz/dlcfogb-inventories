-- HELPER FUNCTIONS TO BREAK RECURSION
-- These functions use SECURITY DEFINER to bypass RLS checks during policy evaluation.

create or replace function public.get_cluster_region_id(cluster_uuid uuid)
returns uuid as $$
begin
  return (select region_id from public.clusters where id = cluster_uuid);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.get_center_cluster_id(center_uuid uuid)
returns uuid as $$
begin
  return (select cluster_id from public.centers where id = center_uuid);
end;
$$ language plpgsql security definer set search_path = public;

-- Tighten Select Policies for Clusters
drop policy if exists "Clusters are viewable by everyone." on clusters;
drop policy if exists "Clusters are viewable based on role scope." on clusters;
create policy "Clusters are viewable based on role scope." on clusters for select using (
  is_super_admin() or 
  (is_region_admin() and region_id = get_user_region_id()) or
  (is_cluster_admin() and id = get_user_cluster_id()) or
  (is_center_rep() and id = get_center_cluster_id(get_user_center_id()))
);

-- Tighten Select Policies for Centers
drop policy if exists "Centers are viewable by everyone." on centers;
drop policy if exists "Centers are viewable based on role scope." on centers;
create policy "Centers are viewable based on role scope." on centers for select using (
  is_super_admin() or 
  (is_region_admin() and get_cluster_region_id(cluster_id) = get_user_region_id()) or
  (is_cluster_admin() and cluster_id = get_user_cluster_id()) or
  (is_center_rep() and id = get_user_center_id())
);

-- Ensure correct manage policy for centers
drop policy if exists "Super admins, region admins, and cluster admins can manage centers." on centers;
drop policy if exists "Authorized admins can manage centers." on centers;
create policy "Authorized admins can manage centers." on centers for all using (
  is_super_admin() or 
  (is_region_admin() and get_cluster_region_id(cluster_id) = get_user_region_id()) or
  (is_cluster_admin() and cluster_id = get_user_cluster_id())
);

-- Fix Attendance Submissions Recursive Policies
drop policy if exists "Admins can view attendance in their scope." on attendance_submissions;
create policy "Admins can view attendance in their scope." on attendance_submissions for select using (
  is_super_admin() or
  (is_region_admin() and (
    (submission_level = 'center' and get_cluster_region_id(get_center_cluster_id(center_id)) = get_user_region_id()) or
    (submission_level = 'cluster' and get_cluster_region_id(cluster_id) = get_user_region_id())
  )) or
  (is_cluster_admin() and (
    (submission_level = 'center' and get_center_cluster_id(center_id) = get_user_cluster_id()) or
    (submission_level = 'cluster' and cluster_id = get_user_cluster_id())
  ))
);

-- Fix Offering Submissions Recursive Policies
drop policy if exists "Admins can view offerings in their scope." on offering_submissions;
create policy "Admins can view offerings in their scope." on offering_submissions for select using (
  is_super_admin() or
  (is_region_admin() and (
    (submission_level = 'center' and get_cluster_region_id(get_center_cluster_id(center_id)) = get_user_region_id()) or
    (submission_level = 'cluster' and get_cluster_region_id(cluster_id) = get_user_region_id())
  )) or
  (is_cluster_admin() and (
    (submission_level = 'center' and get_center_cluster_id(center_id) = get_user_cluster_id()) or
    (submission_level = 'cluster' and cluster_id = get_user_cluster_id())
  ))
);

-- Fix Inventory Items Recursive Policies
drop policy if exists "Admins can manage inventory in their scope." on inventory_items;
create policy "Admins can manage inventory in their scope." on inventory_items for all using (
  is_super_admin() or
  (is_region_admin() and get_cluster_region_id(get_center_cluster_id(center_id)) = get_user_region_id()) or
  (is_cluster_admin() and get_center_cluster_id(center_id) = get_user_cluster_id())
);
