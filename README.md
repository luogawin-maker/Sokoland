# HarvestWire — CMS & API Backend

Strapi v4 (Node.js) on PostgreSQL, exposing both REST and GraphQL, built for a global agribusiness/food-tech publication.

## Stack

- **Strapi v4** — admin panel, content modeling, RBAC, media library
- **PostgreSQL** — primary datastore, plus native full-text search via `tsvector`
- **GraphQL** (`@strapi/plugin-graphql`) — optimized query layer for the Next.js frontend
- **Cloudinary** (`@strapi/provider-upload-cloudinary`) — automatic image compression/format optimization on upload

## Getting started

```bash
cp .env.example .env      # fill in real secrets — see "Generating secrets" below
npm install
npm run develop           # starts Strapi with admin panel + auto-reload
```

First run opens `http://localhost:1337/admin` to create your Super Admin account.

### Generating secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run this four times for `APP_KEYS` (comma-separated) and once each for `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`. Never commit `.env`.

## Content model

| Content type | Purpose | Key fields |
|---|---|---|
| `Article` | A story | `title`, `slug` (auto), `content` (richtext), `excerpt`, `featuredImage`, `author`, `category`, `tags`, `reviewStatus` (draft/in_review/published), `publishedAt` (Strapi's native draft/publish toggle) |
| `Author` | Byline | `name`, `bio`, `avatar`, `role`, `socialLinks` (repeatable component), optional link to a `users-permissions` user account |
| `Category` | Sector/sub-sector | `name`, `slug`, `description`, `parent` (self-relation — e.g. AgTech → Drones) |
| `Tag` | Cross-cutting label | `name`, `slug` |
| `MarketData` | Commodity ticker feed | `commodityName`, `symbol`, `price`, `changePercent`, `region`, `date` |

**Two different "status" concepts, on purpose:** `reviewStatus` tracks where a piece sits in the newsroom workflow (draft → in review → published editorially), while `publishedAt` (Strapi's built-in Draft & Publish system field) controls whether the API actually returns it. A story can be marked `reviewStatus: published` by an Editor internally and still be scheduled — it only becomes publicly fetchable once `publishedAt` is set. See `sql/reference-schema.sql` for the full annotated table definitions.

## RBAC — Author / Editor / Administrator

Strapi ships three admin-panel roles out of the box: **Super Admin**, **Editor**, and **Author** — which map directly onto "Administrator / Editor / Author" from the brief, so no custom role plugin is needed.

- **Author** — create and edit their own articles; cannot publish, delete, or manage taxonomy/market data/users.
- **Editor** — full CRUD + publish/unpublish across Article, Category, Tag, and MarketData; no access to admin user management or server settings.
- **Super Admin (Administrator)** — everything, including inviting/removing admin users.

`src/index.js` seeds sensible defaults for Editor/Author permissions on boot (see `seedAdminRolePermissions`). **Important:** the specific admin permission-action strings it uses (`plugin::content-manager.explorer.*`) reflect Strapi v4's internal permission model at the time this was written and aren't a public, versioned API — after your first boot, open **Settings → Administration Panel → Roles** and confirm the checkboxes landed where you'd expect, adjusting by hand if not. Treat the script as a time-saving starting point, not a black box.

Author-level data scoping (an Author only ever sees their own articles) is enforced in two places: the admin-panel permission conditions above, and `article.find()` in `controllers/article.js` for any API token issued under an Author-linked account.

## Frontend auth (JWT-based API token)

The Next.js frontend should **not** use the `users-permissions` end-user JWT flow — there are no end-user accounts on this site. Instead:

1. In the admin panel, go to **Settings → API Tokens → Create new API Token**.
2. Name it `nextjs-frontend`, set **Token type = Read-only**, duration = unlimited or your rotation policy.
3. Strapi issues a signed JWT-format bearer token. Put it in the frontend's env as `STRAPI_API_TOKEN` and send it as `Authorization: Bearer <token>` on every server-side fetch from Next.js (never expose it to the browser — keep all Strapi calls in Server Components/route handlers).
4. The Public role (used for genuinely anonymous requests, e.g. if you ever fetch client-side) is locked to `find`/`findOne` only on Article, Category, Tag, Author, and MarketData — seeded by `seedPublicApiPermissions` in `src/index.js`.

Rotate the token periodically via the same screen; revoking is instant.

## Full-text search

Postgres-native, no external search service required:

- `src/index.js` bootstrap adds a `search_vector tsvector` column to `articles`, a trigger that keeps it current (weighted: title > excerpt > body), and a GIN index.
- **REST:** `GET /api/articles/search?q=drought+resistant&category=tech&limit=10`
- **GraphQL:** 
  ```graphql
  query {
    searchArticles(query: "drought resistant", categorySlug: "tech", limit: 10) {
      id
      title
      slug
      excerpt
      rank
    }
  }
  ```
Both are public and rate-limited (120 req/min/IP by default — see `config/middlewares.js` and `src/middlewares/rate-limit/`).

If you outgrow single-node Postgres search (typo tolerance, faceting, sub-100ms at high query volume), swap the service body in `src/api/article/services/article.js` for an Algolia client call — the controller and GraphQL resolver both call through that one service method, so nothing else needs to change.

## GraphQL

Enabled at `/graphql` with:
- `depthLimit: 8`, `amountLimit: 100` — guards against expensive nested-relation queries
- Introspection and the Playground both **off** by default outside development (`GRAPHQL_PLAYGROUND`, `GRAPHQL_INTROSPECTION` env flags)
- Standard Strapi shadow-CRUD queries for every content type (`articles`, `article`, `categories`, etc.) plus the custom `searchArticles` query

Example: fetch the homepage's featured + trending set in one round trip:

```graphql
query Homepage {
  articles(
    filters: { category: { slug: { eq: "investment" } } }
    sort: "publishedAt:desc"
    pagination: { limit: 5 }
  ) {
    data {
      id
      attributes {
        title
        slug
        excerpt
        publishedAt
        featuredImage { data { attributes { url width height } } }
        author { data { attributes { name } } }
      }
    }
  }
}
```

## Media optimization (Cloudinary)

`config/plugins.js` configures the Cloudinary upload provider with `quality: "auto"` and `fetch_format: "auto"` on every upload, plus Strapi's responsive-breakpoint generation (thumbnail/small/medium/large), so a writer dragging in a 12MB photo automatically gets compressed, format-negotiated derivatives with no manual step.

## Security checklist

- CORS restricted to `CORS_ORIGINS` (config/middlewares.js) — no wildcard origins.
- CSP `img-src`/`media-src` scoped to `res.cloudinary.com` plus self.
- Public role is read-only (see RBAC section) — even a leaked anonymous request can't write.
- Rate limiting on unauthenticated traffic via `global::rate-limit` (swap the in-memory bucket for `rate-limiter-flexible` + Redis once you run more than one Strapi instance).
- Admin self-registration disabled (`config/admin.js` `autoOpen: false`) — new admin accounts are invite-only.
- `users-permissions` public self-registration disabled — this API has no end-user signup surface.

## Deploying

Strapi builds a static admin panel bundle (`npm run build`) and runs as a standard Node process (`npm run start`) — put it behind a reverse proxy/load balancer (hence `proxy: true` in `config/server.js`), point `DATABASE_*` at a managed Postgres instance (e.g. RDS, Supabase, Neon), and set every secret in `.env.example` via your platform's secret manager rather than a committed file.
