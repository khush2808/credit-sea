# CreditSea Frontend

The frontend for CreditSea - a loan management platform built with Next.js. This handles everything users see and interact with, from applying for loans to managing payments.

## What it does

Pretty straightforward stuff - customers can sign up, apply for loans, and track their payment schedules. Verifiers and admins get specialized dashboards to review applications and manage the system. Built with modern React patterns and a clean UI that works well on mobile.

The app uses Next.js 15 with the app router, TypeScript throughout, and Tailwind for styling. Form handling is done with React Hook Form and Zod validation to keep things clean and type-safe.

## Tech stack

- **Next.js 15** with the app router - React framework that just works
- **TypeScript** - because catching errors at compile time > debugging at 3am
- **Tailwind CSS** - utility-first CSS that's actually maintainable
- **Shadcn/ui** - copy-paste component library that looks great
- **React Hook Form** + **Zod** - forms that don't make you cry
- **Axios** for API calls - reliable HTTP client
- **Recharts** for data visualization - simple charts that look good
- **React Context** for auth state - keeps things simple

## Project structure

```
frontend/
├── app/
│   ├── (auth)/         # login and signup pages
│   ├── dashboard/      # user dashboard after login
│   ├── applications/   # loan application forms and status
│   ├── loans/          # loan details and payment pages
│   ├── profile/        # user profile management
│   ├── admin/          # admin and verifier dashboards
│   └── page.tsx        # landing page
├── components/
│   ├── ui/             # reusable components from shadcn
│   └── layout/         # navigation, sidebar, etc.
├── contexts/
│   └── AuthContext.tsx # manages user auth state
├── lib/
│   ├── api.ts          # all API calls in one place
│   └── utils.ts        # helper functions
└── public/             # static files
```

## Getting it running

You'll need Node.js 18+ and the backend API running (check the backend README for setup).

```bash
cd frontend
npm install

# create your environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# start development server
npm run dev
```

The app will be available at http://localhost:3000

## How authentication works

The app stores JWT tokens in cookies and uses React Context to manage auth state. When you log in, it fetches your user info and redirects you to the appropriate dashboard based on your role.

Different user types see different interfaces:

- **Customers** get a simple dashboard with their loans and payment history
- **Verifiers** see pending applications they need to review
- **Admins** get additional user management and approval capabilities

## Key features

**Responsive design** - works on phones, tablets, whatever. Tailwind makes this pretty easy.

**Form validation** - React Hook Form + Zod means forms validate both client and server side with the same schemas.

**Error handling** - API errors are caught and displayed as toast notifications.

**Protected routes** - pages automatically redirect to login if you're not authenticated.

**Role-based UI** - different users see different navigation and features based on their permissions.

## Building for production

```bash
npm run build
npm start
```

The build output goes to `.next/` and can be deployed anywhere that supports Node.js.

## Environment variables

Just one environment variable needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

In production, change this to your actual API URL.

## Working with the code

The codebase is pretty standard Next.js - if you've worked with React apps before, you'll feel at home.

**Key files to understand:**

- `app/layout.tsx` - root layout with providers
- `contexts/AuthContext.tsx` - how authentication state works
- `lib/api.ts` - all backend API calls
- `components/layout/MainLayout.tsx` - authenticated user layout

**Adding new pages:**
Just create a new folder in `app/` with a `page.tsx` file. The router handles everything automatically.

**Styling:**
Tailwind classes everywhere. If you need custom styles, add them to `globals.css`.

**API calls:**
Add new functions to `lib/api.ts` rather than making axios calls directly in components.

## Deployment

The app is set up for Vercel deployment out of the box, but you can deploy it anywhere that supports Node.js. Just make sure to set the `NEXT_PUBLIC_API_URL` environment variable to point to your production API.

