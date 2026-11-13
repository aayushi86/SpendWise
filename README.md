# SpendWise – Personal Expense Tracker

SpendWise is a full-stack, production-ready personal expense tracking, financial analytics, and budget management web application with Progressive Web App (PWA) installation and real-time Web Push notification capabilities. Built with React 19, Vite, Tailwind CSS, Express.js, and MongoDB, SpendWise delivers bank-grade privacy, strict per-user data isolation, automated budget threshold alerts, receipt OCR scanning, and audit-ready PDF/CSV financial reports in Indian Rupee (₹).

---

## 1. Features Overview

- **Executive Financial Dashboard**: Real-time balance, total income, total expenses, savings rate, and interactive monthly spending trends computed from database records.
- **Unified Transaction Management**: Record expenses and income with categorization (Food, Travel, Shopping, Education, Bills, Healthcare, Entertainment, Salary, Freelance, Investments, Others), payment methods (UPI, Cash, Debit Card, Credit Card, Net Banking), search, and date filters.
- **Automated Budget Notifications**:
  - **80% Budget Alert**: In-app alert and Web Push when spending crosses 80% of any category limit.
  - **100% Budget Alert**: In-app alert and Web Push when spending reaches or exceeds 100%.
  - **Deduplication Guard**: Strict single-alert policy per category per month with automatic eligibility reset each new month.
- **Smart Spending Insights & Daily Spending Limit**: Dynamic calculations suggesting a safe daily spend rate based on remaining monthly budget.
- **Receipt Scanning with OCR**: Client-side optical character recognition via `tesseract.js` automatically populates expense amount and merchant description.
- **Expense Calendar**: Heatmap and calendar view displaying day-by-day spending spikes and highest spending days.
- **Recurring Expenses & Subscriptions**: Track monthly/annual subscriptions, calculate next due dates, and post transactions in one click.
- **Savings Goals**: Visual progress towards financial milestones with milestone celebration and contribution logging.
- **Audit-Ready Reports**: Download structured CSV ledgers and executive PDF statements formatted with `jsPDF` and `jspdf-autotable`.
- **Mobile PWA Ready**: Installable on Android and iOS devices with offline asset caching and home-screen launch.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide React, Tesseract.js, jsPDF, jspdf-autotable
- **Backend**: Node.js (v20+ / v22), Express.js 4.21, Mongoose 8.13, JSON Web Tokens (JWT), bcryptjs, web-push
- **Database**: MongoDB Atlas or local MongoDB
- **Application Type**: Responsive Single Page Application (SPA) + Progressive Web App (PWA)

---

## 3. Project Architecture & Folder Structure

```
SpendWise/
├── package.json                   # Root orchestrator script runner (concurrently)
├── .gitignore                     # Watertight gitignore protecting secrets and builds
├── README.md                      # Comprehensive deployment & usage guide
├── server/                        # Backend REST API
│   ├── .env.example               # Backend environment variables template
│   ├── package.json               # Express, Mongoose, JWT, web-push dependencies
│   ├── test-suite.js              # 22 automated integration verification tests
│   └── src/
│       ├── server.js              # Server entry point, dynamic CORS, routes mounting
│       ├── config/
│       │   └── db.js              # MongoDB Atlas / local connection logic
│       ├── models/
│       │   ├── User.js            # User model with bcrypt & notification preferences
│       │   ├── Transaction.js     # Unified Expense & Income model with indexes
│       │   ├── Budget.js          # Monthly category & overall budget limits
│       │   ├── SavingsGoal.js     # Savings targets & milestone history
│       │   ├── RecurringExpense.js# Subscriptions with next due date tracking
│       │   ├── Notification.js    # In-app notifications with deduplication index
│       │   └── PushSubscription.js# Web Push subscription endpoints
│       ├── middleware/
│       │   └── auth.js            # Bearer JWT verification & data isolation
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── transactionController.js
│       │   ├── budgetController.js
│       │   ├── savingsController.js
│       │   ├── recurringController.js
│       │   └── notificationController.js
│       ├── routes/                # API router modules
│       └── services/
│           └── notificationService.js # VAPID Web Push & 80%/100% budget alerts
└── client/                        # React Frontend (Vite + Tailwind CSS)
    ├── .env.example               # Frontend environment variables template
    ├── package.json
    ├── vite.config.js             # Vite configuration with /api development proxy
    ├── vercel.json                # Vercel SPA routing rewrite configuration
    ├── tailwind.config.js         # Custom brand & navy color palette
    ├── index.html                 # Mobile viewport, manifest link & SW loader
    ├── public/
    │   ├── favicon.svg            # SpendWise vector brand logo
    │   ├── manifest.json          # PWA Web App Manifest (standalone mode)
    │   ├── sw.js                  # Service Worker for offline caching & Web Push
    │   └── icons/                 # Crisp 192x192 & 512x512 PWA & maskable PNG icons
    └── src/
        ├── main.jsx               # React entry point with AuthProvider
        ├── App.jsx                # Layout orchestrator & tab routing
        ├── services/api.js        # Dynamic API client supporting VITE_API_URL
        ├── components/            # Reusable UI components
        └── pages/                 # Full feature views
```

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js v18+ (tested on v22)
- Local MongoDB running on `127.0.0.1:27017` or a MongoDB Atlas URI

