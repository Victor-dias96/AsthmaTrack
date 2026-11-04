# Production readiness

Issue 140 prepares AsthmaTrack for a later production deployment. It does not publish the MVP. Issue 141 is the only issue that may deploy. Issue 142 is the only issue that may add technical monitoring.

Nothing in this document was changed in the Vercel or Supabase dashboards. A status of **pending** was not observable from the repository. A status of **blocked** stops Issue 141.

## Environment separation

| Environment | Where it runs | Supabase | Allowed data |
| --- | --- | --- | --- |
| Local development | Developer machine | Local or a dedicated development project | Developer-owned fictional data |
| Local E2E | Developer machine and GitHub Actions | Loopback only | Disposable fictional fixtures created by CI or the local E2E setup |
| Preview | Vercel Preview for one pull request | Supabase Preview Branch, or one explicitly approved non-production project | Fictional reviewer accounts only |
| Production | Vercel Production from `main` | One dedicated production project | Real accounts only after privacy and email delivery are ready. Launch may start from an empty database |

Rules:

- A missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` throws. The application does not select another environment.
- `VERCEL_ENV=production` and `VERCEL_ENV=preview` reject a loopback Supabase URL, any non-HTTPS Supabase URL, and a URL that carries a username, password, query, or hash.
- A page whose hostname is not loopback also rejects those URLs, including in the browser.
- Local development and local E2E keep loopback available because `VERCEL_ENV` is unset and the page hostname is loopback.
- Preview must not receive Production values. Production must not receive Preview, localhost, or E2E values.
- Local E2E already rejects a non-loopback Supabase URL in its own loader. Do not point that loader at a hosted project.
- `supabase/seed.sql` is empty. Do not apply it to Production.
- `scripts/setup-e2e-fixtures.sql` is not a migration. CI deletes the generated E2E env file and auth storage after the job.

Status: **verified** in repository code and CI fixture handling. Hosted separation is **blocked** until the dashboard checks below pass.

## Production domain

Status: **blocked**.

No canonical production URL has been selected. Do not invent one, purchase a domain, or edit DNS from this issue. Do not put a Preview URL, a branch URL, or localhost into the production Auth Site URL.

Issue 141 needs one HTTPS canonical origin. If a custom domain is chosen, also decide apex versus `www` and redirect the other hostname. A Vercel-generated production hostname is an acceptable temporary canonical origin only when it is chosen explicitly and Auth is configured to that exact origin. The hostname is not chosen here.

## Vercel project

Status: **pending** for every dashboard setting. Repository evidence:

- No `vercel.json` and no `.vercelignore`.
- `.vercel/` is gitignored and is not present in this workspace.
- GitHub has no deployment records for `Victor-dias96/AsthmaTrack`.
- The first import of this repository, and the first `vercel` command, can create a Production deployment even when a Preview was intended. Do not import the repository and do not run `vercel` or `vercel --prod` in Issue 140.
- Pushes to `main` currently run GitHub Actions only. They do not deploy. If Vercel is connected later with Production Branch `main`, a later push deploys Production automatically. Leave that connection for Issue 141, after the gates in this document pass.

When the project is created or confirmed, record only pass, fail, pending, or blocked. Do not paste values into chat.

Expected settings:

- One project, not a second copy
- Git repository `Victor-dias96/AsthmaTrack`
- Root directory: repository root
- Framework: Next.js
- Install: Vercel npm install using `package-lock.json`, or `npm ci`
- Build: `npm run build`
- Output: Next.js default
- Node.js: 24.x, matching CI Node `24.19.0`
- Production branch: `main`
- Preview deployments: pull requests only, with the isolated Preview variables from the README
- Production variables: Production scope only
- Custom domain: unset until the domain decision above
- Deployment Protection: enabled for Preview. Production protection is a product decision in Issue 141
- Function region: unset. When the dashboard offers a region near Supabase `sa-east-1`, prefer that option. Do not invent a region name that the dashboard does not show

## Production variables

The application reads only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No site-origin variable is required. Registration and password recovery use the current page origin.

Status: **blocked**. No Vercel project is linked, so no Production values are configured.

Scope rules for Issue 141:

- Put the production project URL and publishable key in Production only.
- Leave Preview on its own branch or non-production project.
- Do not copy `.env.local`, `.env.e2e.local`, passwords, database URLs, JWT secrets, or secret keys.
- Do not create a `NEXT_PUBLIC_` variable for a secret.
- A variable change applies only to a new deployment. Issue 141 must redeploy after the final values are saved.
- The publishable key must not be a secret key. The client refuses a key that uses the secret prefix or the privileged database role name.

## Supabase project

The local CLI link record points at one hosted project:

- Display name: `Victor-dias96's Project`
- Region recorded from the pooler hostname: `sa-east-1`
- Postgres version recorded by the CLI: `17.6.1.155`
- Repository database major version: 17

