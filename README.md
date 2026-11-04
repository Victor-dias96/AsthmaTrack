This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

Unit and component tests use Vitest. Component behavior uses React Testing Library.

Prefer semantic accessible queries such as `getByRole`. Async Server Components belong to end-to-end tests.

Unit and component tests:

```bash
npm run test:run
```

The same suite on one worker, which CI uses when the machine is short on memory:

```bash
npm run test:run -- --maxWorkers=1 --fileParallelism=false
```

Watch for changes:

```bash
npm test
```

Database tests use pgTAP against local Supabase. Start Docker, then `npx supabase start`. Do not point these tests at a hosted project.

```bash
npx supabase test db
```

Playwright covers public smoke tests, authenticated patient and medical-team flows, keyboard navigation, visual feedback, screen-reader semantics, and responsive layout in Chromium. Authenticated tests sign in through the local login form using gitignored `.env.e2e.local`. The E2E loader rejects any non-loopback Supabase URL.

Playwright E2E:

```bash
npm run test:e2e
```

Visible browser:

```bash
npm run test:e2e:headed
```

Playwright UI:

```bash
npm run test:e2e:ui
```

Local report:

```bash
npm run test:e2e:report
```

Chromium installation when required:

```bash
npx playwright install chromium
```

GitHub Actions workflow `AsthmaTrack CI` (`.github/workflows/ci.yml`) runs on pull requests, pushes to `main`, and manual dispatch. It checks lint, the Next.js build, Vitest, a clean local migration with pgTAP, and Chromium Playwright. CI starts Supabase on the runner and creates disposable local fixtures. It does not deploy the application or connect to hosted Supabase.

These branch-protection settings are recommended and are not changed by the workflow:

- Require a pull request before merging
- Require branches to be up to date
- Require `AsthmaTrack CI / quality`, `AsthmaTrack CI / unit-tests`, `AsthmaTrack CI / database-tests`, and `AsthmaTrack CI / e2e-tests`
- Require conversation resolution
- Prevent force pushes to `main`

Troubleshooting:

- Docker has to be running for local Supabase, pgTAP, and authenticated browser tests. Start Docker, then `npx supabase start`. Ports 54321–54327 need to be free.
- If Playwright cannot find Chromium, run `npx playwright install chromium`. CI installs Chromium with `npx playwright install --with-deps chromium`.
- If the machine runs out of memory, keep Vitest on `--maxWorkers=1 --fileParallelism=false` and Playwright on `--workers=1`.

## Preview deployments

Every pull request is intended to receive one Vercel Preview URL. A later commit on that pull request updates the same preview. The deployment builds the pull request commit and does not serve a production domain.

Preview is not production. Do not enter real names, real email addresses, real patient records, or real health values in a preview.

### Isolated backend

Preview must use an isolated Supabase backend. The preferred backend is a Supabase Preview Branch:

- Opening a pull request creates one ephemeral branch.
- `supabase/migrations` builds the schema.
- Production rows are not copied.
- `supabase/seed.sql` is intentionally empty, so the branch stays data-less.
- Closing or merging the pull request deletes the branch.

Do not point Preview at the production Supabase project. Reviewers who need a signed-in session create a fictional account on that branch. Do not copy local end-to-end credentials into Preview, and do not put passwords in pull request comments.

This repository cannot see whether the hosted Supabase plan includes Branching. If Branching is unavailable, stop. A dedicated non-production Supabase project is the only fallback, and it needs an explicit decision before anyone creates it. Parallel pull requests would share that one database. Do not use production as a substitute.

There is no Vercel project linked from this repository. `.vercel/` is gitignored. GitHub has no deployment for this repository. Vercel treats the first deployment of a new project as production and builds it with Production environment variables, even when the command asks for a preview. Do not import the Git repository and do not run `vercel` or `vercel --prod` until a production deployment is an accepted step.

### Project settings, once a Vercel project exists

Use the existing project. Do not create a second one.

