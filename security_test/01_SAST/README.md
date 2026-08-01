# 01. Static Application Security Testing (SAST)

## Overview
Static Application Security Testing inspects the React/TypeScript source code without executing it to detect AST security flaws, code smells, and dangerous patterns.

## Scanners Used
1. **Oxlint**: High-speed Rust-based linter enforcing clean code & security checks.
2. **Semgrep**: Static analysis engine running security rules against TypeScript & React code.

## Execution
```bash
npx oxlint --format=json > security_test/01_SAST/Oxlint/oxlint-report.json
semgrep scan --config auto --sarif --output security_test/01_SAST/Semgrep/semgrep.sarif
```
