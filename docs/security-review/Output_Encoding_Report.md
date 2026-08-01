# Output Encoding Report

## Summary

| Control | Status |
|---------|--------|
| React JSX auto-escaping | ✅ Active for all string interpolation |
| `dangerouslySetInnerHTML` | ✅ Not used anywhere |
| `innerHTML` assignments | ✅ Not found |
| `document.write` | ✅ Not used |
| Unvalidated URL in `href` | ❌ MED-003 (proof links) |
| Unvalidated URL in `src` | ❌ LOW-005 (badge icons) |

---

## JSX Escaping

React automatically escapes all values rendered in JSX:

```tsx
// ALL of these are safe — React escapes the values
<h3>{student.fullName}</h3>
<p>{activity.description}</p>
<span>{department.name}</span>
```

Even if the API returns `<script>alert(1)</script>` as a student name, React renders it as the literal text string, not executable HTML.

---

## URL Output Risks

The two identified URL output risks (MED-003, LOW-005) are where React's auto-escaping does NOT protect:

1. **`href` attributes** — React renders the URL value literally. A `javascript:` protocol URL will execute when clicked.
2. **`src` attributes on `<img>`** — React renders the URL literally. A malicious URL could be used for tracking or SSRF if processed by the backend.

**Fix for both:**

```typescript
function sanitizeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

// Usage:
<a href={sanitizeUrl(proofLink)} target="_blank" rel="noopener noreferrer">
<img src={sanitizeUrl(badgeIcon)} alt="badge" />
```

---

## CSV Export — Output Injection

**File:** `src/features/admin/tabs/AdminAttendanceTab.tsx` — Lines 271–277

```typescript
// Attendance export to CSV
const rows = [
  ['Status', 'Student Name', 'Register Number'],
  ...presentList.map((s: any) => [
    'Present', 
    s.studentName || s.fullName || '',  // Student name directly in CSV cell
    s.registerNumber || s.regNo || ''
  ]),
];
const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
```

**CSV Injection Risk:** Student names or register numbers containing `,`, `"`, `\n`, or formula prefixes (`=`, `+`, `-`, `@`) can corrupt the CSV structure or, in older versions of Excel, execute formulas.

**Recommended Fix:**

```typescript
function escapeCsvCell(value: string): string {
  const str = String(value).replace(/"/g, '""'); // Escape double quotes
  if (/[,"\n\r]/.test(str) || /^[=+\-@]/.test(str)) {
    return `"${str}"`;  // Wrap in quotes if contains special chars or formula prefix
  }
  return str;
}

const rows = [
  ['Status', 'Student Name', 'Register Number'],
  ...presentList.map((s: any) => [
    'Present',
    escapeCsvCell(s.studentName || ''),
    escapeCsvCell(s.registerNumber || '')
  ]),
];
```

This CSV injection issue is a **Medium severity finding** that was not separately catalogued — adding it here:

> **MED-015 — CSV Injection in Attendance Export**
> - File: `src/features/admin/tabs/AdminAttendanceTab.tsx`
> - Lines: 271–277
> - Impact: Formula execution in Excel when attendance data is exported; student names containing `=CMD|...` patterns could execute system commands via DDE in older Excel.
> - Severity: Medium
> - Fix: Escape all cell values before CSV assembly.
