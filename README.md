# HustleHub - Secure Freelance Marketplace

HustleHub lets **freelancers** advertise services ("gigs") and **clients** browse and book them.
Every booking creates a transaction record, and freelancers get an income summary with an estimated
tax figure. Because the platform handles credentials, transactions and income data, security is a
design requirement throughout, not an add-on.

* **Part 1** - secure auth foundation (register/login, bcrypt, JWT, HTTPS, validation, error handling).
* **Part 2** (this version) - marketplace features, RBAC, rate limiting, security headers + CSP, a React frontend, Newman and frontend tests.

See [`architecture-diagram.svg`](./architecture-diagram.svg) for the system diagram.

## 1. What changed in Part 2

| Area | Part 1 | Part 2 |
|---|---|---|
| Frontend | none | React SPA (Vite): register, login, browse/search gigs, book, manage gigs, bookings, income, admin |
| Data | users | users, **gigs, bookings, transactions** (file-backed JSON) |
| Roles | client / freelancer | client / freelancer / **admin**, enforced per endpoint |
| Auth middleware | verified JWT signature | also loads the user from the store, so the role is never trusted from the token |
| Rate limiting | none | auth, booking and general API limiters |
| Headers | `x-powered-by` off | Helmet + strict Content Security Policy, CORS allow-list, HSTS in production |
| Sanitisation | HTML-escaped names | tag stripping on all free text, operator/prototype-key removal, strict type checks |
| Errors | generic messages | also hides body-parser errors (malformed JSON, oversized payloads) |
| Tests | 9 Postman requests | 67-request Postman collection run with Newman + Vitest frontend tests |

## 2. Features

**Clients** - browse and search gigs (text + category), book a gig with optional notes (simulated confirmation, no real payment), see their bookings.

**Freelancers** - create, edit (including hide/show), and delete their own gigs; see bookings made on their gigs; see income earned, booking count, estimated tax and net income, plus a transaction list.

**Admins** - list all users (never including password hashes), view all transactions, delete any gig. Admins cannot be created through the API; use `npm run seed:admin`.

**Every booking** creates a *booking* and a linked *transaction* (client, freelancer, gig, amount, currency, status). The amount is read from the gig on the server, so a client cannot choose the price. Income is the sum of that freelancer's completed transactions.

**Tax estimate** - a flat, configurable rate (`TAX_RATE`, default 15%). It is illustrative only and not tax advice.

## 3. Project structure

```
hustlehub/
├── server.js                      # HTTPS entry point
├── package.json                   # backend deps + scripts
├── .env.example
├── architecture-diagram.svg
├── certs/README.md                # how to create the local SSL certificate
├── scripts/
│   ├── seedAdmin.js               # creates the admin account
│   └── rateLimitCheck.js          # demonstrates a 429 response
├── postman/HustleHub.postman_collection.json
├── src/
│   ├── app.js                     # middleware stack, routes, serves client/dist
│   ├── constants.js               # categories, roles
│   ├── config/env.js
│   ├── controllers/               # auth, gig, booking, transaction (+income), admin
│   ├── middleware/                # authMiddleware (JWT+RBAC), rateLimiters, sanitizeRequest,
│   │                              # validateRequest, errorHandler
│   ├── models/                    # userStore, jsonStore (generic collection), collections
│   ├── routes/                    # auth, gig, booking, transaction, income, admin, protected
│   ├── utils/                     # jwt, passwords, sanitize, asyncHandler
│   ├── validators/                # auth, gig, booking rule sets
│   └── data/                      # *.json written at runtime (git-ignored)
└── client/
    ├── vite.config.js             # dev proxy to the API + Vitest config
    └── src/
        ├── api/client.js          # fetch wrapper (JWT, error normalisation)
        ├── context/AuthContext.jsx
        ├── components/            # Navbar, ProtectedRoute, GigCard, GigForm, Alert
        ├── pages/                 # Login, Register, Gigs, MyGigs, Bookings, Income, Admin
        ├── utils/                 # validation, formatting
        └── tests/                 # Vitest + Testing Library
```

