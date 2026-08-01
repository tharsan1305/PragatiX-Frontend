# Project Overview — PragatiX Web Frontend

## Application Identity

| Property | Value |
|----------|-------|
| Application Name | PragatiX (Student Performance & Discipline Management System) |
| npm Package Name | `pragatix` |
| Version | 0.0.0 |
| Type | Single Page Application (SPA) |
| Framework | React 19 + Vite 8 |
| Language | TypeScript 6 |
| Styling | TailwindCSS v4 |
| State Management | Zustand v5 + React Context |
| Routing | React Router DOM v7 |
| HTTP Client | Axios v1.18 |
| Form Validation | React Hook Form v7 + Zod v4 |
| Charting | Recharts v3 |

---

## Architecture Overview

```
src/
├── api/           → Low-level Axios instance (client.ts)
├── assets/        → Static images/logos
├── components/    → Shared UI components
│   ├── common/    → Modals, badges, loaders, progress bars
│   └── layout/    → Sidebar, AppLayout
├── config/        → API base URL configuration
├── core/utils/    → Date formatting, data extraction helpers
├── features/
│   ├── admin/     → Admin dashboard, CRUD for students/teachers/depts/stages/activities
│   ├── auth/      → Login pages, auth service
│   ├── captain/   → Captain group view
│   ├── student/   → Student dashboard, XP, leaderboard, badges
│   └── teacher/   → Teacher dashboard, attendance, badge requests
├── hooks/         → useApi generic hook
├── services/      → Business service layer (authService, studentService, etc.)
└── store/         → authContext (primary), authStore (secondary/legacy), studentStore, xpStore
```

---

## User Roles & Privileges

| Role | Access Level |
|------|-------------|
| ADMIN | Full system: create/edit/delete students, teachers, departments, stages, activities, attendance, badges |
| TEACHER (CC) | Manage activities, CC inbox, attendance, badge approval, group management |
| TEACHER (HOD) | Department performance reports |
| TEACHER | View leaderboard, attendance, badge claims |
| CAPTAIN | Student dashboard + Group management view |
| STUDENT | Own dashboard, XP history, leaderboard, activities, badges |
| PARENT | Login via SPR No + DOB (separate login path) |

---

## Technology Stack Security Posture

| Technology | Version | Security Notes |
|-----------|---------|---------------|
| React | 19.2.7 | Auto-escaping JSX — good |
| Vite | 8.1.1 | Source maps controlled by config |
| TypeScript | 6.0.2 | `noImplicitAny` NOT set — risk |
| Axios | 1.18.1 | Interceptors in place — token handling needs review |
| Zod | 4.4.3 | Only used on login form |
| React Hook Form | 7.81.0 | Used on login form only |
| React Router DOM | 7.18.2 | Protected routes implemented |
| Zustand | 5.0.14 | No persistence middleware — state in memory |
| react-hot-toast | 2.6.0 | Used for notifications |

---

## Backend Communication

- Base URL: `VITE_API_BASE_URL` (env var, defaults to `http://localhost:8080`)
- Auth mechanism: Bearer JWT token
- Token retrieval: `localStorage.getItem('spdms_token')` (primary key)
- Fallback keys: `'auth_token'`, `'token'`
- Session management: 30-minute inactivity timeout via event listeners
- Token validation: `/api/v1/auth/me` called on app load

---

## Deployment Target

- Development: `http://localhost:5173` (Vite dev server)
- Backend proxy: `http://localhost:8080` (via Vite proxy config)
- Production: AWS CloudFront/S3 (referenced in `security/FRONTEND_SECURITY.md`)
- CI/CD: GitHub Actions (`.github/workflows/PragatiX-Frontend.yml`)

---

## Data Sensitivity

The application handles:
- Student PII: full name, email, phone, DOB, address, guardian details
- Academic records: attendance, discipline scores, XP points
- Authentication credentials: passwords (cleartext during form submission, no hashing on frontend)
- Role and privilege information
- Evidence documents/URLs for badge claims

This data sensitivity level requires GDPR/PDPA-equivalent controls and justifies thorough security review before production deployment.
