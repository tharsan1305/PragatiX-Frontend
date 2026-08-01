# XSS Sanitization Testing Checklist

| Payload | Context | Result |
|---|---|---|
| `<script>alert(1)</script>` | Student Name Input | Auto-escaped in JSX |
| `<img src=x onerror=alert(1)>` | Profile Bio Text | Rendered as text literal |
| `javascript:alert(1)` | Custom Link Href | Blocked / Sanitized |
