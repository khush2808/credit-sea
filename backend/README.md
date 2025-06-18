# CreditSea Backend

This is the backend API for CreditSea, built with Node.js and TypeScript. It handles everything from user authentication to loan management, with a proper role-based system for customers, verifiers, and admins.

## What's inside

The app is pretty straightforward - users can apply for loans, verifiers can review them, and admins can approve or reject applications. Once approved, the system tracks EMI payments and generates statistics for the dashboard.

Built with Express.js and MongoDB, using JWT for authentication and proper validation throughout. The code is organized in a typical MVC pattern that should be familiar to most developers.

## Tech stack

- **Node.js** with **TypeScript** - because type safety matters
- **Express.js** - solid and reliable web framework
- **MongoDB** with **Mongoose** - document database with a great ODM
- **JWT** for authentication + **bcrypt** for password hashing
- **Zod** for request validation - much better than manual checks
- **Winston** for logging - helpful when things go wrong
- **Jest** for testing (when we get around to writing them)

## Project structure

```
backend/
├── src/
│   ├── config/          # database connection and app config
│   ├── controllers/     # request handlers - where the magic happens
│   ├── middleware/      # auth, error handling, rate limiting
│   ├── models/          # mongoose schemas
│   ├── routes/          # route definitions
│   ├── types/           # typescript interfaces
│   └── utils/           # helper functions
├── logs/                # application logs
└── package.json
```

## Getting started

You'll need Node.js 18+ and MongoDB running locally (or a connection string to a remote instance).

```bash
# clone and install
cd backend
npm install

# create your .env file
cp .env.example .env
# edit .env with your database URL and JWT secret

# run it
npm run dev
```

Your `.env` should look something like this:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/creditsea
JWT_SECRET=your-secret-key-here-make-it-long-and-random
SUPER_ADMIN_EMAIL=admin@creditsea.com
SUPER_ADMIN_PASSWORD=ChangeThis123!
```

The app will create a super admin user on first run with the credentials you provide.

## API endpoints

### Authentication

- `POST /api/auth/signup` - register new customers
- `POST /api/auth/login` - login for all user types
- `GET /api/auth/profile` - get current user info
- `PUT /api/auth/profile` - update profile
- `PUT /api/auth/change-password` - change password

### Applications

- `POST /api/applications` - create new loan application
- `GET /api/applications` - list applications (filtered by role)
- `GET /api/applications/:id` - get specific application
- `PUT /api/applications/:id/verify` - verify application (verifiers only)
- `PUT /api/applications/:id/approve` - approve application (admins only)

### Loans

- `GET /api/loans` - list loans for current user or all (based on role)
- `GET /api/loans/:id` - get loan details
- `POST /api/loans/:id/payment` - make EMI payment
- `GET /api/loans/:id/transactions` - payment history

### Admin stuff

- `GET /api/admin/users` - manage users
- `GET /api/admin/applications` - view all applications
- `GET /api/stats` - dashboard statistics

## How the roles work

- **Customers** can apply for loans and make payments
- **Verifiers** can verify or reject pending applications
- **Admins** can approve verified applications and manage users
- **Super Admins** can do everything including creating other admins/verifiers

The workflow is: Customer applies → Verifier verifies → Admin approves → Loan gets created

## Data models

The main entities are Users, Applications, Loans, and Transactions. Here's what they look like:

**User**: Basic info + role + active status
**Application**: Loan request with amount, tenure, employment details, and status tracking
**Loan**: Approved application with EMI schedule and payment tracking
**Transaction**: Individual payments against loans

Check the model files in `src/models/` for the complete schemas.

## Authentication

Uses JWT tokens in the Authorization header: `Bearer <token>`

Passwords are hashed with bcrypt. Rate limiting is enabled to prevent abuse.

## Error handling

The API returns consistent JSON responses:

```json
{
  "success": true/false,
  "message": "Human readable message",
  "data": {}, // only on success
  "error": "Error details" // only on failure
}
```

## Testing

Run the health check to make sure everything's working:

```bash
curl http://localhost:8000/health
```

There are some basic test scripts in the package.json - they're more like integration tests that hit the actual API.

## Deployment notes

For production:

- Use a strong JWT_SECRET
- Set up proper MongoDB with authentication
- Configure CORS for your frontend domain
- Set up SSL/TLS
- Configure log levels appropriately
- Set up monitoring (the app logs to files in the logs/ directory)

## Troubleshooting

**Can't connect to MongoDB?** Check if it's running and your connection string is correct.

**JWT errors?** Make sure you're including the token in the Authorization header and it's not expired.

**Validation errors?** Check the request payload - the API is pretty strict about required fields and formats.
