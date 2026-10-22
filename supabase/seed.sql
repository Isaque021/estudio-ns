-- =============================================================================
--  Barbearia Navalha — dados iniciais (opcional)
--  Execute DEPOIS de `supabase/schema.sql` no SQL Editor do Supabase.
-- =============================================================================

insert into public.services (id, name, slug, description, price_cents, duration_min, category, image_url, active, position) values
  ('11111111-1111-4111-8111-111111111101', 'Corte masculino', 'corte-masculino', 'Corte clássico ou social, executado com tesoura e máquina, finalizado com styling.', 4500, 30, 'Corte', '/images/service-01.svg', true, 1),
  ('11111111-1111-4111-8111-111111111102', 'Barba completa', 'barba-completa', 'Barba com toalha quente, óleo, navalha e finalização com balm ou pomada.', 4000, 30, 'Barba', '/images/service-02.svg', true, 2),
  ('11111111-1111-4111-8111-111111111103', 'Corte + Barba', 'corte-e-barba', 'O combo mais pedido: corte impecável e barba alinhada, com chá de cortesia.', 7000, 50, 'Combo', '/images/service-03.svg', true, 3),
  ('11111111-1111-4111-8111-111111111104', 'Degradê / Military cut', 'degrade-military-cut', 'Degradê milimetrado na máquina e acabamento preciso nas laterais com navalha.', 5500, 40, 'Corte', '/images/service-04.svg', true, 4),
  ('11111111-1111-4111-8111-111111111105', 'Platinado / Coloração', 'platinado-coloracao', 'Descoloração global ou parcial com matização e tratamento nutritivo.', 12000, 90, 'Coloração', '/images/service-05.svg', true, 5),
  ('11111111-1111-4111-8111-111111111106', 'Barba designer', 'barba-designer', 'Contorno em letra e navalha, alinhamento de linha e acabamento premium.', 6000, 40, 'Barba', '/images/service-06.svg', true, 6),
  ('11111111-1111-4111-8111-111111111107', 'Sobrancelha', 'sobrancelha', 'Design e alinhamento de sobrancelhas com pinça e linha.', 2000, 15, 'Cuidados', '/images/service-07.svg', true, 7),
  ('11111111-1111-4111-8111-111111111108', 'Hidratação capilar', 'hidratacao-capilar', 'Hidratação profunda com máscara térmica para cabelo saudável.', 8000, 60, 'Cuidados', '/images/service-08.svg', true, 8),
  ('11111111-1111-4111-8111-111111111109', 'Corte infantil', 'corte-infantil', 'Corte para crianças até 10 anos, com paciência e lanche incluso.', 3500, 25, 'Infantil', '/images/service-09.svg', true, 9),
  ('11111111-1111-4111-8111-111111111110', 'Pezinho / Franear', 'pezinho-franear', 'Acabamento de nuca, contorno de orelha e pelos isolados.', 1500, 10, 'Combo', '/images/service-10.svg', true, 10)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  duration_min = excluded.duration_min,
  category = excluded.category,
  image_url = excluded.image_url,
  active = excluded.active,
  position = excluded.position;

insert into public.professionals (id, name, slug, role, bio, photo_url, phone, specialties, active, position) values
  ('22222222-2222-4222-8222-222222222201', 'Rafael Mota', 'rafael-mota', 'Barbeiro sênior · Fundador', 'Mais de 12 anos de cadeira. Especialista em cortes tradicionais, degradê milimetrado e navalha em linha.', '/images/pro-01.svg', '5511999990001', array['Corte masculino','Degradê / Military cut','Corte + Barba','Barba designer'], true, 1),
  ('22222222-2222-4222-8222-222222222202', 'Gustavo Lins', 'gustavo-lins', 'Barbeiro · Colorista', 'Referência em coloração e platinado. Trabalha com técnicas de descoloração segura e matização precisa.', '/images/pro-02.svg', '5511999990002', array['Platinado / Coloração','Corte + Barba','Corte masculino'], true, 2),
  ('22222222-2222-4222-8222-222222222203', 'Diego Santana', 'diego-santana', 'Barbeiro · Barba specialist', 'Referência nacional em barboterapia e navalha. Conhece cada contorno do rosto.', '/images/pro-03.svg', '5511999990003', array['Barba completa','Barba designer','Sobrancelha','Pezinho / Franear'], true, 3),
  ('22222222-2222-4222-8222-222222222204', 'Matheus Ribeiro', 'matheus-ribeiro', 'Barbeiro · Estilista', 'Cortes modernos, texturizados e estilos autorais. Atende a galera jovem e quem busca um estilo autoral.', '/images/pro-04.svg', '5511999990004', array['Corte masculino','Degradê / Military cut','Hidratação capilar'], true, 4),
  ('22222222-2222-4222-8222-222222222205', 'Caio Ferreira', 'caio-ferreira', 'Barbeiro · Assistente', 'Em fase de formação avançada na casa, já atende cortes infantis e degradê com muita firmeza.', '/images/pro-05.svg', '5511999990005', array['Corte infantil','Corte masculino','Pezinho / Franear'], true, 5)
on conflict (slug) do update set
  name = excluded.name,
  role = excluded.role,
  bio = excluded.bio,
  photo_url = excluded.photo_url,
  phone = excluded.phone,
  specialties = excluded.specialties,
  active = excluded.active,
  position = excluded.position;