Status of that record: **pending** as the production identity. The display name is the provider default. Confirm in the dashboard that this is the project Issue 141 should use before putting its URL into Vercel Production. Do not create a second project from this issue. Do not migrate the database to another region. `sa-east-1` already serves Brazil. Changing region later means a new project and a planned migration.

This audit did not query project status, database rows, Auth settings, advisors, backups, or network restrictions. A linked `migration list` was not used as evidence: the CLI tried to initialize a login role and the connection timed out. No migration was applied and the command was not retried.

Dashboard checks still required, each as pass, fail, pending, or blocked:

- Project status, database status, API status, and Auth status are healthy
- Storage is unused by the application; confirm it is not required
- SSL enforcement is on
- Network restrictions are understood before enabling them, because Vercel must still reach the API
- The Data API exposes `public` and `graphql_public` only, matching `supabase/config.toml`
- Realtime publication does not add patient tables unless a later issue implements it
- Security Advisor has no unresolved critical finding
- Performance Advisor has no finding that blocks launch
- Backups or point-in-time recovery match the selected plan
- The project contains no E2E accounts, no `example.com` users, no fixture PEF rows, and no copied Preview rows

Do not paste the project ref, database password, or keys.

## Migration history

Repository migrations, in order:

1. `20260812190609_create_profiles.sql`
2. `20260812192031_create_profile_trigger_and_rls.sql`
3. `20260825202000_create_daily_records.sql`
4. `20260826153200_add_daily_records_rls.sql`
5. `20260904150000_create_patient_access_authorizations.sql`
6. `20260904160000_add_patient_access_authorization_policies.sql`
7. `20260905103000_add_professional_lookup_by_code.sql`
8. `20260906120000_add_patient_active_access_authorizations_lookup.sql`
9. `20260908140000_add_medical_authorized_patients_lookup.sql`
10. `20260908180000_add_medical_authorized_patient_latest_record.sql`
11. `20260908190000_add_medical_authorized_patient_dashboard.sql`
12. `20261026170000_restrict_daily_records_policies_to_patient_role.sql`

Included in that history: profiles, the patient-role daily-record policies, authorization tables and policies, professional-code lookup, and every medical read RPC. No migration inserts accounts, passwords, or health rows. Schema changes drop and recreate policies and replace `get_medical_authorized_patients` so its return type can change. They do not drop patient tables.

Remote history: **blocked**. Compare the dashboard migration list, read-only, with the twelve versions above. Issue 141 stops if any version exists on only one side, if a version was marked applied without the objects existing, or if objects exist without a migration.

Clean replay: **verified** for a disposable local database. GitHub Actions job `database-tests` on commit `67a30f8` started a fresh local Supabase, applied the migrations, and passed pgTAP. That job does not prove the hosted project. The same workflow's `e2e-tests` job was cancelled, so CI is not green yet. Do not reset the local E2E database and do not run `supabase db push`, `migration repair`, or `db reset` against the hosted project from Issue 140.

## RLS, grants, and security definer

Repository intent is **verified** by the migrations and by the pgTAP suite that CI applied to a clean database. The hosted definitions are **pending**. Any remote mismatch is a launch blocker. Do not treat pgTAP as proof of the hosted project.

