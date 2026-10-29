import type {
  Booking,
  BusinessHour,
  Client,
  GalleryItem,
  Order,
  Product,
  Professional,
  Service,
} from "@/lib/types";

/**
 * Dados de demonstração.
 *
 * O site usa o Supabase quando as variáveis `NEXT_PUBLIC_SUPABASE_URL` e
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas. Sem elas, o app roda
 * com esta base local para que seja possível navegar, agendar e simular
 * pedidos antes de conectar o banco de verdade.
 */

export const demoServices: Service[] = [
  {
    id: "svc-corte",
    name: "Máquina e tesoura",
    slug: "corte-masculino",
    description:
      "Corte clássico ou social, executado com tesoura e máquina, finalizado com styling.",
    priceCents: 5500,
    durationMin: 30,
    category: "Corte",
    imageUrl: "/images/service-01.svg",
    active: true,
    position: 1,
  },
  {
    id: "svc-barba",
    name: "Barba",
    slug: "barba-completa",
    description:
      "Barba com toalha quente, óleo, navalha e finalização com balm ou pomada.",
    priceCents: 4000,
    durationMin: 30,
    category: "Barba",
    imageUrl: "/images/service-02.svg",
    active: true,
    position: 2,
  },
  {
    id: "svc-combo",
    name: "Corte + Barba",
    slug: "corte-e-barba",
    description:
      "O combo mais pedido: corte impecável e barba alinhada, com chá de cortesia.",
    priceCents: 7500,
    durationMin: 50,
    category: "Combo",
    imageUrl: "/images/service-03.svg",
    active: true,
    position: 3,
  },
  {
    id: "svc-degrade",
    name: "Degradê navalhado",
    slug: "degrade-navalhado",
    description:
      "Degradê milimetrado na máquina e acabamento preciso nas laterais com navalha.",
    priceCents: 6000,
    durationMin: 40,
    category: "Corte",
    imageUrl: "/images/service-04.svg",
    active: true,
    position: 4,
  },
  {
    // Serviço da tabela do estúdio que ficou de fora do print anterior.
    // Tem preço (R$ 40) mas a duração ainda não existe no cadastro — nada
    // é inventado: o card mostra o valor, a consulta segue pelo WhatsApp
    // e o agendamento online volta quando a duração for cadastrada.
    id: "svc-maquininha",
    name: "Só maquininha — pentes 1 e 2 ou 2 e 3",
    slug: "so-maquininha",
    description:
      "Acabamento só na máquina, com o pente que preferir (1 e 2 ou 2 e 3) e contorno feito na hora.",
    priceCents: 4000,
    durationMin: null,
    category: "Corte",
    imageUrl: "/images/service-04.svg",
    active: true,
    position: 5,
  },
  {
    id: "svc-platinado",
    name: "Platinado",
    slug: "platinado",
    description:
      "Descoloração global ou parcial com matização e tratamento nutritivo.",
    priceCents: 12000,
    durationMin: 90,
    category: "Coloração",
    imageUrl: "/images/service-05.svg",
    active: true,
    position: 6,
  },
  {
    // Serviço aprovado do Neto sem preço/duração cadastrados: enquanto o
    // cadastro não existir, nada é inventado — o card mostra só o nome e o
    // agendamento online fica bloqueado (combinar pelo WhatsApp).
    id: "svc-cacheados",
    name: "Corte de cabelo cacheado feminino",
    slug: "corte-cacheado-feminino",
    description: "Corte para cabelos cacheados e crespos, no formato que a cliente quiser.",
    priceCents: null,
    durationMin: null,
    category: "Cachos",
    imageUrl: "/images/service-06.svg",
    active: true,
    position: 7,
  },
  {
    id: "svc-alisamento",
    name: "Alisamento",
    slug: "alisamento",
    description: "Alisamento com análise prévia do cabelo, produtos e proteção da fibra.",
    priceCents: null,
    durationMin: null,
    category: "Cachos",
    imageUrl: "/images/service-10.svg",
    active: true,
    position: 8,
  },
  {
    id: "svc-sobrancelha",
    name: "Sobrancelha",
    slug: "sobrancelha",
    description: "Design e alinhamento de sobrancelhas com pinça e linha.",
    // Ajuste aprovado (antes R$ 20). Serviço da BARBEARIA — distinto do
    // "Design de sobrancelhas" da área Unhas & Beleza (cadastro próprio
    // abaixo), que continua sem tabela oficial de valores.
    priceCents: 1500,
    durationMin: 15,
    category: "Cuidados",
    imageUrl: "/images/service-07.svg",
    active: true,
    position: 9,
  },
  {
    // Serviço DISTINCTO do "Sobrancelha" da barbearia: item da Raquel na
    // área Unhas & Beleza. Valor/duração ainda sem tabela oficial — nada
    // é inventado; o card mostra "Consulte valores" e o fluxo online
    // explica a lacuna na etapa de horário.
    id: "svc-design-sobrancelha",
    name: "Design de sobrancelhas",
    slug: "design-de-sobrancelhas",
    description: "Design de sobrancelhas com a Raquel (Unhas & Beleza).",
    priceCents: null,
    durationMin: null,
    category: "Cuidados",
    imageUrl: "/images/service-07.svg",
    active: true,
    position: 14,
  },
  {
    // Retirada da oferta pública e de novos agendamentos a pedido do
    // estúdio. Continua no cadastro (inativa) para preservar reservas
    // antigas; pode voltar quando quiserem, no painel.
    id: "svc-hidratizacao",
    name: "Hidratação capilar",
    slug: "hidratacao-capilar",
    description: "Hidratação profunda com máscara térmica para cabelo saudável.",
    priceCents: 8000,
    durationMin: 60,
    category: "Cuidados",
    imageUrl: "/images/service-08.svg",
    active: false,
    position: 10,
  },
  {
    id: "svc-crianca",
    name: "Corte infantil",
    slug: "corte-infantil",
    description: "Corte para crianças até 10 anos, com paciência e lanche incluso.",
    priceCents: 3500,
    durationMin: 25,
    category: "Infantil",
    imageUrl: "/images/service-09.svg",
    active: true,
    position: 11,
  },
  {
    id: "svc-franear",
    name: "Pezinho / Franear",
    slug: "pezinho-franear",
    description: "Acabamento de nuca, contorno de orelha e pelos isolados.",
    priceCents: 1500,
    durationMin: 10,
    category: "Combo",
    imageUrl: "/images/service-10.svg",
    active: true,
    position: 12,
  },
  {
    // Retirado da oferta e do agendamento públicos por decisão do estúdio.
    // Fica inativo (não apagado) para preservar o histórico de reservas cujo
    // service_id aponta para cá.
    id: "svc-barba-designer",
    name: "Barba designer",
    slug: "barba-designer",
    description:
      "Contorno em letra e navalha, alinhamento de linha e acabamento premium.",
    priceCents: 6000,
    durationMin: 40,
    category: "Barba",
    imageUrl: "/images/service-06.svg",
    active: false,
    position: 13,
  },
];

