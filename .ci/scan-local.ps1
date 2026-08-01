# scan-local.ps1 — Local Scan Script for Developers (Windows)
# Runs frontend scans locally, normalizes outputs, and renders the HTML report.

$ErrorActionPreference = "SilentlyContinue"
$startTime = [DateTime]::Now

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "     PragatiX-Frontend Local Security Scan   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Setup folders
$findingsDir = "findings"
if (Test-Path $findingsDir) { Remove-Item $findingsDir -Force -Recurse }
New-Item -ItemType Directory -Path $findingsDir -Force | Out-Null

# 2. Run Vite Env Leak Checker
Write-Host "[1/7] Running Vite Env Leak Checker..." -ForegroundColor Yellow
node .ci/check-vite-env.cjs

# 3. TypeScript Typecheck
Write-Host "[2/7] Running TypeScript typecheck..." -ForegroundColor Yellow
npx tsc --noEmit | Out-File -Encoding utf8 findings/tsc-output.txt
node .ci/normalize.cjs typescript findings/tsc-output.txt findings

# 4. oxlint
Write-Host "[3/7] Running oxlint..." -ForegroundColor Yellow
npx oxlint --format=json | Out-File -Encoding utf8 findings/oxlint-output.json
node .ci/normalize.cjs oxlint findings/oxlint-output.json findings

# 5. Vitest Tests
Write-Host "[4/7] Running Vitest..." -ForegroundColor Yellow
npx vitest run --reporter=json --outputFile=findings/test-report.json > $null 2>&1
node .ci/normalize.cjs vitest findings/test-report.json findings

# 6. npm audit
Write-Host "[5/7] Running npm audit..." -ForegroundColor Yellow
npm audit --json | Out-File -Encoding utf8 findings/npm-audit-output.json
node .ci/normalize.cjs npmaudit findings/npm-audit-output.json findings

# 7. bundlesize
Write-Host "[6/7] Running bundlesize check..." -ForegroundColor Yellow
node .ci/normalize.cjs bundlesize none findings

# 8. Render HTML report
Write-Host "[7/7] Generating Consolidated HTML Report..." -ForegroundColor Yellow
$auditDir = "security_test/12_Final_Security_Audit"
if (!(Test-Path $auditDir)) { New-Item -ItemType Directory -Path $auditDir -Force | Out-Null }

node .ci/render_report.cjs `
  findings/ `
  .ci/templates/report.html `
  "$auditDir/final-security-report.html" `
  "$auditDir/gate-result.json" `
  "tharsan1305/PragatiX-Frontend" `
  "local" `
  "00000000" `
  "0" `
  "0" `
  $env:USERNAME `
  "local"

# Sync findings to modular security_test subdirectories
Copy-Item findings/oxlint.json security_test/01_SAST/Oxlint/oxlint-report.json -Force -ErrorAction SilentlyContinue
Copy-Item findings/gitleaks.json security_test/02_Secrets_Scanning/Gitleaks/gitleaks-report.json -Force -ErrorAction SilentlyContinue
Copy-Item findings/npmaudit.json security_test/03_Dependency_Scanning/Npm_Audit/npm-audit-report.json -Force -ErrorAction SilentlyContinue
Copy-Item findings/vitest.json security_test/06_Code_Quality_and_Test_Coverage/Vitest/vitest-report.json -Force -ErrorAction SilentlyContinue

$elapsed = ([DateTime]::Now - $startTime).TotalSeconds.ToString("F2")
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Scan completed in $elapsed seconds!" -ForegroundColor Green
Write-Host "  Report: file:///$((Get-Item $auditDir\final-security-report.html).FullName -replace '\\','/')" -ForegroundColor Green
Write-Host "  Gate Result: $((Get-Content $auditDir\gate-result.json -Raw))" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
