# React-Specific Security Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| CRIT-002 | CSP `unsafe-eval` (React dev tools requirement removed in prod) | Critical |
| HIGH-002 | Debug token bypass in useEffect | High |
| HIGH-010 | Dual auth stores — state desync | High |
| MED-013 | `window.location.href` instead of React Router navigate | Medium |
| LOW-003 | ErrorBoundary `console.error` in production | Low |

---

## React 19 Specific Notes

The application uses React 19 (19.2.7). React 19 includes:
- Automatic batching of state updates (no security impact)
- Server Actions support (not used in this SPA)
- Improved hydration (not used — no SSR)

**No React 19-specific security issues found.**

---

## Hooks Security Review

### `useEffect` Security Issues

**Finding HIGH-002:** `DashboardTab.tsx` has a debug bypass in `useEffect`:

```typescript
useEffect(() => {
  const loadProfile = async () => {
    if (token === 'debug_token') {  // VULNERABLE
      setIsLoading(false);
      return;
    }
    // ... real fetch
  };
  loadProfile();
}, [token, ...]);
```

### `useEffect` Dependency Array Issues

The following `useEffect` calls in `authContext.tsx` reference `logout` (line ~102) without including it in the dependency array:

```typescript
useEffect(() => {
  const checkAuthStatus = async () => {
    // ...
    if (error.response.status === 401) {
      logout(); // 'logout' used but not in deps array
    }
  };
  checkAuthStatus();
}, []); // Empty deps — logout is a stale closure
```

While this is unlikely to cause a security issue (logout is only called on 401), React's exhaustive-deps linting would flag this. The `logout` function could theoretically be a stale closure with outdated state.

---

## Context Security Review

### `AuthContext`

- Context is properly provided at the root level.
- `useAuth()` throws an error if used outside `AuthProvider` — good practice.
- Context value includes computed booleans (`isAdmin`, `isTeacher`, etc.) derived from role state — these are safe if the underlying state is trustworthy.

### Context Value Mutability Risk

```typescript
export interface UserData {
  [key: string]: any; // Allows arbitrary properties
}
```

The `[key: string]: any` index signature on `UserData` allows any property to be set on the user object. This could allow prototype pollution if user data is ever spread into other objects without filtering.

---

## Component Architecture Security

### `ProtectedRoute` Analysis

```typescript
// ProtectedRoute.tsx
if (!token || !user) {
  return <Navigate to="/login" replace />;  // 'replace' prevents back-navigation to protected page — good
}
```

The `replace` prop on `Navigate` prevents the browser back button from returning to a protected page after logout. This is good security practice.

### `NavigationTransition` Component

```typescript
// App.tsx
function NavigationTransition({ children }) {
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 450);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
  // ...
}
```

This component listens to `location.pathname` and `location.search`. **Security Note:** `location.search` includes URL query parameters. If the navigation loader displays a message that includes `location.search` in the UI text, it could be a reflected XSS vector. In the current implementation, the component only shows a "Moving to page..." static message — safe.

---

## React Router v7 Security

### Route Configuration

All sensitive routes use `ProtectedRoute`. The catch-all `<Route path="*" element={<Navigate to="/login" replace />}` prevents information disclosure about route existence.

### `useParams()` Usage

`useParams()` is used in:
- `StudentDetailsPage.tsx`: `const { id } = useParams<{ id: string }>()`
- `ActivityExecutionPageV2.tsx`: `const { activityId } = useParams<{ activityId: string }>()`
- Various group activity pages: `const { activityId } = useParams()`

The `id` and `activityId` values are passed directly to API calls as URL path parameters. **These should be validated as numeric before use:**

```typescript
// SECURE:
const numericId = parseInt(id ?? '', 10);
if (isNaN(numericId) || numericId <= 0) {
  navigate('/not-found');
  return;
}
```

---

## Zustand Store Security

### `xpStore.ts` — Mock Data Leak in Production

```typescript
// xpStore.ts — Lines 16-60 (mock data block)
const mockXpByCategory = {
  "ACADEMIC": 120,
  "SKILL": 100,
  // ...
};

export const useXpStore = create<XpState>(() => ({
  xpByCategory: mockXpByCategory,  // Mock data as initial state
  history: mockHistory,
  streaks: mockStreaks,
  // ...
}));
```

Mock data is used as initial/fallback state. If API calls fail (HIGH-011), users see mock data that appears realistic. This could mislead students about their actual XP scores.

---

## Positive React Security Practices

| Practice | Status |
|----------|--------|
| StrictMode enabled | ✅ |
| No `dangerouslySetInnerHTML` | ✅ |
| ErrorBoundary present | ✅ |
| React auto-escaping JSX | ✅ |
| `replace` prop on auth redirects | ✅ |
| Form submission via `e.preventDefault()` | ✅ (all forms) |
| No `document.write()` usage | ✅ |
| No `eval()` usage | ✅ |
