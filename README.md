# Dorée

Storefront and admin for Dorée, built with Next.js (App Router), TypeScript, Tailwind CSS and Supabase (Postgres, auth, storage).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the Supabase and Square values
npm run dev
```

### Database

1. Create a Supabase project.
2. In the Supabase SQL editor, open a new query tab and run `supabase/migrations/0001_init.sql`, then, in another new tab, `supabase/seed.sql` (sample products, collections, and placeholder shipping fees). Copy each file whole: on GitHub open the file, click **Raw**, select all and copy. Make sure nothing is highlighted in the editor before pressing Run, or only the highlighted part runs. Then run `supabase/migrations/0002_best_sellers_and_signups.sql` the same way. All three files are safe to run again.
3. Create the admin user in Supabase Auth, then give them the admin role. The role lives in `app_metadata`, which users cannot edit themselves:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
where email = 'owner@example.com';
```

They sign in at `/login` and then open `/admin`. The admin area is not linked from the public site and is marked `noindex`.

### Where things live

| What | Where |
| --- | --- |
| Products, variants, images, collections | Database, edited in `/admin/products` and `/admin/collections` |
| Stock levels across all products, low and out-of-stock alerts | `/admin/inventory` |
| Orders and their status | Database, `/admin/orders` |
| Shipping fixed-fee states and amounts | Database, `/admin/shipping` (nothing is hard-coded) |
| Hero, statement, feature panel, coming-soon collection, announcement, Instagram link, lookbook, guides and policies | Database (`site_content`), `/admin/content` |
| Home page best sellers | Tick "Best seller" on up to four products; if none are ticked, the top sellers by paid orders are shown |
| Email sign-ups from the home page | Database (`subscribers`), `/admin/subscribers` |
| Brand tokens | `src/app/globals.css` |
| Logos | `public/brand/` |

Prices are stored in cents and formatted only for display.

Pushing to the branch deploys automatically. Public pages refresh at most a minute after any database change (and immediately after an admin save), so running a migration or editing data never needs a redeploy.

### Checkout and payments

- `POST /api/checkout` validates the bag, recalculates every price and the shipping fee on the server from the database (the request carries no amounts), and creates the order as `pending`. No payment is taken and no stock changes.
- `POST /api/checkout/pay` charges the order's stored total through Square using the card token from the Web Payments SDK.
- `POST /api/webhooks/square` verifies Square's signature. On a completed payment whose amount matches the order, it calls the `mark_order_paid` database function, which marks the order Paid, saves the payment reference and reduces stock in one transaction. It is safe to deliver twice. Failed or abandoned payments leave the order pending and stock untouched.
- Guest orders are linked to a customer when someone confirms an account with the same email.

Subscribe the webhook to `payment.updated` in the Square dashboard and set `SQUARE_WEBHOOK_URL` to the exact URL you registered.

### Tests

```bash
npm test
npm run typecheck
```
