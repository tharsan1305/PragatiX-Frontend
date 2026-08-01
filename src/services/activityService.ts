import apiClient from '../api/client';

export const activityService = {
  // Get all activity stages + subgroups
  // GET /api/v1/admin/stages
  getStages: () =>
    apiClient.get('/api/v1/admin/stages'),

  // Get all activities
  // GET /api/v1/activities
  getActivities: () =>
    apiClient.get('/api/v1/activities'),

  // Get activity by ID
  // GET /api/v1/activities/{id}
  getActivity: (id: string | number) =>
    apiClient.get(`/api/v1/activities/${id}`),

  // ---- ACTIVITY COMPLETION REQUESTS (Latest Spring Boot Commits e32a5c0, ded8496) ----

  // Student submits activity evidence for XP approval
  // POST /api/v1/activity-completion-requests
  submitCompletionRequest: (studentId: string | number, activityId: string | number, evidenceUrl: string, notes?: string) =>
    apiClient.post('/api/v1/activity-completion-requests', {
      studentId, activityId, evidenceUrl, notes
    }),

  // Get all completion requests (teacher/admin view)
  // GET /api/v1/activity-completion-requests
  getAllRequests: () =>
    apiClient.get('/api/v1/activity-completion-requests'),

  // Get completion requests for a specific student
  // GET /api/v1/activity-completion-requests/student/{studentId}
  getStudentRequests: (studentId: string | number) =>
    apiClient.get(`/api/v1/activity-completion-requests/student/${studentId}`),

  // Get pending requests (teacher approval queue)
  // GET /api/v1/activity-completion-requests/pending
  getPendingRequests: () =>
    apiClient.get('/api/v1/activity-completion-requests/pending'),

  // Approve a completion request → awards XP to student
  // PATCH /api/v1/activity-completion-requests/{id}/approve
  approveRequest: (id: string | number, remarks = '') =>
    apiClient.patch(`/api/v1/activity-completion-requests/${id}/approve`, { remarks }),

  // Reject a completion request
  // PATCH /api/v1/activity-completion-requests/{id}/reject
  rejectRequest: (id: string | number, remarks: string) =>
    apiClient.patch(`/api/v1/activity-completion-requests/${id}/reject`, { remarks }),

  // Get activity logs for a student
  // GET /api/v1/students/{id}/discipline-logs
  getActivityLogs: (studentId: string | number) =>
    apiClient.get(`/api/v1/students/${studentId}/discipline-logs`),
};

export default activityService;
