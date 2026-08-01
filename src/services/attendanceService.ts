import apiClient from '../api/client';

export const attendanceService = {
  // Mark attendance for students
  // POST /api/v1/attendance
  // status: 'PRESENT' | 'ABSENT' | 'OD' | 'LEAVE'
  markAttendance: (date: string, subjectId: number | string, records: Array<{ studentId: number | string; status: string }>) =>
    apiClient.post('/api/v1/attendance', { date, subjectId, records }),

  // Get attendance for a student
  // GET /api/v1/attendance/student/{studentId}
  getStudentAttendance: (studentId: string | number) =>
    apiClient.get(`/api/v1/attendance/student/${studentId}`),

  // Get attendance report with date range filter
  // GET /api/v1/attendance/report
  getAttendanceReport: (startDate: string, endDate: string, departmentId?: number | string) =>
    apiClient.get('/api/v1/attendance/report', {
      params: { startDate, endDate, departmentId }
    }),

  // Get today's attendance status
  // GET /api/v1/attendance/today
  getTodayAttendance: () =>
    apiClient.get('/api/v1/attendance/today'),

  // Get attendance streak for student
  // GET /api/v1/attendance/streak/{studentId}
  getAttendanceStreak: (studentId: string | number) =>
    apiClient.get(`/api/v1/attendance/streak/${studentId}`),
};

export default attendanceService;
