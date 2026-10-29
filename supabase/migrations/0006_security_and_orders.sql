begin;

alter table public.admin_users
  alter column role set default 'professional';

create table if not exists public.request_limits (
  key text primary key,
  attempts integer not null,
  expires_at timestamptz not null
);

create index if not exists request_limits_expiry_idx
  on public.request_limits(expires_at);

alter table public.request_limits enable row level security;

revoke all on public.request_limits
  from public, anon, authenticated;

grant all on public.request_limits to service_role;

create or replace function public.ns_consume_request_limits(p_limits jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  used integer;
  checked_at timestamptz := clock_timestamp();
begin
  if p_limits is null
     or jsonb_typeof(p_limits) <> 'array'
     or jsonb_array_length(p_limits) not between 1 and 10 then
    raise exception 'Invalid limits';
  end if;

  delete from public.request_limits
  where expires_at <= checked_at;

  for item in
    select value
    from jsonb_array_elements(p_limits)
    order by
      (value->>'key' not like '%:global'),
      value->>'key'
  loop
    if not (item ?& array['key', 'max', 'seconds'])
       or length(item->>'key') not between 1 and 180
       or (item->>'max')::integer not between 1 and 100000
       or (item->>'seconds')::integer not between 1 and 86400 then
      raise exception 'Invalid limit';
    end if;

    insert into public.request_limits as counters (
      key, attempts, expires_at
    )
    values (
      item->>'key',
      1,
      checked_at
        + make_interval(secs => (item->>'seconds')::integer)
    )
    on conflict (key) do update set
      attempts = case
        when counters.expires_at <= checked_at then 1
        else least(counters.attempts + 1, 100001)
      end,
      expires_at = case
        when counters.expires_at <= checked_at
          then excluded.expires_at
        else counters.expires_at
      end
    returning attempts into used;

    if used > (item->>'max')::integer then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.ns_consume_request_limits(jsonb)
  from public, anon, authenticated;

grant execute on function public.ns_consume_request_limits(jsonb)
  to service_role;

create or replace function public.ns_create_order(
  p_code text,
  p_name text,
  p_phone text,
  p_address text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  client_id uuid;
  order_id uuid;
  entry record;
  product public.products%rowtype;
  total bigint := 0;
  items jsonb := '[]'::jsonb;
begin
  if length(p_name) not between 3 and 120
     or p_phone !~ '^[0-9]{10,15}$'
     or length(coalesce(p_address, '')) > 300
     or length(coalesce(p_notes, '')) > 300
     or p_code !~ '^PD-[A-Z0-9]{10,40}$' then
    raise exception 'Invalid customer';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Invalid cart';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) i
    group by i->>'productId'
    having count(*) > 1
  ) then
    raise exception 'Duplicate product';
  end if;

  for entry in
    select
      x->>'productId' as id,
      x->>'quantity' as qty
    from jsonb_array_elements(p_items) x
    order by x->>'productId'
  loop
    if entry.qty !~ '^[0-9]{1,2}$'
       or entry.qty::integer not between 1 and 99 then
      raise exception 'Invalid quantity';
    end if;

    select * into product
    from public.products
    where id = entry.id::uuid and active
    for share;

    if not found
       or product.price_cents < 0
       or product.stock < entry.qty::integer then
      raise exception 'Unavailable product';
    end if;

    total := total
      + product.price_cents::bigint * entry.qty::integer;

    if total > 2147483647 then
      raise exception 'Order total too large';
    end if;

    items := items || jsonb_build_array(
      jsonb_build_object(
        'productId', product.id,
        'productName', product.name,
        'unitPriceCents', product.price_cents,
        'quantity', entry.qty::integer
      )
    );
  end loop;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_phone, 0)
  );

  select id into client_id
  from public.clients
  where phone = p_phone
  order by created_at, id
  limit 1;

  if client_id is null then
    insert into public.clients(name, phone)
    values (p_name, p_phone)
    returning id into client_id;
  end if;

  insert into public.orders (
    code, client_id, client_name, client_phone,
    address, notes, total_cents, status, payment_method
  )
  values (
    p_code, client_id, p_name, p_phone,
    nullif(p_address, ''), nullif(p_notes, ''),
    total::integer, 'pending', 'presencial'
  )
  returning id into order_id;

  insert into public.order_items (
    order_id, product_id, product_name,
    unit_price_cents, quantity
  )
  select
    order_id,
    (x->>'productId')::uuid,
    x->>'productName',
    (x->>'unitPriceCents')::integer,
    (x->>'quantity')::integer
  from jsonb_array_elements(items) x;

  return jsonb_build_object(
    'id', order_id,
    'code', p_code,
    'totalCents', total,
    'items', items
  );
