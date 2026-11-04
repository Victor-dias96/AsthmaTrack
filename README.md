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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome.
