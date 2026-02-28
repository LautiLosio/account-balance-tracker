# Account Balance Tracker

A Next.js app for tracking account balances and transactions with Auth0 authentication and Vercel KV persistence.

## Prerequisites

- Node.js 18+
- npm
- An Auth0 application (Regular Web Application)
- A Vercel KV database (or Upstash-compatible Redis credentials)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

3. Configure Auth0 in the Auth0 dashboard for your app:

   - **Allowed Callback URLs**:
     - `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**:
     - `http://localhost:3000`
   - **Allowed Web Origins**:
     - `http://localhost:3000`

   Example production equivalents:

   - Callback URL: `https://your-app-domain.com/api/auth/callback`
   - Logout URL: `https://your-app-domain.com`
   - Web Origin: `https://your-app-domain.com`

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local` with values from `.env.example`:

### Auth0

- `AUTH0_SECRET`
- `AUTH0_BASE_URL`
- `AUTH0_ISSUER_BASE_URL`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`

### Vercel KV

Use either:

- `KV_URL` (single Redis connection string), or
- `KV_REST_API_URL` + `KV_REST_API_TOKEN`

Optional:

- `KV_REST_API_READ_ONLY_TOKEN`

> Runtime validation runs when API/auth routes load and throws a clear error in development if required variables are missing.

## Auth smoke checklist

Run this checklist before doing feature work:

1. Open the app and click **Log in**.
2. Confirm you are redirected to Auth0, then back to the app without an error.
3. Call `GET /api/accounts` while logged in and confirm it returns `200`.
4. Click **Log out** and confirm you are returned to the app.
5. Call `GET /api/accounts` after logout and confirm it returns `401 Unauthorized`.

## Useful scripts

```bash
npm run dev
npm run build
npm run lint
npm run start
```
