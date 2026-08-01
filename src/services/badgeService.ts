import apiClient from '../api/client';

export const badgeService = {
  // Get all badge definitions
  // GET /api/v1/badges
  getAllBadges: () =>
    apiClient.get('/api/v1/badges'),

  // Get badges earned by a student
  // GET /api/v1/students/{id}/badges
  getStudentBadges: (studentId: string | number) =>
    apiClient.get(`/api/v1/students/${studentId}/badges`),

  // Check and unlock new badges for student
  // POST /api/v1/badges/check/{studentId}
  checkAndUnlock: (studentId: string | number) =>
    apiClient.post(`/api/v1/badges/check/${studentId}`),
};

export default badgeService;
