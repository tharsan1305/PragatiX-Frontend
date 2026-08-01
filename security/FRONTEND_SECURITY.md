# PragatiX Web Frontend — Security Policy & Checklist

This document details the frontend security practices, controls, and configurations used in the PragatiX Web application.

---

## 1. Content Security Policy (CSP)
A robust Content Security Policy is defined via `meta` tag in [index.html](file:///N:/SPDMS/spdms_web/index.html) to mitigate XSS (Cross-Site Scripting) and data injection attacks:
* **Allowed Sources**:
  * `default-src 'self' http://localhost:8080 ws://localhost:5173` (Restricts code loading to self and local APIs/WebSocket)
  * `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (Permits React application execution)
  * `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (Loads styles securely)
  * `img-src 'self' data: blob: http://localhost:8080` (Restricts images to self, local API, and data URIs)

---

## 2. Authentication & JWT Storage
* **Bearer Token Pattern**: Upon successful login, the API token is received and managed securely.
* **Axios Interceptors**: The token is automatically attached to outgoing HTTP requests via `Authorization: Bearer <token>` in [apiClient.ts](file:///N:/SPDMS/spdms_web/src/services/apiClient.ts).
* **Expiry Management**: Token validation is verified on app init; expired sessions automatically clear local storage and redirect to the `/login` route.

---

## 3. Cross-Site Scripting (XSS) Mitigation
* **React Auto Escaping**: All variables rendered in JSX (e.g. `{studentName}`) are auto-escaped by React before rendering.
* **Risky Operations Policy**: The use of `dangerouslySetInnerHTML` is prohibited unless content is explicitly sanitized via `DOMPurify`.

---

## 4. Secure Transport & Headers
In production, the application is deployed behind CloudFront/S3 or Nginx utilizing HTTPS:
* **Strict-Transport-Security (HSTS)**: Configured at the CDN/Server level.
* **X-Content-Type-Options**: Explicitly configured as `nosniff` in `index.html`.
* **Referrer Policy**: Strict-origin-when-cross-origin.
