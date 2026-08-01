# Needs Manual Verification

> These findings require runtime testing, backend code inspection, or penetration testing to confirm or deny. They cannot be determined from frontend source code alone.

---

## NMV-001 — Backend JWT Validation and Expiry Enforcement

**Suspected Issue:** Broken Authentication  
**File Reference:** `src/api/client.ts`, `src/store/authContext.tsx`

### Description

The frontend correctly handles 401 responses by clearing tokens and redirecting to login. However, it is not possible to verify from the frontend alone:

1. Whether the backend validates JWT signatures and enforces expiry.
2. Whether the JWT secret is strong and not hardcoded in backend source.
3. Whether the algorithm is RS256/ES256 (asymmetric) rather than HS256 (symmetric).
4. Whether the backend rejects tokens after logout (token denylist).

### Verification Steps

1. Obtain a valid JWT from the login flow.
2. Decode the JWT header (base64url) and verify the algorithm is not `"alg":"none"`.
3. After calling logout, attempt to use the old token on a protected endpoint — it should return 401.
4. Manually expire a token (or wait for expiry) and verify 401 is returned.
5. Review backend `application.yml` for JWT secret strength.

---

## NMV-002 — IDOR on Student and Activity Endpoints

**Suspected Issue:** Insecure Direct Object Reference  
**File References:** `src/services/studentService.ts`, `src/features/student/pages/StudentDetailsPage.tsx`

### Description

Student detail pages use the URL parameter `id` from `useParams()` to fetch `/api/v1/students/${id}`. The frontend enforces RBAC via `ProtectedRoute` (only ADMIN and TEACHER can access `/students/:id`). However:

1. A TEACHER user can access `GET /api/v1/students/99999` — does the backend verify the teacher has authority over that student's department?
2. A STUDENT user who knows another student's numeric ID — can they call the API directly bypassing the frontend route guard?
3. The `adjustPoints` and `handleToggleCaptain` functions call `/api/v1/students/${id}/adjust-points` and `/api/v1/students/${id}/make-captain` — does the backend verify the caller has permission to modify this specific student?

### Verification Steps

1. Log in as Teacher A (assigned to Department X).
2. Manually call `GET /api/v1/students/<id-of-student-in-department-Y>`.
3. If successful, IDOR is confirmed.
4. Attempt to call `POST /api/v1/students/<id>/adjust-points` as a STUDENT role.

---

## NMV-003 — Rate Limiting on Login Endpoint

**Suspected Issue:** Brute Force / Credential Stuffing  
**File References:** `src/features/auth/LoginPage.tsx`, `src/features/auth/services/auth.service.ts`

### Description

The login form has no client-side rate limiting (no lockout, no CAPTCHA, no progressive delay). The frontend sends credentials to `/api/v1/auth/login` and `/api/v1/auth/student-login`. Whether the backend enforces rate limiting cannot be determined from the frontend source.

### Verification Steps

1. Use a tool like Burp Suite to send 50 rapid login attempts with incorrect passwords to `/api/v1/auth/login`.
2. If all 50 requests complete without HTTP 429 or account lockout, rate limiting is absent.
3. Check backend for Spring Security rate limiting configuration or IP-based throttling.

---

## NMV-004 — XSS via Backend Data Rendered in DOM

**Suspected Issue:** Stored XSS  
**File References:** Multiple components that render user-supplied names, descriptions, activity names

### Description

The application renders many fields from the backend API directly in JSX (e.g., student `fullName`, activity `name`, badge `badgeName`, stage `name`, department `name`, teacher `fullName`). React's JSX auto-escaping should prevent XSS in most cases. However, manual verification is needed to confirm:

1. No `dangerouslySetInnerHTML` is used anywhere (confirmed absent in this review — good).
2. No `innerHTML` assignments occur in event handlers or utility code.
3. The backend properly stores and returns sanitized data (if the backend stores XSS payloads, React will escape them, but they would still be visible as literal text — though not executable).

### Verification Steps

1. As an admin, create a student with the name `<img src=x onerror=alert(1)>`.
2. View the student list — verify it renders as escaped text, not executable HTML.
3. Search for any `dangerouslySetInnerHTML` patterns in the built output.

---

## NMV-005 — CORS Configuration on Backend API

**Suspected Issue:** CORS Misconfiguration  
**File Reference:** `vite.config.ts` (proxy), `src/api/client.ts`

### Description

The Vite proxy routes `/api` requests to `http://localhost:8080` in development, masking CORS behavior. In production, the frontend SPA will make direct CORS requests to the backend. Whether the backend's CORS policy restricts allowed origins to the specific frontend domain (rather than `*`) cannot be determined from frontend code.

A permissive CORS policy (e.g., `Access-Control-Allow-Origin: *` with credentials) would allow any web page to make authenticated requests to the backend on behalf of a logged-in user.

### Verification Steps

1. Inspect the production backend response headers for `Access-Control-Allow-Origin`.
2. Verify it is not `*` when `Access-Control-Allow-Credentials: true` is set (this combination is invalid per spec but some frameworks misconfigure it).
3. Verify the allowed origin is the specific production frontend domain.
