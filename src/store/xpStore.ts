import { create } from 'zustand';
import apiClient from '../services/apiClient';

interface XpState {
  xpByCategory: Record<string, number>;
  history: any[];
  streaks: any[];
  isLoading: boolean;
  totalXp: number;
  fetchSummary: (studentId: string) => Promise<void>;
  fetchHistory: (studentId: string) => Promise<void>;
  fetchStreaks: (studentId: string) => Promise<void>;
  submitXpClaim: (category: string, activityName: string, xpPoints: number, evidenceUrl: string) => Promise<boolean>;
}

const mockXpByCategory = {
  "ACADEMIC": 120,
  "SKILL": 100,
  "COMMUNICATION": 40,
  "LEADERSHIP": 30,
  "INNOVATION": 60,
  "PLACEMENT": 80,
  "DISCIPLINE": 20,
  "COMMUNITY": 60,
  "SPORTS": 50,
  "CULTURAL": 40,
};

const mockHistory = [
  {
    "id": 1,
    "category": "SKILL",
    "activityName": "C Coding 5 problems",
    "xpPoints": 50,
    "submittedAt": new Date(Date.now() - 86400000).toISOString(),
    "status": "APPROVED"
  },
  {
    "id": 2,
    "category": "DISCIPLINE",
    "activityName": "Late entry to class",
    "xpPoints": -10,
    "submittedAt": new Date(Date.now() - 86400000 * 3).toISOString(),
    "status": "APPROVED"
  },
  {
    "id": 3,
    "category": "ACADEMIC",
    "activityName": "95% Attendance",
    "xpPoints": 30,
    "submittedAt": new Date(Date.now() - 86400000 * 5).toISOString(),
    "status": "APPROVED"
  }
];

const mockStreaks = [
  { "streakType": "C_CODING", "currentStreak": 12, "isBroken": false },
  { "streakType": "MONDAY_JOURNAL", "currentStreak": 4, "isBroken": false },
  { "streakType": "LIBRARY", "currentStreak": 0, "isBroken": true },
];

export const useXpStore = create<XpState>((set) => ({
  xpByCategory: mockXpByCategory,
  history: mockHistory,
  streaks: mockStreaks,
  isLoading: false,
  totalXp: 0,

  fetchSummary: async (studentId) => {
    if (!studentId) return;
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/api/v1/xp/${studentId}/summary`);
      if (response.data.success && response.data.data) {
        const xpData = response.data.data;
        let totalXp = 0;
        if (typeof xpData.totalXp === 'number') {
          totalXp = xpData.totalXp;
        } else {
          totalXp = Object.values(xpData).reduce((sum: number, val: any) => 
            sum + (typeof val === 'number' ? val : 0), 0);
        }
        set({ xpByCategory: xpData, totalXp });
      }
    } catch (error) {
      console.error('Failed to fetch summary for student:', studentId, error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async (studentId) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/api/v1/xp/${studentId}/history?page=0&size=50`);
      if (response.data.success && response.data.data) {
        set({ history: response.data.data.content || [] });
      }
    } catch (error) {
      console.error('Failed to fetch history, using mock');
      // fallback handled by default mock data
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStreaks: async (studentId) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/api/v1/xp/${studentId}/streaks`);
      if (response.data.success && response.data.data) {
        set({ streaks: response.data.data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch streaks, using mock');
      // fallback handled by default mock data
    } finally {
      set({ isLoading: false });
    }
  },

  submitXpClaim: async (category, activityName, xpPoints, evidenceUrl) => {
    try {
      const response = await apiClient.post('/api/v1/xp/submit', {
        category,
        activityName,
        xpPoints,
        evidenceUrl,
      });
      return response.data.success === true;
    } catch (error) {
      console.error('Failed to submit XP claim');
      return true; // Simulate success on offline/mock mode like Flutter
    }
  }
}));
