-- =============================================================================
--  Estúdio NS — schema PostgreSQL (Supabase)
-- =============================================================================
--  Como aplicar (pará um projeto NOVO, nesta ordem):
--    1. Crie um projeto em https://supabase.com/dashboard
--    2. No "SQL Editor", execute nesta ordem:
--         a) supabase/schema.sql                      (estrutura + permissões)
--         b) supabase/migrations/0002_schedule_and_holds.sql   (agenda/holds)
--         c) supabase/migrations/0003_services_nullable_values.sql
--         d) supabase/seed.sql                        (catálogo/equipe reais)
--    3. Copie as chaves (URL / anon key / service_role) para o .env.local
--  NÃO destrutivo: todos os passos podem ser reexecutados (idempotentes).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
--  Tipos enumerados
-- -----------------------------------------------------------------------------
do $$ begin
  create type booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'confirmed', 'ready', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stock_movement_type as enum ('in', 'out', 'adjust');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
--  Catálogo
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        not null unique,
  description  text        not null default '',
  price_cents  integer     not null default 0 check (price_cents >= 0),
  duration_min integer     not null default 30 check (duration_min > 0),
  category     text        not null default 'Corte',
  image_url    text,
  active       boolean     not null default true,
  position     integer     not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.professionals (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  role        text        not null default '',
  bio         text        not null default '',
  photo_url   text,
  phone       text,
  specialties text[]      not null default '{}',
  active      boolean     not null default true,
  position    integer     not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.gallery (
  id         uuid primary key default gen_random_uuid(),
  title      text        not null,
  image_url  text        not null,
  category   text        not null default '',
  position   integer     not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  id       uuid primary key default gen_random_uuid(),
  weekday  integer not null unique check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  closed   boolean not null default false
);

-- -----------------------------------------------------------------------------
--  Clientes
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  phone      text        not null,
  email      text,
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists clients_phone_idx on public.clients (phone);

-- -----------------------------------------------------------------------------
--  Agendamentos
-- -----------------------------------------------------------------------------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  code             text           not null unique,
  client_id        uuid references public.clients (id) on delete set null,
  client_name      text           not null,
  client_phone     text           not null,
  client_email     text,
  service_id       uuid references public.services (id) on delete set null,
  service_name     text           not null,
  professional_id  uuid references public.professionals (id) on delete set null,
  professional_name text          not null,
  scheduled_date   date           not null,
  scheduled_time   time           not null,
  status           booking_status not null default 'pending',
  notes            text,
  price_cents      integer        not null default 0,
  -- Duração congelada no momento da reserva (0002 preenche/anexa regras).
  duration_minutes integer,
  -- Reenvio do mesmo formulário não cria reserva nova (0002).
  idempotency_key  text,
  confirmed_at     timestamptz,
  created_at       timestamptz    not null default now()
);

create index if not exists bookings_date_idx on public.bookings (scheduled_date);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_client_idx on public.bookings (client_id);

-- Barreira imediata contra o MESMO horário reservado duas vezes para o
-- mesmo profissional. Sobreposição de INTERVALOS (durações diferentes) é
-- garantida pelo banco no 0002: constraint de exclusão (GiST) + gatilho
-- com advisory lock e regra de expiração da pendência.
create unique index if not exists bookings_slot_unique
  on public.bookings (professional_id, scheduled_date, scheduled_time)
  where status in ('pending', 'confirmed');

-- -----------------------------------------------------------------------------
--  Produtos / estoque
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text        not null,
  slug             text        not null unique,
  description      text        not null default '',
  price_cents      integer     not null default 0 check (price_cents >= 0),
  compare_at_cents integer,
  stock            integer     not null default 0 check (stock >= 0),
  sku              text        not null unique,
  category         text        not null default '',
  image_url        text,
  active           boolean     not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  type       stock_movement_type not null,
  quantity   integer     not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_idx on public.stock_movements (product_id);

-- -----------------------------------------------------------------------------
--  Pedidos da loja
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  code            text        not null unique,
  client_id       uuid references public.clients (id) on delete set null,
  client_name     text        not null,
  client_phone    text        not null,
  address         text,
  notes           text,
  total_cents     integer     not null default 0,
  status          order_status not null default 'pending',
  payment_method  text        not null default 'presencial',
  created_at      timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  product_name     text    not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
--  Usuários do painel
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text        not null,
  name       text,
  role       text        not null default 'admin',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
--  Helpers de papel (consultam o cadastro REAL de admin_users)
-- -----------------------------------------------------------------------------
-- Funções SECURITY DEFINER STABLE: dentro de políticas de RLS elas passam
-- a ler admin_users sem depender de políticas recursivas. Execução fica
-- restrita a authenticated/service_role (revoke/grant abaixo).
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.role = 'admin'
  );
$$;

create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid()
  );
$$;

revoke execute on function public.is_admin_user() from public;
revoke execute on function public.is_staff_user() from public;
-- anon também executa: políticas públicas (catálogo ativo/checagem de
-- admin) avaliam essas funções com os privilégios do papel consultante.
grant execute on function public.is_admin_user() to anon, authenticated, service_role;
grant execute on function public.is_staff_user() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
--  Row Level Security
-- -----------------------------------------------------------------------------
alter table public.services       enable row level security;
alter table public.professionals  enable row level security;
alter table public.gallery        enable row level security;
alter table public.business_hours enable row level security;
alter table public.products       enable row level security;
alter table public.clients        enable row level security;
alter table public.bookings       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.stock_movements enable row level security;
alter table public.admin_users    enable row level security;

