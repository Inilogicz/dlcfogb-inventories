-- Fix RLS Policies for Regional Admin Submissions

-- 1. Update Attendance Submissions policies
drop policy if exists "Admins can view attendance in their scope." on attendance_submissions;
create policy "Admins can view attendance in their scope." on attendance_submissions for select using (
  (is_region_admin() and (
    (submission_level = 'general' and region_id = get_user_region_id()) or
    (submission_level = 'cluster' and exists (
      select 1 from clusters cl where cl.id = attendance_submissions.cluster_id and cl.region_id = get_user_region_id()
    )) or
    (submission_level = 'center' and exists (
      select 1 from centers c join clusters cl on c.cluster_id = cl.id where c.id = attendance_submissions.center_id and cl.region_id = get_user_region_id()
    ))
  )) or
  (is_cluster_admin() and (
    (submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
    (submission_level = 'center' and exists (
      select 1 from centers c where c.id = attendance_submissions.center_id and c.cluster_id = get_user_cluster_id()
    ))
  ))
);

drop policy if exists "Authorized users can insert attendance within 48h of service." on attendance_submissions;
create policy "Authorized users can insert attendance within 48h of service." on attendance_submissions for insert with check (
  (
    is_super_admin() or
    (is_region_admin() and (
      (submission_level = 'general' and region_id = get_user_region_id()) or
      (submission_level = 'cluster' and exists (select 1 from clusters cl where cl.id = attendance_submissions.cluster_id and cl.region_id = get_user_region_id())) or
      (submission_level = 'center' and exists (select 1 from centers c join clusters cl on c.cluster_id = cl.id where c.id = attendance_submissions.center_id and cl.region_id = get_user_region_id()))
    )) or
    (is_cluster_admin() and (
      (submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
      (submission_level = 'center' and exists (select 1 from centers c where c.id = attendance_submissions.center_id and c.cluster_id = get_user_cluster_id()))
    )) or
    (is_center_rep() and center_id = get_user_center_id())
  ) 
  and (
    is_super_admin() or 
    current_date <= (service_date + interval '48 hours')
  )
);

drop policy if exists "Authorized users can update attendance ONLY on the service day." on attendance_submissions;
create policy "Authorized users can update attendance ONLY on the service day." on attendance_submissions for update using (
  (
    is_super_admin() or
    (is_region_admin() and (
      (submission_level = 'general' and region_id = get_user_region_id()) or
      (submission_level = 'cluster' and exists (select 1 from clusters cl where cl.id = attendance_submissions.cluster_id and cl.region_id = get_user_region_id())) or
      (submission_level = 'center' and exists (select 1 from centers c join clusters cl on c.cluster_id = cl.id where c.id = attendance_submissions.center_id and cl.region_id = get_user_region_id()))
    )) or
    (is_cluster_admin() and (
      (submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
      (submission_level = 'center' and exists (select 1 from centers c where c.id = attendance_submissions.center_id and c.cluster_id = get_user_cluster_id()))
    )) or
    (is_center_rep() and center_id = get_user_center_id())
  )
  and service_date = current_date
);

-- 2. Update Offering Submissions policies
drop policy if exists "Admins can view offerings in their scope." on offering_submissions;
create policy "Admins can view offerings in their scope." on offering_submissions for select using (
  (is_region_admin() and (
    (submission_level = 'general' and region_id = get_user_region_id()) or
    (submission_level = 'cluster' and exists (
      select 1 from clusters cl where cl.id = offering_submissions.cluster_id and cl.region_id = get_user_region_id()
    )) or
    (submission_level = 'center' and exists (
      select 1 from centers c join clusters cl on c.cluster_id = cl.id where c.id = offering_submissions.center_id and cl.region_id = get_user_region_id()
    ))
  )) or
  (is_cluster_admin() and (
    (submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
    (submission_level = 'center' and exists (
      select 1 from centers c where c.id = offering_submissions.center_id and c.cluster_id = get_user_cluster_id()
    ))
  ))
);

drop policy if exists "Authorized users can insert offerings within 48h of service." on offering_submissions;
create policy "Authorized users can insert offerings within 48h of service." on offering_submissions for insert with check (
  (
    is_super_admin() or
    (is_region_admin() and (
      (submission_level = 'general' and region_id = get_user_region_id()) or
      (submission_level = 'cluster' and exists (select 1 from clusters cl where cl.id = offering_submissions.cluster_id and cl.region_id = get_user_region_id())) or
      (submission_level = 'center' and exists (select 1 from centers c join clusters cl on c.cluster_id = cl.id where c.id = offering_submissions.center_id and cl.region_id = get_user_region_id()))
    )) or
    (is_cluster_admin() and (
      (submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
      (submission_level = 'center' and exists (select 1 from centers c where c.id = offering_submissions.center_id and c.cluster_id = get_user_cluster_id()))
    )) or
    (is_center_rep() and center_id = get_user_center_id())
  )
  and (
    is_super_admin() or
    current_date <= (service_date + interval '48 hours')
  )
);

drop policy if exists "Authorized users can update offerings ONLY on the service day." on offering_submissions;
create policy "Authorized users can update offerings ONLY on the service day." on offering_submissions for update using (
  (
    is_super_admin() or
    (is_region_admin() and (
      (submission_level = 'general' and region_id = get_user_region_id()) or
      (submission_level = 'cluster' and exists (select 1 from clusters cl where cl.id = offering_submissions.cluster_id and cl.region_id = get_user_region_id())) or
      (submission_level = 'center' and exists (select 1 from centers c join clusters cl on c.cluster_id = cl.id where c.id = offering_submissions.center_id and cl.region_id = get_user_region_id()))
    )) or
    (is_cluster_admin() and (
      (submission_level = 'cluster' and cluster_id = get_user_cluster_id()) or
      (submission_level = 'center' and exists (select 1 from centers c where c.id = offering_submissions.center_id and c.cluster_id = get_user_cluster_id()))
    )) or
    (is_center_rep() and center_id = get_user_center_id())
  )
  and service_date = current_date
);
