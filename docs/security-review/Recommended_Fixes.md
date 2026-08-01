# Recommended Fixes — Prioritized Action Plan

## Priority 1: Fix Immediately (Before Any Deployment)

### Fix 1 — Remove All JWT from localStorage (CRIT-001)

**Files:** `src/store/authContext.tsx`, `src/store/authStore.ts`, `src/features/auth/LoginPage.tsx`, `src/features/auth/pages/CaptainLoginPage.tsx`, `src/api/client.ts`

**Short-term mitigation** (if `httpOnly` cookie migration is not immediately feasible):

```typescript
// src/api/client.ts — use sessionStorage as a temporary improvement
// sessionStorage is cleared on tab close; still XSS-accessible but limits persistence

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  // Read from sessionStorage instead of localStorage
  const token = sessionStorage.getItem('spdms_token');
  const isAuthRoute = config.url?.includes('/api/v1/auth/login') ||
                      config.url?.includes('/api/v1/auth/student-login');
  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

```typescript
// src/store/authContext.tsx — replace localStorage with sessionStorage for token
useEffect(() => {
  if (token) {
    sessionStorage.setItem('spdms_token', token); // NOT localStorage
  } else {
    sessionStorage.removeItem('spdms_token');
  }
}, [token]);
```

**Long-term fix (recommended):** Migrate to `httpOnly` cookie authentication (see Priority 3, Fix 14).

**Time to fix (short-term):** 45 minutes. **Time to fix (full cookie migration):** 1–2 days.

---

### Fix 2 — Remove Debug Token (HIGH-002)

**File:** `src/features/student/tabs/DashboardTab.tsx`

```typescript
// REMOVE these lines entirely:
if (token === 'debug_token') {
  setIsLoading(false);
  return;
}
```

**Time to fix:** 5 minutes.

---

### Fix 2 — Remove Hardcoded Fallback Password (CRIT-003)

**File:** `src/features/admin/tabs/StudentsTab.tsx`

```typescript
// BEFORE (VULNERABLE):
payload.password = pass || '123456';

// AFTER (SECURE):
if (!pass) {
  toast.error('Password is required for new student registration.');
  setIsSaving(false);
  return;
}
payload.password = pass;
// Remove DOB-based password generation entirely
```

**Time to fix:** 10 minutes.

---

### Fix 3 — Enforce HTTPS in `.env.production` and Remove from Git

1. Update `.env.production` to use HTTPS: `VITE_API_BASE_URL=https://your-api-domain.com`
2. Add `.env.production` to `.gitignore`
3. Configure production API URL via CI/CD environment variable injection

**Time to fix:** 15 minutes.

---

### Fix 4 — Fix Incomplete Sidebar Logout (HIGH-004)

**File:** `src/components/layout/Sidebar.tsx`

```typescript
// BEFORE:
import { Link, useLocation } from 'react-router-dom';
const handleLogout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// AFTER:
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
export default function Sidebar({ role }: SidebarProps) {
  const { logout } = useAuth();
  const handleLogout = () => logout();
  // ...
}
```

**Time to fix:** 10 minutes.

---

### Fix 5 — Remove CSP `unsafe-inline` (CRIT-002) — Move Loader Script to JS

**File:** `index.html`

Move the inline loader script to a separate JS file. Then update CSP:

Create `public/loader-dismiss.js`:
```javascript
window.addEventListener('load', () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.4s ease';
      setTimeout(() => loader.remove(), 400);
    }, 300);
  }
});
```

Update `index.html`:
```html
<script src="/loader-dismiss.js"></script>
<!-- Replace the inline <script> block -->

<!-- Update CSP (remove unsafe-inline, unsafe-eval): -->
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self'; 
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
           font-src 'self' https://fonts.gstatic.com; 
           img-src 'self' data: blob:; 
           connect-src 'self' https://your-api-domain.com; 
           frame-ancestors 'none';" />
```

**Time to fix:** 30 minutes.

---

## Priority 2: Fix This Sprint

### Fix 6 — Increase Password Minimum Length (HIGH-005)

**File:** `src/features/admin/tabs/AdminProfileTab.tsx`

```typescript
// BEFORE:
if (!newPassword || newPassword.trim().length < 4) {
  toast.error("Password must be at least 4 characters.");

// AFTER:
if (!newPassword || newPassword.trim().length < 12) {
  toast.error("Password must be at least 12 characters and include a mix of letters, numbers, and symbols.");
```

---

### Fix 7 — Use Auth Context in AppLayout (HIGH-006)

**File:** `src/components/layout/AppLayout.tsx`

