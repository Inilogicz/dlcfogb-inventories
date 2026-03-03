-- Tighten Select Policies for Clusters
drop policy if exists "Clusters are viewable by everyone." on clusters;
drop policy if exists "Clusters are viewable based on role scope." on clusters;
create policy "Clusters are viewable based on role scope." on clusters for select using (
  is_super_admin() or 
  (is_region_admin() and region_id = get_user_region_id()) or
  (is_cluster_admin() and id = get_user_cluster_id()) or
  (is_center_rep() and exists (select 1 from centers c where c.cluster_id = clusters.id and c.id = get_user_center_id()))
);

-- Tighten Select Policies for Centers
drop policy if exists "Centers are viewable by everyone." on centers;
drop policy if exists "Centers are viewable based on role scope." on centers;
create policy "Centers are viewable based on role scope." on centers for select using (
  is_super_admin() or 
  (is_region_admin() and exists (select 1 from clusters cl where cl.id = centers.cluster_id and cl.region_id = get_user_region_id())) or
  (is_cluster_admin() and cluster_id = get_user_cluster_id()) or
  (is_center_rep() and id = get_user_center_id())
);

-- Ensure correct manage policy for centers
drop policy if exists "Super admins, region admins, and cluster admins can manage centers." on centers;
drop policy if exists "Authorized admins can manage centers." on centers;
create policy "Authorized admins can manage centers." on centers for all using (
  is_super_admin() or 
  (is_region_admin() and exists (select 1 from clusters c where c.id = centers.cluster_id and c.region_id = get_user_region_id())) or
  (is_cluster_admin() and cluster_id = get_user_cluster_id())
);