Exposed tables:

- `public.profiles`: RLS on. Authenticated users select and update only `id = auth.uid()`. `anon` has no privileges. A trigger restores `id`, `role`, and `professional_code` when the current user is `authenticated`.
- `public.daily_records`: RLS on. Select, insert, update, and delete require `patient_id = auth.uid()` and `private.profile_has_role(..., 'patient')`. `anon` has no privileges. There is no medical table policy.
- `public.patient_access_authorizations`: RLS on. Patients view their rows, insert `patient_id` and `professional_id` for a medical profile, and revoke by updating `revoked_at`. Professionals can select only their own active rows. No delete grant. `anon` has no privileges.

There is no `using (true)` or `with check (true)` policy and no public health-data table. Medical reads go through `get_medical_authorized_patients`, `get_medical_authorized_patient_latest_records`, and `get_medical_authorized_patient_period_records`. Those functions are `security definer`, `stable`, `search_path = public`, filter `auth.uid()` and an active authorization, and return no notes and no email. `anon` and `public` cannot execute them. Revocation is checked on the next call because `revoked_at is null` is part of the function body.

`find_medical_professional_by_code` is an exact-match lookup and returns only `id` and `full_name`. `get_patient_active_access_authorizations` also requires `auth.uid()` to equal the patient argument.

`private.profile_has_role` returns a boolean. `private` is not in the Data API schemas. `private.generate_professional_code` is revoked from `public`, `anon`, and `authenticated`.

Trigger functions `handle_new_user`, `update_updated_at_column`, and `assign_professional_code` are `security definer` with `search_path = public`. They return `trigger`, so PostgREST does not expose them as RPCs. Their `EXECUTE` grants are not explicitly revoked. That is a follow-up hardening migration, not a confirmed Data API defect. Confirm Security Advisor does not flag them.

## Duplicate-id limitation

Status: **accepted, not a launch blocker**.

`authenticated` may insert and update every column of `public.daily_records`. RLS still limits rows to the caller and requires the patient role, so a medical user cannot write records and a patient cannot read or overwrite another patient's row. A patient who already knows another record's UUID can attempt an insert with that `id` and learn from the unique-violation error that the id exists. The error does not return health data. Record ids are random and are not listed by the medical RPCs.

Do not ship a repair in Issue 140. A later forward-only migration can revoke table-wide insert and update, then grant insert and update only on the columns the forms send, excluding `id`. Apply that only after review, on a disposable database first.

## Auth, email, and signup

`supabase/config.toml` configures local Auth only. This repository has no `[remotes]` block, so the file does not change the hosted project. Local values are not production evidence:

- Local Site URL is loopback
- Local email confirmation is off
- Local signup is on
- Local anonymous and SMS signup are off
- Local minimum password length is 6, with no extra complexity rule
- Local CAPTCHA is not configured
- Local SMTP is not configured

Hosted Auth: **blocked** until the canonical origin exists.

Cutover, only in Issue 141, after the domain is chosen and DNS or the Vercel hostname is ready:

1. Deploy the application to that exact HTTPS origin.
2. Set the Auth Site URL to that origin, with no path.
3. Set the production redirect allowlist to the exact URLs the code uses:
   - `https://<canonical-origin>/auth/callback`
   - `https://<canonical-origin>/redefinir-senha`
   - `https://<canonical-origin>/login`
4. Remove abandoned and broad wildcard entries from the production project. Do not allow hosted HTTP. Do not add `https://*.vercel.app/**`.
5. Keep loopback redirects only if local development still uses this same production project. A separate development project is preferable.
6. Confirm the confirmation and recovery templates still use `{{ .ConfirmationURL }}` or `{{ .RedirectTo }}`, and that neither template contains localhost.

Registration sends `emailRedirectTo` to `{current origin}/login` for loopback HTTP and for any HTTPS origin. Hosted HTTP origins are rejected. Recovery sends `redirectTo` to `{current origin}/redefinir-senha`. `/redefinir-senha` forwards `code` or a recovery `token_hash` to `/auth/callback`, which exchanges it and returns to `/redefinir-senha` without leaving the token in the page query. The recovery form uses one generic success message.

