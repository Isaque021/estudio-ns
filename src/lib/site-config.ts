export const siteConfig = {
  name: "Barbearia Navalha",
  legalName: "Barbearia Navalha LTDA",
  tagline: "Corte, barba e estilo feito na tesoura.",
  description:
    "Barbearia tradicional com atendimento clássico, professionals experientes, produtos de qualidade e agendamento online pelo WhatsApp.",
  address: {
    street: "Rua das Laranjeiras, 240",
    district: "Centro",
    city: "São Paulo",
    state: "SP",
    zip: "01010-000",
  },
  contact: {
    phone: "(11) 3456-7890",
    phoneE164: "+551134567890",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999",
    email: "contato@barbearianavalha.com.br",
    instagram: "@barbearianavalha",
  },
  map: {
    // Coordenadas aproximadas da loja (Centro de São Paulo).
    latitude: -23.5505,
    longitude: -46.6333,
    embedUrl:
      "https://www.google.com/maps?q=-23.5505,-46.6333&hl=pt-BR&z=15&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=-23.5505,-46.6333",
  },
  social: {
    instagram: "https://instagram.com/barbearianavalha",
    facebook: "https://facebook.com/barbearianavalha",
  },
} as const;

export const businessHours: Array<{
  weekday: number;
  label: string;
  shortLabel: string;
  opensAt: string;
  closesAt: string;
  closed: boolean;
}> = [
  { weekday: 0, label: "Domingo", shortLabel: "Dom", opensAt: "10:00", closesAt: "17:00", closed: false },
  { weekday: 1, label: "Segunda-feira", shortLabel: "Seg", opensAt: "09:00", closesAt: "20:00", closed: false },
  { weekday: 2, label: "Terça-feira", shortLabel: "Ter", opensAt: "09:00", closesAt: "20:00", closed: false },
  { weekday: 3, label: "Quarta-feira", shortLabel: "Qua", opensAt: "09:00", closesAt: "20:00", closed: false },
  { weekday: 4, label: "Quinta-feira", shortLabel: "Qui", opensAt: "09:00", closesAt: "21:00", closed: false },
  { weekday: 5, label: "Sexta-feira", shortLabel: "Sex", opensAt: "09:00", closesAt: "21:00", closed: false },
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