- Repository: `Victor-dias96/AsthmaTrack`
- Framework: Next.js
- Root directory: repository root
- Package manager: npm, respecting `package-lock.json` (`npm ci` or Vercel's npm install)
- Build command: `npm run build`
- Output: Next.js default
- Node.js: 24.x, matching the CI Node version 24.19.0
- Production branch: `main`
- Automatic Preview deployments: enabled for pull requests
- Production custom domain: leave unset here
- Playwright, pgTAP, and local Supabase stay in `.github/workflows/ci.yml`

No `vercel.json` is required. Next.js is detected from the repository.

### Preview environment variables

Set these names in the Vercel Preview environment only. Values come from the matching Supabase Preview Branch through the Supabase Vercel integration. Do not copy Production values into Preview, and do not commit values.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The application reads only those two names. Do not add a secret key or a service-role key to any `NEXT_PUBLIC_` variable. The integration may also store private names such as `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `POSTGRES_URL`. Leave those unread by application code, and do not print them. A variable change applies only on a new deployment.

Check the Preview host of `NEXT_PUBLIC_SUPABASE_URL` against the preview branch host. It must not be the production project host. Do not paste the full URL or key into a pull request.

### Authentication redirects

Password recovery already sends `redirectTo` to `{current origin}/redefinir-senha`. That page forwards `code` or a recovery `token_hash` to `/auth/callback`, which exchanges the credential and returns to `/redefinir-senha`. Login, logout, and role routing stay on relative paths.

Registration now sends `emailRedirectTo` to `{current origin}/login` when the origin is loopback HTTP or any HTTPS origin. Hosted HTTP origins are rejected. `/login` is used so confirmation does not enter the password-recovery callback.

`supabase/config.toml` keeps local Auth at `http://127.0.0.1:3000`. Supabase reapplies that file on a Preview Branch, so the branch Site URL becomes the loopback URL. This repository has no `[remotes]` block, so the file does not change production Auth. After the Vercel team or personal-account slug is known, add these HTTPS allowlist entries on the Preview branch and in `additional_redirect_urls` so the branch keeps them:

- `https://*-<vercel-team-slug>.vercel.app/auth/callback`
- `https://*-<vercel-team-slug>.vercel.app/redefinir-senha`
- `https://*-<vercel-team-slug>.vercel.app/login`

`*` does not cross `.` or `/`. Do not add `https://*.vercel.app/**`, `https://**.vercel.app/**`, `https://**`, or hosted HTTP redirects. Keep the local loopback entries for local development. Do not change the production Site URL. Supabase rejects a redirect that misses the allowlist and falls back to the Site URL.

The default Supabase confirmation and recovery templates must keep using `{{ .ConfirmationURL }}` or `{{ .RedirectTo }}`. A template that only uses `{{ .SiteURL }}` sends the link to the Site URL instead of the preview origin.

### Access, build, and PWA

Keep Vercel Deployment Protection enabled for Preview. Reviewers belong to the project team. The application is not a public demo. Protection does not replace AsthmaTrack authentication or row-level security. Do not commit a bypass token or paste one into a pull request.

The Vercel build runs `npm run build` only. It does not install Chromium, run Playwright, run pgTAP, start local Supabase, or apply migrations. GitHub Actions remains the test runner. Vercel posts a failed deployment status on the pull request when the build fails. This repository does not add a second deployment workflow.

The manifest `id`, `start_url`, and `scope` are `/`. `/sw.js` is same-origin. Cache storage is already isolated by origin, so a preview cache cannot be read by another origin. The worker does not cache authenticated pages, auth routes, API routes, PDFs, or Supabase responses. Do not install a preview deployment as an app.

### Validation checklist

Run this only after Branching, the Vercel project, Preview variables, and the redirect allowlist are in place, and only on a pull request you approve:

1. Push a branch and open a pull request into `main`.
2. Confirm Vercel adds one Preview deployment and a unique HTTPS URL for that pull request.
3. Confirm the deployment environment is Preview.
4. Confirm the Supabase host belongs to the preview branch and is not the production host, without copying the full value.
5. Open `/login`, `/cadastro`, `/recuperar-senha`, `/offline`, `/manifest.webmanifest`, and `/sw.js`.
6. Confirm anonymous visits to `/paciente` and `/equipe-medica` return to `/login`.
7. If a signed-in check is required, register only a fictional account.
8. Close the pull request and confirm the Supabase Preview Branch is deleted.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome.
