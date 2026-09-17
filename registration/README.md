# Tutedude UI/UX Hackathon — Registration

Registration form for the hackathon, backed by a Neon Postgres database.
Static form in `public/`, serverless API in `api/`, deployable on Vercel as-is.

## 1. Create the database (Neon)

1. Go to https://neon.tech, create a project (free tier is fine).
2. In the project, click **Connect** and copy the **pooled** connection string.
3. Copy `.env.example` to `.env` and paste it as `DATABASE_URL`. Set `ADMIN_KEY` to any long random string.
4. Create the table:

```
npm install
set -a; source .env; set +a
npm run db:setup
```

## 2. Run locally

```
set -a; source .env; set +a
npm run dev
```

Open http://localhost:3456 and submit a test registration.

## 3. Deploy on Vercel

```
vercel link
vercel env add DATABASE_URL production
vercel env add ADMIN_KEY production
vercel --prod
```

## 4. Admin dashboard

Open `https://<your-domain>/admin` and enter the `ADMIN_KEY`.
You get live totals (total, today, last hour, solo vs team), daily sign-up chart,
role and source breakdowns, a searchable table, and a CSV download.

Raw API (same key): `/api/stats?key=…`, `/api/registrations?key=…&q=…`, `/api/registrations?key=…&format=csv`.

## Fields collected

full name, email (unique), WhatsApp number, college/company, role, solo or team,
teammate name + email (team only), how they heard about it (optional).

## Scale

Neon free tier (0.5 GB) comfortably holds 20,000+ registrations (roughly 10 MB).
Vercel's free plan allows 100k function invocations per month.
