# Career / Recruitment Management System

Built into the existing Shyamali Krishna Automobile website. It reuses the site's
Supabase database, the existing `/admin` portal and its password-only login, and
the existing design system — nothing was rebuilt or replaced.

**The point of the system:** a developer sets it up once. After that the
administrator adds job categories, locations, vacancies and closes filled roles
without anyone touching code.

---

## 1. Setup — do these three things once

### Step 1 · Run the database migration

Open **Supabase Dashboard → SQL Editor → New query**, paste the whole of
[`supabase/migrations/0001_recruitment_system.sql`](supabase/migrations/0001_recruitment_system.sql),
and run it.

It is idempotent — running it twice is safe and will not duplicate anything.

It creates the lookup tables, extends `jobs` and `job_applications`, adds admin
credential storage, creates the private `applications` storage bucket, closes an
existing security hole (see §6), and seeds the categories, the six locations,
the employment types and the three initial vacancies.

Verify with:

```sql
select title, slug, vacancies, status, location from public.jobs;
```

### Step 2 · Set the environment variables

Local: copy `.env.example` to `.env.local`.
Production: **Vercel → Project → Settings → Environment Variables**, tick
Production + Preview + Development, then trigger a **new** deployment (existing
deployments do not pick up variables added afterwards).

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Already set. Public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Already set. Public, protected by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only. Used by `/api/admin` and `/api/careers/apply`. |
| `ADMIN_PASSWORD` | yes | Bootstrap admin password. Never commit it — see §3. |
| `SMTP_HOST` | for email | e.g. `smtp.hostinger.com` |
| `SMTP_PORT` | for email | `587` (STARTTLS) or `465` (implicit TLS) |
| `SMTP_USER` | for email | `info@shyamalikrishna.com` |
| `SMTP_PASSWORD` | for email | That mailbox's password |
| `RESEND_API_KEY` | alternative | Use instead of the `SMTP_*` block if the host blocks outbound SMTP |
| `MAIL_FROM` | recommended | From address, e.g. `Shyamali Krishna Careers <info@shyamalikrishna.com>` |
| `NEXT_PUBLIC_SITE_URL` | recommended | Used for absolute links inside emails |

Never prefix a secret with `NEXT_PUBLIC_` — that inlines it into the browser bundle.

### Step 3 · Confirm the storage bucket is private

**Supabase → Storage → `applications`** must show **Private**. The migration sets
this, but confirm it. CVs are served only through short-lived signed URLs minted
for an authenticated admin; a public bucket would make every CV world-readable
by URL.

---

## 2. What the administrator can do without a developer

| Task | Where |
| --- | --- |
| Add / rename / deactivate / delete a job category | `/admin/job-categories` |
| Add / rename / deactivate / delete a location | `/admin/job-locations` |
| Add a custom employment type | `/admin/job-locations` (second section) |
| Create, edit, publish, unpublish, close, delete a job | `/admin/jobs` |
| Read applications, change status, download CVs, resend alerts | `/admin/applications` |
| Change where application alerts are emailed | `/admin/settings` |
| Change the admin password | `/admin/settings` |

Nothing in that list requires a code change or a redeploy. Published changes
reach the live site within about five minutes (ISR `revalidate = 300`).

---

## 3. Admin login and passwords

**Sign in at `/admin` with the password only — there is no username.**

The initial password is whatever `ADMIN_PASSWORD` is set to in `.env.local`
(locally) or in the host's environment variables (production). It is
deliberately not written down in this repository.

That variable is a *bootstrap*, not the permanent credential:

1. On the first successful login the server hashes the password with **scrypt**
   and stores it in `admin_credentials`.
2. From that moment on, `ADMIN_PASSWORD` is ignored entirely — the stored hash
   is authoritative.
3. Changing the password at `/admin/settings` rewrites that hash and signs every
   other session out.

The plaintext is never stored in the database, and if neither a stored hash nor
`ADMIN_PASSWORD` exists, login fails closed with a 503 rather than falling back
to anything.

### Password recovery

`/admin` → **Forgot your password?** sends a reset link to
**info@shyamalikrishna.com** (configurable at `/admin/settings` →
*Password recovery inbox*).

The recovery address is **never taken from the request** — it always comes from
the address on file, so the flow cannot be pointed at an attacker's mailbox.
The link carries a random token whose SHA-256 is what gets stored, expires in
30 minutes, works exactly once, and signs out all sessions when used. Passwords
are never emailed.

If no mail transport is configured, the "Forgot your password?" link is hidden
and the endpoint returns a clear 503 rather than pretending to send.

---

## 4. Creating a job

`/admin/jobs` → **Create Job**.

Required to *save a draft*: title and vacancy count.
Required to *publish*: title, vacancies, category, employment type, and at
least one location. Both sets are enforced on the server, not just in the form.

- **Draft** — never appears on the public site. Its URL 404s.
- **Published** — appears at `/careers` and accepts applications.
- **Closed** — disappears from the openings list; its URL still resolves and
  shows *"This position is no longer accepting applications."* Existing
  applications stay accessible.

