/**
 * Gera as imagens placeholder (SVG) usadas pelo site.
 *
 *   node scripts/generate-placeholders.mjs
 *
 * As imagens são vetoriais e leves, funcionam offline e podem ser trocadas
 * pelas fotos reais da barbearia em `public/images/`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images");

mkdirSync(outDir, { recursive: true });

const W = 900;
const H = 675;

function hsl(h, s, l) {
  return `hsl(${h} ${s}% ${l}%)`;
}

/** Fundo com gradiente + listras de poste de barbeiro. */
function backdrop(hue, accentHue) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hsl(hue, 28, 20)}"/>
      <stop offset="55%" stop-color="${hsl(hue + 12, 24, 13)}"/>
      <stop offset="100%" stop-color="${hsl(hue + 26, 22, 8)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="${hsl(accentHue, 70, 60)}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${hsl(accentHue, 70, 60)}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="pole" width="56" height="56" patternTransform="rotate(38)" patternUnits="userSpaceOnUse">
      <rect width="28" height="56" fill="${hsl(accentHue, 55, 55)}" fill-opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#pole)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>`;
}

function frame(text) {
  return `
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="28" fill="none" stroke="${hsl(45, 60, 60)}" stroke-opacity="0.28" stroke-width="2"/>
  <text x="50%" y="${H - 62}" text-anchor="middle" font-family="Inter, Segoe UI, sans-serif" font-size="34" font-weight="700" letter-spacing="6" fill="${hsl(45, 65, 82)}" fill-opacity="0.85">${text}</text>`;
}

function label(text) {
  return `<text x="50%" y="${H - 62}" text-anchor="middle" font-family="Inter, Segoe UI, sans-serif" font-size="34" font-weight="700" letter-spacing="6" fill="${hsl(45, 65, 82)}" fill-opacity="0.85">${text}</text>`;
}

/* -------------------------------------------------------------------------- */
/*  Serviços — tesoura estilizada                                             */
/* -------------------------------------------------------------------------- */
function scissors(hue, accent) {
  return `
  <g transform="translate(${W / 2} ${H / 2 - 30})" opacity="0.9">
    <circle cx="-86" cy="96" r="40" fill="none" stroke="${hsl(accent, 70, 72)}" stroke-width="12"/>
    <circle cx="86" cy="96" r="40" fill="none" stroke="${hsl(accent, 70, 72)}" stroke-width="12"/>
    <path d="M-62 66 L150 -120" stroke="${hsl(accent, 70, 78)}" stroke-width="12" stroke-linecap="round"/>
    <path d="M62 66 L-150 -120" stroke="${hsl(accent, 70, 78)}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="0" cy="-8" r="16" fill="${hsl(accent, 70, 78)}"/>
  </g>`;
}

/* -------------------------------------------------------------------------- */
/*  Produtos — frasco                                                          */
/* -------------------------------------------------------------------------- */
function bottle(hue, accent) {
  return `
  <g transform="translate(${W / 2} ${H / 2 - 20})" opacity="0.92">
    <rect x="-34" y="-170" width="68" height="52" rx="12" fill="${hsl(accent, 60, 60)}"/>
    <path d="M-70 -118 h140 v210 a34 34 0 0 1 -34 34 h-72 a34 34 0 0 1 -34 -34 z" fill="${hsl(accent, 55, 48)}"/>
    <rect x="-54" y="-40" width="108" height="86" rx="10" fill="${hsl(hue, 30, 12)}" fill-opacity="0.55"/>
    <rect x="-70" y="-140" width="140" height="26" rx="12" fill="${hsl(accent, 60, 72)}"/>
  </g>`;
}

/* -------------------------------------------------------------------------- */
/*  Equipe — avatar com iniciais                                               */
/* -------------------------------------------------------------------------- */
function avatar(hue, accent, initials) {
  return `
  <g opacity="0.95">
    <circle cx="${W / 2}" cy="${H / 2 - 40}" r="176" fill="${hsl(hue, 26, 14)}"/>
    <circle cx="${W / 2}" cy="${H / 2 - 40}" r="176" fill="none" stroke="${hsl(accent, 60, 60)}" stroke-opacity="0.5" stroke-width="3"/>
    <circle cx="${W / 2}" cy="${H / 2 - 40}" r="132" fill="none" stroke="${hsl(accent, 60, 60)}" stroke-opacity="0.22" stroke-width="2"/>
    <text x="${W / 2}" y="${H / 2 - 8}" text-anchor="middle" font-family="Inter, Segoe UI, sans-serif" font-size="132" font-weight="800" fill="${hsl(accent, 65, 82)}" fill-opacity="0.9">${initials}</text>
  </g>`;
}