Routes only map URLs to controllers; controllers hold business logic; `models/` is the only code that touches storage (swap it for MongoDB later without touching controllers).

## 4. API summary

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | role: `client` or `freelancer` only; rate limited |
| POST | `/api/auth/login` | public | returns JWT; rate limited |
| GET | `/api/profile` | any authenticated | |
| GET | `/api/gigs`, `/api/gigs/:id`, `/api/gigs/categories` | any authenticated | `?q=` and `?category=` filters |
| GET | `/api/gigs/mine` | freelancer | includes hidden gigs |
| POST | `/api/gigs` | freelancer | owner taken from the JWT identity |
| PUT | `/api/gigs/:id` | freelancer (owner) | 403 for anyone else |
| DELETE | `/api/gigs/:id` | freelancer (owner) or admin | |
| POST | `/api/bookings` | client | creates booking + transaction; rate limited |
| GET | `/api/bookings/mine` | client, freelancer | client: bookings made; freelancer: bookings received |
| GET | `/api/bookings/:id` | the two parties, or admin | 403 otherwise |
| GET | `/api/transactions/mine` | client, freelancer | payments made / income received |
| GET | `/api/income` | freelancer | totals + tax estimate |
| GET | `/api/admin/users`, `/api/admin/transactions` | admin | |

### Role matrix

| Capability | Client | Freelancer | Admin |
|---|:--:|:--:|:--:|
| Browse gigs | yes | yes | yes |
| Create / edit own gigs | no | yes | no |
| Delete a gig | no | own only | any |
| Book a gig | yes | no | no |
| View own bookings / transactions | yes | yes | no (uses admin views) |
| View income | no | yes (own) | no |
| List users / all transactions | no | no | yes |

## 5. Security measures

**Passwords (bcrypt).** Passwords are hashed with bcrypt (12 salt rounds, unique salt per hash) before storage. Plain-text passwords are never stored, logged or returned, and `passwordHash` is stripped from every response.

**JWT authentication.** Login issues an HS256 token (1 hour expiry, secret from `.env`). The algorithm is pinned on sign and verify. Payload is minimal (`sub`, `email`, `role`). `requireAuth` runs on every protected route, verifies the token, then loads the user from the store; a deleted account is rejected immediately and the **role comes from the store, not the token**. All failures return the same generic 401.

**Role-based access control and ownership.** `requireRole` limits each endpoint to specific roles and runs *before* validation, so the wrong role gets 403. Resource ownership is checked separately: freelancers can only update/delete their own gigs, and bookings are visible only to the client, the freelancer, or an admin. Owner identity always comes from the JWT, never from the request body, and updates copy only whitelisted fields (mass-assignment protection).

**Input validation and sanitisation.** All input is validated with `express-validator` (type checks first, then length/format/range, UUID checks on ids, category allow-list). Free text has HTML tags and control characters stripped. `sanitizeRequest` removes `$`-prefixed keys, dotted keys and `__proto__`/`constructor`/`prototype` from body and query to block operator injection and prototype pollution. React renders everything as text (no `dangerouslySetInnerHTML`), so stored data cannot execute as markup. We strip on input and rely on React output encoding rather than HTML-escaping before storage, so names like "O'Brien" display correctly.

**Rate limiting** (`express-rate-limit`, configurable in `.env`):

| Limiter | Applies to | Default | Response |
|---|---|---|---|
| auth | register, login | 20 / 15 min | 429 + `Retry-After` + clear JSON message |
| booking | `POST /bookings` | 10 / 10 min | 429 + message |
| API | all other `/api` routes | 300 / 15 min | 429 + message |

