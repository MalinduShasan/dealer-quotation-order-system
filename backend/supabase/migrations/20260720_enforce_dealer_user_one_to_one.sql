begin;

-- Allow dealer profiles to exist temporarily as drafts before a user account
-- is linked. Active, inactive, and blocked profiles must have a dealer user.
alter table public.dealers
drop constraint if exists dealers_status_check;

alter table public.dealers
add constraint dealers_status_check
check (status in ('draft', 'active', 'inactive', 'blocked'));

-- Safely link older dealer profiles to dealer-role users only when:
-- 1. Their emails match.
-- 2. The dealer has exactly one matching user.
--
-- This is only a migration/backfill mechanism. Normal ownership afterward
-- must use dealers.user_id, not email matching.
with candidate_links as (
  select
    d.id as dealer_id,
    u.id as user_id,
    count(*) over (partition by d.id) as dealer_match_count
  from public.dealers d
  join public.users u
    on lower(trim(u.email)) = lower(trim(d.email))
   and u.role = 'dealer'
   and u.deleted_at is null
  where d.user_id is null
    and d.deleted_at is null
)
update public.dealers d
set user_id = c.user_id
from candidate_links c
where d.id = c.dealer_id
  and c.dealer_match_count = 1;

-- Unlinked dealer profiles must remain drafts.
update public.dealers
set status = 'draft'
where user_id is null
  and deleted_at is null
  and status <> 'draft';

alter table public.dealers
drop constraint if exists dealers_user_required_unless_draft;

alter table public.dealers
add constraint dealers_user_required_unless_draft
check (
  status = 'draft'
  or user_id is not null
);

-- A dealer user may own multiple dealer profiles. Do not enforce uniqueness
-- on dealers.user_id.
drop index if exists public.idx_dealers_one_active_profile_per_user;

-- Enforce the permanent UUID relationship:
--
-- users.id -> dealers.user_id -> quotations.dealer_id
--
-- The dealer contact email and user login email are intentionally allowed
-- to differ.
create or replace function public.enforce_dealer_user_integrity()
returns trigger
language plpgsql
as $$
declare
  linked_user record;
begin
  -- An unlinked profile is allowed only while it is a draft.
  if new.user_id is null then
    if new.status <> 'draft' then
      raise exception
        'Dealer profile must reference a dealer user unless it is draft';
    end if;

    return new;
  end if;

  select
    id,
    role,
    status,
    deleted_at
  into linked_user
  from public.users
  where id = new.user_id;

  if linked_user.id is null then
    raise exception 'Linked dealer user does not exist';
  end if;

  if linked_user.deleted_at is not null then
    raise exception 'Linked dealer user has been deleted';
  end if;

  if linked_user.role <> 'dealer' then
    raise exception
      'Dealer profile user_id must reference a dealer-role user';
  end if;

  -- Prevent an active dealer profile from being linked to an inactive user.
  -- Draft dealer profiles may still be prepared before final activation.
  if new.status = 'active'
     and linked_user.status <> 'active' then
    raise exception
      'An active dealer profile must reference an active dealer user';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_dealer_user_integrity
on public.dealers;

create trigger enforce_dealer_user_integrity
before insert or update of user_id, status
on public.dealers
for each row
execute function public.enforce_dealer_user_integrity();

commit;
