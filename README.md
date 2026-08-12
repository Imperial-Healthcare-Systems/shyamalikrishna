# Shyamali Krishna Automobile — Next.js

Full Next.js 15 (App Router) conversion of the Vite + React Router SPA that
lives in `../project`.

## Run

    npm install
    npm run dev      # http://localhost:3000
    npm run build && npm start

## Required environment

`.env.local`:

| Var                             | Exposed to browser | Purpose                        |
| ------------------------------- | ------------------ | ------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | yes                | Public reads + storage upload  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes                | Public reads + storage upload  |
| `SUPABASE_SERVICE_ROLE_KEY`     | **no**             | `/api/admin` only              |
| `ADMIN_PASSWORD`                | **no**             | `/api/admin/login`             |

The last two are blank in the committed `.env.local` and must be filled in
before the admin panel works. `/api/admin/login` returns 503 if
`ADMIN_PASSWORD` is unset — it never falls back to a baked-in password.

## What changed from the Vite build

| Vite / React Router                | Next.js                                            |
| ---------------------------------- | -------------------------------------------------- |
| `src/App.tsx` route table          | `src/app/**/page.tsx` file-system routes            |
| `src/pages/`                       | `src/views/` (`src/pages/` means Pages Router)      |
| `<Link to>`                        | `next/link` `<Link href>`                           |
| `useNavigate()` / `useLocation()`  | `useRouter()` / `usePathname()`                     |
| `useSearchParams()` tuple          | object + `<Suspense>` wrapper on prerendered routes |
| `<Navigate>` in ProtectedRoute     | `router.replace()` in an effect                     |
| nested `<Routes>` in AdminLayout   | `src/app/admin/**` segments; shell takes `children` |
| `useSEO()` client effect           | `metadata` / `generateMetadata` per route           |
| browser-only Supabase fetches      | `src/lib/data.ts` server fetches + `initial*` props |
| Supabase Edge Function (Deno)      | `src/app/api/admin/[...path]/route.ts`              |
| `import.meta.env.VITE_*`           | `process.env.NEXT_PUBLIC_*`                         |
| `index.html`                       | `src/app/layout.tsx`                                |

## Rendering model

Route segments are **server components**. Each one fetches through
`src/lib/data.ts` (React-`cache()`d, so a page and its `generateMetadata`
share one query) and passes the result to the client view as `initial*` props.
`useAsync` starts seeded and skips the mount fetch, so nothing is fetched
twice; changing a filter in the browser still refetches normally.

Result: catalogue content is in the HTML with JavaScript disabled, and unknown
slugs return a real HTTP 404 via `notFound()` rather than a client-rendered
"not found" panel.

`useSEO()` is still called inside the views. Title and description now come
from server metadata; the hook is retained because it also injects the
per-page JSON-LD structured data, which has not been moved server-side yet.

## Admin API

The Deno edge function was moved in-process at `/api/admin/*`. The ~45 route
handlers are unchanged — only the runtime preamble and entrypoint differ. The
service-role client is constructed lazily so `next build` can collect route
metadata without runtime secrets.

Consequences: the service-role key stays on the server, there is no separate
function to deploy, and CORS is gone because the API is same-origin.

**Deploying this app does not retire the edge function** — `../project` still
calls it. Delete the function only after this app is the live site.

## Known gaps

- JSON-LD structured data is still injected client-side by `useSEO`.
- `next/image` is not used; images are plain `<img>` from `public/`.
- Supabase warns that Node 20 is deprecated; this builds on Node 20 but
  Node 22+ is the supported target.