### 1. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install:all
```

### 2. Configure Environment Files
Backend (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/spendwise
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:admin@spendwise.app
```

Frontend (`client/.env` - optional in local dev):
```env
# Leave empty for local Vite dev proxy to localhost:5000
VITE_API_URL=
```

### 3. Run Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 5. Automated Verification & Testing

SpendWise includes an end-to-end integration test suite covering authentication, database isolation, budget calculations, 80%/100% notification triggers, deduplication, and recurring bills.

```bash
# Run verification suite (with backend server running)
npm test
# Or directly:
node server/test-suite.js
```

---

## 6. Production Deployment Guide

### A. Database: MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2. Create a new cluster (e.g., M0 Free Shared).
3. Under **Security > Database Access**, add a database user with username and password.
4. Under **Security > Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere (`0.0.0.0/0`)** so Render can connect.
5. In **Clusters > Connect > Drivers**, copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/spendwise?retryWrites=true&w=majority
   ```

---

### B. Backend Deployment: Render
1. Sign in to [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `spendwise-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan Type**: `Free`
4. In **Environment Variables**, add:
   | Variable | Example / Description |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/spendwise?retryWrites=true&w=majority` |
   | `JWT_SECRET` | Generate a 32+ character random secret |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://spendwise.vercel.app` (your Vercel frontend URL, without trailing slash) |
   | `VAPID_PUBLIC_KEY` | Your VAPID public key |
   | `VAPID_PRIVATE_KEY`| Your VAPID private key |
   | `VAPID_EMAIL` | `mailto:admin@spendwise.app` |
5. Click **Deploy Web Service**.
6. Note your Render URL (e.g., `https://spendwise-backend.onrender.com`). Verify by visiting `https://spendwise-backend.onrender.com/` in your browser to see the online health response.

---

### C. Frontend Deployment: Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In **Project Configuration**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Under **Environment Variables**, add:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://spendwise-backend.onrender.com` (your Render backend URL) |
5. Click **Deploy**.
6. When deployment finishes, copy your frontend domain (e.g. `https://spendwise.vercel.app`).
7. Update `CLIENT_URL` in your Render backend environment variables with this domain to finalize CORS security.

---

## 7. Mobile PWA Installation Guide

SpendWise is configured as an installable Progressive Web App with standalone viewport, custom theme color (`#4f46e5`), offline asset cache, and home-screen icons.

### On Android (Google Chrome)
1. Open Chrome on your mobile phone and navigate to your production URL (`https://spendwise.vercel.app`).
2. An **"Add SpendWise to Home Screen"** or **"Install app"** banner will automatically appear at the bottom.
3. If not shown automatically, tap the three-dot menu (**⋮**) in the top right corner.
4. Tap **"Install application"** or **"Add to Home screen"**.
5. Tap **Add / Install**. SpendWise will appear on your device's home screen and app drawer as a native standalone app.

### On iOS (Apple Safari)
1. Open Safari on your iPhone/iPad and navigate to your production URL.
2. Tap the **Share** button (box with an upward arrow) at the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Name it **SpendWise** and tap **Add** in the top-right corner.

---

## 8. Web Push Notifications Setup

1. In the SpendWise top bar, click the **Notification Bell** icon.
2. Click **Enable Push Notifications** when prompted by the application.
3. Tap **Allow** when the browser displays the notification permission dialog.
4. Whenever an expense causes a category to hit 80% or exceed 100% of its budget, you will receive real-time push notifications on your phone or desktop.

---

## 9. License & Author

Developed with care for modern personal finance management.
SpendWise is open-source under the MIT License.
