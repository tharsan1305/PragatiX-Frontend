import apiClient from '../api/client';

export const notificationService = {
  // Get notifications for a user (teacher/admin)
  // GET /api/v1/notifications/user/{userId}
  getUserNotifications: (userId: string | number) =>
    apiClient.get(`/api/v1/notifications/user/${userId}`),

  // Get notifications for a student
  // GET /api/v1/notifications/student/{studentId}
  getStudentNotifications: (studentId: string | number) =>
    apiClient.get(`/api/v1/notifications/student/${studentId}`),

  // Get unread count (user)
  // GET /api/v1/notifications/user/{userId}/unread-count
  getUserUnreadCount: (userId: string | number) =>
    apiClient.get(`/api/v1/notifications/user/${userId}/unread-count`),

  // Get unread count (student)
  // GET /api/v1/notifications/student/{studentId}/unread-count
  getStudentUnreadCount: (studentId: string | number) =>
    apiClient.get(`/api/v1/notifications/student/${studentId}/unread-count`),

  // Mark all read (user)
  // PATCH /api/v1/notifications/user/{userId}/mark-all-read
  markUserAllRead: (userId: string | number) =>
    apiClient.patch(`/api/v1/notifications/user/${userId}/mark-all-read`),

  // Mark all read (student)
  // PATCH /api/v1/notifications/student/{studentId}/mark-all-read
  markStudentAllRead: (studentId: string | number) =>
    apiClient.patch(`/api/v1/notifications/student/${studentId}/mark-all-read`),
};

export default notificationService;
