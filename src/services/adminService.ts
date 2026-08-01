import apiClient from '../api/client';

export const adminService = {
  // Dashboard stats
  // GET /api/v1/admin/stats
  getStats: () => apiClient.get('/api/v1/admin/stats'),

  // Users CRUD
  getUsers: () => apiClient.get('/api/v1/admin/users'),
  createUser: (data: any) => apiClient.post('/api/v1/admin/users', data),
  updateUser: (id: string | number, data: any) => apiClient.put(`/api/v1/admin/users/${id}`, data),
  deleteUser: (id: string | number) => apiClient.delete(`/api/v1/admin/users/${id}`),

  // Departments CRUD
  getDepartments: () => apiClient.get('/api/v1/admin/departments'),
  createDepartment: (data: any) => apiClient.post('/api/v1/admin/departments', data),
  updateDepartment: (id: string | number, data: any) => apiClient.put(`/api/v1/admin/departments/${id}`, data),
  deleteDepartment: (id: string | number) => apiClient.delete(`/api/v1/admin/departments/${id}`),

  // Stages & Subgroups
  getStages: () => apiClient.get('/api/v1/admin/stages'),
  createStage: (data: any) => apiClient.post('/api/v1/admin/stages', data),
  deleteStage: (id: string | number) => apiClient.delete(`/api/v1/admin/stages/${id}`),
  createSubgroup: (stageId: string | number, data: any) =>
    apiClient.post(`/api/v1/admin/stages/${stageId}/subgroups`, data),
  updateSubgroup: (id: string | number, data: any) =>
    apiClient.put(`/api/v1/admin/subgroups/${id}`, data),
  deleteSubgroup: (id: string | number) =>
    apiClient.delete(`/api/v1/admin/subgroups/${id}`),
  assignFaculty: (id: string | number, data: any) =>
    apiClient.put(`/api/v1/admin/subgroups/${id}/assign-faculty`, data),

  // Subjects CRUD
  getSubjects: () => apiClient.get('/api/v1/admin/subjects'),
  createSubject: (data: any) => apiClient.post('/api/v1/admin/subjects', data),
  deleteSubject: (id: string | number) => apiClient.delete(`/api/v1/admin/subjects/${id}`),

  // Roles
  getRoles: () => apiClient.get('/api/v1/admin/roles'),

  // Reports
  getStudentReport: () => apiClient.get('/api/v1/admin/reports/students'),
  getDepartmentReport: () => apiClient.get('/api/v1/admin/reports/departments'),
  getAtRiskReport: () => apiClient.get('/api/v1/admin/reports/at-risk'),
  getSummaryReport: () => apiClient.get('/api/v1/admin/reports/summary'),

  // Activity assignment
  assignActivity: (data: any) => apiClient.post('/api/v1/admin/activities/assign', data),
};

export default adminService;
