# Input Validation & Sanitization Report

## Summary

| Finding ID | Description | Severity |
|------------|-------------|----------|
| HIGH-005 | Password min length 4 chars | High |
| MED-002 | File upload without type/size validation | Medium |
| MED-005 | No input length limits on free-text fields | Medium |

---

## Validation Coverage by Form

| Form | Validation Library | Fields Validated | Missing |
|------|--------------------|-----------------|---------|
| Login (LoginPage.tsx) | ✅ Zod + RHF | role, username, password (min 1) | Password strength |
| Change Password (AdminProfileTab.tsx) | ✅ Manual | Length ≥ 4 | **Min 4 is too low** |
| Create Student (StudentsTab.tsx) | ⚠️ Minimal | fullName (required), email (type=email) | Phone format, DOB range, email regex |
| Create Teacher (TeachersTab.tsx) | ⚠️ HTML required only | fullName, email (required) | Password strength |
| Create Activity (ActivityForm.tsx) | ⚠️ HTML required | name (required) | Length limits |
| Create Stage (CreateStagePage.tsx) | ⚠️ Minimal | name (trim check) | No length limits |
| Adjust Points (StudentDetailsPage.tsx) | ⚠️ Minimal | points (required), reason (required) | Point range limits |
| Attendance (AttendanceTab.tsx) | ⚠️ None | date, period | Future date prevention |
| Badge Reject (AdminBadgeRequestsTab.tsx) | ✅ `required` | reason | Min length |
| Department Edit (DepartmentsTab.tsx) | ✅ Minimal | name, code (trim check) | Length limits |

---

## Zod Usage — Login Form Only

```typescript
// LoginPage.tsx
const loginSchema = z.object({
  role: z.enum(['Student', 'Teacher', 'Admin']),
  username: z.string().min(1, 'Username / ID is required'),
  password: z.string().min(1, 'Password is required'),
});
```

**Assessment:** The Zod schema only validates minimum length of 1 character and field presence. No maximum length, no character restrictions. Password is only checked for non-empty. This schema should be tightened and extended to all forms.

### Recommended Extended Schemas

```typescript
// SECURE login schema
const loginSchema = z.object({
  role: z.enum(['Student', 'Teacher', 'Admin']),
  username: z.string().min(1).max(100).trim(),
  password: z.string().min(8).max(128),
});

// SECURE student creation schema
const studentSchema = z.object({
  fullName: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
  password: z.string().min(12).max(128),
  // ... other fields
});
```

---

## Phone Number Validation

`StudentsTab.tsx` uses `maxLength={10}` on the phone input but does not validate format:

```tsx
<input 
  type="text" 
  maxLength={10}        // Length limit only — no format check
  value={formData.phone} 
  ...
/>
```

A phone field with `type="text"` allows non-numeric input. Should use `type="tel"` or a regex pattern.

---

## Date Validation

`CreateStagePage.tsx` has a basic date validation:

```tsx
<input 
  type="date" 
  value={formData.endDate} 
  min={formData.startDate}  // Basic: endDate cannot be before startDate
  ...
/>
```

This is a good basic control. However, no validation prevents setting dates far in the past or future.

---

## Number Field Injection

XP points, penalty points, and adjustment values use `type="number"` inputs with `parseInt()`:

```typescript
// ActivityForm.tsx
onChange={e => handleChange('awardXp', parseInt(e.target.value) || 0)}
```

`parseInt()` on an empty or non-numeric value returns `NaN`, which is then replaced by `|| 0`. This is safe for the frontend. However, no range validation is applied — an admin could set `awardXp: 99999999` or `penaltyXp: -99999999`.

### Recommended Fix

```typescript
onChange={e => {
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val) && val >= 0 && val <= 1000) {
    handleChange('awardXp', val);
  }
}}
```

---

## Output Encoding

React's JSX automatically encodes all values rendered via `{expression}`. **No `dangerouslySetInnerHTML` is used in the codebase.** Output encoding is effectively handled by React's rendering engine.

The only output encoding risk is the external URL rendering identified in MED-003 (`href={proofLink}` and `href={claim.evidenceUrl}`), where `javascript:` URLs are not filtered.
