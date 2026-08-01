import { create } from 'zustand';

interface User {
  id: number | string;
  username: string;
  role: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Load initial state from localStorage
const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

let initialUser = null;
if (storedUser) {
  try {
    initialUser = JSON.parse(storedUser);
  } catch (e) {
    console.error('Failed to parse user from local storage');
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
  
  login: (user, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userRole', user.role);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

