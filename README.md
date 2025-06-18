# Credit Sea – Loan-Management Platform

Credit Sea is a full-stack web application that lets customers apply for loans, make EMI payments, and track their balances while verifiers and admins handle the approval workflow.  
It is built with a modern TypeScript stack: **Express + MongoDB** in the backend and **Next.js 15** in the frontend.

---

## 📂 Monorepo layout

```
credit-sea/
├─ backend/     # Express + TypeScript API
│  ├─ src/
│  └─ …
├─ frontend/    # Next.js 15 (App Router) client
│  ├─ app/
│  └─ …
└─ README.md    # <–– you are here
```

## 🔧 Tech stack

| Layer    | Main libraries / tools                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Backend  | Node.js 18, Express, TypeScript, MongoDB + Mongoose, Zod, bcrypt, JWT, Winston, rate-limiter-flexible |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui, Axios (SWR ready), Chart.js (placeholder)  |

---

## 🚀 Quick start

1. **Clone & install**
   ```bash
   git clone <repo> credit-sea && cd credit-sea
   # backend deps
   cd backend && npm install && cd ..
   # frontend deps
   cd frontend && npm install && cd ..
   ```
2. **Environment variables**  
   Copy `backend/.env.example` → `backend/.env` and adjust MongoDB URI & JWT secret.
3. **Run everything in dev mode**

   ```bash
   # terminal 1
   cd backend && npm run dev

   # terminal 2
   cd frontend && npm run dev
   ```

   Back-end defaults to http://localhost:8000, front-end to http://localhost:3000.

---

## ✨ Core features

- Customer sign-up / login
- Create loan applications → multi-step **verify → approve** flow
- Automatic loan & EMI schedule generation
- Role hierarchy: **USER → VERIFIER → ADMIN → SUPER_ADMIN** (hard-coded seed)
- Real-time stats endpoint for dashboards

---

## 📑 REST API – 30-second tour

(Full details live in [`backend/README.md`](backend/README.md))

| Area         | Method & path                                   | Role     |
| ------------ | ----------------------------------------------- | -------- |
| Auth         | `POST /api/auth/signup`, `POST /api/auth/login` | anyone   |
| Applications | `POST /api/applications`                        | USER     |
|              | `PUT /api/applications/:id/verify`              | VERIFIER |
|              | `PUT /api/applications/:id/approve`             | ADMIN    |
| Loans        | `GET /api/loans`, `POST /api/loans/:id/payment` | USER     |
| Stats        | `GET /api/stats/dashboard`                      | ADMIN    |

JWT is expected in the `Authorization: Bearer <token>` header.
