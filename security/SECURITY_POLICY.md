# Security Policy & Vulnerability Disclosure

## 1. Reporting Security Issues
If you discover a security vulnerability within the PragatiX Web Frontend application, please report it privately. Do not disclose vulnerabilities publicly via GitHub Issues.

### Reporting Channels:
* **Security Contact**: `security@pragatix.internal`
* **Response SLA**: Initial triage within 24 hours; patch notification within 7 days.

---

## 2. Supported Versions
| Version | Supported |
|---|---|
| Main Branch (`v1.x`) | ✅ Yes |
| Legacy Tags (< v1.0) | ❌ No |

---

## 3. Vulnerability Classification & Gate Policies
Our automated security gate enforces strict policies before code can be deployed:
* **CRITICAL**: Immediate build failure. Zero tolerance for exposed secrets, active RCE, or high-risk XSS.
* **HIGH**: Build failure unless mitigated (e.g. CSRF in unreferenced RSC mode, documented in pipeline).
* **MODERATE / LOW**: Tracked and remediated during regular maintenance sprints.
