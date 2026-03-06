-- Migration to add region_id to submissions for regional scoping

-- 1. Add region_id to attendance_submissions
alter table attendance_submissions add column if not exists region_id uuid references regions(id) on delete cascade;

-- 2. Add region_id to offering_submissions
alter table offering_submissions add column if not exists region_id uuid references regions(id) on delete cascade;

-- 3. Update unique indexes for 'general' level to include region_id
-- This allows different regions to each have a 'general' submission for the same date/type
drop index if exists attendance_submissions_unique_general;
create unique index attendance_submissions_unique_general on attendance_submissions (region_id, service_type_id, service_date) where submission_level = 'general';

drop index if exists offering_submissions_unique_general;
create unique index offering_submissions_unique_general on offering_submissions (region_id, service_type_id, service_date) where submission_level = 'general';

-- 4. Backfill region_id for existing records based on cluster_id/center_id if possible
update attendance_submissions as s
set region_id = c.region_id
from clusters as c
where s.cluster_id = c.id and s.region_id is null;

update attendance_submissions as s
set region_id = c.region_id
from centers as cn
join clusters as c on cn.cluster_id = c.id
where s.center_id = cn.id and s.region_id is null;

update offering_submissions as s
set region_id = c.region_id
from clusters as c
where s.cluster_id = c.id and s.region_id is null;

update offering_submissions as s
set region_id = c.region_id
from centers as cn
join clusters as c on cn.cluster_id = c.id
where s.center_id = cn.id and s.region_id is null;