Public signup is implemented at `/cadastro` and is intentional for the product. It is not safe to open while confirmation email cannot be delivered. Anonymous sign-in, phone sign-in, and OAuth are not used by the application. The hosted project should keep those providers disabled. Minimum length 6 matches the registration and reset forms. Raising it in Auth without changing the forms would reject valid UI submissions.

SMTP: **blocked** for a public launch. No production sender is configured in the repository, and the hosted provider was not verified. Do not use the default Supabase mailer for a public launch without an explicit review of its limits. Do not commit SMTP credentials. Issue 141 may deploy the site only if public registration stays closed until SPF, DKIM, DMARC, the from-address, bounce handling, and a fictional delivery test are done. Do not send that test without approval, and do not use a real patient's account.

Rate limits and CAPTCHA on the hosted project are **pending**. Do not load-test Production. Exercise abuse controls on Preview or local Supabase. Professional lookup stays exact-match. There is no directory search.

## Data policy

Production must not contain:

- local E2E accounts or storage-state files
- `example.com` fixture users
- fixture PEF rows
- local professional codes copied from E2E
- Preview rows
- development notes
- `supabase/seed.sql`, unless a later change is reviewed and approved
- real patient data before privacy and operational approval

An empty production database is a valid launch state. This audit did not count hosted rows. Emptiness is **pending**. If fixture rows are later found, report the count and category only, then delete them manually in the dashboard. Do not run cleanup SQL from Issue 140.

## Cache, PWA, and privacy

Status: **verified** in source. Real-device production behavior is **pending** until Issue 141.

- `/sw.js` is same-origin. The manifest `id`, `start_url`, and `scope` are `/`.
- Precache is the offline page, the manifest, and public icons.
- The worker does not cache another origin, so Supabase responses stay out of Cache Storage.
- It skips authenticated, auth, API, PDF, and router-data requests, and any response marked `private` or `no-store`.
- Patient and medical pages are dynamic. The PDF route is `force-dynamic`, Node.js, `private, no-store`, and `nosniff`. The filename is `relatorio-asthmatrack-<days>-dias.pdf` with no patient identifier.
- Logout ends the Supabase session and returns to `/login`. It does not need to delete private documents from Cache Storage because those documents are not written there. After launch, confirm in the browser that Cache Storage names are only `asthmatrack-offline-v2` and `asthmatrack-static-v2`.

Application source has no `console.log` or `console.error` outside tests. Auth and data errors shown to the user are generic. Do not add health values, emails, tokens, or ids to logs. Issue 142 must keep that boundary when monitoring is added. This issue does not claim legal compliance.

## Headers and transport

Vercel serves HTTPS. The app sets `Cache-Control` on `/sw.js` and `Cache-Control` plus `X-Content-Type-Options` on the PDF route. HSTS, CSP, `Referrer-Policy`, `Permissions-Policy`, and frame protection are not set in the repository.

Status: **pending** as a follow-up, not a reason to add headers in Issue 140. Do not add HSTS, `includeSubDomains`, or preload before the final hostname and subdomain policy exist. Do not deploy a new CSP until it has been tested with Next.js and Supabase. A report-only CSP can wait until after the first controlled deployment.

## Backup and rollback

Application rollback, for Issue 141:

- Keep the previous Vercel Production deployment available to promote.
- A git revert rolls the application forward to an older commit. It does not undo database migrations.
- Abort before DNS cutover if the build, Auth redirect, or smoke checks fail.
- After promotion, watch the same smoke list for one validation window before inviting real users.

Database rollback:

- Prefer a forward fix. Do not add down migrations that delete health data.
- Take a backup before any later migration that rewrites or deletes rows. The current twelve migrations do not delete patient rows.
- Restore only from the provider's backup or point-in-time recovery for this project, and only with an explicit decision. Do not rehearse a restore in Issue 140.

