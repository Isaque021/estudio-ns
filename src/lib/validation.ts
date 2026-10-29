import { z } from "zod";

export const recordId = z.string().uuid("Identificador inválido.");

export const money = z.number().int().min(0).max(100_000_000);

export const quantity = z.number().int().min(0).max(1_000_000);

export const phoneNumber = z
  .string()
  .trim()
  .max(30)
  .refine((value) => {
    if (!/^[+\d\s().-]+$/.test(value)) return false;

    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }, "Informe um telefone válido com DDD.");

export const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Data inválida.");

export const productInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000),
  priceCents: money,
  compareAtCents: money.nullable(),
  sku: z.string().trim().max(100),
  category: z.string().trim().max(100),
  active: z.boolean(),
});

export const serviceInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000),
  priceCents: money.nullable(),
  durationMin: z.number().int().min(1).max(1440).nullable(),
  category: z.string().trim().max(100),
  active: z.boolean(),
});

export const professionalInput = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().max(120),
  bio: z.string().trim().max(5000),
  specialties: z.array(
    z.string().trim().min(1).max(120),
  ).max(100),
  active: z.boolean(),
});

export const cartInput = z
  .array(
    z.object({
      productId: recordId,
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .min(1)
  .max(50)
  .refine(
    (items) =>
      new Set(items.map((item) => item.productId)).size ===
      items.length,
    "O carrinho contém produtos repetidos. Recarregue a página.",
  );
