# CSRF Protection Testing Checklist

1. CORS configuration enforced on API endpoints.
2. React Server Components (RSC) mode is NOT used (pure client SPA), mitigating RSC CSRF bypass advisories (`GHSA-qwww-vcr4-c8h2`).
3. State-changing requests utilize Bearer token in headers rather than ambient cookies.
