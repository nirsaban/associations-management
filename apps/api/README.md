# Amutot API

NestJS backend API for the Amutot Management Platform - Multi-tenant SaaS for Israeli nonprofits.

## Overview

This is a multi-tenant SaaS backend serving Israeli nonprofit organizations (עמותות). It provides APIs for:

- User authentication (JWT-based with OTP)
- User management
- Group management
- Family management
- Weekly orders and distribution tracking
- Payment processing
- Reminders and notifications
- CSV import utilities
- Role-based dashboards

## Tech Stack

- **Framework**: NestJS 10+
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator + class-transformer
- **API Docs**: Swagger/OpenAPI
- **Scheduling**: @nestjs/schedule for cron jobs
- **Rate Limiting**: @nestjs/throttler

## Project Structure

```
src/
├── common/                    # Shared infrastructure
│   ├── prisma/               # Database service
│   ├── guards/               # JWT & Role-based auth
│   ├── decorators/           # @CurrentUser, @Roles, etc
│   ├── interceptors/         # Response transformation
│   ├── filters/              # Error handling
│   └── pipes/                # Validation pipes
├── modules/
│   ├── auth/                 # Authentication (login, verify OTP, refresh)
│   ├── users/                # User CRUD
│   ├── groups/               # Group management + members
│   ├── families/             # Family records
│   ├── weekly-orders/        # Weekly order management
│   ├── weekly-distributors/  # Distributor assignment
│   ├── payments/             # Payment processing + webhooks
│   ├── reminders/            # Reminder cron job service
│   ├── notifications/        # User notifications
│   ├── csv-import/           # CSV import utilities
│   └── dashboard/            # Role-specific dashboards
├── main.ts                   # Application bootstrap
└── app.module.ts             # Root module
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm (or npm/yarn)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.schema .env
# Edit .env with your database URL and secrets
```

3. Run Prisma migrations:
```bash
pnpm prisma migrate dev
```

4. Start the development server:
```bash
pnpm start:dev
```

The API will be available at `http://localhost:3001/api/v1`
Swagger docs available at `http://localhost:3001/api/docs`

## Available Scripts

- `pnpm start` - Start production server
- `pnpm start:dev` - Start development server with auto-reload
- `pnpm start:debug` - Start with debugging enabled
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Generate coverage report
- `pnpm typecheck` - Run TypeScript compiler
- `pnpm prisma:migrate` - Create and run migrations
- `pnpm prisma:studio` - Open Prisma Studio

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Initiate login with phone
- `POST /api/v1/auth/verify-otp` - Verify OTP and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users` - List users (paginated)
- `GET /api/v1/users/:id` - Get user
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (soft)

### Groups
- `GET /api/v1/groups` - List groups
- `GET /api/v1/groups/:id` - Get group
- `POST /api/v1/groups` - Create group
- `PATCH /api/v1/groups/:id` - Update group
- `POST /api/v1/groups/:id/assign-manager` - Assign manager
- `POST /api/v1/groups/:id/members/:userId` - Add member
- `DELETE /api/v1/groups/:id/members/:userId` - Remove member
- `GET /api/v1/groups/:id/members` - List group members

### Families
- `GET /api/v1/families` - List families
- `GET /api/v1/families/:id` - Get family
- `POST /api/v1/families` - Create family
- `PATCH /api/v1/families/:id` - Update family
- `POST /api/v1/families/:id/groups/:groupId` - Link to group
- `DELETE /api/v1/families/:id/groups` - Unlink from group

### Weekly Orders
- `GET /api/v1/weekly-orders` - List orders
- `GET /api/v1/weekly-orders/:id` - Get order
- `POST /api/v1/weekly-orders` - Create order
- `PATCH /api/v1/weekly-orders/:id` - Update order
- `POST /api/v1/weekly-orders/:id/complete` - Mark as completed

### Weekly Distributors
- `POST /api/v1/weekly-distributors/:groupId` - Assign distributor
- `GET /api/v1/weekly-distributors/current/:groupId` - Get current distributor
- `GET /api/v1/weekly-distributors` - List distributors for week

### Payments
- `POST /api/v1/payments/webhook` - Payment webhook (no auth)
- `GET /api/v1/payments/status/:monthKey` - Check payment status
- `GET /api/v1/payments/history` - Get payment history
- `GET /api/v1/payments/unpaid/:monthKey` - List unpaid users

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `POST /api/v1/notifications/mark-all-read` - Mark all as read
- `GET /api/v1/notifications/unread/count` - Get unread count

### CSV Import
- `POST /api/v1/csv-import/users` - Import users from CSV
- `POST /api/v1/csv-import/families` - Import families from CSV
- `POST /api/v1/csv-import/groups` - Import groups from CSV

### Dashboard
- `GET /api/v1/dashboard` - Get role-specific dashboard data

## Authentication

The API uses JWT-based authentication with the following flow:

1. User calls `POST /auth/login` with phone number
2. Backend sends OTP via SMS
3. User calls `POST /auth/verify-otp` with phone and OTP code
4. Backend returns `accessToken` and `refreshToken`
5. Client includes `Authorization: Bearer {accessToken}` in subsequent requests
6. When token expires, client uses `POST /auth/refresh` with `refreshToken` to get new `accessToken`

All protected endpoints require the `JwtAuthGuard` and validate the token signature.

## Role-Based Access Control

Users have roles that determine endpoint access:
- `admin` - Full system access
- `manager` - Group and family management
- `user` - Self-service user
- `distributor` - Weekly distribution tracking

The `@Roles()` decorator on endpoints restricts access by role.

## Multi-Tenancy

All records are scoped by `organizationId`. The JWT payload includes the user's `organizationId`, and all queries automatically filter by this field through Prisma middleware.

**Important**: Never query without organizationId scope. The PrismaService middleware enforces this automatically on find operations.

## Soft Deletes

This system uses soft deletes (sets `deletedAt` timestamp) instead of hard deletes. The Prisma middleware automatically adds `where: { deletedAt: null }` to all find queries.

To hard delete (rare): Update `deletedAt` field directly if absolutely necessary.

## Error Handling

Errors are returned in a standardized format:

```json
{
  "error": "Conflict",
  "message": "User with this email already exists",
  "statusCode": 409
}
```

## Response Envelope

Successful responses are wrapped in a data envelope:

```json
{
  "data": {
    "id": "...",
    "name": "..."
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
```

## Logging

All services include a `Logger` instance. Key operations are logged:
- Authentication events
- Database operations
- Errors and exceptions

Logs are written to console. In production, configure external logging (ELK, DataDog, etc).

## Testing

Unit tests are co-located with source files (`*.spec.ts`). Run with:

```bash
pnpm test              # Single run
pnpm test:watch       # Watch mode
pnpm test:cov         # With coverage
```

Minimum 70% coverage is required for new code.

## Deployment

1. Build the application:
```bash
pnpm build
```

2. Set production environment variables

3. Run migrations:
```bash
pnpm prisma migrate deploy
```

4. Start server:
```bash
pnpm start:prod
```

## Security Considerations

- JWT secrets should be strong and rotated regularly
- Database credentials should use strong passwords
- Rate limiting is enabled (100 requests per 60 seconds)
- All user input is validated with class-validator
- Soft deletes prevent accidental data loss
- Sensitive fields (passwords, tokens) are never logged

## Contributing

Follow the project conventions in `CLAUDE.md`:
- Use TypeScript strict mode
- Add JSDoc comments to public methods
- Include unit tests for new features
- Ensure `pnpm lint` and `pnpm typecheck` pass
- Use the response envelope format
- Scope all queries by organizationId

## License

MIT
