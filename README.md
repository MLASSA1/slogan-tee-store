# SLOGAN TEE Store

The official storefront for **SLOGAN TEE**, a Moroccan-made statement T-shirt
brand. The site presents `OUT LOUD — COLLECTION 001`, six heavyweight unisex
designs built around the idea **Private Thoughts, Worn Publicly**.

## What is included

- Responsive editorial storefront and campaign hero
- Six product pages with Bone and Washed Ink Black image variants
- Quick shop, server-side shopping bag and size selection
- Per-variant stock tracking with sold-out sizes and oversell protection
- Server-validated discount codes
- Morocco-focused cash-on-delivery checkout; orders land in the back office
- Password-protected back office for orders, stock and discount codes
- Delivery, returns, FAQ, contact, terms, privacy, cookies and legal pages
- Full oversized-fit size guide
- Anonymized customer-content section
- Cloudflare/Vinext build and artifact validation scripts

## Technology

- Next.js 16 and React 19
- Vinext and Vite 8
- Cloudflare Workers build output
- Cloudflare D1 and Drizzle ORM for bags, stock, discounts and orders
- TypeScript and Tailwind CSS 4

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

### First-run database setup

The local D1 database starts empty. Create `.dev.vars` in the project root
(git-ignored) with an admin password:

```
ADMIN_PASSWORD=choose-a-long-random-password
ADMIN_SESSION_SECRET=choose-another-long-random-value
```

Then open `/admin`, sign in and press **Run setup**. That applies the generated
migrations in `drizzle/`, creates one inventory row per product/colour/size and
adds two example discount codes. It is idempotent — run it again after adding a
migration or a product.

In production, set the same two values as Worker secrets:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

The hosting platform applies `drizzle/` on deploy, so only the seeding step
needs the **Run setup** button there.

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

Checkout is intentionally cash-on-delivery only. Completing checkout writes the
order to the database and it appears immediately in the back office at `/admin`,
where the shop works it. The customer sees an order reference and nothing more
is asked of them — the shop calls to confirm the delivery slot.

Customer details are never handed to a third-party messaging app. The checkout
response carries only the reference and the total; name, telephone and address
stay in D1 and are visible only behind the admin session.

The browser never decides money. It names a variant (product, colour, size) and
a quantity; the server prices it from the catalogue, re-validates any discount
code and takes stock with a guarded update, so two customers cannot both buy the
last unit. Cancelling an order in the back office returns its units to stock.

The project still has no payment gateway, analytics, or mailing-list backend.

### Where things live

| Path | Purpose |
| --- | --- |
| `app/store-data.ts` | Product catalogue and prices (brand content, not database rows) |
| `db/schema.ts` | Drizzle tables: inventory, carts, discount codes, orders |
| `app/lib/pricing.ts` | Delivery and discount rules shared by client and server |
| `app/server/` | Cart, order, discount, admin-auth and setup logic |
| `app/api/` | Route handlers |
| `app/cart-storage.ts` | Client-side mirror of the server bag |
| `public/images/` | Store images |

Bags live in D1 behind an `HttpOnly` cookie, so they survive across devices on
the same browser session rather than living in `localStorage`. A bag built
before this change is imported automatically on first load.

## Back office

`/admin` is password-protected and excluded from search indexing.

- **Orders** — every order with customer, address, items and totals; move an
  order through new → confirmed → shipped → delivered, or cancel it to restock
- **Stock** — edit units per product, colour and size
- **Discounts** — create percent or fixed-amount codes with a minimum subtotal
  and optional usage cap; pause or delete them

## API routes

| Route | Purpose |
| --- | --- |
| `GET/POST /api/cart` | Read the bag; add, requantify, re-variant, merge or clear |
| `POST /api/discount` | Validate a code against the current bag |
| `POST /api/checkout` | Place a cash-on-delivery order |
| `GET /api/stock` | Per-variant availability for one product |
| `/api/admin/*` | Session, setup, orders, inventory and discounts (admin only) |

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Campaign, collection, community content and waitlist |
| `/products/[id]` | Product detail and colour/size selection |
| `/checkout` | Morocco COD checkout and order confirmation |
| `/admin` | Back office (password-protected, not indexed) |
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