/**
 * Equipe real aprovada pelo estúdio. Referências antigas (Rafael, Gustavo,
 * Diego, Matheus e Caio) eram conteúdo de demonstração e não executam
 * serviços: agendamento novo não pode usá-las.
 *
 * Fotos/bio/cargo continuam vazios até a equipe fornecer (a interface
 * mostra as iniciais no lugar da foto). O WhatsApp de cada profissional
 * agora é real: as reservas abrem no chat de quem vai atender.
 */
export const demoProfessionals: Professional[] = [
  {
    id: "pro-neto",
    name: "Neto",
    slug: "neto",
    role: "",
    bio: "",
    photoUrl: "",
    // WhatsApp do Neto: todas as reservas dele abrem aqui — inclusive os
    // exclusivos (cacheados, Platinado e Alisamento). Dígitos E164 p/ wa.me.
    phone: "5511975589299",
    // Cinco serviços gerais (Máquina e tesoura, Degradê navalhado,
    // maquininha, Barba e Corte + Barba) divididos com Isaque; os
    // exclusivos dele são Platinado, Corte de cabelo cacheado feminino e
    // Alisamento. A "Sobrancelha" da barbearia também é dele (e do
    // Isaque) — produção confirma. Sem Barba designer: o serviço foi
    // retirado da oferta pública.
    specialties: [
      "Máquina e tesoura",
      "Degradê navalhado",
      "Só maquininha — pentes 1 e 2 ou 2 e 3",
      "Barba",
      "Corte + Barba",
      "Platinado",
      "Corte de cabelo cacheado feminino",
      "Alisamento",
      "Sobrancelha",
    ],
    active: true,
    position: 1,
  },
  {
    id: "pro-isaque",
    name: "Isaque",
    slug: "isaque",
    role: "",
    bio: "",
    photoUrl: "",
    // WhatsApp do Isaque para as reservas que ele executa. E164 p/ wa.me.
    phone: "5521983700520",
    // Executa os mesmos cinco serviços gerais do Neto e a "Sobrancelha"
    // da barbearia (produção confirma); os exclusivos do Neto
    // (Platinado, cacheados femininos e Alisamento) são só do Neto.
    specialties: [
      "Máquina e tesoura",
      "Degradê navalhado",
      "Só maquininha — pentes 1 e 2 ou 2 e 3",
      "Barba",
      "Corte + Barba",
      "Sobrancelha",
    ],
    active: true,
    position: 2,
  },
  {
    id: "pro-isabelle",
    name: "Isabelle",
    slug: "isabelle",
    role: "",
    bio: "",
    photoUrl: "",
    // WhatsApp da Isabelle: as reservas dela abrem aqui. E164 p/ wa.me.
    phone: "5511933186719",
    // Executa unhas e unhas de gel — serviços SEM preço/duração no
    // cadastro: aparecem como "Consulte valores" e o fluxo online
    // direta a consulta pelo WhatsApp dela (mesma regra da produção).
    specialties: ["Unhas", "Unhas de gel"],
    active: true,
    position: 3,
  },
  {
    id: "pro-raquel",
    name: "Raquel",
    slug: "raquel",
    role: "",
    bio: "",
    photoUrl: "",
    // WhatsApp da Raquel para reservas das especialidades dela. E164 p/ wa.me.
    phone: "5511989891969",
    // Ela executa "Design de sobrancelhas" (área Unhas & Beleza, sem tabela
    // oficial de valores), Pedicure, Calista e Depilação — estes três útimos
    // seguem SEM cadastro no catálogo. A "Sobrancelha" da BARBEARIA é de
    // Isaque/Neto (produção confirma) — aqui não entra.
    specialties: ["Design de sobrancelhas"],
    active: true,
    position: 4,
  },
];

