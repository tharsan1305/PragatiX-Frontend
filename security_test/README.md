# 🔒 PragatiX Web Frontend — Security Testing Center

## Overview

This directory serves as the **single centralized Security Testing Center** for the PragatiX Web Frontend (React 19, Vite 8, TypeScript, TailwindCSS v4) project.

All security testing reports, scan outputs, evidence, manual penetration testing matrices, and audit documentation generated during the complete security testing lifecycle are organized and stored here in a modular format.

---

## Project Under Test

| Field | Value |
|---|---|
| **Project Name** | PragatiX Web Frontend (`spdms_web`) |
| **Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **Language** | TypeScript |
| **Styling** | TailwindCSS v4 |
| **State Management** | Zustand |
| **Routing** | React Router DOM v7 / v8 |
| **Package Manager** | npm (`package-lock.json` enforced via `npm ci`) |
| **CI/CD Pipeline** | GitHub Actions (`.github/workflows/PragatiX-Frontend.yml`) |

---

## Directory Structure

```
security_test/
│
├── README.md                                    ← You are here
│
├── 01_SAST/                                     ← Static Application Security Testing
│   ├── Oxlint/                                  ← Oxlint AST security reports
│   └── Semgrep/                                 ← Semgrep SAIF & SAST scanner outputs
│
├── 02_Secrets_Scanning/                         ← Secrets & credential leak detection
│   ├── Gitleaks/                                ← Gitleaks repository secret scan reports
│   └── Vite_Env_Checker/                        ← Vite VITE_ env leak checker outputs
│
├── 03_Dependency_Scanning/                      ← SCA & dependency vulnerability scanning
│   ├── Npm_Audit/                               ← npm audit vulnerability reports
│   └── Snyk/                                    ← Snyk dependency reports
│
├── 04_Container_Security/                       ← Static filesystem & container image security
│   └── Trivy/                                   ← Trivy FS scan reports
│
├── 05_SBOM/                                     ← Software Bill of Materials & vulnerability matching
│   ├── Syft/                                    ← CycloneDX SBOM JSON reports
│   └── Grype/                                   ← Grype vulnerability matching reports
│
├── 06_Code_Quality_and_Test_Coverage/           ← Unit tests & code coverage
│   ├── Vitest/                                  ← Vitest test execution reports & JSON outputs
│   └── Coverage/                                ← Vitest V8 code coverage summaries
│
├── 07_API_Security_Testing/                     ← Frontend API security & interceptors
│   ├── api-security.spec.ts                     ← Unit/Integration tests for auth headers & 401 redirects
│   └── README.md
│
├── 08_Dynamic_Application_Security_Testing/     ← E2E & DAST testing
│   ├── Playwright_E2E/                          ← Playwright E2E security test suites
│   └── README.md
│
├── 09_Manual_Security_Testing/                  ← Manual penetration testing matrices & checklists
│   ├── Authentication_Testing.md
│   ├── Authorization_RBAC_Testing.md
│   ├── JWT_Storage_Security.md
│   ├── XSS_Sanitization_Testing.md
│   ├── CSRF_Protection_Testing.md
│   ├── Security_Headers_Testing.md
│   └── LocalStorage_Hygiene.md
│
├── 10_Infrastructure_and_Configuration/         ← Build & infrastructure security review
│   ├── Vite_Build_Security.md
│   ├── Actionlint_Workflows.md
│   └── Bundlesize_Budget_Check.md
│
├── 11_CI_CD_Security/                           ← Pipeline security & GitHub Actions workflow
│   ├── PragatiX-Frontend.yml                    ← Pipeline definition copy
│   └── Pipeline_Security_Checklist.md
│
├── 12_Final_Security_Audit/                     ← Consolidated audit reports & gate decisions
│   ├── final-security-report.html               ← Consolidated HTML Security Report
│   └── gate-result.json                         ← Automated Security Gate JSON decision
│
└── 13_Evidence/                                 ← Audit evidence artifacts & logs
    ├── scan_summary.json
    └── audit_evidence.md
```

---

## Security Scan Execution

To run the complete automated security scan suite locally and refresh all modular reports inside `security_test/`, execute:

```powershell
.\.ci\scan-local.ps1
```

Or on Linux/macOS:

```bash
bash .ci/scan-local.sh
```

---

## Security Gate Policy

Our security gate enforces strict zero-tolerance criteria:
- **CRITICAL Vulnerabilities**: 0 allowed (Immediate Fail)
- **HIGH Vulnerabilities**: 0 allowed (Fail unless explicitly mitigated with technical justification)
- **Scanner Execution Failures**: 0 allowed
- **TypeScript & Vite Build**: Must compile cleanly
- **Unit Tests**: All tests must PASS
