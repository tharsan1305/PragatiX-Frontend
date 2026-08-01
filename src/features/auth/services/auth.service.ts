import { apiClient } from '../../../api/client';

export interface LoginCredentials {
  username: string;
  password?: string; // Optional because student login might only use ID
  role?: string;     // Added specifically to handle our form selection
}

export interface AuthResponse {
  token: string;
  user: {
    id: number | string;
    username: string;
    role: string;
    name?: string;
  };
}

export const authService = {
  loginStaff: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/api/v1/auth/login', {
      username: credentials.username,
      password: credentials.password
    });
    // Spring backend wraps responses in { success: boolean, data: { ... } }
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Invalid credentials');
  },

  loginStudent: async (studentId: string, dob?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/api/v1/auth/student-login', {
      identity: studentId,
      password: dob
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Invalid credentials');
  },
  
  // Generic login handler based on role
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (credentials.role === 'Student') {
      return authService.loginStudent(credentials.username, credentials.password);
    } else {
      return authService.loginStaff(credentials);
    }
  }
};
