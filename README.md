# betterauth-turbo-starter

A fullstack monorepo reference implementation for integrating [Better Auth](https://better-auth.com) with iOS, Android (TODO), and Web clients. Built with Turborepo, Hono, Drizzle ORM, and PostgreSQL.

Use this as a reference when setting up Better Auth in new projects.

## Architecture

```
betterauth-turbo-starter/
├── apps/
│   ├── api/          # Hono API server (port 3001)
│   ├── web/          # Vite + React + Tailwind (port 3000)
│   └── ios/          # SwiftUI iOS app
├── packages/
│   ├── db/           # Drizzle ORM + PostgreSQL + Better Auth schema
│   ├── ui/           # Shared React component library
│   ├── eslint-config/
│   └── typescript-config/
├── docker-compose.yaml
└── turbo.json
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + pnpm workspaces |
| API | Hono + @hono/node-server |
| Auth | Better Auth (email OTP + JWT + Google + Apple OAuth) |
| Database | PostgreSQL 17 + Drizzle ORM |
| Web | Vite + React 19 + Tailwind v4 + shadcn/ui + React Router |
| iOS | SwiftUI + @Observable (Swift 6 / Xcode 26) |

## Auth Strategy

- **JWT-based** authentication via Better Auth's `jwt()` plugin
- **Email OTP** login (no passwords) via `emailOTP()` plugin
- **Google & Apple OAuth** configured (provide your own credentials)
- **UUID primary keys** on all auth tables (using `gen_random_uuid()`)
- Server sets JWT in cookies; web stores session in `localStorage` for offline access
- iOS stores token in `UserDefaults` for offline access

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm 9
- Docker (for PostgreSQL)
- Xcode 16+ (for iOS)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 17 with:
- User: `app_user`
- Password: `Qwerty123456`
- Database: `app_db`
- Port: `5432`

### 3. Run migrations

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
```

### 4. Configure environment

The `.env` files are already set up for local development. For OAuth, fill in your credentials in `apps/api/.env`:

```env
DATABASE_URL=postgres://app_user:Qwerty123456@localhost:5432/app_db?sslmode=disable
BETTER_AUTH_SECRET=supersecretkey-change-me-in-production
BETTER_AUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
```

### 5. Start development

```bash
# Start API + Web together
pnpm dev

# Or individually
pnpm --filter api dev     # API on :3001
pnpm --filter web dev     # Web on :3000
```

### 6. iOS

Open `apps/ios/IosBetterAuthIntegration.xcodeproj` in Xcode and run on a simulator. The API server must be running on `localhost:3001`.

## How It Works

### API Server (`apps/api`)

Better Auth is mounted at `/api/auth/*` in `src/app.ts`:

```typescript
app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});
```

Auth configuration in `src/lib/auth.ts`:

```typescript
export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    advanced: { database: { generateId: false } },  // DB generates UUIDs
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                console.log(`[OTP] ${type} -> ${email}: ${otp}`);
            },
        }),
        jwt(),
    ],
    socialProviders: { google: { ... }, apple: { ... } },
});
```

CORS is configured to allow `http://localhost:3000` with credentials.

### Database Schema (`packages/db`)

Generated via `npx @better-auth/cli generate` then modified to use UUID PKs.

**Tables:** `user`, `session`, `account`, `verification`, `jwks`

To regenerate after adding new Better Auth plugins:

```bash
cd apps/api
npx @better-auth/cli generate --config ./src/lib/auth.ts --output ../../packages/db/src/schema/auth.ts --yes
```

Then re-apply UUID changes and run `db:generate` + `db:migrate`.

### Web Client (`apps/web`)

Uses Better Auth's React client with JWT:

```typescript
export const authClient = createAuthClient({
    baseURL: "http://localhost:3001",
    plugins: [emailOTPClient(), jwtClient()],
});
```

Session is stored in `localStorage` after sign-in for offline access. Two pages:
- `/auth` — Email OTP sign-in (email input -> OTP verification)
- `/` — Home page (shows user email, sign out button)

### iOS Client (`apps/ios`)

Native SwiftUI app using `@Observable` (Swift 6). Calls the API directly via `URLSession`:

- `POST /api/auth/email-otp/send-verification-otp` — Send OTP
- `POST /api/auth/sign-in/email-otp` — Verify OTP and sign in

Token stored in `UserDefaults` for offline persistence.

## Auth API Endpoints

Better Auth exposes these endpoints automatically:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/email-otp/send-verification-otp` | Send OTP to email |
| POST | `/api/auth/sign-in/email-otp` | Sign in with email + OTP |
| GET | `/api/auth/get-session` | Get current session |
| POST | `/api/auth/sign-out` | Sign out |
| POST | `/api/auth/sign-in/social` | OAuth sign in (Google/Apple) |

## Key Decisions & Gotchas

1. **UUID PKs instead of text IDs** — Better Auth CLI generates `text("id")` by default. We changed all PKs to `uuid("id").defaultRandom()` and set `generateId: false` so Postgres generates IDs.

2. **JWT plugin requires `jwks` table** — Adding the `jwt()` plugin means you must regenerate the schema to include the `jwks` table, then migrate.

3. **CORS with credentials** — `cors()` with no options sets `Access-Control-Allow-Origin: *` which browsers reject when cookies/credentials are involved. Must specify exact origins with `credentials: true`.

4. **Schema regeneration overwrites UUID changes** — Running the Better Auth CLI again resets PKs to `text`. Re-apply UUID changes after each regeneration.

5. **Web session uses localStorage, not JWT decode** — The JWT cookie may be HttpOnly. We store user info in localStorage after sign-in for reliable client-side access and offline support.

6. **iOS simulator + localhost** — Works fine on simulator. For real devices, replace `localhost` with your machine's local IP.

## Scripts

```bash
pnpm dev                              # Start all apps
pnpm build                            # Build all apps
pnpm --filter @repo/db db:generate    # Generate Drizzle migration
pnpm --filter @repo/db db:migrate     # Apply migrations
pnpm --filter @repo/db db:studio      # Open Drizzle Studio
pnpm --filter api dev                 # Start API only
pnpm --filter web dev                 # Start web only
```
