# 08. Dynamic Application Security Testing (DAST) & E2E

## Overview
Executes full browser-based end-to-end security and user workflow tests against the compiled Vite development / production web server using Playwright.

## Test Suites
* `Playwright_E2E/smoke.spec.ts`: Validates page loading, title validation, route protection, and unauthenticated redirects to `/login`.

## Execution
```bash
npx playwright test
```
