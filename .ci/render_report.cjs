#!/usr/bin/env node
/**
 * render_report.js — Aggregate findings and render the consolidated HTML report.
 */

const fs = require('fs');
const path = require('path');

const ARGS = process.argv.slice(2);
if (ARGS.length < 4) {
  console.error("Usage: node render_report.js <findings_dir> <template_file> <output_file> <gate_result_file> [repo] [branch] [sha] [run_id] [run_num] [actor] [event]");
  process.exit(1);
}

const FINDINGS_DIR = ARGS[0];
const TEMPLATE_FILE = ARGS[1];
const OUTPUT_FILE = ARGS[2];
const GATE_RESULT_FILE = ARGS[3];

const REPO = ARGS[4] || 'unknown/repo';
const BRANCH = ARGS[5] || 'unknown-branch';
const SHA = ARGS[6] || '00000000';
const RUN_ID = ARGS[7] || '0';
const RUN_NUM = ARGS[8] || '0';
const ACTOR = ARGS[9] || 'unknown-actor';
const EVENT = ARGS[10] || 'push';

const EXPECTED_TOOLS = [
  { id: 'actionlint', name: 'actionlint', category: 'LINT' },
  { id: 'vitebuild', name: 'Vite build', category: 'BUILD' },
  { id: 'typescript', name: 'TypeScript', category: 'TYPES' },
  { id: 'bundlesize', name: 'bundlesize', category: 'BUILD' },
  { id: 'oxlint', name: 'oxlint', category: 'LINT' },
  { id: 'eslint', name: 'ESLint (security plugins)', category: 'LINT' },
  { id: 'vitest', name: 'Vitest', category: 'Tests' },
  { id: 'coverage', name: 'c8/v8 coverage', category: 'Coverage' },
  { id: 'playwright', name: 'Playwright E2E', category: 'Tests' },
  { id: 'deps', name: 'npm outdated', category: 'SCA' },
  { id: 'semgrep', name: 'Semgrep', category: 'SAST' },
  { id: 'codeql', name: 'GitHub CodeQL', category: 'SAST' },
  { id: 'scorecard', name: 'OpenSSF Scorecard', category: 'SCA' },
  { id: 'gitleaks', name: 'Gitleaks', category: 'Secrets' },
  { id: 'viteenv', name: 'Vite Env Leak Checker', category: 'Secrets' },
  { id: 'npmaudit', name: 'npm audit', category: 'SCA' },
  { id: 'trivy', name: 'Trivy fs', category: 'SCA' },
  { id: 'grype', name: 'Grype', category: 'SCA' },
  { id: 'syft', name: 'Syft', category: 'SBOM' },
  { id: 'zap', name: 'OWASP ZAP', category: 'DAST' }
];

const DEDUCTIONS = { CRITICAL: 25, HIGH: 10, MEDIUM: 3, LOW: 1, INFO: 0 };

