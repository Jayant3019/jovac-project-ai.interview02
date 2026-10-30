# InterviewAI

Voice-based AI interview practice. React + Vite + TS + Tailwind client, Express + MongoDB (Mongoose) API.

## Setup (Windows PowerShell)
```bash
npm run install:all
Copy-Item .env.example server/.env  # only if server/.env does not already exist
npm run dev                       # starts API and app together
```
Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Open http://localhost:5173. If the API is already responding on port 4000, the
development launcher reuses it instead of starting a duplicate. You can also
start the API and client separately with `npm run dev:server` and
`npm run dev:client` in two terminals. The Vite `/api` proxy targets
`http://127.0.0.1:4000`; set `API_PROXY_TARGET` if your API runs elsewhere.

## Deploy (Netlify + Render)

The repository includes `netlify.toml` and `render.yaml` for deployment. Netlify
builds the Vite app from `client/`, serves React Router routes, and proxies
`/api/*` to the Render API. The browser therefore uses a same-origin API and the
HttpOnly login cookie works without exposing backend secrets in the frontend.

1. Deploy the API on Render from this repository using the included Blueprint
   (`render.yaml`). The service root is `server/`; Render will prompt for
   `MONGODB_URI` and `AI_API_KEY`, and generate `JWT_SECRET` automatically.
   Set your MongoDB Atlas network access to allow the Render service to connect.
2. Deploy the frontend on Netlify from the repository root. It will read
   `netlify.toml`; the build command and publish directory are configured there.
3. In `netlify.toml`, confirm the `/api/*` proxy target matches the public URL
   of your Render service. The current target is
   `https://jovac-project-ai-interview02-00.onrender.com`.
4. For direct cross-origin API access (outside the Netlify proxy), set the
   Render `CLIENT_URL` variable to your Netlify site origin. The normal app
   flow uses the proxy, so no frontend API URL or CORS setup is needed.

After deploy, open the Netlify site and check that `/api/health` returns
`{"status":"ok"}`. Interview generation and evaluation need a valid AI key.

## Credentials
- **Required:** `MONGODB_URI`, `JWT_SECRET`.
- **Needed for interviews:** `AI_API_KEY` (+ `AI_MODEL`, `AI_BASE_URL`) for an OpenAI-compatible chat-completions API, or `GEMINI_API_KEY` (+ `GEMINI_MODEL`) for Gemini. Gemini uses Google's OpenAI-compatible endpoint automatically. Without an AI key, auth, dashboard, history and setup work, but question generation and evaluation return a clear 503 error.

## API (all `/api`, JSON, auth via HttpOnly `token` cookie)
| Method | Path | Notes |
|---|---|---|
| POST | /auth/register, /auth/login, /auth/logout | |
| GET | /auth/me, /users/me | PATCH /users/me updates name |
| POST | /interviews | create from setup form |
| GET | /interviews, /interviews/:id | owner-only |
| POST | /interviews/:id/next-question | returns pending question or generates one; `{done:true}` at the limit |
| POST | /interviews/:id/answers | `{index, answer, skip?}` -> evaluation JSON |
| POST | /interviews/:id/finish | builds report from real evaluations |
| GET | /reports/:id | |
| GET | /analytics/overview, /analytics/progress | |

## Privacy
Raw audio is never recorded or uploaded by this app. Chrome/Edge send audio to their own speech service for recognition. Submitted transcripts, questions, evaluations, and optional job description/resume text are stored in your MongoDB under your user and sent to the configured AI provider. To delete data, remove the interview documents (a delete endpoint is not implemented yet).

## Production
Serve client build (`npm --prefix client run build`) behind HTTPS, set `NODE_ENV=production`, `CLIENT_URL`, and `COOKIE_SAMESITE=none` only if client and API are on different sites.

## Not included in this build
Forgot-password, profile/settings page, question-practice page, resume PDF upload, server-side STT, automated tests, and a dedicated analytics page (the dashboard shows trends/skills). Layout is flatter than the spec (`server/src/{app,ai,models,server}.ts`).