insert into public.gallery (id, title, image_url, category, position) values
  ('33333333-3333-4333-8333-333333333301', 'Degradê milimetrado', '/images/gallery-01.svg', 'Cortes', 1),
  ('33333333-3333-4333-8333-333333333302', 'Barba com navalha', '/images/gallery-02.svg', 'Barbas', 2),
  ('33333333-3333-4333-8333-333333333303', 'Platinado completo', '/images/gallery-03.svg', 'Coloração', 3),
  ('33333333-3333-4333-8333-333333333304', 'Corte social', '/images/gallery-04.svg', 'Cortes', 4),
  ('33333333-3333-4333-8333-333333333305', 'Detalhe na nuca', '/images/gallery-05.svg', 'Detalhes', 5),
  ('33333333-3333-4333-8333-333333333306', 'Barba designer', '/images/gallery-06.svg', 'Barbas', 6),
  ('33333333-3333-4333-8333-333333333307', 'Corte infantil', '/images/gallery-07.svg', 'Cortes', 7),
  ('33333333-3333-4333-8333-333333333308', 'Acabamento premium', '/images/gallery-08.svg', 'Detalhes', 8)
on conflict do nothing;

insert into public.products (id, name, slug, description, price_cents, compare_at_cents, stock, sku, category, image_url, active) values
  ('44444444-4444-4444-8444-444444444401', 'Pomada Modeladora Navalha', 'pomada-modeladora-navalha', 'Fixação forte e brilho discreto. Ideal para social, pompadour e degradê com volume.', 4900, 6500, 24, 'PNV-POM-120', 'Finalização', '/images/product-01.svg', true),
  ('44444444-4444-4444-8444-444444444402', 'Gel Fixativo 120g', 'gel-fixativo-120g', 'Fixação média, secagem rápida e zero respingos.', 3200, null, 41, 'PNV-GEL-120', 'Finalização', '/images/product-02.svg', true),
  ('44444444-4444-4444-8444-444444444403', 'Balm de Barba Manteiga de Karité', 'balm-de-barba-manteiga-de-karite', 'Hidratação profunda para barbas longas, com brilho natural e fragrância amadeirada.', 5900, 6900, 18, 'PNV-BLM-060', 'Barba', '/images/product-03.svg', true),
  ('44444444-4444-4444-8444-444444444404', 'Óleo de Barba Premium', 'oleo-de-barba-premium', 'Óleo de argan com conta-gotas. Nutre, amacia e perfuma levemente.', 4500, null, 0, 'PNV-OLE-030', 'Barba', '/images/product-04.svg', true),
  ('44444444-4444-4444-8444-444444444405', 'Shampoo Barbearia — 500ml', 'shampoo-barbearia-500ml', 'Limpeza diária para cabelo e barba, sem ressecar a pele. Frango com cidra.', 3900, 4900, 33, 'PNV-SHA-500', 'Cuidados', '/images/product-05.svg', true),
  ('44444444-4444-4444-8444-444444444406', 'Condicionador Hidratante', 'condicionador-hidratante', 'Condicionador de uso diário com repair de biotina e arginina.', 3900, null, 27, 'PNV-CON-500', 'Cuidados', '/images/product-06.svg', true),
  ('44444444-4444-4444-8444-444444444407', 'Creme de Barbear', 'creme-de-barbear', 'Creme de barbear sem sabão, com suavidade para navegar sem irritação.', 4200, null, 12, 'PNV-CRB-150', 'Barba', '/images/product-07.svg', true),
  ('44444444-4444-4444-8444-444444444408', 'Kit Navalha Completo', 'kit-navalha-completo', 'Pincéis, tesoura, navalha descartável, cape e apurador. O essencial do barbeiro.', 18900, 22900, 6, 'PNV-KIT-001', 'Kits', '/images/product-08.svg', true),
  ('44444444-4444-4444-8444-444444444409', 'Toalha de Barbear Personalizada', 'toalha-de-barbear-personalizada', 'Algodão felpudo com bordas em cetim e monograma bordado.', 7900, null, 15, 'PNV-TLH-001', 'Acessórios', '/images/product-09.svg', true),
  ('44444444-4444-4444-8444-444444444410', 'Prancha de Cabelo em Titânio', 'prancha-de-cabelo-em-titanio', 'Aquecimento em 30s, placas em titânio e controle de temperatura digital.', 24900, 29900, 4, 'PNV-PRN-220', 'Equipamentos', '/images/product-10.svg', true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  compare_at_cents = excluded.compare_at_cents,
  stock = excluded.stock,
  sku = excluded.sku,
  category = excluded.category,
  image_url = excluded.image_url,
  active = excluded.active;

-- ---------------------------------------------------------------------------
--  Usuário administrador
-- ---------------------------------------------------------------------------
--  1. Crie o usuário em Authentication > Users (e-mail + senha).
--  2. Troque o e-mail abaixo pelo e-mail criado e rode o comando abaixo.
-- ---------------------------------------------------------------------------
-- insert into public.admin_users (id, email, name, role)
-- select id, 'admin@barbearianavalha.com.br', 'Administrador', 'admin'
-- from auth.users where email = 'admin@barbearianavalha.com.br';
