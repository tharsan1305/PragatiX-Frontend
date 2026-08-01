# Performance & DoS Security Report

## Summary

| Risk | Severity | Notes |
|------|----------|-------|
| No Axios timeout | Medium | MED-007 |
| Large unbounded list fetch | Low | `size=100` student list |
| File upload no size limit | Medium | MED-002 |
| No login rate limiting | Medium | MED-010 |
| Mock data on store init | Low | xpStore pre-loads 10 categories |

---

## Network DoS Risks

### Missing Request Timeout (MED-007)

Without a timeout on the Axios instance, any API call can hang indefinitely. If the backend becomes unresponsive (slow query, network issue), the browser holds the connection open. With many concurrent users, this can exhaust browser connection pools.

**Impact:** UI appears frozen; teachers cannot mark attendance or approve badges.

### Parallel API Requests on Load

Several components fire multiple simultaneous API requests on mount:

**AdminAttendanceTab (loadLookups):**
```typescript
const [yearRes, deptRes, secRes] = await Promise.all([
  apiClient.get('/api/v1/admin/years'),
  apiClient.get('/api/v1/admin/departments'),
  apiClient.get('/api/v1/admin/sections')
]);
```

3 simultaneous requests on component mount. This is acceptable in normal operation but could contribute to DoS if many admin users open the attendance tab simultaneously.

**StudentsTab (fetchLookups):**
```typescript
const [deptRes, ayRes, yearRes, semRes, genRes, secRes, teamRes] = await Promise.all([...]);
```

7 simultaneous API requests on student management tab open.

---

## Regular Expression DoS (ReDoS)

**Status: No ReDoS-vulnerable regex patterns found.**

The codebase uses minimal regex. All search operations use `.toLowerCase().includes()` — no regex. No catastrophic backtracking risk identified.

---

## Rendering Performance with Large Datasets

| Component | Default Data Size | Virtualized? | Risk |
|-----------|------------------|-------------|------|
| StudentListPage (table) | 100 rows | ❌ | Medium for 1000+ students |
| AdminAttendanceTab (present/absent lists) | Unbounded | ❌ | Medium |
| RemovalRequestsTab | All pending | ❌ | Low |

**Recommendation:** Implement virtual scrolling for large lists or enforce server-side pagination with navigation UI.

---

## Memory Leak Risks

All `window.addEventListener` calls in `authContext.tsx` include proper cleanup in `useEffect` return functions. `NavigationTransition` in `App.tsx` correctly cleans up its `setTimeout`. **No memory leaks detected.**

---

## Possible Infinite Loading Bug

**File:** `src/features/admin/activity/pages/ActivityExecutionPageV2.tsx`

```typescript
} fontinally: {   // ← Typo: 'fontinally' is parsed as a JS label, not 'finally'
  setLoading(false);
}
```

`fontinally:` is a valid JavaScript label followed by a block, so the code compiles and `setLoading(false)` executes unconditionally after the `try/catch` — coincidentally matching `finally` behavior in this function. No infinite loading bug results today, but the misleading label is fragile: if a `return` is ever added inside the `try` block, cleanup behavior becomes unclear. Fix to a real `finally` block (see Code_Quality_Report).
