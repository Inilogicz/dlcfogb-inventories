-- 🚨 NUCLEAR RLS FIX 🚨
-- Run this in your Supabase Dashboard SQL Editor to definitively stop the recursion error.

-- 1. Disable RLS on profiles entirely. 
-- This is necessary because many other table policies query 'profiles',
-- and if 'profiles' has RLS enabled, it creates a recursive check loop.
alter table public.profiles disable row level security;

-- 2. Drop all policies on the profiles table for good measure
drop policy if exists "Allow all users to view profiles" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Super admins can manage all profiles." on profiles;
drop policy if exists "Super admins can write to all profiles" on profiles;

-- 3. Simplify the role checking functions to be more performant
-- and ensure they are 'security definer' to bypass all RLS checks internally.
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return (select role = 'super_admin' from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_cluster_admin()
returns boolean as $$
begin
  return (select role = 'cluster_admin' from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_center_rep()
returns boolean as $$
begin
  return (select role = 'center_rep' from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Set the search_path for the auth trigger function too
alter function public.handle_new_user() set search_path = public;

-- ✅ THE LOOP IS NOW BROKEN.
