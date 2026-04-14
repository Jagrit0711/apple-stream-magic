create or replace function public.prevent_privileged_profile_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow trusted backend/service-role updates (used by server-side admin tooling).
  if auth.role() = 'service_role'
     or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;

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
