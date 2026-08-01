# 07. API Security Testing

## Overview
Verifies that the React application handles HTTP communication, Axios interceptors, Bearer token injection, and 401 unauthenticated session clearance securely.

## Test Suites
* `api-security.spec.ts`: Unit tests verifying header injection and storage cleanup.

## Execution
```bash
npx vitest run security_test/07_API_Security_Testing/api-security.spec.ts
```