```typescript
// BEFORE:
const storedUser = localStorage.getItem('user');
let role = null;
if (storedUser) {
  try { const user = JSON.parse(storedUser); role = user.role; } catch (e) {}
}

// AFTER:
import { useAuth } from '../../store/authContext';
export default function AppLayout({ children }: AppLayoutProps) {
  const { role } = useAuth();
  // ...
}
```

---

### Fix 8 — Add Backend Logout Call (HIGH-007)

**File:** `src/store/authContext.tsx`

```typescript
const logout = async () => {
  try {
    await apiClient.post('/api/v1/auth/logout');
  } catch {
    // Proceed with local cleanup even if backend call fails
  }
  setToken(null);
  setUser(null);
  setRole(null);
  setSubRolesState([]);
  localStorage.removeItem('spdms_token');
  localStorage.removeItem('spdms_user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('auth_token');
  sessionStorage.clear();
  window.location.href = '/login';
};
```

---

### Fix 9 — Add Axios Timeout (MED-007)

**File:** `src/api/client.ts`

```typescript
export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
```

---

### Fix 10 — Validate External URLs (MED-003)

Create a shared utility:

```typescript
// src/core/utils/urlValidation.ts
export function isSafeExternalUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

Apply in `AdminBadgeRequestsTab.tsx` and `RemovalRequestsTab.tsx`.

---

### Fix 11 — Fix XP Claim Error Handling (HIGH-011)

**File:** `src/store/xpStore.ts`

```typescript
submitXpClaim: async (category, activityName, xpPoints, evidenceUrl) => {
  try {
    const response = await apiClient.post('/api/v1/xp/submit', {
      category, activityName, xpPoints, evidenceUrl,
    });
    return response.data.success === true;
  } catch (error) {
    console.error('Failed to submit XP claim', error);
    return false; // Never simulate success on failure
  }
}
```

---

### Fix 12 — Add CSV Injection Protection (MED-015)

**File:** `src/features/admin/tabs/AdminAttendanceTab.tsx`

```typescript
function escapeCsvCell(value: string): string {
  const str = String(value ?? '').replace(/"/g, '""');
  if (/[,"\n\r]/.test(str) || /^[=+\-@\t]/.test(str)) {
    return `"${str}"`;
  }
  return str;
}

// Use in rows.map():
['Present', escapeCsvCell(s.studentName || ''), escapeCsvCell(s.registerNumber || '')]
```

---

### Fix 13 — Disable Source Maps in Production

**File:** `vite.config.ts`

```typescript
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    sourcemap: mode === 'development',
  },
  // ...
}));
```

---

## Priority 3: Medium-Term (Architecture)

### Fix 14 — Migrate to httpOnly Cookie Authentication

This is the most impactful security improvement but requires backend changes:

1. **Backend:** Set `httpOnly; Secure; SameSite=Strict` cookie on login response.
2. **Frontend:** Remove all `localStorage.setItem(token)` calls.
3. **Frontend:** Add `withCredentials: true` to Axios instance.
4. **Frontend:** Add CSRF double-submit cookie protection.
5. **Backend:** Implement refresh token endpoint.

### Fix 15 — Remove `authStore.ts` (Dead Code)

1. Verify no component imports `useAuthStore`.
2. Delete `src/store/authStore.ts`.
3. Remove `auth_token` localStorage key from all remaining references.

### Fix 16 — Enable TypeScript Strict Mode

**File:** `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Fix all resulting type errors — this will expose many implicit `any` usages that should become proper interfaces.

### Fix 17 — Implement Structured Logger

```typescript
// src/core/utils/logger.ts
const isDev = import.meta.env.MODE === 'development';

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    if (isDev) {
      console.error(message, meta);
    }
    // Production: send sanitized error to monitoring service
    // NEVER include tokens, passwords, or full user objects
  },
  warn: (message: string) => {
    if (isDev) console.warn(message);
  },
};
```

### Fix 18 - Downgrade react-router-dom to 7.11.0 (HIGH-012)

```bash
npm install react-router-dom@7.11.0
```

`react-router-dom@7.18.2` pulls `react-router@7.12.0-8.2.0` which is affected by GHSA-qwww-vcr4-c8h2 (CWE-352, CSRF bypass). npm audit reports 2 HIGH production vulnerabilities. The advisory's fix is a downgrade to `7.11.0`. After downgrading, re-run `npm audit --omit=dev` to confirm a clean tree, and regenerate `sbom.cdx.json`.

Then re-run:

```bash
npm audit --omit=dev
```

Expected: no vulnerabilities found.
