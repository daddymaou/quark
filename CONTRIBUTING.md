# Contributing to QUARK

Thanks for your interest in contributing. This document explains the workflow and standards for this repository.

## Local Setup

1. **Prerequisites** — Node.js v20+ (v22 or v24 recommended) and npm v10+.
2. **Install**:
   ```bash
   git clone https://github.com/thepalearchitects/quark.git
   cd quark
   npm install
   ```
3. **Environment** — copy `.env.example` to `.env.local` and fill in real keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   RESEND_API_KEY=re_...
   DATABASE_URL=postgresql://...
   ```
   The app boots without some of these (Clerk and the database degrade gracefully in dev), but you need all of them for a fully working local instance.
4. **Run**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Workflow

1. **Fork the repository** and create a feature branch from `master`:
   ```bash
   git checkout -b feat/short-description
   ```
2. **Make your changes** in focused, logical commits. Each commit must have a clear, professional message (see below).
3. **Verify locally** before pushing:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   ```
4. **Push** to your fork and open a Pull Request against `thepalearchitects/quark:master`.

## Branch Naming

| Prefix   | Use case                          |
| -------- | --------------------------------- |
| `feat/`  | New feature                       |
| `fix/`   | Bug fix                           |
| `chore/` | Maintenance, tooling, repo files  |
| `docs/`  | Documentation only                |
| `refactor/` | Code change without behavior change |
| `test/`  | Test additions or fixes           |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <imperative summary, lowercase, no period>

<body: what changed and why, wrapped at ~72 characters>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`.

Examples:
- `fix: return owner-scoped pen list from GET /api/projects`
- `feat: add comments section to public pen view`
- `chore: add Apache-2.0 license and security policy`

## Pull Request Guidelines

- Keep PRs focused — one concern per PR
- Roughly 10 files per commit; split large work into sequential commits
- Fill out the PR template completely
- All CI checks must pass (lint, typecheck, secret scan, audit)
- Database schema changes require a new Drizzle migration (`npm run db:generate`)

## Code Standards

- TypeScript strict mode; no `any` without justification
- Server-side authorization on every mutating API route — never trust the client
- No mock data in application code paths; everything reads from the real API/database
- Tailwind v4 with the existing design tokens in `src/styles/tokens.ts` — no one-off colors
- Route handlers return the `{ success, data, error }` envelope from `src/lib/api.ts`

## Testing

- Backend smoke tests live in `tests/` and run against a live Neon database
- Set `DATABASE_URL` in `.env.local` to run them; suites skip automatically without it
- New API routes should ship with tests covering the happy path and the authorization failure path

## Questions

Open a Discussion or an issue and a maintainer will respond.