/* -------------------------------------------------------------------------- */
/*  Galeria — cortes estilizados                                                */
/* -------------------------------------------------------------------------- */
function haircut(hue, accent, variant = 0) {
  const shapes = [
    `<path d="M250 430 q60 -230 200 -230 q140 0 200 230 q-90 -120 -200 -120 q-110 0 -200 120 z" fill="${hsl(accent, 55, 60)}" fill-opacity="0.85"/>
     <rect x="250" y="430" width="400" height="26" rx="13" fill="${hsl(accent, 40, 35)}"/>`,
    `<path d="M270 420 q30 -210 180 -210 q150 0 180 210 l-60 0 q-20 -140 -120 -140 q-100 0 -120 140 z" fill="${hsl(accent, 55, 60)}" fill-opacity="0.85"/>
     <circle cx="450" cy="240" r="46" fill="${hsl(hue, 40, 30)}" fill-opacity="0.9"/>`,
    `<path d="M240 440 h420 v22 h-420 z" fill="${hsl(accent, 40, 35)}"/>
     <path d="M280 440 q20 -260 170 -260 q150 0 170 260 q-40 -170 -170 -170 q-130 0 -170 170 z" fill="${hsl(accent, 55, 60)}" fill-opacity="0.85"/>`,
  ];
  return `
  <g transform="translate(0 0)">
    ${shapes[variant % shapes.length]}
    <path d="M180 470 h540" stroke="${hsl(accent, 60, 70)}" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

function write(name, content) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">${content}</svg>`;
  writeFileSync(join(outDir, name), svg, "utf8");
}

/* Serviços */
const serviceNames = [
  "Corte",
  "Barba",
  "Combo",
  "Degradê",
  "Coloração",
  "Designer",
  "Sobrancelha",
  "Hidratação",
  "Infantil",
  "Pezinho",
];
serviceNames.forEach((name, index) => {
  const hue = 24 + index * 9;
  write(
    `service-${String(index + 1).padStart(2, "0")}.svg`,
    `${backdrop(hue, 42)}${scissors(hue, 42)}${frame("")}${label(name)}`,
  );
});

/* Produtos */
const productNames = [
  "Pomada",
  "Gel",
  "Balm",
  "Óleo",
  "Shampoo",
  "Condicionador",
  "Creme",
  "Kit",
  "Toalha",
  "Prancha",
];
productNames.forEach((name, index) => {
  const hue = 200 + index * 14;
  write(
    `product-${String(index + 1).padStart(2, "0")}.svg`,
    `${backdrop(hue, 42)}${bottle(hue, 42)}${frame("")}${label(name)}`,
  );
});

/* Equipe */
const team = [
  ["RM", "Rafael"],
  ["GL", "Gustavo"],
  ["DS", "Diego"],
  ["MR", "Matheus"],
  ["CF", "Caio"],
];
team.forEach(([initials, name], index) => {
  const hue = 16 + index * 11;
  write(
    `pro-${String(index + 1).padStart(2, "0")}.svg`,
    `${backdrop(hue, 42)}${avatar(hue, 42, initials)}${frame("")}${label(name)}`,
  );
});

/* Galeria */
const galleryNames = [
  "Degradê",
  "Barba",
  "Platinado",
  "Corte social",
  "Detalhe",
  "Designer",
  "Infantil",
  "Acabamento",
];
galleryNames.forEach((name, index) => {
  const hue = 28 + index * 13;
  write(
    `gallery-${String(index + 1).padStart(2, "0")}.svg`,
    `${backdrop(hue, 42)}${haircut(hue, 42, index)}${frame("")}${label(name)}`,
  );
});

console.log(`Imagens geradas em ${outDir}`);
