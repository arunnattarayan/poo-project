# Nanjai Clothing — Next.js + Supabase + WhatsApp checkout

## Setup

1. **Supabase**: create a project → SQL Editor → run `supabase/schema.sql`.
2. **Admin user**: Authentication → Users → *Add user* (email + password, auto-confirm). Then in the SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
3. **Disable public sign-ups** (recommended): Authentication → Sign In / Providers → turn off *Allow new users to sign up*.
4. **Env**: `cp .env.local.example .env.local` and fill in the URL and anon key (Project Settings → API).
5. **Run**: `npm install && npm run dev` → storefront at http://localhost:3000, admin at http://localhost:3000/admin.
6. **Configure**: `/admin/settings` → set your WhatsApp number (with country code, e.g. `919876543210`).

## Deploy (Vercel)

Import the repo in Vercel and add the same two `NEXT_PUBLIC_SUPABASE_*` env vars. No other config needed.

## Structure

```
supabase/schema.sql            Tables, RLS, is_admin(), create_order() RPC
middleware.js                  /admin/* protection (session + admin allow-list)
lib/supabase.js                Browser client
lib/supabase-server.js         Cookie-aware server client
lib/supabase-public.js         Cookie-less client for cached public reads
lib/cart-store.js              Zustand cart (persisted)
app/(store)/                   Storefront: catalog, /product/[id]
app/admin/                     login, orders dashboard, products CRUD, settings
components/CheckoutForm.jsx    WhatsApp checkout
```

## Security notes

- Admin = logged in **and** listed in `public.admins`. Any random sign-up gets no access.
- Customers can't insert into `orders` directly; checkout uses the `create_order` RPC, which
  recomputes prices and the delivery fee from the database so totals can't be tampered with.
