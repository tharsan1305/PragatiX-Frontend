# Security Headers Report

## Summary

| Header | Present | Value | Assessment |
|--------|---------|-------|------------|
| Content-Security-Policy | ✅ (meta tag) | `unsafe-inline`, `unsafe-eval` | ❌ Ineffective |
| X-Content-Type-Options | ✅ | `nosniff` | ✅ Good |
| Referrer-Policy | ✅ | `strict-origin-when-cross-origin` | ✅ Good |
| X-Frame-Options | ❌ | Not set | ❌ Clickjacking risk |
| Strict-Transport-Security | ❌ | Not set | ❌ Missing HTTPS enforcement |
| Permissions-Policy | ❌ | Not set | ❌ Missing |
| Cache-Control | ❌ | Not set | ❌ Missing |
| Cross-Origin-Opener-Policy | ❌ | Not set | ❌ Missing |
| Cross-Origin-Resource-Policy | ❌ | Not set | ❌ Missing |

---

## Headers Analysis

### What's Present (index.html meta tags)

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta http-equiv="Content-Security-Policy" content="..." />
```

### What's Missing (must be HTTP headers)

The following headers **cannot be set via HTML meta tags** and must be configured at the web server, CDN (CloudFront), or reverse proxy level:

#### 1. X-Frame-Options / CSP frame-ancestors
**Risk: Clickjacking**

```
X-Frame-Options: DENY
# or via CSP:
Content-Security-Policy: frame-ancestors 'none'
```

Any page of the application (including the login page) can currently be embedded in an `<iframe>` on another website, enabling clickjacking attacks where a victim is tricked into clicking admin buttons while viewing the embedded PragatiX interface.

#### 2. Strict-Transport-Security (HSTS)
**Risk: SSL stripping attacks**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Without HSTS, a network attacker can perform SSL stripping, downgrading HTTPS connections to HTTP and intercepting credentials.

#### 3. Permissions-Policy
**Risk: Excessive browser API access**

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

Prevents malicious third-party scripts from accessing device sensors.

#### 4. Cache-Control for Authenticated Pages
**Risk: Sensitive data in browser/proxy cache**

```
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
```

Without cache control headers, sensitive pages (student discipline records, attendance data) may be cached in browser history or shared proxy caches.

#### 5. Cross-Origin-Opener-Policy
```
Cross-Origin-Opener-Policy: same-origin
```

Prevents cross-origin windows from accessing the browsing context.

---

## CSP Meta Tag Limitations

The CSP is delivered via `<meta http-equiv="Content-Security-Policy">`. This has several limitations:
1. Cannot use `frame-ancestors` directive (silently ignored in meta CSP).
2. Applied after the HTML document starts parsing — cannot prevent the initial page load itself.
3. Some browsers may not support all CSP features via meta tags.
4. Cannot set `report-uri` or `report-to` for violation reporting.

---

## Recommended CloudFront Response Headers Policy

For the AWS CloudFront deployment (referenced in `security/FRONTEND_SECURITY.md`):

```json
{
  "ResponseHeadersPolicyConfig": {
    "SecurityHeadersConfig": {
      "ContentSecurityPolicy": {
        "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'nonce-{NONCE}'; ...",
        "Override": true
      },
      "StrictTransportSecurity": {
        "AccessControlMaxAgeSec": 31536000,
        "IncludeSubdomains": true,
        "Preload": true,
        "Override": true
      },
      "XFrameOptions": { "FrameOption": "DENY", "Override": true },
      "XContentTypeOptions": { "Override": true },
      "ReferrerPolicy": { "ReferrerPolicy": "strict-origin-when-cross-origin", "Override": true }
    }
  }
}
```
