import { create } from 'zustand';
import { studentService, type StudentResponse } from '../features/student/services/student.service';

interface StudentState {
  students: StudentResponse[];
  selectedStudent: StudentResponse | null;
  isLoading: boolean;
  error: string | null;
  
  fetchStudents: (page?: number, size?: number, sortBy?: string) => Promise<void>;
  searchStudents: (keyword: string) => Promise<void>;
  setSelectedStudent: (student: StudentResponse | null) => void;
  createStudent: (data: any) => Promise<void>;
  updateStudent: (id: number, data: any) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  selectedStudent: null,
  isLoading: false,
  error: null,
  
  fetchStudents: async (page = 0, size = 100, sortBy = 'fullName') => {
    set({ isLoading: true, error: null });
    try {
      const response = await studentService.getAllStudents(page, size, sortBy);
      set({ students: response.content, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch students', isLoading: false });
    }
  },
  
  searchStudents: async (keyword: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await studentService.searchStudents(keyword);
      set({ students: response.content, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to search students', isLoading: false });
    }
  },
  
  setSelectedStudent: (student) => {
    set({ selectedStudent: student });
  },
  
  createStudent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await studentService.createStudent(data);
      // Refresh list
      await get().fetchStudents();
    } catch (error: any) {
      set({ error: error.message || 'Failed to create student', isLoading: false });
      throw error; // Rethrow so the form can handle it
    }
  },
  
  updateStudent: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await studentService.updateStudent(id, data);
      // Refresh list
      await get().fetchStudents();
    } catch (error: any) {
      set({ error: error.message || 'Failed to update student', isLoading: false });
      throw error;
    }
  },
  
  deleteStudent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await studentService.deleteStudent(id);
      // Remove from current list without re-fetching
      set((state) => ({
        students: state.students.filter(s => s.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete student', isLoading: false });
      throw error;
    }
  }
}));
