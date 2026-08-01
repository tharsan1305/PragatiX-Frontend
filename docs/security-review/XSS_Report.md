# Cross-Site Scripting (XSS) Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| CRIT-002 | CSP `unsafe-inline` + `unsafe-eval` negates XSS protection | Critical |
| MED-003 | Unvalidated external URL rendered as link | Medium |
| LOW-005 | Badge image URL from API rendered directly | Low |
| NMV-004 | Stored XSS via backend data — needs runtime verification | NMV |

---

## XSS Vector Assessment

### 1. React JSX Auto-Escaping

React automatically escapes all expressions rendered in JSX. For example:

```tsx
<h3>{student.fullName}</h3>
// If fullName = "<script>alert(1)</script>"
// Renders as: &lt;script&gt;alert(1)&lt;/script&gt;
```

**Result: No reflected XSS through standard JSX rendering.** This is a positive control.

### 2. `dangerouslySetInnerHTML`

**Search Result: NOT USED anywhere in the codebase.** This is a positive finding.

### 3. External URLs in Anchor Tags

**Finding MED-003:** `proofLink` and `evidenceUrl` from API responses are rendered as `href` values without URL scheme validation. A `javascript:` URL would execute if clicked.

```tsx
// AdminBadgeRequestsTab.tsx
<a href={proofLink} target="_blank" rel="noopener noreferrer">
```

`javascript:alert(document.cookie)` is a valid `href` value and will execute in most browsers when clicked.

### 4. Badge Image URL

**Finding LOW-005:** `src={badgeIcon}` renders an unvalidated URL. An attacker could submit a badge icon URL that:
- Points to a tracking pixel to log admin IP addresses
- Exploits browser vulnerabilities via malformed image data

### 5. CSP Effectiveness

**Finding CRIT-002:** The current CSP with `unsafe-inline` and `unsafe-eval` provides **zero XSS protection** from CSP. Any injected `<script>` tag or `onerror` attribute would execute freely.

---

## Positive Controls

| Control | Status |
|---------|--------|
| React JSX auto-escaping | ✅ Active |
| No `dangerouslySetInnerHTML` | ✅ Confirmed absent |
| No `eval()` usage in application code | ✅ Confirmed absent |
| No `innerHTML` assignments | ✅ Confirmed absent |
| `rel="noopener noreferrer"` on most external links | ✅ Mostly present |

---

## Recommended XSS Mitigations

1. **Fix CSP** (CRIT-002) — remove `unsafe-inline` and `unsafe-eval`.
2. **Validate all URLs** before rendering as `href` or `src` (see MED-003 fix).
3. **Add DOMPurify** if any user-supplied HTML content ever needs to be rendered:
   ```typescript
   import DOMPurify from 'dompurify';
   const safeHtml = DOMPurify.sanitize(userContent);
   ```
4. **Add `Content-Security-Policy` as HTTP header** (not just meta tag) in production, with `frame-ancestors 'none'` for clickjacking protection.
