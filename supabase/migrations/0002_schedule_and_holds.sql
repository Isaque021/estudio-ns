-- ============================================================================
--  0002_schedule_and_holds.sql (Estúdio NS)
--  Agenda individual, exceções, prazo de guarda das solicitações,
--  idempotência de reenvio e BLOQUEIO DE SOBREPOSIÇÃO GARANTIDO NO BANCO.
--  Não destrutivo: só cria/ajusta objetos; dados existentes são preservados.
--  Requer: supabase/schema.sql aplicado antes.
-- ============================================================================

/* --------------------------------------------------------------------------
   Colunas novas em bookings
   -------------------------------------------------------------------------- */
alter table public.bookings
  add column if not exists duration_minutes integer,
  add column if not exists idempotency_key text;

-- Envio repetido do mesmo formulário não cria reserva nova.
create unique index if not exists bookings_idempotency_key_unique
  on public.bookings (idempotency_key)
  where idempotency_key is not null;

-- Reservas antigas herdam a duração do serviço (que não muda o que já
-- foi combinado: hoje elas já foram gravadas com histórico próprio).
update public.bookings
set duration_minutes = coalesce(
  duration_minutes,
  (select s.duration_min from public.services s where s.id = bookings.service_id)
)
where duration_minutes is null;

/* --------------------------------------------------------------------------
   Vínculo usuário do painel → profissional (escopo de agenda).
   Preencher manualmente no cadastro de equipe.
   -------------------------------------------------------------------------- */
alter table public.admin_users
  add column if not exists professional_id uuid
  references public.professionals (id) on delete set null;

/* --------------------------------------------------------------------------
   Aperto de RLS para dados pessoais (a leitura interna do painel agora é
   com o cliente do usuário — com sessão —, então o banco também filtra):
   - reservas: administrador em todas; profissional apenas as PRÓPRIAS;
   - clientes/pedidos/itens/estoque: somente administrador.
   -------------------------------------------------------------------------- */
do $$
declare
  tbl text;
begin
  drop policy if exists "staff read bookings" on public.bookings;
  create policy "staff read bookings"
    on public.bookings for select to authenticated
    using (
      public.is_admin_user()
      or exists (
        select 1 from public.admin_users au
        where au.id = auth.uid()
          and au.professional_id = bookings.professional_id
      )
    );

  foreach tbl in array array['clients', 'orders', 'order_items', 'stock_movements'] loop
    execute format('drop policy if exists "staff read %1$s" on public.%1$I', tbl);
    execute format(
      'create policy "admin read %1$s" on public.%1$I
         for select to authenticated
         using (public.is_admin_user())', tbl);
  end loop;
end $$;

/* --------------------------------------------------------------------------
   Expediente individual e exceções por profissional
   -------------------------------------------------------------------------- */
create table if not exists public.professional_hours (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (professional_id, weekday)
);

create table if not exists public.professional_exceptions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  scheduled_date date not null,
  kind text not null check (kind in ('open-late','close-early','extra-window','block-range','day-off')),
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  unique (professional_id, scheduled_date, kind, start_time)
);

create table if not exists public.booking_settings (
  id uuid primary key default gen_random_uuid(),
  hold_minutes integer not null default 30 check (hold_minutes between 1 and 1440),
  updated_at timestamptz not null default now()
);

-- Padrão do estúdio: guarda de 30 minutos (idempotente).
insert into public.booking_settings (hold_minutes)
select 30
where not exists (select 1 from public.booking_settings);

/* --------------------------------------------------------------------------
   RLS dessas tabelas.
   Leitura pública: o wizard precisa do expediente/exceções/prazo para
   calcular horários (dados sem dados pessoais). Escrita: administradores
   em qualquer registro; profissionais apenas no PRÓPRIO expediente e
   PRÓPRIAS exceções — nada de "qualquer autenticado".
   -------------------------------------------------------------------------- */