**Security headers and CSP (Helmet).** `default-src 'self'`, `script-src 'self'`, `style-src 'self'`, `img-src 'self' data:`, `connect-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, plus Helmet's other defaults (nosniff, referrer policy, etc.). The React app contains no inline scripts or inline styles, so it works under this strict policy. HSTS is enabled when `NODE_ENV=production`. CORS only allows origins listed in `CLIENT_ORIGIN`.

**HTTPS.** The API (and the built React app) is served only over HTTPS using a local self-signed certificate. This encrypts credentials and tokens in transit and prevents tampering; production would use a CA-issued certificate.

**Controlled errors.** One error handler returns generic messages; stack traces, file paths and parser internals are logged server-side only. Malformed JSON returns `Malformed JSON in request body`. Login returns the same message for unknown email and wrong password to prevent account enumeration.

**What the UI never shows:** tokens, password hashes, stack traces or raw server errors. Failed requests show a friendly message plus field-level validation hints.

## 6. Running the application

Requires Node 18+.

### Backend
```bash
npm install
cp .env.example .env            # then set a real JWT_SECRET (command is in the file)
# create the local SSL certificate - see certs/README.md (Git Bash on Windows: use "//CN=localhost")
npm run seed:admin              # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm start                       # https://localhost:5443
```

### Frontend - development (hot reload)
```bash
npm run client:install
npm --prefix client run dev     # http://localhost:5173 (proxies /api to the HTTPS backend)
```

### Frontend - production-style (strict CSP applies)
```bash
npm run client:install
npm run client:build            # creates client/dist
npm start                       # open https://localhost:5443 (accept the self-signed certificate warning)
```
When `client/dist` exists, Express serves it from the same HTTPS origin, which is where the Content Security Policy is enforced. In development the page is served by Vite, so CSP headers come from Express only when you use the production-style setup.

### Trying it out
1. Register one **freelancer** and one **client** (two browsers/profiles, or log out between).
2. Freelancer: *My gigs* -> create a gig.
3. Client: *Browse gigs* -> Book this gig -> Confirm.
4. Freelancer: *Bookings* shows the booking; *Income* shows earnings and the tax estimate.
5. Admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`): *Admin* page lists users and all transactions.

## 7. Testing

### Backend - Postman + Newman
The collection (`postman/HustleHub.postman_collection.json`, 67 requests) runs in order and covers successes and failures: auth and JWT handling, gig CRUD, ownership violations (403), role violations (403), booking creation with transaction check, income tracking per freelancer, admin-only endpoints, validation errors (400), sanitisation (HTML stripped), operator injection, malformed JSON, and missing/invalid tokens (401). Users are created with unique emails per run.

```bash
# server running over HTTPS, admin seeded
npm run test:api
```
This runs Newman with `--insecure` (self-signed certificate) and writes an HTML report to `reports/newman-report.html` for evidence. The collection can also be imported into Postman; disable SSL verification there.

Auth limit note: one collection run uses about 14 of the 20 allowed auth requests. **Restart the server between runs** (the limiter is in memory) or raise `AUTH_RATE_LIMIT_MAX` in `.env`.

### Rate limiting demonstration
```bash
npm run test:ratelimit          # sends bad logins until a 429 appears; restart server afterwards
```

### Frontend - Vitest + Testing Library
```bash
npm run client:install
npm run test:client
```
Tests cover: login form rendering, validation errors, submitting credentials, API error display; gig card rendering, the booking interaction, role-based buttons, and XSS-safe rendering of malicious titles; gig form validation and submission; and route protection by role.

## 8. Design decisions and limitations

* **Storage** is file-backed JSON, so it is single-process and not for production. All access goes through `models/`, so MongoDB can replace it without touching controllers.
* **Payments** are simulated; a transaction is recorded as `completed` on booking.
* **Token storage** uses `sessionStorage` (cleared when the tab closes). httpOnly cookies with CSRF protection would be stronger against XSS and are a recommended next step. The strict CSP reduces XSS risk. There are no refresh tokens; the session ends when the 1-hour token expires.
* **Rate limiter** state is in memory and per process.
* **Gig deletion** keeps existing bookings and transactions (they store a gig title/price snapshot) so financial history is preserved.
* **Tax** is a flat illustrative rate; real tax logic is out of scope.
