# Deploy to the web — free-tier runbook

Everything needed to put **Mkg.IELTS.COM** on the internet with free accounts, and get it indexed by Google.

## STATUS (2026-08-16)

- Frontend: **LIVE** at https://ielts-master-2026.vercel.app (Vercel, git-connected). Production branch must be set to `master` in Vercel dashboard → Settings → Git for pushes to auto-deploy production (previews already build green).
- Backend: **LIVE** at https://ielts-api-hypc.onrender.com (Render, **Docker** runtime, free plan, auto-deploy on push). Kept awake by .github/workflows/keepalive.yml (5-min health ping).
- Live-functional fixes (2026-08-16): removed Ideavo `vercel.json` (it bricked every git build: `MISSING_SERVICES`, framework was `services` → set to `nextjs`); proxy route `src/app/api/brain/[...path]/route.ts` forwards `/api/brain/*` (check/vocab/bank/session/…) to the Render backend; restored the 7 offline handlers (mock/evaluate/recommendation/tutor/report/blueprints/blueprint) for anonymous/offline use; `brainCall` falls back offline on 401 only when no token exists; health probe timeout raised 1.6s → 10s (free-tier cold starts); backend URL resolution is lazy so a missing env var can't brick builds.
- AI-parity + production fixes (2026-08-16, commits `276d306`→`d5065ba`): bank-session checks no longer 404 for listening/writing/speaking (check lookup now resolves stamped `bank-*` ids); fixed `UnboundLocalError` crashing every writing/non-cue-speaking item check; check toasts surface the real backend message; `BETA_VERIFY_EMAIL` accepts comma-separated beta owners; GZipMiddleware compresses all JSON ≥1KB (speaking bank payload 213 KB → 13 KB, 16×); health probe shares one in-flight promise across concurrent callers; health probe retries across a ~70s wake budget so the first visit after Render sleep still reaches the real AI instead of degrading.
- Verified live (2026-08-16): bank→check round-trip 200 for reading/listening/writing/speaking; tutor AI reply; mock evaluate (speaking answer) full banded result; `/auth/me` with adaptive profile; preflight CORS with `authorization` header; gzip content-encoding.
- Production audit (2026-08-16): no secrets in code (all via env); bcrypt + timing-equalized login against unknown emails; per-route rate limits (auth x6 scopes, brain-ai 120/5min); JWT HS256 + `ver` token version + 7-day expiry; body-size ceiling 50 MB; request-ID logging + security headers (nosniff/DENY/HSTS in prod); AI gateway with 15-min bounded LRU cache (128), provider failover Groq→Gemini, throttle + capped backoff, 10s hard deadline; tutor chat history capped at last 6 turns; Postgres (Supabase) with indexed FKs/unique fields; CORS locked to the Vercel origin.
- Database: Supabase Postgres (shared with local dev DB)
- Environment: `APP_ENV=production`, all 19 vars set via Render API; JWT_SECRET generated and stored on Render only; `NEXT_PUBLIC_*` envs set for all three Vercel environments (production/preview/development)
- Tested: 36/36 local regression suite; prod CORS incl. Authorization preflight; security headers on both surfaces
- OUTSTANDING: Resend domain verification (buy domain, verify, update `RESEND_API_KEY`/`RESEND_FROM` — until then test-mode emails are never delivered; register with the Resend-verified inbox or switch to Gmail SMTP for real delivery); Google Sign-In authorized origin (add `https://ielts-master-2026.vercel.app` in Google Cloud Console); Search Console; GitHub Support ticket (optional)

## Prerequisites (all free)

- GitHub account (already in use: `https://github.com/xeon405/IELTS`)
- Vercel account (sign in with GitHub)
- Render account (sign in with GitHub) — free web service
- Neon account (free Postgres)
- Resend account (free email, 100 emails/day)
- Google Search Console (sign in with Google)

Canvas: the code is already on GitHub (`master`, commit `b89b0b0` — security-hardened: auth/rate-limit fixes, fail-closed env, token revocation).

