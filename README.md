# SLOGAN TEE Store

The official storefront for **SLOGAN TEE**, a Moroccan-made statement T-shirt
brand. The site presents `OUT LOUD — COLLECTION 001`, six heavyweight unisex
designs built around the idea **Private Thoughts, Worn Publicly**.

## What is included

- Responsive editorial storefront and campaign hero
- Six product pages with Bone and Washed Ink Black image variants
- Quick shop, persistent local shopping bag and size selection
- Morocco-focused cash-on-delivery checkout with WhatsApp handoff
- Delivery, returns, FAQ, contact, terms, privacy, cookies and legal pages
- Full oversized-fit size guide
- Anonymized customer-content section
- Cloudflare/Vinext build and artifact validation scripts

## Technology

- Next.js 16 and React 19
- Vinext and Vite 8
- Cloudflare Workers build output
- TypeScript and Tailwind CSS 4
- Browser `localStorage` for the shopping bag

## Requirements

- Node.js `>=22.13.0`
- npm
- Linux is recommended for the bounded install/build helper scripts

## Local development

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Validation

```bash
npm run lint
npm test
```

`npm test` builds the deployable worker, validates the generated artifact and
checks the rendered HTML metadata.

## Production build

```bash
npm run build
```

The verified Cloudflare Worker output is written to `dist/`. The project also
contains `.openai/hosting.json`, which binds this checkout to its ChatGPT Sites
project. Keep that file when deploying through Sites.

## Store behavior

The current checkout is intentionally cash-on-delivery only. Customer details
and the order summary are assembled in the browser and handed to WhatsApp for
confirmation. The project does not yet include a payment gateway, inventory
database, durable order database, analytics, or a live mailing-list backend.

Product and variant configuration lives in `app/store-data.ts`. Store images
are in `public/images/`, while the reusable shopping-bag logic lives in
`app/cart-storage.ts`.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Campaign, collection, community content and waitlist |
| `/products/[id]` | Product detail and colour/size selection |
| `/checkout` | Morocco COD checkout and WhatsApp confirmation |
| `/size-guide` | Garment measurements and fit guidance |
| `/delivery` | Delivery terms |
| `/returns` | Exchanges and returns |
| `/faq` | Frequently asked questions |
| `/contact` | Contact and WhatsApp support |
| `/terms`, `/privacy`, `/cookies`, `/legal` | Trust and legal information |

## Brand assets

The SLOGAN TEE name, product slogans, photography and artwork in this repository
are brand assets. No reuse licence is granted by making this source public.

© 2026 SLOGAN TEE. All rights reserved.
