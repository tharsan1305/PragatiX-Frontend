import apiClient from '../api/client';

export const leaderboardService = {
  // Get individual student leaderboard
  // GET /api/v1/leaderboard/students
  getIndividualLeaderboard: (period: 'weekly' | 'monthly' | 'all-time' = 'all-time') =>
    apiClient.get('/api/v1/leaderboard/students', {
      params: { period }
    }),

  // Get team leaderboard
  // GET /api/v1/leaderboard/teams
  getTeamLeaderboard: () =>
    apiClient.get('/api/v1/leaderboard/teams'),

  // Get department-wise rankings
  // GET /api/v1/leaderboard/departments
  getDepartmentLeaderboard: () =>
    apiClient.get('/api/v1/leaderboard/departments'),
};

export default leaderboardService;