Backup availability on the selected plan is **pending**. Issue 141 does not start until that path is known.

## Issue 141 gates

Required before deployment:

- `main` is the commit that passed CI, with a clean worktree
- CI is green, including `database-tests` and `e2e-tests`
- Preview was validated on an isolated backend
- One production domain is decided
- The production Supabase project is confirmed, in `sa-east-1` unless a new project is explicitly approved
- Preview and Production use different Supabase backends
- Production variables exist, are scoped to Production, and a new deployment is made after the last edit
- Hosted migration history matches the twelve repository versions
- Clean replay evidence is still the passing CI `database-tests` job, or a newer one on the same commit
- Hosted RLS, grants, and security-definer functions match this document
- Security Advisor has no unresolved critical finding
- Auth Site URL and the three exact redirect URLs are ready for the chosen origin
- Email confirmation stays intentional
- SMTP is production-ready, or public signup is deliberately left closed
- Password recovery has a written test plan and no real account is used without approval
- Production has no E2E fixtures
- Backup or restore path is known
- This rollback plan is still accurate
- Production build is green and the browser bundle has no secret
- Private caching still matches this document

Recommended, not required:

- Custom domain
- CAPTCHA
- MFA for the organization owner
- Network restrictions after Vercel access is understood
- Point-in-time recovery if the plan offers it
- Report-only CSP
- Cost alerting
- Column-level `daily_records` grants for the duplicate-id limitation
- Explicit `EXECUTE` revoke on trigger functions
- Password length above 6, together with the same change in the forms
- Leaked-password protection if the plan offers it

## Issue 141 deployment steps

Do not run these during Issue 140.

1. Re-read the gates. Stop on any blocker.
2. Confirm the Vercel project, Production Branch `main`, and that Preview variables are still isolated.
3. Save Production variables. Redeploy only when Issue 141 says to deploy.
4. Compare hosted migration history. Apply pending migrations only with explicit approval, and never with `migration repair`.
5. Set Auth Site URL and the three redirect URLs for the canonical origin.
6. If SMTP is not ready, disable public signup or keep the registration route unreachable to the public until it is.
7. Deploy the selected commit once.
8. Smoke-test with a fictional account only after approval: `/login`, `/cadastro` if signup is open, `/recuperar-senha`, `/offline`, `/manifest.webmanifest`, `/sw.js`, an anonymous visit to `/paciente` and `/equipe-medica` returning to `/login`, and one patient record created only for that fictional account.
9. Check Cache Storage and that the PDF response is `private, no-store`.
10. Keep the previous deployment available until the validation window ends.

## Issue 142 boundary

Monitoring is out of scope. When it is added, it must not collect symptoms, PEF values, notes, emails, session tokens, patient ids, or request bodies. Error reporting should keep the generic messages already shown in the application.

## Manual dashboard actions

Reply with pass, fail, pending, or blocked. Do not paste values.

Vercel, after a project exists:

1. Open the single AsthmaTrack project.
2. Confirm the Git repository, root, Next.js preset, npm install, and `npm run build`.
3. Confirm Production Branch is `main` and that opening the project did not create a Production deployment.
4. Confirm Production variable names and scopes, and that Preview values are different.
5. Confirm the domain is still the undecided state, or record the chosen canonical origin without pasting unrelated secrets.
6. Confirm Deployment Protection for Preview.

Supabase, on the intended production project:

1. Open the project and confirm the display name and region `sa-east-1`.
2. Confirm project, database, API, and Auth status.
3. Read migration history and compare it with the twelve versions.
4. Run Security Advisor and Performance Advisor.
5. Confirm RLS and grants for `profiles`, `daily_records`, and `patient_access_authorizations`.
6. Confirm Site URL, redirects, email confirmation, SMTP, password policy, and rate limits.
7. Confirm anonymous, phone, and unused OAuth providers are disabled.
8. Confirm organization MFA, SSL, network restrictions, and backups or PITR.
9. Confirm there is no fixture data, by count and category only.
