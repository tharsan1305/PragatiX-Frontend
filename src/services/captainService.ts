import apiClient from '../api/client';

export const captainService = {
  // Get captain's team
  getMyTeam: (captainId: string | number) =>
    apiClient.get(`/api/v1/teams?captainId=${captainId}`),

  // Log team activity
  logTeamActivity: (groupId: string | number, activityData: any) =>
    apiClient.post(`/api/v1/teams/${groupId}/activity`, activityData),

  // Get team score summary
  getTeamScore: (groupId: string | number) =>
    apiClient.get(`/api/v1/teams/${groupId}`),
};

export default captainService;