Slugs are generated from the title and de-duplicated automatically, so two jobs
called *Salesman* become `salesman` and `salesman-2`.

**Deadlines** are evaluated in **IST (Asia/Kolkata)** and are inclusive —
applications are accepted through the end of the deadline day. The backend
rejects late submissions regardless of what the browser thinks the date is.

**Vacancy count is informational.** A job with 2 vacancies does not close itself
after 2 applications; the admin decides when it is filled.

---

## 5. How applications arrive

```
Applicant fills the form  →  POST /api/careers/apply
   ↓
1. Validate fields, job status and deadline   (server-side)
2. Validate the CV                            (extension, MIME, size, magic bytes)
3. Upload the CV to the private bucket        (server-generated filename)
4. INSERT the application                     ← the point of no return
5. Attempt the notification email
```

The applicant sees *"Your application has been submitted successfully"* as soon
as step 4 lands. **Step 5 failing never loses an application.** The row is
written first and the outcome recorded on it:

| `notification_status` | Meaning |
| --- | --- |
| `sent` | The alert email went out |
| `failed` | Saved, but the email did not send — the error is stored on the row |
| `skipped` | Saved, but no mail transport is configured |
| `pending` | Not yet attempted |

Anything not `sent` is flagged on the dashboard, at the top of
`/admin/applications`, and on the application itself, with a **Resend
notification** button. Resending only re-sends the email — it can never create
a second application record.

**Email format** — subject `New Career Application — [Job Title] — [Applicant
Name]`, body containing name, email, phone, position, category, preferred
location, experience, address, cover note and application date, with the CV
attached and `Reply-To` set to the candidate.

### Duplicate protection

Three independent layers:

1. The submit button disables while the request is in flight.
2. A ref guard blocks a second click landing before React re-renders.
3. The server treats the same email + same job within 15 minutes as the same
   submission and returns success against the existing row.

A refresh after submitting shows the confirmation screen, not a resubmission.

---

## 6. Security

- **Applications are written server-side only.** The public form previously
  inserted straight into `job_applications` with the anon key, which meant
  anyone could write a row for any `job_id` — including a draft or closed job.
  The migration revokes that access and enables RLS on the table; submissions
  now go through `/api/careers/apply`, which verifies the job exists, is
  published, and is inside its deadline before writing anything.
- **CVs are not publicly reachable.** Private bucket, server-generated UUID
  filenames, and 5-minute signed URLs minted only for an authenticated admin.
  The storage path is never sent to the browser.
- **Upload validation** checks extension, declared MIME type, byte size, and
  file signature — plus an explicit deny list for executables and a
  double-extension check, so `cv.exe.pdf` and an `.exe` renamed to `.pdf` are
  both rejected.
- **Admin API** is protected by a server-validated session token on every
  endpoint. Session validation fails closed: an unverifiable token is not a
  valid token. Logout deletes the session row rather than only clearing
  localStorage.
- **Application edits are limited to status and internal notes.** The previous
  handler spread the request body into the UPDATE, which allowed an
  authenticated request to rewrite an applicant's details or their `resume_url`.
- **Search terms are sanitised** before being interpolated into PostgREST
  `.or()` filters, where an unescaped comma would otherwise rewrite the query.
- **Rate limiting** — 5 login attempts / 15 min per IP, 3 password-reset
  requests / 30 min per IP, 8 applications / hour per IP.
- **No raw errors reach the client.** Database and configuration errors are
  logged server-side and answered with a plain sentence.
- **XSS** — React escapes all stored content on render, and everything
  interpolated into notification email HTML is escaped explicitly.
- **Admin is not indexed** — `robots.txt` disallows `/admin`, and every admin
  page also sets `noindex`.

---

## 7. Deploying

```bash
npm install
npm run build     # runs the env preflight first
```

Push to the branch Vercel is watching. If environment variables were added or
changed, trigger a **new** deployment — existing ones do not pick them up.

---

## 8. Known limitations

- **CV uploads are capped at 4 MB.** Vercel rejects request bodies over 4.5 MB
  at the edge, before any application code runs, returning an HTML error the
  form cannot parse. Capping below that line means the applicant gets a clear
  message from us. Real CVs are almost always under 2 MB. To raise it, switch
  the upload to a Supabase signed-upload URL so the file never passes through
  the serverless function — see `src/lib/server/cv-upload.ts`.
- **Email is optional but strongly recommended.** Without it, applications are
  still saved and CVs still stored, but nobody is notified until an admin opens
  the portal, and password recovery is unavailable.
- **One shared administrator account.** The portal has a single password and no
  per-user accounts, matching how it already worked. There is no audit trail of
  *which* person made a change, only that a change was made.
- **Hindi content is per-record.** Category, location and job titles have
  optional Hindi fields; anything the admin leaves blank falls back to English.
- **Applications are not exportable to CSV yet.** Leads have this; applications
  do not.
