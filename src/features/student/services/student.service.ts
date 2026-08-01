import { apiClient } from '../../../api/client';

export interface StudentResponse {
  id: number;
  regNo: string;
  fullName: string;
  email: string;
  year: string;
  section: string;
  departmentId: number;
  departmentName: string;
  disciplineScore: number;
  teamId?: number;
  teamName?: string;
  isCaptain: boolean;
  status: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const studentService = {
  getAllStudents: async (page = 0, size = 100, sortBy = 'fullName'): Promise<PaginatedResponse<StudentResponse>> => {
    const response = await apiClient.get<any>(`/api/v1/students?page=${page}&size=${size}&sortBy=${sortBy}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch students');
  },

  getStudentById: async (id: number): Promise<StudentResponse> => {
    const response = await apiClient.get<any>(`/api/v1/students/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch student details');
  },

  searchStudents: async (keyword: string, page = 0, size = 100): Promise<PaginatedResponse<StudentResponse>> => {
    const response = await apiClient.get<any>(`/api/v1/students/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to search students');
  },

  createStudent: async (data: any): Promise<StudentResponse> => {
    const response = await apiClient.post<any>('/api/v1/students', data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create student');
  },

  updateStudent: async (id: number, data: any): Promise<StudentResponse> => {
    const response = await apiClient.put<any>(`/api/v1/students/${id}`, data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update student');
  },

  deleteStudent: async (id: number): Promise<void> => {
    const response = await apiClient.delete<any>(`/api/v1/students/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete student');
    }
  }
};
