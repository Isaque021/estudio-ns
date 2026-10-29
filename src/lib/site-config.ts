export const siteConfig = {
  name: "Estúdio NS",
  legalName: "Estúdio NS",
  tagline: "Corte, barba e estilo feito na tesoura.",
  description:
    "Barbearia, unhas e cuidados com a beleza no Estúdio NS. Solicite horários da barbearia pelo site e combine os serviços de beleza pelo WhatsApp.",
  // Endereço real informado pelo estúdio. Sem número do imóvel,
  // complemento, bairro ou cidade: nada é inventado — só rua e CEP.
  address: {
    street: "Rua Doutor Carlos Bastos Aranha",
    zip: "02278-010",
  },
  contact: {
    // Contato geral do estúdio: Neto. Reservas usam o número do profissional.
    phone: "(11) 97558-9299",
    phoneE164: "+5511975589299",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511975589299",
    email: "",
    instagram: "",
  },
  map: {
    // A busca no mapa usa exatamente os dados reais do estúdio (rua + CEP).
    // Sem coordenadas inventadas: com rua e CEP o Google localiza o endereço.
    query: "Rua Doutor Carlos Bastos Aranha, CEP 02278-010",
    embedUrl: `https://www.google.com/maps?q=${encodeURIComponent("Rua Doutor Carlos Bastos Aranha, CEP 02278-010")}&hl=pt-BR&z=15&output=embed`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("Rua Doutor Carlos Bastos Aranha, CEP 02278-010")}`,
  },
  social: {
    instagram: "",
    facebook: "",
  },
} as const;

/** Linhas de endereço para exibir: só o que o estúdio realmente declarou. */
export const addressLines: string[] = [
  siteConfig.address.street,
  `CEP ${siteConfig.address.zip}`,
];

// Padrão do estúdio: terça a sábado, 09:00–19:00; domingo e segunda fechados.
export const businessHours: Array<{
  weekday: number;
  label: string;
  shortLabel: string;
  opensAt: string;
  closesAt: string;
  closed: boolean;
}> = [
  { weekday: 0, label: "Domingo", shortLabel: "Dom", opensAt: "", closesAt: "", closed: true },
  { weekday: 1, label: "Segunda-feira", shortLabel: "Seg", opensAt: "", closesAt: "", closed: true },
  { weekday: 2, label: "Terça-feira", shortLabel: "Ter", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 3, label: "Quarta-feira", shortLabel: "Qua", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 4, label: "Quinta-feira", shortLabel: "Qui", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 5, label: "Sexta-feira", shortLabel: "Sex", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 6, label: "Sábado", shortLabel: "Sáb", opensAt: "09:00", closesAt: "19:00", closed: false },
];

export const bookingSlotIntervalMin = 30;

export const navigation = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/precos", label: "Preços" },
  { href: "/profissionais", label: "Equipe" },
  { href: "/galeria", label: "Galeria" },
  { href: "/loja", label: "Loja" },
  { href: "/localizacao", label: "Onde estamos" },
  { href: "/horarios", label: "Horários" },
  { href: "/contato", label: "Contato" },
];
