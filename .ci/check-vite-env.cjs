#!/usr/bin/env node
/**
 * check-vite-env.js — Vite environment variable leak checker.
 * Checks all .env* files for sensitive variables prefixed with VITE_,
 * and checks the built dist/ output to see if those secrets actually shipped.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const FINDINGS_DIR = path.join(ROOT_DIR, 'findings');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const SENSITIVE_NAME_PAT = /KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|PRIVATE|AUTH|API_KEY/i;
const CREDENTIAL_VAL_PATS = [
  /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT shape
  /[A-Za-z0-9+/]{40,}=*/, // Base64 over 40 chars
  /AKIA[A-Z0-9]{16}/, // AWS Access Key
  /sk_live_[a-zA-Z0-9]{24}/, // Stripe live key
  /-----BEGIN/ // PEM block
];

function checkValuePattern(val) {
  for (const pat of CREDENTIAL_VAL_PATS) {
    if (pat.test(val)) return true;
  }
  return false;
}

function searchInDist(value) {
  if (!fs.existsSync(DIST_DIR)) return false;
  
  function walk(dir) {
    let found = false;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fp = path.join(dir, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        if (walk(fp)) found = true;
      } else if (stat.isFile() && (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css'))) {
        const content = fs.readFileSync(fp, 'utf8');
        if (content.includes(value)) {
          found = true;
        }
      }
    }
    return found;
  }
  return walk(DIST_DIR);
}

function main() {
  const startTime = Date.now();
  const findings = [];
  let envFileCount = 0;

  // Ensure findings directory exists
  if (!fs.existsSync(FINDINGS_DIR)) {
    fs.mkdirSync(FINDINGS_DIR, { recursive: true });
  }

  // Find all .env files at root
  const files = fs.readdirSync(ROOT_DIR);
  const envFiles = files.filter(f => f === '.env' || (f.startsWith('.env.') && !f.endsWith('.example')));

  for (const f of envFiles) {
    envFileCount++;
    const filepath = path.join(ROOT_DIR, f);
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, ''); // strip quotes

      if (name.startsWith('VITE_')) {
        const lineNum = index + 1;
        const isNameSensitive = SENSITIVE_NAME_PAT.test(name);
        const isValueSensitive = checkValuePattern(value);

        if (isNameSensitive || isValueSensitive) {
          const shipped = searchInDist(value);
          findings.push({
            id: 'vite.env.leak',
            severity: 'CRITICAL',
            title: `Sensitive Vite environment variable detected: ${name}`,
            file: f,
            line: lineNum,
            code_snippet: `${name}=${'*'.repeat(Math.min(15, value.length))}`,
            description: `Environment variable '${name}' is prefixed with 'VITE_' which compiles it into client-side JS bundles. ` +
              (shipped ? `CRITICAL WARNING: The raw value was detected inside the production build assets (dist/).` : `The variable was defined in configuration.`),
            impact: 'An attacker opening the web app can extract credentials from compile assets, enabling unauthorized API access or resource compromise.',
            remediation: `1. Remove 'VITE_' prefix from '${name}' if it is a secret. Connect through a secure backend proxy.\n` +
              `2. Add '${f}' to .gitignore to prevent committing secrets to source control.`,
            cwe: 'CWE-522',
            owasp: 'A05:2021 Security Misconfiguration',
            reference_urls: ['https://vite.dev/guide/env-and-mode.html#html-env-replacement']
          });
        } else {
          // Info logs for non-sensitive public configuration
          findings.push({
            id: 'vite.env.info',
            severity: 'INFO',
            title: `Public Vite variable checked: ${name}`,
            file: f,
            line: lineNum,
            code_snippet: `${name}=${value}`,
            description: `The variable '${name}' was analyzed and verified as non-sensitive public configuration (URLs or feature flags).`,
            remediation: 'None required.',
            cwe: null,
            owasp: null
          });
        }
      }
    });
  }

  const criticals = findings.filter(f => f.severity === 'CRITICAL').length;
  const status = envFileCount === 0 ? 'ERROR' : (criticals > 0 ? 'FAIL' : 'PASS');
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  const report = {
    tool: 'Vite Env Leak Checker',
    category: 'Secrets',
    status: status,
    scanned: envFileCount,
    scanned_unit: 'files',
    duration_seconds: parseFloat(elapsed),
    findings: findings
  };

  fs.writeFileSync(
    path.join(FINDINGS_DIR, 'vite-env-leak.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );
  console.log(`[check-vite-env] Scanned ${envFileCount} files. Criticals: ${criticals}. Status: ${status}`);
}

main();
