/**
 * Generates typographic placeholder artwork for product variants that have no
 * photograph yet.
 *
 * The original PNGs shipped truncated at 768 KiB, so most of the catalogue had
 * no usable image. Rather than render a half-decoded photo — which reads as a
 * broken site — each missing variant gets a tile built from the design's own
 * slogan, in the real garment colour and the real print colour. It is honest
 * about the product and consistent with a brand whose identity is 60%
 * typography.
 *
 * These are placeholders. Replace them with photography via
 * scripts/prepare-images.sh, then repoint app/store-data.ts.
 *
 *   node scripts/generate-placeholders.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, "public/images");

// From the SLOGAN TEE identity system.
const INK = "#0B0B0B";
const OFF_WHITE = "#F1E9DD";
const RED = "#C51624";
const STONE = "#918979";

/** Print colour per design, taken from the `colour` field in store-data.ts. */
const ACCENTS = {
  "just-kiss-me": "#C51624",
  "break-her-bed": null, // reverses out of the garment
  "simple-man": "#6E7B1F",
  "afraid-of-boobs": null,
  "date-them": "#2B3BD0",
  "marry-moroccan": "#4A57E0",
};

/** Variants still waiting on photography. */
const PENDING = [
  { product: "date-them", colour: "Washed Ink Black", file: "product-date-them-black" },
];

const QUOTES = {
  "just-kiss-me": "JUST KISS ME / WE CAN TALK LATER",
  "break-her-bed": "BREAK HER BED / NOT HER HEART",
  "simple-man": "I LOVE MY WIFE / AND MAX VERSTAPPEN",
  "afraid-of-boobs": "IF YOU TRYNA SCARE ME / I AM AFRAID OF BOOBS",
  "date-them": "I DON'T MAKE MISTAKES / I DATE THEM",
  "marry-moroccan": "EAT ITALIEN / DRIVE GERMAN / MARRY MOROCCAN",
};

const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Splits a slogan into lines short enough to set large and centred. */
function layout(quote, maxChars = 15) {
  const lines = [];
  for (const segment of quote.split("/").map((part) => part.trim())) {
    let current = "";
    for (const word of segment.split(/\s+/)) {
      if (!current) current = word;
      else if (`${current} ${word}`.length <= maxChars) current += ` ${word}`;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function productTile({ product, colour }) {
  const width = 1024;
  const height = 1536;
  const isBlack = colour.includes("Black");
  const garment = isBlack ? "#1A1A1A" : "#EDE4D6";

  // Designs printed in a spot colour keep it on both garments; the two
  // reversed-out designs simply flip against the fabric.
  const accent = ACCENTS[product] ?? (isBlack ? OFF_WHITE : INK);

  const lines = layout(QUOTES[product]);
  const fontSize = lines.length > 5 ? 86 : 100;
  const lineHeight = fontSize * 1.16;
  const blockTop = height / 2 - ((lines.length - 1) * lineHeight) / 2 - 40;

  const text = lines
    .map(
      (line, index) =>
        `    <text x="${width / 2}" y="${blockTop + index * lineHeight}" fill="${accent}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="1" text-anchor="middle">${escape(line)}</text>`,
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect width="${width}" height="${height}" fill="${garment}"/>
  <rect x="0" y="0" width="${width}" height="10" fill="${RED}"/>
${text}
  <text x="${width / 2}" y="${blockTop + lines.length * lineHeight + 54}" fill="${accent}" font-family="Georgia, serif" font-size="34" font-style="italic" text-anchor="middle" opacity="0.85">Slogan Tee</text>
  <text x="${width / 2}" y="${height - 74}" fill="${isBlack ? STONE : STONE}" font-family="Courier New, monospace" font-size="26" font-weight="700" letter-spacing="5" text-anchor="middle">${escape(colour.toUpperCase())}</text>
</svg>
`;
}

function reviewTile(city, slogan) {
  const width = 942;
  const height = 1256;
  const lines = layout(slogan, 13);
  const lineHeight = 92;
  const blockTop = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  const text = lines
    .map(
      (line, index) =>
        `    <text x="${width / 2}" y="${blockTop + index * lineHeight}" fill="${OFF_WHITE}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="78" font-weight="900" text-anchor="middle">${escape(line)}</text>`,
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect width="${width}" height="${height}" fill="${INK}"/>
${text}
  <text x="${width / 2}" y="${height - 96}" fill="${RED}" font-family="Courier New, monospace" font-size="30" font-weight="700" letter-spacing="6" text-anchor="middle">${escape(city)}</text>
</svg>
`;
}

await mkdir(outputDir, { recursive: true });

const written = [];

for (const variant of PENDING) {
  const path = resolve(outputDir, `${variant.file}.svg`);
  await writeFile(path, productTile(variant), "utf8");
  written.push(`${variant.file}.svg`);
}

await writeFile(
  resolve(outputDir, "review-casa-anonymous.svg"),
  reviewTile("CASABLANCA", "JUST KISS ME / WE CAN TALK LATER"),
  "utf8",
);
await writeFile(
  resolve(outputDir, "review-rabat-anonymous.svg"),
  reviewTile("RABAT", "BREAK HER BED / NOT HER HEART"),
  "utf8",
);
written.push("review-casa-anonymous.svg", "review-rabat-anonymous.svg");

console.log(`Generated ${written.length} placeholder(s) in public/images/:`);
for (const name of written) console.log(`  ${name}`);
