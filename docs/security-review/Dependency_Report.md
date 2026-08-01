# Dependency Security Report

## Summary

| Check | Status |
|-------|--------|
| npm audit (known CVEs) | ❌ **2 HIGH severity vulnerabilities** in `react-router` / `react-router-dom` (GHSA-qwww-vcr4-c8h2 — CSRF bypass, CWE-352) |
| Outdated packages | ⚠️ Check dates (some packages pre-release versions) |
| Suspicious packages | ✅ No typosquatting detected |
| SBOM generated | ✅ `sbom.cdx.json` present |
| Supply chain risk | ℹ️ Standard React ecosystem |

---

## Runtime Dependencies

| Package | Version | Security Notes |
|---------|---------|---------------|
| `axios` | ^1.18.1 | Actively maintained. No known critical CVEs. |
| `react` | ^19.2.7 | Latest stable RC. Monitor for security patches. |
| `react-dom` | ^19.2.7 | Same as above. |
| `react-router-dom` | 7.18.2 | ⚠️ **VULNERABLE** — in range 7.12.0–8.2.0 affected by GHSA-qwww-vcr4-c8h2 (CSRF bypass, HIGH). Downgrade to `7.11.0` to fix. |
| `zod` | ^4.4.3 | Schema validation. No known CVEs. |
| `zustand` | ^5.0.14 | State management. No known CVEs. |
| `react-hook-form` | ^7.81.0 | Form library. No known CVEs. |
| `@hookform/resolvers` | ^5.4.0 | Zod resolver. No known CVEs. |
| `recharts` | ^3.9.2 | Charting. No known CVEs. |
| `react-hot-toast` | ^2.6.0 | Notification. No known CVEs. |
| `lucide-react` | ^1.24.0 | Icon library. No known CVEs. |

### Notable Observation

`react-router-dom@7.18.2` is pinned (no `^` caret), which prevents automatic version bumps — but it is pinned **within a known-vulnerable range** (7.12.0–8.2.0). `npm audit` reports the `react-router` CSRF bypass (GHSA-qwww-vcr4-c8h2, CWE-352) as HIGH severity in the production dependency tree. Per the advisory, the fix is to downgrade to `7.11.0`. This is a blocking finding for production — see HIGH-012 and MED-001/CRIT-001 for the CSRF context.

---

## Dev Dependencies Security Notes

| Package | Version | Notes |
|---------|---------|-------|
| `vite` | ^8.1.1 | Latest. Monitor for security advisories. |
| `typescript` | ~6.0.2 | Uses `~` (patch-only) — acceptable. |
| `vitest` | ^3.0.4 | Test runner. No known CVEs. |
| `jsdom` | ^26.0.0 | Used in test environment. Monitor for XSS-related issues. |
| `oxlint` | ^1.71.0 | Linter. No security concerns. |

---

## Supply Chain Risk Assessment

The dependency tree consists entirely of well-known, widely-used packages from the React ecosystem. No packages with unusual names, suspicious maintainers, or limited download counts were observed.

**Risk Level: LOW** for supply chain attack via direct dependencies.

### Transitive Dependencies

Transitive dependency vulnerabilities are harder to track. The presence of `sbom.cdx.json` and the CI pipeline's use of Syft/Grype/Trivy for SBOM scanning is a positive control. Ensure:
1. The SBOM is regenerated on every dependency update.
2. Grype scan results are reviewed in CI — do not set to "always pass."

---

## Recommendations

1. **Pin all dependency versions** (remove `^`) and use `npm ci` instead of `npm install` in production builds.
2. **Enable Dependabot or Renovate** for automated security update PRs.
3. **Run `npm audit --audit-level=moderate`** in CI and fail on moderate+ severity issues.
4. **Consider using `overrides` in `package.json`** to force secure versions of transitive dependencies with known CVEs.
5. **Review `jsdom` in test environment** — jsdom parses HTML and executes scripts; ensure test-only dependencies do not leak into production builds.
