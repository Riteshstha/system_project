# Portal App

Dedicated authentication portal for Acme Web Studio running on port 3200.

## Purpose

This is a separate Next.js application that handles:
- Client login (/login)
- Admin login (/admin/login)
- Landing page with login options (/)

## Architecture

The portal app separates authentication from the main application (port 3000):
- **Main App (port 3000)**: Core application with dashboard, admin panel, pricing, etc.
- **Portal App (port 3200)**: Dedicated authentication flows

When users click "Sign In" or "Start an order" on the main app, they are redirected to `http://localhost:3200/login` or `http://localhost:3200/admin/login` respectively.

After successful login, users are redirected back to the main app:
- Clients → `http://localhost:3000/dashboard`
- Admins → `http://localhost:3000/admin`

## Development

```bash
cd portal-app
npm install
npm run dev  # Runs on port 3200
```

## Production (Docker)

```bash
docker build -t acme-portal:dev .
docker run -p 3200:3200 --env-file .env acme-portal:dev
```

Or with docker-compose from the root:

```bash
docker-compose up portal-app
```

## Environment Variables

See `.env.example` for all required variables:
- `NEXT_PUBLIC_SITE_URL` - Portal app URL (http://localhost:3200)
- `NEXT_PUBLIC_MAIN_APP_URL` - Main app URL (http://localhost:3000)
- `DATABASE_URL` - Shared PostgreSQL connection
- `JWT_SECRET` - Shared JWT secret for session tokens