export const demoGallery: GalleryItem[] = [
  { id: "gal-01", title: "Degradê milimetrado", imageUrl: "/images/gallery-01.svg", category: "Cortes", position: 1 },
  { id: "gal-02", title: "Barba com navalha", imageUrl: "/images/gallery-02.svg", category: "Barbas", position: 2 },
  { id: "gal-03", title: "Platinado completo", imageUrl: "/images/gallery-03.svg", category: "Coloração", position: 3 },
  { id: "gal-04", title: "Corte social", imageUrl: "/images/gallery-04.svg", category: "Cortes", position: 4 },
  { id: "gal-05", title: "Detalhe na nuca", imageUrl: "/images/gallery-05.svg", category: "Detalhes", position: 5 },
  { id: "gal-06", title: "Barba designer", imageUrl: "/images/gallery-06.svg", category: "Barbas", position: 6 },
  { id: "gal-07", title: "Corte infantil", imageUrl: "/images/gallery-07.svg", category: "Cortes", position: 7 },
  { id: "gal-08", title: "Acabamento premium", imageUrl: "/images/gallery-08.svg", category: "Detalhes", position: 8 },
];

// Padrão do estúdio: terça a sábado, 09:00–19:00; domingo e segunda fechados.
export const demoHours: BusinessHour[] = [
  { weekday: 0, label: "Domingo", opensAt: null, closesAt: null, closed: true },
  { weekday: 1, label: "Segunda-feira", opensAt: null, closesAt: null, closed: true },
  { weekday: 2, label: "Terça-feira", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 3, label: "Quarta-feira", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 4, label: "Quinta-feira", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 5, label: "Sexta-feira", opensAt: "09:00", closesAt: "19:00", closed: false },
  { weekday: 6, label: "Sábado", opensAt: "09:00", closesAt: "19:00", closed: false },
];