end;
$$;

revoke all on function public.ns_create_order(
  text, text, text, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.ns_create_order(
  text, text, text, text, text, jsonb
) to service_role;

alter table public.orders
  add column if not exists stock_debited boolean not null default false;

-- Evita repetir a baixa dos pedidos antigos já processados.
update public.orders
set stock_debited = true
where status in ('confirmed', 'ready', 'delivered')
  and not stock_debited;

create or replace function public.finalize_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  sale public.orders%rowtype;
  item record;
begin
  select * into sale
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if sale.stock_debited then
    return;
  end if;

  if sale.status = 'cancelled' then
    raise exception 'Cancelled order';
  end if;

  if not exists (
    select 1
    from public.order_items
    where order_id = p_order_id
  ) then
    raise exception 'Empty order';
  end if;

  for item in
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id
    group by product_id
    order by product_id
  loop
    if item.product_id is null or item.quantity <= 0 then
      raise exception 'Invalid product';
    end if;

    update public.products
    set stock = stock - item.quantity
    where id = item.product_id
      and active
      and stock >= item.quantity;

    if not found then
      raise exception 'Insufficient stock';
    end if;

    insert into public.stock_movements (
      product_id, type, quantity, note
    )
    values (
      item.product_id,
      'out',
      item.quantity,
      'Baixa automática — pedido ' || sale.code
    );
  end loop;

  update public.orders
  set stock_debited = true
  where id = p_order_id;
end;
$$;

revoke all on function public.finalize_order(uuid)
  from public, anon, authenticated;

grant execute on function public.finalize_order(uuid)
  to service_role;

create or replace function public.ns_set_order_status(
  p_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  sale public.orders%rowtype;
  item record;
begin
  select * into sale
  from public.orders
  where id = p_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if sale.status::text = p_status then
    return;
  end if;

  if not (
    (sale.status = 'pending'
      and p_status in ('confirmed', 'cancelled'))
    or
    (sale.status = 'confirmed'
      and p_status in ('ready', 'cancelled'))
    or
    (sale.status = 'ready'
      and p_status in ('delivered', 'cancelled'))
  ) then
    raise exception 'Invalid status transition';
  end if;

  if sale.status = 'pending' and p_status = 'confirmed' then
    perform public.finalize_order(p_id);
  end if;

  if p_status = 'cancelled' and sale.stock_debited then
    for item in
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_id
      group by product_id
      order by product_id
    loop
      if item.product_id is null then
        raise exception 'Product removed';
      end if;

      update public.products
      set stock = stock + item.quantity
      where id = item.product_id;

      if not found then
        raise exception 'Product removed';
      end if;

      insert into public.stock_movements (
        product_id, type, quantity, note
      )
      values (
        item.product_id,
        'in',
        item.quantity,
        'Estorno — pedido ' || sale.code
      );
    end loop;

    update public.orders
    set stock_debited = false
    where id = p_id;
  end if;

  update public.orders
  set status = p_status::public.order_status
  where id = p_id;
end;
$$;

revoke all on function public.ns_set_order_status(uuid, text)
  from public, anon, authenticated;

grant execute on function public.ns_set_order_status(uuid, text)
  to service_role;

create or replace function public.ns_adjust_stock(
  p_id uuid,
  p_type text,
  p_quantity integer,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  change integer;
begin
  if p_quantity = 0
     or abs(p_quantity::bigint) > 1000000
     or p_type not in ('in', 'out', 'adjust')
     or length(coalesce(p_note, '')) > 500 then
    raise exception 'Invalid adjustment';
  end if;

  change := case
    when p_type = 'in' then abs(p_quantity)
    when p_type = 'out' then -abs(p_quantity)
    else p_quantity
  end;

  update public.products
  set stock = stock + change
  where id = p_id
    and stock::bigint + change between 0 and 1000000;

  if not found then
    raise exception 'Invalid stock';
  end if;

  insert into public.stock_movements (
    product_id, type, quantity, note
  )
  values (
    p_id,
    p_type::public.stock_movement_type,
    abs(p_quantity),
    nullif(p_note, '')
  );
end;
$$;

revoke all on function public.ns_adjust_stock(
  uuid, text, integer, text
) from public, anon, authenticated;

grant execute on function public.ns_adjust_stock(
  uuid, text, integer, text
) to service_role;

commit;