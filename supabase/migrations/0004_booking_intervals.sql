-- Proteção de intervalos e liberação de pedidos vencidos.
BEGIN;

create extension if not exists btree_gist;

drop trigger if exists trg_bookings_no_interval_conflict
on public.bookings;

drop index if exists public.bookings_slot_unique;

alter table public.bookings
add column if not exists slot_held boolean not null default true;

update public.bookings
set slot_held = false
where status = 'pending'
  and created_at + make_interval(
    mins => coalesce(
      (select hold_minutes from public.booking_settings limit 1),
      30
    )
  ) <= now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'ns_booking_duration'
  ) then
    alter table public.bookings
    add constraint ns_booking_duration
    check (
      status not in ('pending', 'confirmed')
      or (
        duration_minutes is not null
        and duration_minutes > 0
        and professional_id is not null
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'ns_booking_end_same_day'
  ) then
    alter table public.bookings
    add constraint ns_booking_end_same_day
    check (
      extract(epoch from scheduled_time) / 60
      + coalesce(duration_minutes, 0) <= 1440
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and conname = 'ns_no_overlap'
  ) then
    alter table public.bookings
    add constraint ns_no_overlap
    exclude using gist (
      professional_id with =,
      tsrange(
        scheduled_date + scheduled_time,
        scheduled_date + scheduled_time
          + make_interval(mins => duration_minutes),
        '[)'
      ) with &&
    )
    where (
      slot_held
      and status in ('pending', 'confirmed')
    );
  end if;
end $$;

create or replace function public.ns_release_expired()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  hold integer;
begin
  select hold_minutes into hold
  from public.booking_settings
  limit 1;

  update public.bookings
  set slot_held = false
  where professional_id = new.professional_id
    and scheduled_date = new.scheduled_date
    and id <> new.id
    and status = 'pending'
    and slot_held
    and created_at
      + make_interval(mins => coalesce(hold, 30)) <= now();

  new.slot_held :=
    new.status in ('pending', 'confirmed')
    and (
      new.status = 'confirmed'
      or new.created_at
        + make_interval(mins => coalesce(hold, 30)) > now()
    );

  return new;
end;
$$;

drop trigger if exists ns_release_expired
on public.bookings;

create trigger ns_release_expired
before insert or update of
  status,
  professional_id,
  scheduled_date,
  scheduled_time,
  duration_minutes
on public.bookings
for each row
execute function public.ns_release_expired();

COMMIT;