export const demoProducts: Product[] = [
  {
    id: "prd-pomada",
    name: "Pomada Modeladora Navalha",
    slug: "pomada-modeladora-navalha",
    description:
      "Fixação forte e brilho discreto. Ideal para social, pompadour e degradê com volume.",
    priceCents: 4900,
    compareAtCents: 6500,
    stock: 24,
    sku: "PNV-POM-120",
    category: "Finalização",
    imageUrl: "/images/product-01.svg",
    active: true,
  },
  {
    id: "prd-gel",
    name: "Gel Fixativo 120g",
    slug: "gel-fixativo-120g",
    description:
      "Fixação média, secagem rápida e ZERO respingos. Para quem gosta de acabamento limpo.",
    priceCents: 3200,
    compareAtCents: null,
    stock: 41,
    sku: "PNV-GEL-120",
    category: "Finalização",
    imageUrl: "/images/product-02.svg",
    active: true,
  },
  {
    id: "prd-balm",
    name: "Balm de Barba Manteiga de Karité",
    slug: "balm-de-barba-manteiga-de-karite",
    description:
      "Hidratação profunda para barbas longas, com brilho natural e fragrância amadeirada.",
    priceCents: 5900,
    compareAtCents: 6900,
    stock: 18,
    sku: "PNV-BLM-060",
    category: "Barba",
    imageUrl: "/images/product-03.svg",
    active: true,
  },
  {
    id: "prd-oleo",
    name: "Óleo de Barba Premium",
    slug: "oleo-de-barba-premium",
    description: "Óleo de argan com conta-gotas. Nutre, amacia e perfuma levemente.",
    priceCents: 4500,
    compareAtCents: null,
    stock: 0,
    sku: "PNV-OLE-030",
    category: "Barba",
    imageUrl: "/images/product-04.svg",
    active: true,
  },
  {
    id: "prd-shampoo",
    name: "Shampoo Barbearia — 500ml",
    slug: "shampoo-barbearia-500ml",
    description:
      "Limpeza quotidienne para cabelo e barba, sem ressecar a pele. Frango com cidra.",
    priceCents: 3900,
    compareAtCents: 4900,
    stock: 33,
    sku: "PNV-SHA-500",
    category: "Cuidados",
    imageUrl: "/images/product-05.svg",
    active: true,
  },
  {
    id: "prd-cond",
    name: "Condicionador Hidratante",
    slug: "condicionador-hidratante",
    description: "Condicionador de uso diário com repair de biotina e arginina.",
    priceCents: 3900,
    compareAtCents: null,
    stock: 27,
    sku: "PNV-CON-500",
    category: "Cuidados",
    imageUrl: "/images/product-06.svg",
    active: true,
  },
  {
    id: "prd-shave",
    name: "Creme de Barbear",
    slug: "creme-de-barbear",
    description:
      "Creme de barbear sem sabão, com suavidade para navegar sem irritação.",
    priceCents: 4200,
    compareAtCents: null,
    stock: 12,
    sku: "PNV-CRB-150",
    category: "Barba",
    imageUrl: "/images/product-07.svg",
    active: true,
  },
  {
    id: "prd-kit",
    name: "Kit Navalha Completo",
    slug: "kit-navalha-completo",
    description:
      "Pincéis, tesoura, navalha descartável, cape e apurador. O essencial do barbeiro.",
    priceCents: 18900,
    compareAtCents: 22900,
    stock: 6,
    sku: "PNV-KIT-001",
    category: "Kits",
    imageUrl: "/images/product-08.svg",
    active: true,
  },
  {
    id: "prd-toalha",
    name: "Toalha de Barbear Personalizada",
    slug: "toalha-de-barbear-personalizada",
    description: "Algodão felpudo com bordas em cetim e monograma bordado.",
    priceCents: 7900,
    compareAtCents: null,
    stock: 15,
    sku: "PNV-TLH-001",
    category: "Acessórios",
    imageUrl: "/images/product-09.svg",
    active: true,
  },
  {
    id: "prd-pente",
    name: "Prancha de Cabelo em Titânio",
    slug: "prancha-de-cabelo-em-titanio",
    description: "Aquecimento em 30s, placas em titânio e controle de temperatura digital.",
    priceCents: 24900,
    compareAtCents: 29900,
    stock: 4,
    sku: "PNV-PRN-220",
    category: "Equipamentos",
    imageUrl: "/images/product-10.svg",
    active: true,
  },
];

