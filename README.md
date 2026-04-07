# VNS Store

Modern premium e-commerce web app built with:
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + Vercel Postgres
- Vercel Serverless API routes
- Stripe test checkout

## Backend Rule

- Backend bat buoc dung Next.js (`app/api/*/route.ts`) voi TypeScript.
- Khong su dung framework backend rieng (Express, NestJS, Fastify).

## Features

- Email/password authentication (register, login, logout)
- Product listing with category filter and search
- Product detail page
- Add to cart, cart management, checkout flow
- Stripe test payment integration with success/cancel pages
- Profile page with order history
- Activity logging for auth actions
- Reusable UI components (navbar, cards, modal, toasts)

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/products`
- `GET /api/products/[id]`
- `POST /api/cart/add`
- `POST /api/cart/remove`
- `POST /api/checkout`
- `POST /api/stripe/webhook`
- `GET /api/orders`

## Local Setup

1. Install Node.js 20+ and npm.
2. Install dependencies:
   - `npm install`
3. Copy env template:
   - `cp .env.example .env` (or duplicate manually on Windows)
4. Set up database and Stripe keys in `.env`.
5. Generate Prisma client:
   - `npm run prisma:generate`
6. Create schema in database:
   - `npm run prisma:migrate -- --name init`
7. Seed products:
   - `npm run prisma:seed`
8. Start app:
   - `npm run dev`

Open `http://localhost:3000`.

## Stripe Test

- Use test card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits
- ZIP: any value

## Deploy to Vercel

1. Push repo to Git provider.
2. Import project in Vercel.
3. If this app is inside a subfolder, set **Root Directory** correctly (example: `web_sample2`).
4. Add environment variables from `.env.example`.
5. Connect Vercel Postgres and update `DATABASE_URL`/`DIRECT_URL`.
6. Run Prisma migration in production:
   - `npx prisma migrate deploy`
7. Set Stripe webhook endpoint in Stripe dashboard:
   - `https://<your-domain>/api/stripe/webhook`
8. Deploy.

### Notes for stable Vercel builds

- Prisma Client is auto-generated via `postinstall` (`prisma generate`).
- Homepage uses dynamic rendering to avoid querying database during build time.
- Checkout route auto-falls back to `VERCEL_URL` when `NEXT_PUBLIC_APP_URL` is not set.
