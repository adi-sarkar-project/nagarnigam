# URBANRESOLVE — Project Documentation

Civic complaint management portal for citizens to report municipal issues and for administrators to review, resolve, and notify users. Citizens and admins use separate login flows, email verification, and admin approval before citizens can file complaints.

---

## Recent Updates

| Feature | Description |
|--------|-------------|
| **Complaint address** | Citizens submit a full street/colony address; stored on each complaint and shown in citizen history and admin cards. |
| **Email on submit** | After a complaint is created, the citizen receives a `complaintReceived` email with a PDF attachment. |
| **Email on resolve** | When an admin marks a complaint resolved (after uploading an after-image), the citizen receives a `complaintResolved` email with an updated PDF. |
| **PDF reports** | `pdfkit` generates a complaint report (citizen info, category, location, address, description, status) attached to notification emails. |
| **Split user collections** | Citizens and admins live in separate MongoDB collections (`Citizen`, `Admin`) instead of a single `User` collection. |
| **Auth flows** | Email verification, forgot/reset password, admin approval/rejection with email notifications. |

---

## Project Structure

```
adi-sarkar-project/
├── package.json              # Root scripts to run frontend + backend together
├── PROJECT_DOCUMENTATION.md  # This file
├── backend/                  # Node.js / Express API
└── frontend/                 # React / Vite client
```

---

## Root

| File | Use case |
|------|----------|
| `package.json` | Workspace helper: `npm run install:all`, `npm run dev` (runs backend + frontend via `concurrently`). |
| `PROJECT_DOCUMENTATION.md` | Single source of truth for setup, architecture, dependencies, and API overview. |

---

## Backend (`backend/`)

### Entry & config

| Path | Use case |
|------|----------|
| `server.js` | Express app entry: CORS, JSON body, health check, mounts `/api/auth` and `/api/complaints`, error handler, DB connect, auto-seeds admin if missing. |
| `package.json` | Backend dependencies and scripts (`dev`, `start`, `seed:admin`, migration scripts). |
| `.env` / `.env.example` | Environment variables (MongoDB, JWT, Cloudinary, email, admin seed, `CLIENT_URL`). |
| `config/db.js` | Connects to MongoDB using `MONGODB_URI`. |
| `config/cloudinary.js` | Uploads complaint images to Cloudinary (`uploadBuffer`). |
| `config/email.js` | Nodemailer transport (`EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`). |

### Controllers

| Path | Use case |
|------|----------|
| `controllers/authController.js` | Register/login (citizen & admin), verify email, forgot/reset password, current user, pending/active citizens, approve/reject citizens with emails. |
| `controllers/complaintController.js` | Create complaint (with address + before image), list all/my complaints, upload after-image, resolve complaint and trigger resolution email + PDF. |

### Middleware

| Path | Use case |
|------|----------|
| `middleware/authMiddleware.js` | JWT `protect`, `authorizeAdmin` for admin-only routes. |
| `middleware/roleMiddleware.js` | Role guard (`citizen` / `admin`) on complaint routes. |
| `middleware/uploadMiddleware.js` | Multer memory storage for `beforeImage` / `afterImage` multipart fields. |

### Models

| Path | Use case |
|------|----------|
| `models/Citizen.js` | Citizen schema: credentials, email verification, approval status, reset tokens. |
| `models/Admin.js` | Admin schema for municipal staff accounts. |
| `models/Complaint.js` | Complaint schema: user ref, category, `location` (district/city), **address**, description, before/after image URLs, status, `resolvedAt`. |

### Routes

| Path | Use case |
|------|----------|
| `routes/authRoutes.js` | Maps auth endpoints under `/api/auth`. |
| `routes/complaintRoutes.js` | Maps complaint CRUD/resolution under `/api/complaints`. |

### Utilities

| Path | Use case |
|------|----------|
| `utils/emailService.js` | HTML email templates (`verifyEmail`, `resetPassword`, `approvalNotification`, `complaintReceived`, `complaintResolved`) and `sendEmail` / `sendEmailWithAttachment`. |
| `utils/pdfGenerator.js` | Builds PDF complaint reports returned as Nodemailer attachments. |
| `utils/accountLookup.js` | Normalized email lookup across Citizen/Admin collections. |
| `utils/generateToken.js` | JWT creation for authenticated sessions. |