---

## Step 1 — Frontend on Vercel (free)

1. Go to https://vercel.com → **Sign up** → "Continue with GitHub" → authorize.
2. **Add New** → **Project** → Import the `IELTS` repository.
3. Framework preset: **Next.js** (auto-detected). Root directory: keep `/`.
4. Under **Environment Variables** add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-url>` (from Step 2 — can be filled in and redeployed later) — **required**: the production build fails without it, and it must be `https://` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` (shown by Vercel after first deploy) |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | same value as in your local `src/.env.local` |

5. **Deploy**. You get a free URL like `https://ielts-xxxx.vercel.app`.
6. Keep the settings "Git" — every future push to GitHub auto-deploys.

## Step 2 — Backend on Render (free)

1. Go to https://render.com → **Sign up** with GitHub.
2. **New** → **Web Service** → connect the `IELTS` repo.
3. Settings:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance: **Free**
4. **Environment variables** (secrets — never commit these):

   | Name | Value |
   |---|---|
| `APP_ENV` | `production` — required: keeps OpenAPI docs/dev-code features off |
   | `FRONTEND_URL` | `https://<your-project>.vercel.app` |
   | `CORS_ORIGINS` | `https://<your-project>.vercel.app` |
   | `JWT_SECRET` | **required** — the backend refuses to start without it. Long random string, e.g. `openssl rand -hex 32` |
   | `DATABASE_URL` | from Step 3, rewritten as `postgresql+psycopg://...` |
   | `RESEND_API_KEY` | from Step 4 |
   | `RESEND_FROM` | `Mkg.IELTS <onboarding@resend.dev>` (before you add a real domain) |
   | `AI_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL`, `GEMINI_API_KEY` etc. | copy your working values from `backend/.env` (use the **new** Gemini key — the old one was rotated; never reuse it) |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Sign-In (optional in prod until you add the Vercel origin to the Google console) |

   Note: the **free** tier sleeps after ~15 minutes idle; the first request after sleep takes ~30–60s to wake up.

## Step 3 — Postgres on Neon (free)

1. https://neon.tech → sign up (GitHub) → **Create project** (region near you).
2. Copy the connection string, e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.
3. Render needs the `psycopg` dialect prefix — set `DATABASE_URL` to:
   `postgresql+psycopg://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
4. Tables are created automatically on first backend start.

## Step 4 — Email via Resend (free)

1. https://resend.com → sign up → **API Keys** → create key `re_...`.
2. Put it as `RESEND_API_KEY` on Render (Step 2). Verification codes and password resets now really get emailed.

## Step 5 — Google indexing

1. Visit https://search.google.com/search-console → **Start now** → choose **URL prefix** → enter `https://<your-project>.vercel.app`.
2. Verify (HTML tag or the DNS method Vercel suggests).
3. **Sitemaps** → submit `https://<your-project>.vercel.app/sitemap.xml`.
4. **URL Inspection** → paste `https://<your-project>.vercel.app/` → **Request indexing**.
5. Search results usually appear in **1–4 weeks**. Q: "mkg ielts" or "ielts examiner ai".

## Step 6 — Full flow test

With the Vercel URL open (and backend woken by one request):

- Register with a real email → the 6-digit code arrives by email → dashboard loads.
- Press the **back arrow** — you stay logged in (fixed, no logout).
- Run a mock exam — question banks are the fresh mock pools, all skills.

## Later upgrades (paid)

- Buy `mkgielts.com` (≈$10–15/yr) at Namecheap/GoDaddy → add as custom domain in Vercel → point `A`/`CNAME` records → update `NEXT_PUBLIC_SITE_URL`, `FRONTEND_URL`, `CORS_ORIGINS`, Resend `RESEND_FROM`.
- Google OAuth: add the Vercel domain as an authorized JavaScript origin in Google Cloud Console.
- Move backend to a paid tier (Render $7/mo) so it never sleeps.