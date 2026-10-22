import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O painel e as páginas públicas leem dados do Supabase em tempo real.
  // Desativamos o Cache Components para que as leituras dinâmicas não exijam
  // fronteiras de Suspense em todas as rotas.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
