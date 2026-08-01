# Vite Build Security Review

1. Production bundle target: ES2022 / modern JS.
2. `VITE_` env variables inspected before bundling to prevent secret leaks.
3. Assets output directory `dist/` verified before deployment.