### Scripts

| Path | Use case |
|------|----------|
| `scripts/createAdmin.js` | Manually seed an admin from `.env` values. |
| `scripts/migrateUsersToCollections.js` | Migrate legacy `users` collection into `citizens` / `admins`. |
| `scripts/dropLegacyUsersCollection.js` | Drop old `users` collection after migration. |

### API overview

**Auth** (`/api/auth`)

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/register` | Public | Citizen registration |
| POST | `/login` | Public | Citizen or admin login |
| POST/GET | `/verify-email`, `/verify-email/:token` | Public | Email verification |
| POST | `/forgot-password`, `/reset-password` | Public | Password recovery |
| GET | `/me` | Authenticated | Current user profile |
| GET | `/admin/pending-users` | Admin | Users awaiting approval |
| GET | `/admin/active-citizens` | Admin | Approved citizens |
| PATCH | `/admin/approve-user/:userId` | Admin | Approve citizen |
| PATCH | `/admin/reject-user/:userId` | Admin | Reject citizen |

**Complaints** (`/api/complaints`)

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/create` | Citizen | Submit complaint (multipart: category, district, city, address, description, beforeImage) |
| GET | `/my` | Authenticated | Citizen’s own complaints |
| GET | `/` | Admin | All complaints |
| PATCH | `/:id/after-image` | Admin | Upload resolution photo |
| PATCH | `/:id/resolve` | Admin | Mark resolved; sends email + PDF |

**Health:** `GET /api/health`

---

## Frontend (`frontend/`)

### App shell

| Path | Use case |
|------|----------|
| `package.json` | React app dependencies and Vite scripts. |
| `vite.config.ts` | Dev server, path aliases (`@/`), build options. |
| `index.html` | HTML shell for Vite. |
| `.env` / `.env.example` | `VITE_API_URL` pointing to backend API. |
| `src/main.tsx` | React DOM mount. |
| `src/App.tsx` | Routes: home, login, admin login, register, password reset, verify email, approval pending, citizen panel, admin dashboard. |
| `src/index.css` | Global styles and theme tokens (saffron/navy civic theme). |
| `tailwind.config.ts` | Tailwind theme extensions. |
| `components.json` | shadcn/ui configuration. |

### Pages

| Path | Use case |
|------|----------|
| `pages/Index.tsx` | Landing / entry to login or register. |
| `pages/Login.tsx` | Citizen login. |
| `pages/AdminLogin.tsx` | Admin-only login. |
| `pages/Register.tsx` | Citizen registration. |
| `pages/VerifyEmail.tsx` | Handles email verification link from inbox. |
| `pages/ApprovalPending.tsx` | Shown when account is verified but not yet approved by admin. |
| `pages/ForgotPassword.tsx` | Request password reset email. |
| `pages/ResetPassword.tsx` | Set new password from reset link. |
| `pages/CitizenPanel.tsx` | Raise complaints (category, district, city, **address**, description, photo) and view history with address. |
| `pages/AdminDashboard.tsx` | Approve/reject users, view complaints with **address**, upload after-images, resolve complaints. |
| `pages/NotFound.tsx` | 404 page. |

### API layer

| Path | Use case |
|------|----------|
| `api/axios.ts` | Axios instance with base URL and JWT interceptor. |
| `api/auth.ts` | Auth API calls (login, register, verify, reset, admin user management). |
| `api/complaints.ts` | Complaint create, list, upload after-image, resolve. |

### Shared code

| Path | Use case |
|------|----------|
| `types/app.ts` | TypeScript types: `User`, `Complaint` (includes `address`), roles, statuses. |
| `hooks/useAuth.tsx` | Auth context: user state, login/logout, token persistence. |
| `hooks/use-toast.ts` | Toast hook (legacy shadcn). |
| `lib/auth-storage.ts` | localStorage helpers for JWT. |
| `lib/api-error.ts` | Normalize API error messages for UI. |
| `lib/utils.ts` | `cn()` and small helpers. |
| `lib/mockStore.ts` | Optional mock data (if used offline). |

### Components