alter table public.professional_hours enable row level security;
alter table public.professional_exceptions enable row level security;
alter table public.booking_settings enable row level security;

do $$
begin
  -- Leitura (pública, sem dados pessoais) ------------------------------------
  drop policy if exists "agenda_leitura_publica" on public.professional_hours;
  create policy "agenda_leitura_publica"
    on public.professional_hours for select using (true);

  drop policy if exists "agenda_excecoes_leitura_publica" on public.professional_exceptions;
  create policy "agenda_excecoes_leitura_publica"
    on public.professional_exceptions for select using (true);

  drop policy if exists "agenda_config_leitura_publica" on public.booking_settings;
  create policy "agenda_config_leitura_publica"
    on public.booking_settings for select using (true);

  -- Escrita: admin em tudo ----------------------------------------------------
  drop policy if exists "agenda_config_escrita_admin" on public.booking_settings;
  create policy "agenda_config_escrita_admin"
    on public.booking_settings for all to authenticated
    using (public.is_admin_user())
    with check (public.is_admin_user());

  -- Escrita: admin em tudo; profissional só no PRÓPRIO expediente -------------
  drop policy if exists "agenda_escrita_admin_ou_propria" on public.professional_hours;
  create policy "agenda_escrita_admin_ou_propria"
    on public.professional_hours for all to authenticated
    using (
      public.is_admin_user()
      or exists (
        select 1 from public.admin_users au
        where au.id = auth.uid()
          and au.professional_id = professional_hours.professional_id
      )
    )
    with check (
      public.is_admin_user()
      or exists (
        select 1 from public.admin_users au
        where au.id = auth.uid()
          and au.professional_id = professional_hours.professional_id
      )
    );

  -- Escrita: admin em tudo; profissional só em EXCEÇÕES do próprio dia --------
  drop policy if exists "agenda_excecoes_escrita_admin_ou_propria" on public.professional_exceptions;
  create policy "agenda_excecoes_escrita_admin_ou_propria"
    on public.professional_exceptions for all to authenticated
    using (
      public.is_admin_user()
      or exists (
        select 1 from public.admin_users au
        where au.id = auth.uid()
          and au.professional_id = professional_exceptions.professional_id
      )
    )
    with check (
      public.is_admin_user()
      or exists (
        select 1 from public.admin_users au
        where au.id = auth.uid()
          and au.professional_id = professional_exceptions.professional_id
      )
    );
end $$;

/* --------------------------------------------------------------------------
   Expediente padrão do estúdio (upsert, idempotente):
   terça a sábado 09:00–19:00; domingo e segunda fechados.
   A tabela business_hours NÃO tem coluna "label" — rotulos vivem na app.
   -------------------------------------------------------------------------- */
insert into public.business_hours (weekday, opens_at, closes_at, closed)
values
  (0, null, null, true),
  (1, null, null, true),
  (2, '09:00', '19:00', false),
  (3, '09:00', '19:00', false),
  (4, '09:00', '19:00', false),
  (5, '09:00', '19:00', false),
  (6, '09:00', '19:00', false)
on conflict (weekday) do update
  set opens_at = excluded.opens_at,
      closes_at = excluded.closes_at,
      closed = excluded.closed;

/* --------------------------------------------------------------------------
   BLOQUEIO DE SOBREPOSIÇÃO GARANTIDO PELO BANCO
   -------------------------------------------------------------------------- */
create extension if not exists btree_gist;

-- Faixa de tempo do atendimento (início inclusivo, fim exclusivo, sem
-- fuso: agenda é calculada no horário do estúdio). Gerada a partir da
-- data, hora e duração gravadas.
alter table public.bookings
  add column if not exists slot_range tsrange
  generated always as (
    tsrange(
      scheduled_date::timestamp + scheduled_time,
      scheduled_date::timestamp + scheduled_time
        + coalesce(make_interval(mins => duration_minutes), interval '1 minute'),
      '[)'
    )
  ) stored;

