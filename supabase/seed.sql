-- =============================================================================
--  Estúdio NS — dados iniciais (espelho do ambiente em produção)
-- =============================================================================
--  Execute DEPOIS de, nesta ordem:
--    1) supabase/schema.sql
--    2) supabase/migrations/0002_schedule_and_holds.sql
--    3) supabase/migrations/0003_services_nullable_values.sql
--  Idempotente: pode ser reexecutado (upserts por slug; nada é duplicado).
--
--  IMPORTANTE: o catálogo abaixo ESPELHA o estado real do projeto Supabase
--  em produção, verificado por LEITURA (REST anon, sem escrita) em 27/10/2026.
--  Nada é inventado: descrições vazias, imagem nula, valores nulos onde a
--  tabela oficial do estúdio ainda não confirmou preço/duração.
-- =============================================================================

-- -----------------------------------------------------------------------------
--  Equipe real (fotos/bio/cargo chegam depois; iniciais no site).
--  Telefones E164 (wa.me) vindos do cadastro do estúdio.
-- -----------------------------------------------------------------------------
insert into public.professionals (id, name, slug, role, bio, photo_url, phone, specialties, active, position) values
  ('b1000000-0000-4000-8000-000000000001', 'Neto', 'neto', '', '', null, '5511975589299',
    array[
      'Máquina e tesoura',
      'Degradê navalhado',
      'Maquininha simples — 1 e 2',
      'Barba',
      'Corte + Barba',
      'Nevou',
      'Hidratação masculina',
      'Pezinho',
      'Sobrancelha',
      'Corte de cabelo cacheado feminino',
      'Alisamento'
    ]::text[],
    true, 1),
  ('b1000000-0000-4000-8000-000000000002', 'Isaque', 'isaque', '', '', null, '5521983700520',
    array[
      'Máquina e tesoura',
      'Degradê navalhado',
      'Maquininha simples — 1 e 2',
      'Barba',
      'Corte + Barba',
      'Nevou',
      'Hidratação masculina',
      'Pezinho',
      'Sobrancelha',
      'Alisamento'
    ]::text[],
    true, 2),
  ('b1000000-0000-4000-8000-000000000003', 'Isabelle', 'isabelle', '', '', null, '5511933186719',
    array['Unhas', 'Unhas de gel']::text[],
    true, 3),
  ('b1000000-0000-4000-8000-000000000004', 'Raquel', 'raquel', '', '', null, '5511989891969',
    array['Pedicure', 'Calista', 'Depilação', 'Design de sobrancelhas']::text[],
    true, 4)
on conflict (slug) do update set
  name = excluded.name,
  role = excluded.role,
  bio = excluded.bio,
  photo_url = excluded.photo_url,
  phone = excluded.phone,
  specialties = excluded.specialties,
  active = excluded.active,
  position = excluded.position;

-- -----------------------------------------------------------------------------
--  Catálogo (17 serviços, todos ativos). PREÇOS/DURAÇÕES SÓ OS CONFIRMADOS —
--  velho "null" quando a tabela oficial ainda não confirmou; nada é chutado.
--
--  Dois cadastros DISTINTOS de sobrancelha, por decisão do estúdio:
--    · sobrancelha            → execução na BARBEARIA (Isaque ou Neto);
--    · design-de-sobrancelhas → execução da RAQUEL na área Unhas & Beleza
--      (ainda sem tabela oficial de valores).
--
--  Valores confirmados atualmente em produção:
--    – Sobrancelha: R$ 20 · 15 min (em produção; o ajuste para R$ 15
--      aprovado na conversa AINDA NÃO foi aplicado lá — confirmar antes
--      de alterar o cadastro real).
--    – NevoU (platinado): R$ 200 · 4 h (nome/nevo como saiu no cadastro).
-- -----------------------------------------------------------------------------
insert into public.services (id, name, slug, description, price_cents, duration_min, category, image_url, active, position) values
  ('c1000000-0000-4000-8000-000000000001', 'Máquina e tesoura', 'corte-masculino', '', 5500, 40, 'Corte', null, true, 1),
  ('c1000000-0000-4000-8000-000000000002', 'Degradê navalhado', 'degrade-navalhado', '', 6000, 50, 'Corte', null, true, 2),
  ('c1000000-0000-4000-8000-000000000003', 'Maquininha simples — 1 e 2', 'so-maquininha', '', 4000, 30, 'Corte', null, true, 3),
  ('c1000000-0000-4000-8000-000000000004', 'Barba', 'barba-completa', '', 4000, 25, 'Barba', null, true, 4),
  ('c1000000-0000-4000-8000-000000000005', 'Corte + Barba', 'corte-e-barba', '', 7500, 50, 'Combo', null, true, 5),
  ('c1000000-0000-4000-8000-000000000006', 'Nevou', 'platinado', '', 20000, 240, 'Coloração', null, true, 6),
  ('c1000000-0000-4000-8000-000000000007', 'Hidratação masculina', 'hidratacao-capilar', '', 6000, 60, 'Cuidados', null, true, 7),
  ('c1000000-0000-4000-8000-000000000008', 'Pezinho', 'pezinho', '', 2000, 15, 'Cuidados', null, true, 8),
  ('c1000000-0000-4000-8000-000000000009', 'Sobrancelha', 'sobrancelha', '', 2000, 15, 'Cuidados', null, true, 9),
  ('c1000000-0000-4000-8000-000000000010', 'Corte de cabelo cacheado feminino', 'corte-cacheado-feminino', '', null, null, 'Cachos', null, true, 10),
  ('c1000000-0000-4000-8000-000000000011', 'Alisamento', 'alisamento', '', null, null, 'Coloração', null, true, 11),
  ('c1000000-0000-4000-8000-000000000012', 'Unhas', 'unhas', '', null, null, 'Unhas', null, true, 12),
  ('c1000000-0000-4000-8000-000000000013', 'Unhas de gel', 'unhas-de-gel', '', null, null, 'Unhas', null, true, 13),
  ('c1000000-0000-4000-8000-000000000014', 'Pedicure', 'pedicure', '', null, null, 'Beleza', null, true, 14),
  ('c1000000-0000-4000-8000-000000000015', 'Calista', 'calista', '', null, null, 'Beleza', null, true, 15),
  ('c1000000-0000-4000-8000-000000000016', 'Depilação', 'depilacao', '', null, null, 'Beleza', null, true, 16),
  -- Serviço DISTINTO do "Sobrancelha" da barbearia: é o item da Raquel na
  -- área Unhas & Beleza. Valor/duração ainda sem tabela oficial (null).
  ('c1000000-0000-4000-8000-000000000017', 'Design de sobrancelhas', 'design-de-sobrancelhas', '', null, null, 'Beleza', null, true, 17)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  duration_min = excluded.duration_min,
  category = excluded.category,
  image_url = excluded.image_url,
  active = excluded.active,
  position = excluded.position;

-- -----------------------------------------------------------------------------
--  Expediente padrão: terça a sábado, 09:00–19:00; dom/seg fechados
--  (idempotente; já semeado em schema.sql e 0002 — repetido aqui para o
--  seed funcionar standalone em banco fresco; espelha o estado em produção).
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

-- Prazo de guarda padrão: 30 minutos (0002 já semeia; reforço idempotente).
insert into public.booking_settings (hold_minutes)
select 30
where not exists (select 1 from public.booking_settings);
