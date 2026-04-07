# VNS Store - Huong Dan Setup Tu A -> Z (Tieng Viet)

Tai lieu nay huong dan ban chay du an tu dau den cuoi: cai dat local, tao database, seed du lieu, test Stripe, va deploy len Vercel.

**Quy dinh backend:** backend bat buoc dung Next.js API Routes/Route Handlers (`app/api/*/route.ts`) voi TypeScript, khong dung Express/NestJS/Fastify rieng.

---

## 1) Yeu cau truoc khi bat dau

Can cai dat san:

- Node.js 20+ (khuyen nghi ban LTS moi nhat)
- npm (di kem Node.js)
- Tai khoan Vercel
- Tai khoan Stripe
- Git (neu muon day code len GitHub/GitLab)

Kiem tra nhanh tren may:

```bash
node -v
npm -v
```

Neu chua co Node.js: cai tai [https://nodejs.org](https://nodejs.org)

---

## 2) Mo project va cai dependency

Di chuyen vao thu muc project:

```bash
cd c:\Users\nqchi\Downloads\Sample2
```

Cai goi:

```bash
npm install
```

---

## 3) Tao file bien moi truong (.env)

Copy file mau:

- Tu `.env.example` tao file `.env`

Hoac tao thu cong file `.env` voi noi dung:

```env
# Vercel Postgres
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
DIRECT_URL="postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require"

# Auth
JWT_SECRET="replace-with-long-random-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

### Giai thich nhanh cac bien:

- `DATABASE_URL`, `DIRECT_URL`: chuoi ket noi PostgreSQL (Vercel Postgres)
- `JWT_SECRET`: chuoi bi mat dai va kho doan (dung cho dang nhap)
- `NEXT_PUBLIC_APP_URL`: URL app hien tai (local la `http://localhost:3000`)
- `STRIPE_SECRET_KEY`: secret key test cua Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: publishable key test cua Stripe
- `STRIPE_WEBHOOK_SECRET`: secret webhook de xac thuc su kien Stripe

---

## 4) Setup database bang Prisma

### 4.1 Tao Prisma Client

```bash
npm run prisma:generate
```

### 4.2 Chay migration tao bang

```bash
npm run prisma:migrate -- --name init
```

### 4.3 Seed du lieu san pham mau

```bash
npm run prisma:seed
```

Sau buoc nay, trang chu se co san pham de test.

---

## 5) Chay du an local

```bash
npm run dev
```

Mo trinh duyet:

- [http://localhost:3000](http://localhost:3000)

---

## 6) Test chuc nang chinh

Lam lan luot:

1. Vao trang `Profile` de dang ky tai khoan (email + password)
2. Dang nhap lai neu can
3. Vao trang chu, tim kiem/loc san pham
4. Vao chi tiet san pham, bam **Add to Cart**
5. Vao `Cart`, kiem tra tong tien
6. Bam `Proceed to Checkout`

---

## 7) Test thanh toan Stripe (test mode)

Khi sang Stripe Checkout, dung the test:

- So the: `4242 4242 4242 4242`
- Expiry: ngay bat ky trong tuong lai
- CVC: 3 so bat ky
- ZIP: bat ky

Ket qua:

- Thanh cong -> `/checkout/success`
- Huy -> `/checkout/cancel`

---

## 8) Cau hinh Stripe webhook (quan trong)

De cap nhat trang thai don hang tu `PENDING` sang `PAID`, can webhook.

### 8.1 Local webhook (de test tren may)

1. Cai Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Dang nhap:
   ```bash
   stripe login
   ```
3. Forward webhook ve local:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Stripe CLI se in ra `whsec_...`, copy vao `.env`:
   - `STRIPE_WEBHOOK_SECRET="whsec_xxx"`

### 8.2 Webhook tren production

Trong Stripe Dashboard:

- Tao endpoint: `https://ten-mien-cua-ban/api/stripe/webhook`
- Chon event: `checkout.session.completed`
- Lay signing secret va cap nhat len Vercel env: `STRIPE_WEBHOOK_SECRET`

---

## 9) Deploy len Vercel

### 9.1 Day code len git

```bash
git init
git add .
git commit -m "Initial VNS Store setup"
```

Push len GitHub/GitLab.

### 9.2 Import project vao Vercel

1. Dang nhap Vercel
2. Chon **Add New Project**
3. Chon repo vua push

### 9.3 Them Environment Variables

Them day du cac bien giong `.env`:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (dat URL production cua ban)
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 9.4 Chay migration production

Co 2 cach:

- Cach 1: chay tu may local voi production DB URL
- Cach 2: dung Vercel build/deploy flow va command:

```bash
npx prisma migrate deploy
```

### 9.5 Kiem tra sau deploy

- Dang ky/dang nhap ok
- Them gio hang ok
- Checkout Stripe ok
- Webhook cap nhat don hang ok

---

## 10) Mot so loi thuong gap va cach xu ly

### Loi `JWT_SECRET is missing`
- Kiem tra da them `JWT_SECRET` trong `.env` (local) hoac Vercel env (production)

### Loi ket noi database
- Kiem tra `DATABASE_URL`, `DIRECT_URL` dung format postgres
- Kiem tra DB co cho phep ket noi SSL (`?sslmode=require`)

### Loi Stripe key
- Dam bao dang dung key test: `sk_test_...` va `pk_test_...`
- Khong tron key live voi test

### Thanh toan xong nhung don hang van `PENDING`
- Kiem tra webhook da tao dung URL chua
- Kiem tra `STRIPE_WEBHOOK_SECRET` co dung khong
- Kiem tra endpoint `/api/stripe/webhook` co nhan event `checkout.session.completed`

---

## 11) Cau truc nhanh de ban de quan ly

- `app/` -> page va API route (serverless function)
- `components/` -> component giao dien tai su dung
- `lib/` -> auth, db, stripe, helper
- `prisma/` -> schema va seed
- `.env` -> bien moi truong

---

## 12) Checklist nhanh (ban co the tick tung buoc)

- [ ] Cai Node.js 20+
- [ ] `npm install`
- [ ] Tao `.env` tu `.env.example`
- [ ] Dien day du env vars
- [ ] `npm run prisma:generate`
- [ ] `npm run prisma:migrate -- --name init`
- [ ] `npm run prisma:seed`
- [ ] `npm run dev`
- [ ] Test dang ky/dang nhap
- [ ] Test them gio hang va checkout
- [ ] Cau hinh Stripe webhook
- [ ] Deploy Vercel va them env production

---

Neu ban muon, toi co the tao tiep 1 file **HUONG_DAN_SETUP_VIETNAM_CUC_NGAN.md** (chi 1 trang, checklist theo tung lenh copy/paste) de ban setup nhanh trong 5-10 phut.
