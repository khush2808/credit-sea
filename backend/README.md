# CreditSea Backend

Backend for my loan management system built with Node.js/TypeScript. Users can apply for loans, get them verified and approved, then make EMI payments.

## Setup

Built this with Express + MongoDB. Pretty standard stack but works well.

Tech used:

- Node.js + TypeScript
- Express.js
- MongoDB with Mongoose
- JWT auth + bcrypt
- Zod for validation
- Winston logging

## Project structure

```
backend/
├── src/
│   ├── config/          # db connection
│   ├── controllers/     # route handlers
│   ├── middleware/      # auth stuff, error handling
│   ├── models/          # mongoose models
│   ├── routes/          # api routes
│   ├── types/           # typescript types
│   └── utils/           # helper functions
└── package.json
```

## Getting started

Need Node 18+ and MongoDB.

```bash
cd backend
npm install

# copy env file and edit it
cp .env.example .env

# start dev server
npm run dev
```

Your `.env`:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/creditsea
JWT_SECRET=put-something-random-here
SUPER_ADMIN_EMAIL=admin@creditsea.com
SUPER_ADMIN_PASSWORD=ChangeThis123!
```

Creates admin user on first run.

## API endpoints

### Auth stuff

- `POST /api/auth/signup` - register
- `POST /api/auth/login` - login
- `GET /api/auth/profile` - user info
- `PUT /api/auth/profile` - update profile
- `PUT /api/auth/change-password` - change password

### Applications

- `POST /api/applications` - create loan application
- `GET /api/applications` - list applications
- `GET /api/applications/:id` - get application
- `PUT /api/applications/:id/verify` - verify (verifiers)
- `PUT /api/applications/:id/approve` - approve (admins)

### Loans

- `GET /api/loans` - user's loans or all loans (admin)
- `GET /api/loans/:id` - loan details
- `POST /api/loans/:id/payment` - make payment
- `GET /api/loans/:id/transactions` - payment history

### Admin

- `GET /api/admin/users` - user management
- `GET /api/stats` - dashboard stats

## Roles

- **Customers** - apply for loans, make payments
- **Verifiers** - verify applications
- **Admins** - approve loans, manage users
- **Super Admins** - everything

Flow: Customer applies → Verifier checks → Admin approves → Loan created

## Models

**User** - basic info + role
**Application** - loan request with employment details
**Loan** - approved application with EMI tracking  
**Transaction** - payment records

## Auth

JWT tokens in Authorization header: `Bearer <token>`

Passwords hashed with bcrypt. Added rate limiting.

## Response format

```json
{
  "success": true/false,
  "message": "...",
  "data": {}, // on success
  "error": "..." // on failure
}
```

## Running

```bash
npm run dev  # development
npm start    # production
```

Check health: `curl http://localhost:8000/health`

## Notes

- Set strong JWT_SECRET in production
- Configure MongoDB properly
- CORS is configured for localhost:3000
- Logs go to logs/ directory

TODO: Need to add proper tests and maybe some caching.
