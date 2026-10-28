# Leave Management System

Full-stack demo: React + Vite, Node.js + Express, MongoDB, JWT authentication.

## Requirements
- Node.js 20+ (18+ may work)
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- VS Code

## 1. Start MongoDB
Make sure your local MongoDB service is running, or create a MongoDB Atlas database.

## 2. Backend setup
Open a terminal in VS Code:

```bash
cd server
npm install
```

Copy `.env.example` to `.env`, then update `MONGO_URI` if needed.

Seed demo accounts and initial leave balances:
```bash
npm run seed
```

Start backend:
```bash
npm run dev
```
Backend runs at http://localhost:5000

Demo accounts (after seeding):
- Manager: manager@demo.com / Manager@123
- Employee: employee@demo.com / Employee@123

## 3. Frontend setup
Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173

## Workflow
1. Sign in as employee and submit a leave request.
2. Sign out, sign in as manager, and approve or reject the request.
3. Sign back in as employee to see the updated status.
4. Approved days are deducted from the matching leave balance. Pending/rejected requests do not deduct days.

## Notes
- This is a learning/demo project. Change demo passwords and use HTTPS / secure cookie strategy before production.
- The API validates roles and leave dates. Never trust frontend-only role checks.
- A leave request counts calendar days inclusively (start date and end date included).