export const demoClients: Client[] = [
  {
    id: "cli-001",
    name: "Marcos Vinícius",
    phone: "5511981112233",
    email: "marcos.vinicius@email.com",
    notes: "Prefere o Rafael.",
    totalBookings: 7,
    totalSpentCents: 38500,
    lastBookingAt: "2026-10-18T14:00:00.000Z",
    createdAt: "2026-05-02T12:00:00.000Z",
  },
  {
    id: "cli-002",
    name: "Pedro Henrique",
    phone: "5511992223344",
    email: null,
    notes: null,
    totalBookings: 3,
    totalSpentCents: 15500,
    lastBookingAt: "2026-10-12T18:30:00.000Z",
    createdAt: "2026-06-14T12:00:00.000Z",
  },
  {
    id: "cli-003",
    name: "Lucas Andrade",
    phone: "5511973334455",
    email: "lucas.andrade@email.com",
    notes: "Cliente da loja, compra produtos com frequência.",
    totalBookings: 2,
    totalSpentCents: 21800,
    lastBookingAt: "2026-09-30T16:00:00.000Z",
    createdAt: "2026-07-21T12:00:00.000Z",
  },
  {
    id: "cli-004",
    name: "Felipe Rocha",
    phone: "5511964445566",
    email: null,
    notes: null,
    totalBookings: 1,
    totalSpentCents: 4500,
    lastBookingAt: "2026-10-05T13:00:00.000Z",
    createdAt: "2026-09-01T12:00:00.000Z",
  },
  {
    id: "cli-005",
    name: "Thiago Barros",
    phone: "5511955556677",
    email: null,
    notes: null,
    totalBookings: 5,
    totalSpentCents: 29400,
    lastBookingAt: "2026-10-20T19:00:00.000Z",
    createdAt: "2026-04-11T12:00:00.000Z",
  },
];

