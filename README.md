# Microstore — Microservices E-Commerce Platform

**What this repo proves:** Monolithic deployment doesn't mean monolithic code. This full-stack e-commerce platform is organized as a set of independently extractable microservices — each with its own controller, service layer, storage abstraction, health checks, and service client — deployed today as a single Express process, ready to split tomorrow.

Built for engineers who care about architecture: service registry pattern, dual storage backends (PostgreSQL + in-memory), Stripe payments, session-based auth, a live monitoring dashboard, and Docker container management UI — all in one TypeScript monorepo.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Application                         │
│              React + Vite + TailwindCSS + Shadcn/UI           │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP/REST (relative /api routes)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                       │
│              Rate Limiter · Session Auth · Swagger Docs        │
│              Service Registry · Health Aggregation             │
└───┬─────┬──────┬──────┬──────┬──────┬──────┬──────────────────┘
    │     │      │      │      │      │      │
    ▼     ▼      ▼      ▼      ▼      ▼      ▼
┌─────┐ ┌────┐ ┌────┐ ┌─────┐ ┌───────┐ ┌──────────┐
│Product│ │User│ │Cart│ │Order│ │Payment│ │Notification│
│Service│ │Svc │ │Svc │ │Svc  │ │Service│ │Service     │
└──┬───┘ └──┬─┘ └──┬─┘ └──┬──┘ └───┬───┘ └─────┬────┘
   │        │      │      │        │            │
   ▼        ▼      ▼      ▼        ▼            │
┌──────────────────────────────────────┐        │
│  PostgreSQL (Drizzle ORM)            │        │
│  └─ In-Memory Fallback (dev)         │        │
└──────────┬───────────────────────────┘        │
           │                                    │
           ▼                                    ▼
    ┌────────────┐                    ┌──────────────┐
    │   Stripe   │                    │  SMTP Email   │
    │  Payments  │                    │  Provider     │
    └────────────┘                    └──────────────┘
```

### Service Interactions (Checkout Flow)

```
Client → POST /api/orders
  OrderService → CartService        (getCartItems)
  OrderService → ProductService     (verifyInventory)
  OrderService → PaymentService     (createPaymentIntent)
  PaymentService → Stripe           (paymentIntents.create)
  Client ← { clientSecret, order }
  Client → Stripe                   (confirmCardPayment)
  Client → POST /api/payments/confirm
  PaymentService → Stripe           (retrievePaymentIntent)
  PaymentService → OrderService     (paymentConfirmed)
  OrderService → CartService        (clearCart)
  OrderService → ProductService     (decrementInventory)
  OrderService → NotificationService(sendOrderConfirmation)
```

### Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, TailwindCSS, Shadcn/UI, Framer Motion, Recharts |
| Backend | Express.js, Node.js, Passport.js (session auth) |
| API | REST + Swagger/OpenAPI docs at `/api-docs` |
| Database | PostgreSQL via Drizzle ORM (+ in-memory dev fallback) |
| Payments | Stripe (Payment Intents API) |
| Email | Nodemailer + SMTP |
| Logging | Winston |
| Containerization | Docker + docker-compose |

---

## Run Anywhere

The app binds to `0.0.0.0:5000` out of the box. The client uses **relative** `/api` routes, so there is **no hardcoded localhost** — it works behind any domain, reverse proxy, or load balancer.

```bash
# Clone & install
git clone <repo> && cd EcommerceApi && npm install

# Configure (copy and edit)
cp .env.example .env

# Development (HMR-enabled)
npm run dev
# → http://localhost:5000

# Production
npm run build && npm start
# → http://0.0.0.0:5000
```

Set `APP_URL` in your environment to control the canonical URL used by links and emails.

---

## Containerization

```bash
# Start full stack (app + PostgreSQL)
docker compose up --build

# Or build and run standalone
docker build -t microstore .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e SESSION_SECRET=$(openssl rand -hex 32) \
  microstore
