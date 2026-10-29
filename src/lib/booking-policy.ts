export const onlineProfessionalSlugs = new Set(["isaque", "neto"]);

export const whatsappServiceSlugs = new Set([
  "unhas",
  "unhas-de-gel",
  "pedicure",
  "calista",
  "depilacao",
  "design-de-sobrancelhas",
]);

export function acceptsOnlineBooking(
  professionalSlug: string,
  serviceSlug: string,
): boolean {
  return (
    onlineProfessionalSlugs.has(professionalSlug) &&
    !whatsappServiceSlugs.has(serviceSlug)
  );
}
