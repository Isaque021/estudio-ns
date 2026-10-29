-- 0003_services_nullable_values.sql (Estúdio NS)
-- Catálogo do estúdio sem preços/durações inventadas: serviços novos
-- aprovados podem entrar no cadastro com valor e/ou duração em branco
-- enquanto a tabela oficial não os confirmar. NÃO destrutivo: dados
-- existentes não mudam.

alter table public.services
  alter column price_cents drop not null,
  alter column duration_min drop not null;

-- Serviço sem duração nunca entra na grade de horários: o servidor
-- recusa a reserva e encaminha para combinar pelo WhatsApp com o
-- profissional responsável (nada é estimado no lugar do estúdio).
