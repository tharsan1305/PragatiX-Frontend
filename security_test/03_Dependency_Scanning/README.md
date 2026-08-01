# 03. Software Composition Analysis (SCA) & Dependency Scanning

## Overview
Scans all 300+ third-party npm packages listed in `package-lock.json` for known CVEs and vulnerabilities.

## Tools Used
1. **npm audit**: Native package manager audit.
2. **Snyk CLI**: Deep vulnerability & license scanner.

## Execution
```bash
npm audit --json > security_test/03_Dependency_Scanning/Npm_Audit/npm-audit-report.json
```
