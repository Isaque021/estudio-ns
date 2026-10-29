/**
 * Slugs antigos de serviços renomeados do catálogo.
 *
 * Os IDs dos serviços (svc-*) e o histórico de reservas não mudam; só o
 * endereço público do degradê e do platinado foi enxergado. Quem abre um
 * link antigo cai na página nova, sem erro 404.
 */
const legacyServiceSlugs: Record<string, string> = {
  "degrade-military-cut": "degrade-navalhado",
  "platinado-coloracao": "platinado",
};

/** Devolve o slug atual do serviço quando o link é antigo. */
export function resolveServiceSlug(slug: string | undefined): string | undefined {
  if (!slug) return slug;
  return legacyServiceSlugs[slug] ?? slug;
}
