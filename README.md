# Maximall

The storefront includes product search and department filters, product detail pages, recently viewed products, saved items, a cart, checkout, payment simulation, sign-in, signup, and an account dashboard.

## Run locally

Requires Node.js 18 or newer. Copy `.env.example` to `.env.local` and set your Supabase project URL and publishable key before running the app.

```sh
npm install
npm run dev
```

Create and preview a production build:

```sh
npm run build
npm run preview
```

The Vite build copies the product images into `dist`. Client-side navigation uses hash routes, so direct links and browser history work without additional server rewrite rules.

## Supabase setup

Firebase remains responsible for sign-in and authentication. Supabase stores account profiles and authenticated checkout orders; guest checkout continues to use browser storage.

1. Create a Supabase project and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. These are browser-visible values; never put a Supabase secret or service-role key in the Vite environment.
2. In Supabase, enable Firebase as a third-party authentication provider and configure it with the Firebase project ID `maxima-6f4dc`.
3. Run [`supabase/migrations/20261113000000_initial_schema.sql`](./supabase/migrations/20261113000000_initial_schema.sql) in the Supabase SQL Editor. Its row-level security policies restrict profile and order access to Firebase tokens issued for this project and matching each row's Firebase UID.
4. Restart the Vite server after changing environment variables.

Existing Firestore records are not automatically copied to Supabase. The migration creates the schema and policies only; transfer any existing data separately if needed.
