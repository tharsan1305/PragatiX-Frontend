# Frontend Security Report

## Overview

This report summarizes the overall frontend security posture of the PragatiX SPA, covering React/Vite specific concerns beyond those documented in individual domain reports.

---

## Clickjacking Protection

**Status: MISSING**

No `X-Frame-Options` header or `frame-ancestors` CSP directive is set. The login page and all authenticated views can be embedded in iframes. An attacker could create a malicious page that overlays transparent PragatiX iframes to trick admin users into performing unintended actions (clickjacking).

**Fix:** Add `X-Frame-Options: DENY` HTTP response header at the CDN/server level.

---

## Source Map Exposure

**Status: RISK**

Vite generates source maps by default in production builds (`vite build`). These `.map` files, if deployed alongside the built JavaScript, allow anyone to view the original TypeScript source code in browser DevTools.

**Fix:** Add to `vite.config.ts`:

```typescript
build: { sourcemap: false }
```

Or use environment-conditional source maps:

```typescript
build: { sourcemap: import.meta.env.DEV }
```

---

## Third-Party Script Loading

**Status: SECURE**

No third-party scripts (analytics, chat widgets, ad networks) are loaded. All JavaScript is self-hosted or bundled by Vite. This significantly reduces supply chain and XSS risks.

---

## Browser API Usage

| API | Usage | Security Notes |
|-----|-------|---------------|
| `localStorage` | Heavy use | See CRIT-001, HIGH-008 |
| `sessionStorage` | Cleared on logout | Acceptable |
| `window.location` | Redirect on logout/401 | See MED-013 |
| `window.confirm/alert` | Delete/adjust actions | See MED-009 |
| `window.addEventListener` | Inactivity timer, storage events | Properly cleaned up |
| `document.createElement` | CSV download (createElement('a')) | Acceptable pattern |
| `document.body.appendChild/removeChild` | CSV download | Acceptable — no untrusted HTML |

---

## DOM Manipulation Security

**CSV Download Pattern**

```typescript
// AdminAttendanceTab.tsx
const link = document.createElement('a');
link.setAttribute('href', encodedUri);
link.setAttribute('download', `attendance_${selectedDate}_period${selectedPeriod}.csv`);
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

The `href` is a `data:text/csv` URI, not a user-controlled URL. The `download` attribute uses `selectedDate` (from a `<input type="date">` which enforces YYYY-MM-DD format) and `selectedPeriod` (a number 1-8). No injection risk here.

**Risk: CSV injection in the data content** (see Output_Encoding_Report.md — MED-015).

---

## Loader Script in index.html

```html
<script>
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
</script>
```

This inline script is why `'unsafe-inline'` was added to the CSP `script-src`. **This is a self-inflicted problem.** The loader functionality should be moved to a script file, or the loader should be implemented entirely in CSS/React to allow removal of `'unsafe-inline'`.

---

## Performance DoS Risks

| Scenario | Risk | Mitigation |
|----------|------|-----------|
| Large student list (size=100 default) | Medium — renders 100 DOM nodes | Add pagination |
| Leaderboard data without limit | Medium | Paginate API response |
| Long activity descriptions | Low | `maxLength` on inputs |
| Large bulk Excel upload | Medium | File size limit (MED-002) |
| Recharts with large datasets | Low | Data is bounded by API |

The `fetchStudents(page = 0, size = 100)` default in `studentStore.ts` fetches 100 students per page. With large cohorts (500+ students), this increases memory usage and render time. However, the API supports pagination.

---

## Mobile Security

The application supports mobile via a bottom navigation bar. Mobile-specific security notes:
- No viewport meta hardening (`maximum-scale` restriction) — acceptable for accessibility.
- Bottom nav is a UI element only — actual route protection via `ProtectedRoute` is device-agnostic.
- Touch event listeners in the inactivity timer (`touchstart`) correctly support mobile sessions.
