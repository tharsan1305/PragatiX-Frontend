# Developer Setup & Local Security Scan Guide

This guide describes how to set up the development environment for the PragatiX Web Frontend and execute the automated security pipeline locally before pushing changes.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **Git**

### 2. Installation
Run the following command at the repository root to perform a clean installation of all dependencies (including testing and quality utilities):
```bash
npm ci
```

### 3. Environment Configuration
To connect the frontend to a local or remote API backend:
1. Copy the example configuration template:
   ```bash
   cp .env.example .env
   ```
2. Modify the API endpoint inside `.env` or `.env.development` as required:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```
   > [!IMPORTANT]
   > Do **NOT** commit `.env` or `.env.development` to source control. They are ignored by Git. Only `.env.production` remains tracked as it contains no credentials.

---

## 🔍 Running Local Scans

Before submitting a Pull Request, you should run the automated scanning script to verify that there are no compilation errors, failing unit tests, or critical environment variable leaks.

### On Windows (PowerShell)
Execute the PowerShell scanner script:
```powershell
.\.ci\scan-local.ps1
```

### On macOS / Linux (Bash)
Execute the shell scanner script (make sure it is executable first):
```bash
chmod +x .ci/scan-local.sh
./.ci/scan-local.sh
```

### Reading the Report
Both scripts produce:
1. `final-security-report.html`: A single self-contained HTML file summarizing all results with filterable details. Open this file in any web browser to view findings.
2. `gate-result.json`: The verdict report of the security gate.

---

## 🛠️ Integrated Pipeline Tools

The CI pipeline runs the following checks in parallel:
1. **actionlint**: Validates GHA workflow configuration syntax.
2. **TypeScript**: Verifies strict type checking (`tsc --noEmit`).
3. **Oxlint**: Runs fast lint rules.
4. **Vitest**: Runs component and unit tests.
5. **v8 coverage**: Tracks code coverage.
6. **Semgrep**: Runs static application security testing (SAST) rule patterns.
7. **CodeQL**: Deep path-based code analysis.
8. **Gitleaks**: Scans commit history for leaked credentials/secrets.
9. **Vite Env Leak Checker**: Verifies that no sensitive data (keys/tokens) is exposed via `VITE_` variables in production builds.
10. **npm audit**: Scans project dependencies for vulnerabilities.
11. **Trivy / Grype / Syft**: Generates Software Bill of Materials (SBOM) and performs container/dependency checks.
