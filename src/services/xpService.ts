import apiClient from '../api/client';

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
}

export const xpService = {
  // Get student XP summary
  // GET /api/v1/xp/{studentId}/summary
  getStudentXp: (studentId: string | number) =>
    apiClient.get(`/api/v1/xp/${studentId}/summary`),

  // Get XP transaction history
  // GET /api/v1/xp/{studentId}/history
  getXpHistory: (studentId: string | number) =>
    apiClient.get(`/api/v1/xp/${studentId}/history`),

  // Get XP leaderboard
  // GET /api/v1/xp/leaderboard
  getXpLeaderboard: () =>
    apiClient.get('/api/v1/xp/leaderboard'),

  // XP Level thresholds matching XpEngineService.java & LevelBadgeController.java
  LEVELS: [
    { level: 1, title: 'Explorer', minXp: 0, maxXp: 100 },
    { level: 2, title: 'Builder', minXp: 101, maxXp: 500 },
    { level: 3, title: 'Innovator', minXp: 501, maxXp: 1500 },
    { level: 4, title: 'Specialist', minXp: 1501, maxXp: 3000 },
    { level: 5, title: 'Leader', minXp: 3001, maxXp: 5000 },
    { level: 6, title: 'Mentor', minXp: 5001, maxXp: 7000 },
    { level: 7, title: 'Architect', minXp: 7001, maxXp: 10000 },
    { level: 8, title: 'Industry Ready', minXp: 10001, maxXp: 99999 },
  ] as LevelInfo[],

  // Get level from XP score
  getLevelFromXp: (xp: number): LevelInfo => {
    return xpService.LEVELS.find(l => xp >= l.minXp && xp <= l.maxXp) || xpService.LEVELS[0];
  },
};

export default xpService;
