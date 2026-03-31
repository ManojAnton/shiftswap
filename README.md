# 🔄 ShiftSwap — Retail Shift Swap & Availability Management System

**PRG-800 · Team Horizon · Seneca Polytechnic**

---

## 🚀 Quick Start (3 commands)

```bash
npm install          # Install all dependencies
npm run seed         # Load demo data into database
npm run dev          # Start the application
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Login Credentials

| Role     | Email                       | Password      |
|----------|-----------------------------|---------------|
| Manager  | manager@shiftswap.com       | Manager@123   |
| Employee | john@shiftswap.com          | Employee@123  |
| Employee | sarah@shiftswap.com         | Employee@123  |
| Employee | mike@shiftswap.com          | Employee@123  |
| Employee | emily@shiftswap.com         | Employee@123  |
| Employee | lisa@shiftswap.com          | Employee@123  |
| Employee | tom@shiftswap.com           | Employee@123  |
| Employee | anna@shiftswap.com          | Employee@123  |
| Employee | james@shiftswap.com         | Employee@123  |
| Employee | priya@shiftswap.com         | Employee@123  |
| Employee | carlos@shiftswap.com        | Employee@123  |
| Employee | rachel@shiftswap.com        | Employee@123  |
| Employee | david@shiftswap.com         | Employee@123  |

---

## ⚙️ Environment Setup

Copy `.env.example` to `.env` and fill in:

```env
MONGODB_URI=mongodb+srv://mantonmanorathan:ShiftSwap123@clustershiftswap.bhd1xn7.mongodb.net/shiftswap?retryWrites=true&w=majority&appName=ClusterShiftSwap
JWT_SECRET=shiftswap_super_secret_2026_xyz
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

---

## 📁 Project Structure

```
shiftswap/
├── client/                    # React Frontend (TypeScript)
│   ├── api/client.ts          # API client
│   ├── components/
│   │   ├── layout/Layout.tsx  # Sidebar + header + notification bell
│   │   └── ui/               # Badge, Btn, Card, Modal, Avatar, Toast, Bell
│   ├── context/AuthContext.tsx
│   ├── hooks/useAutoRefresh.ts
│   ├── pages/
│   │   ├── auth/LoginPage.tsx
│   │   ├── manager/
│   │   │   ├── ManagerDashboard.tsx
│   │   │   ├── ManagerSchedules.tsx
│   │   │   ├── ManagerSwaps.tsx
│   │   │   ├── ManagerEmployees.tsx
│   │   │   └── ManagerAvailability.tsx
│   │   └── employee/
│   │       ├── EmployeeDashboard.tsx
│   │       ├── EmployeeAvailability.tsx
│   │       ├── EmployeeSwaps.tsx
│   │       └── EmployeeIncoming.tsx
│   └── types.ts
├── src/                       # Express Backend (Node.js)
│   ├── models/
│   │   ├── User.js
│   │   ├── Schedule.js
│   │   ├── Shift.js
│   │   ├── SwapRequest.js
│   │   ├── Availability.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── schedules.js
│   │   ├── shifts.js
│   │   ├── swaps.js
│   │   ├── availability.js
│   │   └── dashboard.js
│   ├── middleware/auth.js
│   ├── server.js
│   └── utils/seed.js
├── .env                       # Your credentials (not in git)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔄 Swap Request Workflow

```
1. Employee views their upcoming shifts
2. Clicks "Swap →" on a shift
3. Modal shows two groups:
   🔄 Can Exchange — colleagues who have a shift that day (true swap)
   ✅ Can Cover    — colleagues free that day (just covering)
4. Employee selects colleague + optional reason → sends request
5. Target employee sees it in "Incoming Requests" → Accept or Decline
6. If accepted → Manager sees it in "Swap Requests" → Approve or Reject
7. If approved → Shift is automatically reassigned in database
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint         | Description     |
|--------|-----------------|-----------------|
| POST   | /api/auth/login | Login           |
| GET    | /api/auth/me    | Current user    |

### Schedules
| Method | Endpoint                        | Description        |
|--------|---------------------------------|--------------------|
| GET    | /api/schedules                  | List all           |
| POST   | /api/schedules                  | Create (Manager)   |
| PATCH  | /api/schedules/:id/publish      | Publish (Manager)  |

### Shifts
| Method | Endpoint        | Description             |
|--------|----------------|-------------------------|
| GET    | /api/shifts/my | My assigned shifts       |
| POST   | /api/shifts    | Add shift (Manager)      |
| DELETE | /api/shifts/:id| Remove shift (Manager)   |

### Swaps
| Method | Endpoint                          | Description                  |
|--------|----------------------------------|------------------------------|
| GET    | /api/swaps                       | All swaps (role-filtered)    |
| GET    | /api/swaps/sent                  | My sent requests             |
| GET    | /api/swaps/incoming              | Requests targeting me        |
| POST   | /api/swaps                       | Create swap request          |
| PATCH  | /api/swaps/:id/employee-respond  | Accept/Reject (Employee)     |
| PATCH  | /api/swaps/:id/manager-decide    | Approve/Reject (Manager)     |
| PATCH  | /api/swaps/:id/cancel            | Cancel request               |

### Availability
| Method | Endpoint                                    | Description              |
|--------|---------------------------------------------|--------------------------|
| GET    | /api/availability                           | Own availability         |
| GET    | /api/availability/all-employees             | All employees (Manager)  |
| GET    | /api/availability/available-for-shift       | Smart swap targeting     |
| POST   | /api/availability/bulk                      | Bulk update              |

---

## 🚀 Deploy to Railway

```bash
# 1. Build frontend
npm run build

# 2. Push to GitHub
git add . && git commit -m "deploy" && git push

# 3. Railway.app → New Project → Deploy from GitHub
# 4. Add environment variables in Railway dashboard
# 5. Set Build Command: npm install && npm run build
# 6. Set Start Command: npm start
```

Railway environment variables:
```
MONGODB_URI  = <your atlas URI>
JWT_SECRET   = <your secret>
NODE_ENV     = production
```

---

## 🛡️ Security Features

- JWT authentication (7-day tokens)
- Role-Based Access Control (Manager vs Employee)
- Employees can only swap their own assigned shifts
- Duplicate swap requests blocked
- All critical actions logged in AuditLog collection
- Password hashing with bcrypt

---

## 📊 Database Collections

| Collection   | Purpose                                    |
|--------------|--------------------------------------------|
| users        | Managers and employees                     |
| schedules    | Weekly schedules (Draft/Published)         |
| shifts       | Individual shift entries                   |
| swaprequests | Full swap lifecycle with 2-step approval   |
| availabilities | Per-employee per-day availability        |
| auditlogs    | Immutable action trail                     |

---

*ShiftSwap v1.0 · Built with React + Node.js + MongoDB Atlas*
