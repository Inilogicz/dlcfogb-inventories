-- Migration script to add missing columns to existing tables
-- Run this in your Supabase SQL Editor

-- 1. Update attendance_submissions with new categories
do $$ 
begin
    -- Add the 8 demographic columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name='attendance_submissions' and column_name='adult_brothers') then
        alter table attendance_submissions add column adult_brothers integer not null default 0;
        alter table attendance_submissions add column adult_sisters integer not null default 0;
        alter table attendance_submissions add column youth_brothers integer not null default 0;
        alter table attendance_submissions add column youth_sisters integer not null default 0;
        alter table attendance_submissions add column children_brothers integer not null default 0;
        alter table attendance_submissions add column children_sisters integer not null default 0;
        alter table attendance_submissions add column visitors_brothers integer not null default 0;
        alter table attendance_submissions add column visitors_sisters integer not null default 0;
    end if;

    -- Add grand_total if it doesn't exist
    if not exists (select 1 from information_schema.columns where table_name='attendance_submissions' and column_name='grand_total') then
        alter table attendance_submissions add column grand_total integer generated always as (
            adult_brothers + adult_sisters + 
            youth_brothers + youth_sisters + 
            children_brothers + children_sisters + 
            visitors_brothers + visitors_sisters
        ) stored;
    end if;
end $$;

-- 2. Update inventory_items with new fields
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name='inventory_items' and column_name='model') then
        alter table inventory_items add column model text;
        alter table inventory_items add column model_number text;
        alter table inventory_items add column condition text;
    end if;
end $$;

-- 3. Cleanup old columns if they exist (male, female, children)
-- Optional: Only run if you want to clean up the old schema
-- alter table attendance_submissions drop column if exists male;
-- alter table attendance_submissions drop column if exists female;
-- alter table attendance_submissions drop column if exists children;

-- NOTE: After running this, the Supabase cache might take a minute to refresh. 
-- In some cases, you might need to run:
-- notify pgrst, 'reload schema';
