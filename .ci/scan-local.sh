#!/bin/bash
# scan-local.sh — Local Scan Script for Developers (Linux/macOS)
# Runs frontend scans locally, normalizes outputs, and renders the HTML report.

set -e
START_TIME=$(date +%s)

echo "============================================="
echo "     PragatiX-Frontend Local Security Scan   "
echo "============================================="

# 1. Setup folders
rm -rf findings
mkdir -p findings

# 2. Run Vite Env Leak Checker
echo "[1/7] Running Vite Env Leak Checker..."
node .ci/check-vite-env.cjs

# 3. TypeScript Typecheck
echo "[2/7] Running TypeScript typecheck..."
npx tsc --noEmit > findings/tsc-output.txt 2>&1 || true
node .ci/normalize.cjs typescript findings/tsc-output.txt findings

# 4. oxlint
echo "[3/7] Running oxlint..."
npx oxlint --format=json > findings/oxlint-output.json 2>&1 || true
node .ci/normalize.cjs oxlint findings/oxlint-output.json findings

# 5. Vitest Tests
echo "[4/7] Running Vitest..."
npx vitest run --reporter=json --outputFile=test-report.json > /dev/null 2>&1 || true
if [ -f test-report.json ]; then
  mv test-report.json findings/vitest-output.json
fi
node .ci/normalize.cjs vitest findings/vitest-output.json findings

# 6. npm audit
echo "[5/7] Running npm audit..."
npm audit --json > findings/npm-audit-output.json 2>&1 || true
node .ci/normalize.cjs npmaudit findings/npm-audit-output.json findings

# 7. bundlesize
echo "[6/7] Running bundlesize check..."
node .ci/normalize.cjs bundlesize none findings

# 8. Render HTML report
echo "[7/7] Generating Consolidated HTML Report..."
AUDIT_DIR="security_test/12_Final_Security_Audit"
mkdir -p "$AUDIT_DIR"

node .ci/render_report.cjs \
  findings/ \
  .ci/templates/report.html \
  "$AUDIT_DIR/final-security-report.html" \
  "$AUDIT_DIR/gate-result.json" \
  "tharsan1305/PragatiX-Frontend" \
  "local" \
  "00000000" \
  "0" \
  "0" \
  "$USER" \
  "local"

# Sync findings to modular security_test subdirectories
cp findings/oxlint.json security_test/01_SAST/Oxlint/oxlint-report.json 2>/dev/null || true
cp findings/gitleaks.json security_test/02_Secrets_Scanning/Gitleaks/gitleaks-report.json 2>/dev/null || true
cp findings/npmaudit.json security_test/03_Dependency_Scanning/Npm_Audit/npm-audit-report.json 2>/dev/null || true
cp findings/vitest.json security_test/06_Code_Quality_and_Test_Coverage/Vitest/vitest-report.json 2>/dev/null || true

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
echo "============================================="
echo "  Scan completed in ${ELAPSED} seconds!"
echo "  Report: $AUDIT_DIR/final-security-report.html"
echo "  Gate Result: $(cat $AUDIT_DIR/gate-result.json)"
echo "============================================="