```

The app includes a **Docker container management UI** at `/docker` that displays running containers, images, networks, and volumes — useful for operational visibility without leaving the browser.

---

## Observability

| Capability | How |
|---|---|
| **Health checks** | Per-service: `/api/products/health`, `/api/cart/health`, etc. Aggregate: `/api/health` |
| **Service registry dashboard** | `/dashboard` — live service status cards with CPU/memory/request metrics |
| **API traffic stats** | `/api/gateway/traffic` — 24h request volume time-series |
| **System metrics** | `/api/gateway/metrics` — orders, users, revenue KPIs |
| **API documentation** | `/api-docs` — Swagger UI with schemas and endpoint docs |
| **Request logging** | Winston-based structured logging with response times and payload previews |
| **Error handling** | Centralized Express error middleware, rate limiting (100 req/15min per IP) |

---

## Project Structure

```
├── client/                 # React SPA
│   └── src/
│       ├── components/     # Reusable UI (Shadcn + custom)
│       ├── pages/          # Route pages (dashboard, cart, orders, etc.)
│       ├── lib/            # Axios client, query client
│       └── services/       # Typed API service clients
├── server/                 # Express API
│   ├── controllers/        # Route handlers per domain
│   ├── services/           # Business logic (one per microservice)
│   ├── integration/        # Service clients + service registry
│   ├── middleware/         # Auth, validation, etc.
│   ├── routes.ts           # All route registration
│   ├── storage.ts          # IStorage interface + MemStorage
│   └── pg-storage.ts       # PostgreSQL implementation
├── shared/                 # Shared Zod schemas + Drizzle types
│   └── schema.ts           # Single source of truth for validation
├── tests/                  # Integration & unit tests
├── migrations/             # Drizzle Kit migrations
├── docker-compose.yml      # App + PostgreSQL
└── Dockerfile              # Multi-stage production build
```

---

## Key Architectural Decisions

- **Monolith-first, microservices-ready**: Code is organized into service modules with a service registry, typed service clients, and health endpoints. Extracting any service into its own process means copying the directory and wiring up HTTP clients.
- **Dual storage backends**: `IStorage` interface with `PgStorage` (production) and `MemStorage` (dev/testing). Auto-selects on startup — no DB required for development.
- **Shared Zod schemas**: Drizzle ORM tables produce Zod schemas used for both server-side validation and client-side form validation — zero duplication.
- **Session auth over JWT**: Server-side sessions with `connect-pg-simple` for production, `memorystore` for dev. Simpler revocation, no client token management.

---

## API Overview

| Service | Key Endpoints |
|---|---|
| **Products** | `GET /api/products` (search, filter), `POST`, `PUT`, `DELETE` |
| **Auth/Users** | `POST /api/auth/login`, `GET /api/auth/me`, CRUD users |
| **Cart** | `GET /api/cart`, `POST /api/cart/items`, `PUT`, `DELETE` |
| **Orders** | `POST /api/orders` (checkout), `GET`, status updates |
| **Payments** | Stripe Payment Intents, confirm, refund via `/api/payments/*` |
| **Notifications** | `GET /api/notifications`, `POST /api/notifications/send` |
| **Gateway** | `GET /api/services/status`, `/api/gateway/metrics`, `/api/gateway/traffic` |

Full interactive docs at `/api-docs` when running.

---

## Environment Variables

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | for PostgreSQL | — |
| `SESSION_SECRET` | yes | `microstore-secret-dev` |
| `STRIPE_SECRET_KEY` | for payments | — |
| `VITE_STRIPE_PUBLIC_KEY` | for payments | — |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | for email | — |
| `NOTIFICATION_EMAIL` | for email | — |
| `NODE_ENV` | — | `development` |
| `APP_URL` | for canonical URLs | `http://localhost:5000` |

---

## Testing

```bash
npm test               # Jest test suite
npm run lint           # ESLint
npm run check          # TypeScript compiler check
```

---

## License

MIT
