import type { MetadataRoute } from "next";

import { getProducts, getServices } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/servicos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/precos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/profissionais`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/galeria`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/loja`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/localizacao`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/horarios`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contato`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/agendar`, changeFrequency: "weekly", priority: 0.9 },
  ];

  const [services, products] = await Promise.all([getServices(), getProducts()]);

  return [
    ...staticRoutes.map((route) => ({ ...route, lastModified: now })),
    ...services.map((service) => ({
      url: `${baseUrl}/servicos/${service.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/loja/${product.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
