# 02. Secrets & Credential Leak Detection

## Overview
Scans repository commit history, environment files (`.env*`), and codebase for hardcoded secrets, API tokens, passwords, and private keys.

## Tools Used
1. **Gitleaks**: Audits git history and files for secret patterns.
2. **Vite Env Leak Checker**: Custom Node script verifying `VITE_` prefix hygiene and checking for un-prefixed sensitive keys.

## Execution
```bash
gitleaks detect --report-path security_test/02_Secrets_Scanning/Gitleaks/gitleaks-report.json --exit-code 0
node .ci/check-vite-env.cjs
```
