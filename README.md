# Getir2 Monorepo (Demo)

## Structure
- apps/ops-web (Next.js console app: customer + ops + admin)
- services/api (NestJS API)
- services/worker (BullMQ workers)
- packages/shared (types + zod)
- packages/ui (optional UI components)

## Requirements
- Node.js 18+
- Docker (optional)

## Env Vars
Copy `.env.example` to `.env` and adjust as needed.

Key vars:
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- MINIO_ENDPOINT/MINIO_PORT
- MINIO_ACCESS_KEY/MINIO_SECRET_KEY
- MINIO_BUCKET
- API_INTERNAL_SECRET
- API_BASE_URL (worker -> api)
- NEXT_PUBLIC_API_URL

## Run (local)
1) `npm install`
2) `docker compose up -d postgres redis minio`
3) `npm --workspace services/api run prisma:generate`
4) `npm --workspace services/api run prisma:migrate`
5) `npm --workspace services/api run seed`
6) `npm run dev`

## Run (docker)
`docker compose up --build`

## Ports
- API: http://localhost:3000/api
- Web: http://localhost:3001

## Demo Accounts (seed)
- Customer: customer@getir.test / password123
- OPS: ops@getir.test / password123
- Admin: admin@getir.test / password123

## Demo Flow
Customer:
1) Login (`/login`)
2) Create order (`/customer/checkout`)
3) Pay order
4) Tracking page receives alerts and ETA updates (`/customer/orders/:id`)

OPS:
1) Login (`/login`)
2) Dashboard KPIs (`/ops`)
3) Orders list -> change status / assign courier (`/ops/orders`)
4) Alerts inbox -> ack (`/ops/alerts`)

Admin:
1) Login (`/login`)
2) Users + roles (`/admin`)

## CSV Import
Upload CSV from OPS `/ops/uploads`.
Required columns:
- order_external_id
- customer_id
- customer_zone
- restaurant_zone
- address_lat
- address_lon
- items_json (JSON array)

## Notes
- Real-time events use Socket.IO rooms: customer:{userId}, ops:global
- Background worker computes delay risk and emits alerts
