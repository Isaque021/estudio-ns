import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barbearia Navalha",
    short_name: "Navalha",
    description:
      "Agende seu horário na Barbearia Navalha e compre produtos de barbearia com pagamento presencial.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0e",
    theme_color: "#c08a32",
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
