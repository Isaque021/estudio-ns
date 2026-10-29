-- Valores em centavos; duracoes em minutos.
BEGIN;

insert into public.services
  (name, slug, price_cents, duration_min, category, position, active)
values
  ('Máquina e tesoura', 'corte-masculino', 5500, 40, 'Corte', 1, true),
  ('Degradê navalhado', 'degrade-navalhado', 6000, 50, 'Corte', 2, true),
  ('Maquininha simples — 1 e 2', 'so-maquininha', 4000, 30, 'Corte', 3, true),
  ('Barba', 'barba-completa', 4000, 25, 'Barba', 4, true),
  ('Corte + Barba', 'corte-e-barba', 7500, 50, 'Combo', 5, true),
  ('Nevou', 'platinado', 20000, 240, 'Coloração', 6, true),
  ('Hidratação masculina', 'hidratacao-capilar', 6000, 60, 'Cuidados', 7, true),
  ('Pezinho', 'pezinho', 2000, 15, 'Cuidados', 8, true),
  ('Sobrancelha', 'sobrancelha', 2000, 15, 'Cuidados', 9, true),
  ('Corte de cabelo cacheado feminino', 'corte-cacheado-feminino', null, null, 'Cachos', 10, true),
  ('Alisamento', 'alisamento', null, null, 'Coloração', 11, true),
  ('Unhas', 'unhas', null, null, 'Unhas', 12, true),
  ('Unhas de gel', 'unhas-de-gel', null, null, 'Unhas', 13, true),
  ('Pedicure', 'pedicure', null, null, 'Beleza', 14, true),
  ('Calista', 'calista', null, null, 'Beleza', 15, true),
  ('Depilação', 'depilacao', null, null, 'Beleza', 16, true),
  ('Design de sobrancelhas', 'design-de-sobrancelhas', null, null, 'Beleza', 17, true)
on conflict (slug) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  duration_min = excluded.duration_min,
  category = excluded.category,
  position = excluded.position,
  active = excluded.active;

update public.professionals p
set specialties = array(
  select s.name
  from public.services s
  where s.slug in (
    'corte-masculino', 'degrade-navalhado', 'so-maquininha',
    'barba-completa', 'corte-e-barba', 'platinado',
    'hidratacao-capilar', 'pezinho', 'sobrancelha', 'alisamento'
  )
  or (s.slug = 'corte-cacheado-feminino' and p.slug = 'neto')
  order by s.position
)
where p.slug in ('isaque', 'neto');

update public.professionals
set specialties = array['Unhas', 'Unhas de gel']
where slug = 'isabelle';

update public.professionals
set specialties = array[
  'Pedicure', 'Calista', 'Depilação', 'Design de sobrancelhas'
]
where slug = 'raquel';

COMMIT;