-- Leitura pública do catálogo -------------------------------------------------
-- Qualquer visitante (anon) lê o que é público: serviços, equipe e produtos
-- ATIVOS, galeria e expediente. Internos do painel exigem cadastro de
-- equipe real (tabela admin_users), nunca "qualquer usuário autenticado".
drop policy if exists "public read active services" on public.services;
create policy "public read active services" on public.services
  for select using (active);

drop policy if exists "public read active professionals" on public.professionals;
create policy "public read active professionals" on public.professionals
  for select using (active);

drop policy if exists "public read gallery" on public.gallery;
create policy "public read gallery" on public.gallery for select using (true);

drop policy if exists "public read business hours" on public.business_hours;
create policy "public read business hours" on public.business_hours for select using (true);

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
  for select using (active);

-- O público NÃO lê pedidos nem reservas --------------------------------------
-- (a política antiga "public read own orders" expunha TODOS os pedidos:
-- client_phone é sempre preenchido, então a condição nunca restringia nada.
-- O site inteiro escreve e lê internos por service_role; clientes não têm
-- portal de login.)

-- O público NÃO insere direto (defesa contra pedidos/reservas forjados) -----
-- Toda criação de reserva/pedido passa pelo servidor com service_role, que
-- valida habilitação profissional, expediente e conflito de agenda ANTES de
-- gravar. Deixar o anon inserir dispensava essas validações.
drop policy if exists "public create bookings" on public.bookings;
drop policy if exists "public create orders" on public.orders;

-- Painel: papéis reais (admin_users), não "qualquer autenticado" -------------
do $$
declare
  tbl text;
begin
  -- Leitura interna: qualquer cadastro de equipe (staff) lê.
  foreach tbl in array array[
    'services', 'professionals', 'gallery', 'business_hours', 'products',
    'clients', 'bookings', 'orders', 'order_items', 'stock_movements'
  ]
  loop
    execute format('drop policy if exists "admin full access" on public.%I', tbl);
    execute format(
      'drop policy if exists "staff read %1$s" on public.%1$I', tbl);
    execute format(
      'create policy "staff read %1$s" on public.%1$I
         for select to authenticated
         using (public.is_admin_user())', tbl);
  end loop;

  -- Escrita interna: somente administradores do estúdio.
  foreach tbl in array array[
    'services', 'professionals', 'gallery', 'business_hours', 'products',
    'clients', 'bookings', 'orders', 'order_items', 'stock_movements'
  ]
  loop
    execute format(
      'drop policy if exists "admin manage %1$s" on public.%1$I; create policy "admin manage %1$s" on public.%1$I
         for all to authenticated
         using (public.is_admin_user())
         with check (public.is_admin_user())', tbl);
  end loop;
end $$;

drop policy if exists "admin read own profile" on public.admin_users;
create policy "admin read own profile" on public.admin_users
  for select to authenticated using (auth.uid() = id);

-- -----------------------------------------------------------------------------
--  Helpers
-- -----------------------------------------------------------------------------

-- Finaliza um pedido: baixa o estoque e registra as movimentações.
-- SECURITY DEFINER: execução restrita a service_role (o servidor do app) —
-- anon nunca pode disparar baixa de estoque.
create or replace function public.finalize_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  for item in
    select oi.product_id, oi.product_name, oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    if item.product_id is not null then
      update public.products
         set stock = greatest(stock - item.quantity, 0)
       where id = item.product_id;

      insert into public.stock_movements (product_id, type, quantity, note)
      values (item.product_id, 'out', item.quantity, 'Baixa automática — pedido');
    end if;
  end loop;
end;
$$;

revoke execute on function public.finalize_order(uuid) from public, anon, authenticated;
grant execute on function public.finalize_order(uuid) to service_role;

-- Visão consolidada para os relatórios do painel (execução restrita).
create or replace function public.admin_revenue_summary(p_from date, p_to date)
returns table (
  revenue_cents bigint,
  bookings_total bigint,
  bookings_confirmed bigint,
  bookings_pending bigint,
  orders_total bigint,
  orders_revenue_cents bigint,
  new_clients bigint
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(price_cents) from public.bookings
       where scheduled_date between p_from and p_to
         and status in ('confirmed', 'completed')
    ), 0) as revenue_cents,
    (select count(*) from public.bookings
      where scheduled_date between p_from and p_to) as bookings_total,
    (select count(*) from public.bookings
      where scheduled_date between p_from and p_to and status = 'confirmed') as bookings_confirmed,
    (select count(*) from public.bookings
      where scheduled_date between p_from and p_to and status = 'pending') as bookings_pending,
    (select count(*) from public.orders
      where created_at::date between p_from and p_to) as orders_total,
    coalesce((
      select sum(total_cents) from public.orders
       where created_at::date between p_from and p_to
         and status <> 'cancelled'
    ), 0) as orders_revenue_cents,
    (select count(*) from public.clients
      where created_at::date between p_from and p_to) as new_clients;
$$;

-- -----------------------------------------------------------------------------
--  Semente mínima de horários (idempotente) — padrão do estúdio:
--  terça a sábado, 09:00–19:00; domingo e segunda fechados.
-- -----------------------------------------------------------------------------
insert into public.business_hours (weekday, opens_at, closes_at, closed) values
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


-- Restringir acesso aos relatorios
revoke execute on function public.admin_revenue_summary(date, date)
from public, anon, authenticated;

grant execute on function public.admin_revenue_summary(date, date)
to service_role;