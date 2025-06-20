# Credit Sea – Loan Management Platform

A full-stack loan management system where customers can apply for loans and admins can manage the approval process.

Built with **Express + MongoDB** backend and **Next.js 15** frontend.

## Project Structure

```
credit-sea/
├─ backend/     # API server
├─ frontend/    # Next.js app
└─ README.md
```

## Tech Stack

**Backend:** Node.js, Express, TypeScript, MongoDB, JWT  
**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui

## Features

- User registration and authentication
- Loan application system
- Multi-step approval workflow (Verifier → Admin)
- EMI payment tracking
- Role-based access control
- Admin dashboard with statistics

## Quick Setup

1. **Clone and install**

   ```bash
   git clone <repo> credit-sea && cd credit-sea

   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install
   ```

2. **Configure backend**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Run both servers**

   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

Backend runs on http://localhost:8000  
Frontend runs on http://localhost:3000

## User Roles

- **Customer** - Apply for loans, make payments
- **Verifier** - Verify loan applications
- **Admin** - Approve loans, manage users
- **Super Admin** - Full system access

## Workflow

1. Customer applies for loan
2. Verifier reviews and verifies application
3. Admin approves or rejects verified applications
4. Approved applications become active loans
5. Customer makes EMI payments

## API Overview

**Auth:** `/api/auth/*` - signup, login, profile  
**Applications:** `/api/applications/*` - CRUD operations  
**Loans:** `/api/loans/*` - loan management, payments  
**Admin:** `/api/admin/*` - user management  
**Stats:** `/api/stats/*` - dashboard data

## Default Admin

Email: `super@loan.com`  
Password: `Password@1`

## Development Notes

- Uses JWT for authentication
- MongoDB with Mongoose ODM
- Comprehensive input validation
- Role-based middleware
- Error handling and logging
- Rate limiting enabled

For detailed setup instructions, check the README files in `/backend` and `/frontend` directories.
