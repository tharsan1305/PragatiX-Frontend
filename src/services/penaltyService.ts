import apiClient from '../api/client';

export const penaltyService = {
  // Issue a penalty to a student
  // POST /api/v1/penalty-requests
  issuePenalty: (studentId: string | number, violationType: string, reason: string, points: number, subgroupId: number | null = null) =>
    apiClient.post('/api/v1/penalty-requests', {
      studentId, violationType, reason, points, subgroupId
    }),

  // Get all penalty requests
  // GET /api/v1/penalty-requests
  getAllPenalties: () =>
    apiClient.get('/api/v1/penalty-requests'),

  // Get penalties for a specific student
  // GET /api/v1/penalty-requests/student/{studentId}
  getStudentPenalties: (studentId: string | number) =>
    apiClient.get(`/api/v1/penalty-requests/student/${studentId}`),

  // Get pending penalty approvals
  // GET /api/v1/penalty-requests/pending
  getPendingPenalties: () =>
    apiClient.get('/api/v1/penalty-requests/pending'),

  // Approve a penalty → deducts XP immediately
  // PATCH /api/v1/penalty-requests/{id}/approve
  approvePenalty: (id: string | number) =>
    apiClient.patch(`/api/v1/penalty-requests/${id}/approve`),

  // Reject a penalty
  // PATCH /api/v1/penalty-requests/{id}/reject
  rejectPenalty: (id: string | number, reason: string) =>
    apiClient.patch(`/api/v1/penalty-requests/${id}/reject`, { reason }),

  // Violation type → penalty points map
  // (match exactly what PenaltyWorkflowService.java uses)
  VIOLATION_PENALTIES: {
    'Late Arrival': 3,
    'Missing ID Card': 2,
    'Mobile Usage': 5,
    'Misbehavior': 10,
    'Proxy Attendance': 15,
    'Ragging': 50,
    'Severe Misconduct': 100,
    'Non-presentable Attire': 40,
    'Punctuality Violation': 40,
    'English Zone Violation': 40,
    'Absent After Break': 40,
    'Uninformed Leave': 50,
  } as Record<string, number>,
};

export default penaltyService;