export const demoBookings: Booking[] = [
  {
    id: "bk-001",
    code: "AG-9F3K2",
    clientName: "Marcos Vinícius",
    clientPhone: "5511981112233",
    clientEmail: "marcos.vinicius@email.com",
    serviceId: "svc-combo",
    serviceName: "Corte + Barba",
    professionalId: "pro-rafael",
    professionalName: "Rafael Mota",
    date: "2026-10-24",
    time: "10:00",
    status: "confirmed",
    notes: "Degradê alto nas laterais.",
    priceCents: 7000,
    createdAt: "2026-10-20T12:00:00.000Z",
  },
  {
    id: "bk-002",
    code: "AG-7T1P9",
    clientName: "Pedro Henrique",
    clientPhone: "5511992223344",
    clientEmail: null,
    serviceId: "svc-barba",
    serviceName: "Barba completa",
    professionalId: "pro-diego",
    professionalName: "Diego Santana",
    date: "2026-10-24",
    time: "11:30",
    status: "pending",
    notes: null,
    priceCents: 4000,
    createdAt: "2026-10-21T09:30:00.000Z",
  },
  {
    id: "bk-003",
    code: "AG-3M8Q1",
    clientName: "Lucas Andrade",
    clientPhone: "5511973334455",
    clientEmail: "lucas.andrade@email.com",
    serviceId: "svc-platinado",
    serviceName: "Platinado / Coloração",
    professionalId: "pro-gustavo",
    professionalName: "Gustavo Lins",
    date: "2026-10-25",
    time: "14:00",
    status: "confirmed",
    notes: "Manter as meias luzes.",
    priceCents: 12000,
    createdAt: "2026-10-19T15:45:00.000Z",
  },
  {
    id: "bk-004",
    code: "AG-5C2W7",
    clientName: "Felipe Rocha",
    clientPhone: "5511964445566",
    clientEmail: null,
    serviceId: "svc-corte",
    serviceName: "Corte masculino",
    professionalId: "pro-matheus",
    professionalName: "Matheus Ribeiro",
    date: "2026-10-26",
    time: "16:30",
    status: "pending",
    notes: null,
    priceCents: 4500,
    createdAt: "2026-10-22T08:10:00.000Z",
  },
  {
    id: "bk-005",
    code: "AG-1Z4H6",
    clientName: "Thiago Barros",
    clientPhone: "5511955556677",
    clientEmail: null,
    serviceId: "svc-degrade",
    serviceName: "Degradê / Military cut",
    professionalId: "pro-rafael",
    professionalName: "Rafael Mota",
    date: "2026-10-23",
    time: "09:30",
    status: "completed",
    notes: null,
    priceCents: 5500,
    createdAt: "2026-10-17T11:20:00.000Z",
  },
  {
    id: "bk-006",
    code: "AG-8N6J3",
    clientName: "André Oliveira",
    clientPhone: "5511944448888",
    clientEmail: null,
    serviceId: "svc-crianca",
    serviceName: "Corte infantil",
    professionalId: "pro-caio",
    professionalName: "Caio Ferreira",
    date: "2026-10-24",
    time: "15:00",
    status: "cancelled",
    notes: "Doente.",
    priceCents: 3500,
    createdAt: "2026-10-18T10:00:00.000Z",
  },
];

export const demoOrders: Order[] = [
  {
    id: "ord-001",
    code: "PD-4K7M2",
    clientName: "Lucas Andrade",
    clientPhone: "5511973334455",
    address: null,
    notes: "Retirar depois das 18h.",
    totalCents: 8800,
    status: "confirmed",
    paymentMethod: "presencial",
    items: [
      { productId: "prd-pomada", productName: "Pomada Modeladora Navalha", unitPriceCents: 4900, quantity: 1 },
      { productId: "prd-gel", productName: "Gel Fixativo 120g", unitPriceCents: 3200, quantity: 1 },
    ],
    createdAt: "2026-10-21T13:00:00.000Z",
  },
  {
    id: "ord-002",
    code: "PD-2R9B5",
    clientName: "Thiago Barros",
    clientPhone: "5511955556677",
    address: null,
    notes: null,
    totalCents: 3900,
    status: "pending",
    paymentMethod: "presencial",
    items: [{ productId: "prd-shampoo", productName: "Shampoo Barbearia — 500ml", unitPriceCents: 3900, quantity: 1 }],
    createdAt: "2026-10-22T10:30:00.000Z",
  },
  {
    id: "ord-003",
    code: "PD-6T3X8",
    clientName: "Marcos Vinícius",
    clientPhone: "5511981112233",
    address: null,
    notes: null,
    totalCents: 24900,
    status: "delivered",
    paymentMethod: "presencial",
    items: [
      { productId: "prd-pente", productName: "Prancha de Cabelo em Titânio", unitPriceCents: 24900, quantity: 1 },
    ],
    createdAt: "2026-10-15T17:20:00.000Z",
  },
];
