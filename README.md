# Acme Web Studio

A complete web platform with admin portal for Acme Web Studio.

## Features

- Client portal for browsing and requesting services
- Admin portal for managing clients and orders
- Pricing page with package selection
- Quote request system
- Order management with status tracking
- Email notifications and audit logging

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Prisma ORM with PostgreSQL
- Tailwind CSS
- Resend for email

## Setup

1. Clone this repository
2. Run `pnpm install` or `npm install`
3. Copy `.env.example` to `.env` and configure database and email settings
4. Run `pnpm db:push` to apply database migrations
5. Run `pnpm dev` to start the development server

### Git Configuration

This project has been configured with:
- Remote origin set to GitHub (https://github.com/riteshshrestha/system-project.git)
- GitHub Actions workflow for pushing to GitBook
- Updated README with project overview and setup instructions

## Development

This project is a spin-off of [Ritesh Shrestha](https://github.com/riteshshrestha) original Acme Web Studio repository. It includes the admin portal functionality with client management, order tracking, and quote request handling.

## Key Components

- **Client Portal** (`app/(public)/*`): User-facing site with pricing and quote requests
- **Admin Portal** (`app/admin/*`): Admin interface for managing clients and orders
- **API Routes** (`app/api/*`): Backend API endpoints
- **Database Models**: Clients, Packages, Orders, Invoices, Subscriptions
- **Authentication**: JWT-based session management with middleware protection

## Admin Routes

- `/admin` - Dashboard
- `/admin/clients` - Client management
- `/admin/orders` - Order management
- `/admin/quotes` - Quote requests
- `/admin/settings` - Settings

## Client Routes

- `/` - Home page
- `/pricing` - Pricing page with package selection
- `/contact` - Contact/form for quote requests
- `/login` - Login page

## Database

Using PostgreSQL with Prisma ORM. The database includes:

- `Client` table for user accounts
- `Package` table for service packages
- `Order` table for project requests
- `Invoice` table for billing
- `Subscription` table for service subscriptions

## Email Integration

Using Resend for email notifications. Admin notifications are sent when clients submit quote requests.

## License

MIT