| Path | Use case |
|------|----------|
| `components/AppHeader.tsx` | Top navigation and branding. |
| `components/AppFooter.tsx` | Footer. |
| `components/ProtectedRoute.tsx` | Redirects unauthenticated users; enforces `citizen` vs `admin` role. |
| `components/StatusBadge.tsx` | Pending/resolved status chip. |
| `components/SafeImage.tsx` | Image with fallback when URL fails. |
| `components/RedirectLoader.tsx` | Loading state during redirects. |
| `components/NavLink.tsx` | Styled router link. |
| `components/ui/*` | shadcn/ui primitives (Button, Card, Input, Select, Dialog, etc.) used across pages. |

### Tests

| Path | Use case |
|------|----------|
| `vitest.config.ts` | Vitest configuration. |
| `src/test/setup.ts` | Test environment setup. |
| `src/test/example.test.ts` | Sample test. |

---

## User Flows

### Citizen

1. Register → verify email via link → wait for admin approval.
2. Log in → open **Citizen Panel**.
3. Submit complaint: category, district, city, **address**, description, before photo.
4. Receive **complaint received** email with PDF.
5. Track status in history (address visible on each card).
6. When admin resolves: receive **complaint resolved** email with updated PDF.

### Admin

1. Log in at `/admin/login`.
2. **Pending** tab: approve or reject new citizens (rejection sends reason by email).
3. **Complaints** tab: view all issues with city, district, and **address**.
4. Upload after-work image → click **Resolve** → citizen notified by email.

---

## Dependencies

### Root

| Package | Purpose |
|---------|---------|
| `concurrently` | Run backend and frontend dev servers with one command. |

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| `express` | HTTP API server |
| `mongoose` | MongoDB ODM |
| `dotenv` | Load `.env` |
| `cors` | Cross-origin requests from frontend |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT auth |
| `multer` | Multipart file uploads |
| `cloudinary` | Cloud image storage for complaint photos |
| `nodemailer` | Transactional emails |
| `pdfkit` | PDF complaint reports for email attachments |
| `nodemon` *(dev)* | Auto-restart during development |

### Frontend (`frontend/package.json`)

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client to backend |
| `@tanstack/react-query` | Server state / caching |
| `lucide-react` | Icons |
| `sonner` | Toast notifications |
| `tailwindcss`, `tailwind-merge`, `tailwindcss-animate` | Styling |
| `class-variance-authority`, `clsx` | Component variant utilities |
| `@radix-ui/*` | Accessible UI primitives (shadcn base) |
| `react-hook-form`, `@hookform/resolvers`, `zod` | Forms and validation |
| `date-fns`, `react-day-picker` | Date handling |
| `recharts` | Charts (if used on dashboards) |
| `vite`, `@vitejs/plugin-react-swc` | Build tooling |
| `typescript` | Type checking |
| `vitest`, `@testing-library/react` | Unit tests |
| `eslint` | Linting |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs JWT tokens |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated |
| `CLOUDINARY_*` | Cloud name, API key/secret, folder prefix |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Auto-seed admin on startup |
| `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` | Outbound email (e.g. Gmail app password) |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base (e.g. `http://localhost:5000/api`) |

---

## Setup & Run

```bash
# From project root — install everything
npm run install:all

# Or separately
cd backend && npm install
cd frontend && npm install
```

Configure `backend/.env` and `frontend/.env` from the `.env.example` files.

```bash
# Run both (from root)
npm run dev

# Or individually
npm run backend:dev
npm run frontend:dev
```

**Backend scripts**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start API with nodemon |
| `npm start` | Start API (production) |
| `npm run seed:admin` | Create admin manually |
| `npm run migrate:users` | Migrate legacy users collection |
| `npm run drop:users` | Drop legacy users collection |

**Frontend scripts**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## Testing Checklist

1. Register citizen → verify email → admin approves account.
2. Submit complaint with address and photo → confirm history and admin card show address.
3. Confirm **complaint received** email and PDF attachment (requires valid email env).
4. Admin uploads after-image and resolves → confirm **complaint resolved** email and PDF.
5. Test forgot/reset password and admin reject flow emails.

---

## Notes

- If `EMAIL_USER` / `EMAIL_PASSWORD` are unset, complaints still save; emails are skipped with a console warning.
- Complaint images are stored on **Cloudinary**, not local disk (except optional `/uploads` static route).
- Default admin is created on first server start if no admin exists for `ADMIN_EMAIL`.
