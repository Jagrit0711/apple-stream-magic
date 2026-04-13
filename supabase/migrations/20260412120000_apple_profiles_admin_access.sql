do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'apple_profiles'
  ) then
    alter table public.profiles rename to apple_profiles;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'watch_history'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'apple_user_content'
  ) then
    alter table public.watch_history rename to apple_user_content;
  end if;
end $$;

alter table if exists public.apple_profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists email text null,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists subscription_expires_at timestamp with time zone null,
  add column if not exists renewal_whatsapp text null default '8851844602',
  add column if not exists plan_price integer null default 50;

alter table if exists public.apple_profiles
  drop constraint if exists apple_profiles_subscription_status_check;

alter table if exists public.apple_profiles
  add constraint apple_profiles_subscription_status_check
  check (subscription_status = any (array['active', 'inactive', 'trial', 'expired', 'suspended', 'lifetime']));

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.apple_profiles
    where user_id = auth.uid()
      and is_admin = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.apple_profiles (
    user_id,
    display_name,
    favorite_genres,
    onboarding_complete,
    is_admin,
    subscription_status,
    subscription_expires_at,
    renewal_whatsapp,
    plan_price
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    '{}'::integer[],
    false,
    false,
    'inactive',
    null,
    '8851844602',
    50
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

create or replace function public.prevent_privileged_profile_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    if new.is_admin is distinct from old.is_admin
      or new.subscription_status is distinct from old.subscription_status
      or new.subscription_expires_at is distinct from old.subscription_expires_at
      or new.renewal_whatsapp is distinct from old.renewal_whatsapp
      or new.plan_price is distinct from old.plan_price then
      raise exception 'restricted profile fields can only be updated by admin';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_privileged_profile_edits_trigger on public.apple_profiles;
create trigger prevent_privileged_profile_edits_trigger
  before update on public.apple_profiles
  for each row execute function public.prevent_privileged_profile_edits();

alter table if exists public.apple_profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.apple_profiles;
create policy "Users can view their own profile" on public.apple_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.apple_profiles;
create policy "Users can insert their own profile" on public.apple_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.apple_profiles;
create policy "Users can update their own profile" on public.apple_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "Admins can view all profiles" on public.apple_profiles;
create policy "Admins can view all profiles" on public.apple_profiles
  for select using (public.is_admin_user());

drop policy if exists "Admins can update all profiles" on public.apple_profiles;
create policy "Admins can update all profiles" on public.apple_profiles
  for update using (public.is_admin_user());

alter table if exists public.apple_user_content enable row level security;

drop policy if exists "Users can view their own watch history" on public.apple_user_content;
create policy "Users can view their own watch history" on public.apple_user_content
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own watch history" on public.apple_user_content;
create policy "Users can insert their own watch history" on public.apple_user_content
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own watch history" on public.apple_user_content;
create policy "Users can update their own watch history" on public.apple_user_content
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own watch history" on public.apple_user_content;
create policy "Users can delete their own watch history" on public.apple_user_content
  for delete using (auth.uid() = user_id);

drop policy if exists "Admins can view all watch history" on public.apple_user_content;
create policy "Admins can view all watch history" on public.apple_user_content
  for select using (public.is_admin_user());

drop policy if exists "Admins can update all watch history" on public.apple_user_content;
create policy "Admins can update all watch history" on public.apple_user_content
  for update using (public.is_admin_user());

drop policy if exists "Admins can delete all watch history" on public.apple_user_content;
create policy "Admins can delete all watch history" on public.apple_user_content
  for delete using (public.is_admin_user());

insert into public.apple_profiles (user_id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
on conflict (user_id) do nothing;

update public.apple_profiles
set
  email = coalesce(email, auth_users.email),
  renewal_whatsapp = coalesce(renewal_whatsapp, '8851844602'),
  plan_price = coalesce(plan_price, 50),
  subscription_status = coalesce(subscription_status, 'inactive'),
  updated_at = timezone('utc'::text, now())
from auth.users auth_users
where public.apple_profiles.user_id = auth_users.id
   and (
     public.apple_profiles.email is null
     or public.apple_profiles.renewal_whatsapp is null
     or public.apple_profiles.plan_price is null
     or public.apple_profiles.subscription_status is null
   );
