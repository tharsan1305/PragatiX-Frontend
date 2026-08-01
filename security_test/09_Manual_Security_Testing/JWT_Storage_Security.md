# JWT Storage Security Checklist

1. Token is attached via `Authorization: Bearer <token>` header.
2. Expired tokens trigger automatic 401 response interceptor clearing storage.
3. No plaintext passwords or sensitive credentials saved in localStorage.
