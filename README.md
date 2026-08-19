# AuraPlay Premium | Next-Gen Crypto Casino & Cloud Gaming

AuraPlay is a state-of-the-art iGaming ecosystem featuring a premium casino, live sportsbook, political predictions, and an innovative Cloud Gaming library. Built on Next.js 14 App Router, it offers a blazing fast, highly interactive, and visually stunning user experience.

![AuraPlay Banner](./public/logo.png)

[![Cron Job Uptime Status](https://api.cron-job.org/jobs/7823707/23abdccf428e8897/status-1.svg)](https://cron-job.org)
![Production DevSecOps Audit](https://img.shields.io/badge/Security_Audit-Passing-success?style=flat&logo=githubactions)
![Next.js 16](https://img.shields.io/badge/Next.js-16.2.7-black?style=flat&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat&logo=supabase)

## 📁 Project Structure

The codebase is organized cleanly to separate UI components, server logic, and database operations.

```text
├── app/                  # Next.js 14 App Router (Pages & Layouts)
│   ├── (admin)/          # Admin Dashboard routes (protected)
│   ├── (public)/         # Public routes (Casino, Sportsbook, etc.)
│   ├── (user)/           # User Profile & Wallet routes
│   └── api/              # Serverless API routes (Auth, Wagers, System)
├── components/           # Reusable React UI Components
│   ├── layout/           # Sidebar, Header, Footer
│   ├── portfolio/        # Positions & Bet Slips
│   ├── providers/        # Context Providers (Zustand)
│   └── ui/               # Modals, Buttons, Inputs
├── lib/                  # Core Business Logic & Databases
│   ├── userDb.ts         # User authentication & balance logic
│   ├── wagerDb.ts        # Betting and payout logic
│   └── store.ts          # Zustand global state management
├── public/               # Static Assets (Images, Logos)
└── scripts/              # Background Workers & Bots
    ├── generate_hype_bets.js  # Simulates live site activity & rentals
    └── notification_worker.js # Background notification dispatcher
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Running Locally
To run both the Next.js development server AND the background bots simultaneously, use the concurrently start script:

```bash
npm run dev
# OR for production build testing:
npm run build
npm start
```

## 🛠️ Architecture & Deployment
This application utilizes a local JSON-based file system (`/data`) for storing users, balances, and wagers to provide lightning-fast read/writes during development.

### Deployment Options
* **Railway / Render:** Recommended. These platforms allow the Node.js background workers to run flawlessly alongside the web server. Ensure you attach a **Persistent Volume/Disk** to `/data` so user balances are saved across restarts.
* **Vercel / Netlify:** Not recommended out-of-the-box. As serverless platforms, their disks are ephemeral (read-only), meaning the `/data` folder will not persist. If deploying to Vercel, the database layer (`lib/userDb.ts`) must first be migrated to a cloud database like Supabase or Firebase.

## 🔐 Security
- API routes are protected by Edge rate-limiting middleware (`proxy.ts`).
- Secure JWT-based authentication flow.
- Strict Content Security Policies (CSP) configured in `next.config.ts`.
