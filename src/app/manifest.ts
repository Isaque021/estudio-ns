import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estúdio NS",
    short_name: "NS Studio",
    description:
      "Agende seu horário no Estúdio NS e compre produtos com pagamento presencial.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0e",
    theme_color: "#d9cfc4",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