function main() {
  const reports = {};
  
  // Read all findings
  if (fs.existsSync(FINDINGS_DIR)) {
    const files = fs.readdirSync(FINDINGS_DIR);
    files.forEach(f => {
      if (f.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(FINDINGS_DIR, f), 'utf8');
          const data = JSON.parse(content);
          reports[data.tool.toLowerCase()] = data;
        } catch (e) {}
      }
    });
  }

  // Map findings and tool rows
  const tools = [];
  let totalCritical = 0;
  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;
  let totalInfo = 0;
  let totalScansRun = 0;
  let totalErrors = 0;
  let totalFails = 0;
  let totalPasses = 0;
  let totalWarns = 0;
  let totalSkips = 0;
  
  const allFindings = [];

  EXPECTED_TOOLS.forEach(expected => {
    let report = null;
    // Match by name or file ID
    for (const key of Object.keys(reports)) {
      if (key.includes(expected.id) || reports[key].tool.toLowerCase() === expected.name.toLowerCase()) {
        report = reports[key];
        break;
      }
    }

    if (report) {
      totalScansRun++;
      const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
      report.findings.forEach(f => {
        const sev = (f.severity || 'INFO').toUpperCase();
        counts[sev]++;
        if (sev === 'CRITICAL') totalCritical++;
        if (sev === 'HIGH') totalHigh++;
        if (sev === 'MEDIUM') totalMedium++;
        if (sev === 'LOW') totalLow++;
        if (sev === 'INFO') totalInfo++;
        
        // Link repo and commit SHA for links
        f.detected_by = report.tool;
        f.tool_id = expected.id;
        allFindings.push(f);
      });

      if (report.status === 'ERROR') totalErrors++;
      else if (report.status === 'FAIL') totalFails++;
      else if (report.status === 'PASS') totalPasses++;
      else if (report.status === 'WARN') totalWarns++;

      tools.push({
        name: report.tool,
        category: report.category,
        status: report.status,
        scanned: `${report.scanned} ${report.scanned_unit}`,
        duration: `${report.duration_seconds}s`,
        critical: counts.CRITICAL,
        high: counts.HIGH,
        medium: counts.MEDIUM,
        low: counts.LOW
      });
    } else {
      totalSkips++;
      tools.push({
        name: expected.name,
        category: expected.category,
        status: 'SKIPPED',
        scanned: '0 files',
        duration: '0s',
        critical: 0, high: 0, medium: 0, low: 0
      });
    }
  });

  // Calculate score
  let score = 100;
  score -= totalCritical * DEDUCTIONS.CRITICAL;
  score -= totalHigh * DEDUCTIONS.HIGH;
  score -= totalMedium * DEDUCTIONS.MEDIUM;
  score -= totalLow * DEDUCTIONS.LOW;
  score = Math.max(0, score);

  let band = 'Critical';
  let bandColor = '#ef4444';
  if (score >= 90) { band = 'Excellent'; bandColor = '#22c55e'; }
  else if (score >= 75) { band = 'Good'; bandColor = '#84cc16'; }
  else if (score >= 50) { band = 'Needs Improvement'; bandColor = '#f59e0b'; }

  // Gate Policy evaluation
  const reasons = [];
  if (totalCritical > 0) reasons.push(`${totalCritical} CRITICAL security leak(s) detected`);
  if (totalHigh > 0) reasons.push(`${totalHigh} HIGH severity vulnerability/vulnerabilities detected`);
  if (totalErrors > 0) reasons.push(`${totalErrors} scanner(s) exited with ERROR status`);
  
  // Specific checks
  const viteReport = tools.find(t => t.name === 'Vite build');
  if (viteReport && viteReport.status === 'FAIL') reasons.push("Vite compilation build failed");
  const tsReport = tools.find(t => t.name === 'TypeScript');
  if (tsReport && tsReport.status === 'FAIL') reasons.push("TypeScript typecheck compile failed");
  const vitestReport = tools.find(t => t.name === 'Vitest');
  if (vitestReport && vitestReport.status === 'FAIL') reasons.push("Vitest unit tests failed");

  const gatePass = reasons.length === 0;

  // Write gate result
  fs.writeFileSync(GATE_RESULT_FILE, JSON.stringify({
    pass: gatePass,
    score: score,
    reasons: reasons
  }, null, 2), 'utf8');

  // Load template
  let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  // Format replacements
  const dateIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' IST';
  const dateUTC = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  template = template
    .replace(/\{\{REPO\}\}/g, REPO)
    .replace(/\{\{BRANCH\}\}/g, BRANCH)
    .replace(/\{\{SHA\}\}/g, SHA.substring(0, 8))
    .replace(/\{\{SHA_FULL\}\}/g, SHA)
    .replace(/\{\{RUN_ID\}\}/g, RUN_ID)
    .replace(/\{\{RUN_NUM\}\}/g, RUN_NUM)
    .replace(/\{\{ACTOR\}\}/g, ACTOR)
    .replace(/\{\{EVENT\}\}/g, EVENT)
    .replace(/\{\{REPORT_TIME_UTC\}\}/g, dateUTC)
    .replace(/\{\{REPORT_TIME_IST\}\}/g, dateIST)
    .replace(/\{\{VERDICT\}\}/g, gatePass ? 'PASSED' : 'FAILED')
    .replace(/\{\{VERDICT_COLOR\}\}/g, gatePass ? '#22c55e' : '#ef4444')
    .replace(/\{\{SCORE\}\}/g, score)
    .replace(/\{\{SCORE_BAND\}\}/g, band)
    .replace(/\{\{SCORE_COLOR\}\}/g, bandColor)
    .replace(/\{\{TOTAL_CRITICAL\}\}/g, totalCritical)
    .replace(/\{\{TOTAL_HIGH\}\}/g, totalHigh)
    .replace(/\{\{TOTAL_MEDIUM\}\}/g, totalMedium)
    .replace(/\{\{TOTAL_LOW\}\}/g, totalLow)
    .replace(/\{\{TOTAL_INFO\}\}/g, totalInfo)
    .replace(/\{\{TOTAL_FINDINGS\}\}/g, allFindings.length)
    .replace(/\{\{TOTAL_RUN\}\}/g, totalScansRun)
    .replace(/\{\{TOTAL_PASS\}\}/g, totalPasses)
    .replace(/\{\{TOTAL_WARN\}\}/g, totalWarns)
    .replace(/\{\{TOTAL_FAIL\}\}/g, totalFails)
    .replace(/\{\{TOTAL_SKIP\}\}/g, totalSkips)
    .replace(/\{\{TOTAL_ERROR\}\}/g, totalErrors);

  // Render Tool Summary Table Rows
  const toolRows = tools.map(t => {
    let statusClass = 'status-skipped';
    if (t.status === 'PASS') statusClass = 'status-pass';
    if (t.status === 'WARN') statusClass = 'status-warn';
    if (t.status === 'FAIL') statusClass = 'status-fail';
    if (t.status === 'ERROR') statusClass = 'status-error';

    return `<tr>
      <td><strong>${t.name}</strong></td>
      <td>${t.category}</td>
      <td><span class="status-badge ${statusClass}">${t.status}</span></td>
      <td>${t.scanned}</td>
      <td>${t.duration}</td>
      <td class="${t.critical > 0 ? 'text-critical font-bold' : ''}">${t.critical}</td>
      <td class="${t.high > 0 ? 'text-high font-bold' : ''}">${t.high}</td>
      <td>${t.medium}</td>
      <td>${t.low}</td>
    </tr>`;
  }).join('\n');
  template = template.replace('<!-- TOOL_SUMMARY_ROWS -->', toolRows);

  // Group and Render Findings
  const sortedFindings = allFindings.sort((a, b) => {
    const priority = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
    return priority[b.severity] - priority[a.severity];
  });

  const grouped = {};
  sortedFindings.forEach(f => {
    const key = `${f.severity}-${f.detected_by}-${f.id}`;
    if (!grouped[key]) {
      grouped[key] = {
        meta: f,
        locations: []
      };
    }
    grouped[key].locations.push({
      file: f.file,
      line: f.line || 1,
      column: f.column || 1,
      code_snippet: f.code_snippet || ''
    });
  });

  const findingsListHtml = Object.keys(grouped).map((key, idx) => {
    const g = grouped[key];
    const f = g.meta;
    const isCriticalOrHigh = f.severity === 'CRITICAL' || f.severity === 'HIGH';
    const collState = isCriticalOrHigh ? 'open' : '';

    const locationsHtml = g.locations.map(loc => {
      const gitLink = `https://github.com/${REPO}/blob/${SHA}/${loc.file}#L${loc.line}`;
      return `<div style="margin-top: 8px; font-size: 0.85rem;">
        📍 File: <a href="${gitLink}" target="_blank" class="github-link">${loc.file}:${loc.line}:${loc.column}</a>
        ${loc.code_snippet ? `<pre class="code-block" style="margin-top: 4px;"><code>${loc.code_snippet}</code></pre>` : ''}
      </div>`;
    }).join('\n');

    return `<details ${collState} class="finding-card card-${f.severity.toLowerCase()}">
      <summary class="finding-summary">
        <div>
          <span class="severity-badge sev-${f.severity.toLowerCase()}">${f.severity}</span>
          <strong>${f.title}</strong>
          <span style="font-size: 0.8rem; color: var(--muted); margin-left: 8px;">(${f.id})</span>
        </div>
      </summary>
      <div class="finding-content">
        <p><strong>Description:</strong> ${f.description}</p>
        ${f.impact ? `<p><strong>Impact:</strong> ${f.impact}</p>` : ''}
        <p><strong>Remediation:</strong></p>
        <pre class="code-block"><code>${f.remediation || 'Upgrade package or resolve warning.'}</code></pre>
        <div style="display: flex; gap: 20px; font-size: 0.85rem; color: var(--muted); margin-top: 10px;">
          ${f.cwe ? `<span>CWE: <a href="https://cwe.mitre.org/data/definitions/${f.cwe.replace('CWE-', '')}.html" target="_blank">${f.cwe}</a></span>` : ''}
          ${f.owasp ? `<span>OWASP: ${f.owasp}</span>` : ''}
          ${f.cve ? `<span>CVE: ${f.cve}</span>` : ''}
          <span>Detected By: <strong>${f.detected_by}</strong></span>
        </div>
        <div style="margin-top: 12px; border-top: 1px solid #334155; padding-top: 8px;">
          <strong>Occurrences (${g.locations.length}):</strong>
          ${locationsHtml}
        </div>
      </div>
    </details>`;
  }).join('\n');

  template = template.replace('<!-- FINDINGS_DETAILS_LIST -->', findingsListHtml || '<div style="padding: 20px; text-align: center; color: var(--muted);">No findings reported.</div>');

  fs.writeFileSync(OUTPUT_FILE, template, 'utf8');
  console.log(`[render] Consolidate Report -> ${OUTPUT_FILE} (Verdict: ${gatePass ? 'PASS' : 'FAIL'}, Score: ${score})`);
}

main();
