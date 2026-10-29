# InterviewAI

Voice-based AI interview practice. React + Vite + TS + Tailwind client, Express + MongoDB (Mongoose) API.

## Setup
```bash
npm run install:all
cp .env.example server/.env      # then edit: MONGODB_URI, JWT_SECRET (32+ chars), AI_API_KEY
npm run dev:server               # API on :4000
npm run dev:client               # app on http://localhost:5173 (proxies /api to :4000)
```
Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Credentials
- **Required:** `MONGODB_URI`, `JWT_SECRET`.
- **Needed for interviews:** `AI_API_KEY` (+ `AI_MODEL`, `AI_BASE_URL`). Any OpenAI-compatible chat-completions API works. Without it, auth, dashboard, history and setup work, but question generation and evaluation return a clear 503 error. Nothing is faked.

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