-- Barreira dura do banco: CONFIRMADAS do mesmo profissional nunca se
-- sobrepõem. Pendências são tratadas pelo gatilho abaixo (uma pendência
-- EXPIRADA não pode bloquear ninguém — essa regla usa now(), que não é
-- permitido dentro de constraint).
alter table public.bookings drop constraint if exists bookings_slots_no_overlap;
alter table public.bookings
  add constraint bookings_slots_no_overlap
  exclude using gist (
    professional_id with =,
    slot_range with &&
  ) where (status = 'confirmed');

/* --------------------------------------------------------------------------
   Gatilho de conflito com prazo de guarda.
   - Pendência DENTRO do prazo (created_at >= now() - hold) bloqueia.
   - Pendência EXPIRADA NÃO bloqueia: pode até ser confirmada depois se o
     horário continuar livre (fluxo do painel /gerenciar).
   - Confirmadas sempre bloqueiam (sozinha a constraint já bastaria; aqui
     a checagem cobre a combinação pending/confirmed em qualquer ordem).
   - pg_advisory_xact_lock serializa reservas SIMULTÂNEAS do mesmo
     profissional: a segunda transação espera a primeira terminar e re-
     checa com os dados reais — não existe janela entre checar e gravar.
   -------------------------------------------------------------------------- */
create or replace function public.bookings_no_interval_conflict()
returns trigger
language plpgsql
as $$
declare
  hold_minutes integer;
  conflicts integer;
  new_slot tsrange;
begin
  -- Canceladas/concluídas/não comparecidas não ocupam agenda (permite,
  -- por exemplo, recusar e liberar o horário).
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  -- Reserva NOVA (insert) sem duração: recusa — o servidor já impede,
  -- o banco fecha a porta. Atualizações de legado (sem duração) usam a
  -- estimativa de 30 min só para o cálculo, para travar o painel no
  -- manejo de reservas antigas.
  if tg_op = 'INSERT' and new.duration_minutes is null then
    raise exception 'Reserva sem duração cadastrada não pode ocupar agenda'
      using errcode = 'check_violation';
  end if;

  -- Serializa reservas do mesmo profissional durante a transação.
  perform pg_advisory_xact_lock(
    hashtextextended(coalesce(new.professional_id::text, 'sem-profissional'), 0)
  );

  select bs.hold_minutes into hold_minutes
  from public.booking_settings bs
  limit 1;
  if hold_minutes is null or hold_minutes < 1 then
    hold_minutes := 30;
  end if;

  new_slot := tsrange(
    new.scheduled_date::timestamp + new.scheduled_time,
    new.scheduled_date::timestamp + new.scheduled_time
      + make_interval(mins => coalesce(new.duration_minutes, 30)),
    '[)'
  );

  select count(*) into conflicts
  from public.bookings b
  where b.professional_id is not distinct from new.professional_id
    and b.scheduled_date = new.scheduled_date
    and b.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and b.status in ('pending', 'confirmed')
    and (
      b.status = 'confirmed'
      -- pendência só bloqueia DENTRO do prazo de guarda; expirada libera.
      or b.created_at >= now() - make_interval(mins => hold_minutes)
    )
    and tsrange(
          b.scheduled_date::timestamp + b.scheduled_time,
          b.scheduled_date::timestamp + b.scheduled_time
            + make_interval(mins => coalesce(b.duration_minutes, 30)),
          '[)'
        ) && new_slot;

  if conflicts > 0 then
    raise exception 'Horário em conflito — já existe reserva ativa nesse intervalo'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bookings_no_interval_conflict on public.bookings;
create trigger trg_bookings_no_interval_conflict
  before insert or update of professional_id, scheduled_date, scheduled_time,
         status, duration_minutes
  on public.bookings
  for each row execute function public.bookings_no_interval_conflict();

-- Execução da função fica restrita (só dispara via trigger).
revoke execute on function public.bookings_no_interval_conflict() from public, anon, authenticated;
