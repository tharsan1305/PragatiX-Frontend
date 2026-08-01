import apiClient from '../api/client';

export const teamService = {
  // Get all teams/groups
  // GET /api/v1/groups
  getTeams: () =>
    apiClient.get('/api/v1/groups'),

  // Get single team
  // GET /api/v1/groups/{id}
  getTeam: (id: string | number) =>
    apiClient.get(`/api/v1/groups/${id}`),

  // Create team
  // POST /api/v1/groups
  createTeam: (name: string, size: number, captainStudentId: string | number, memberStudentIds: Array<string | number>) =>
    apiClient.post('/api/v1/groups', {
      name, size, captainStudentId, memberStudentIds
    }),

  // Get captain's team
  // GET /api/v1/groups/captain/{captainId}
  getCaptainTeam: (captainId: string | number) =>
    apiClient.get(`/api/v1/groups/captain/${captainId}`),

  // Get team score summary
  // GET /api/v1/groups/{id}/score
  getTeamScore: (id: string | number) =>
    apiClient.get(`/api/v1/groups/${id}/score`),
};

export default teamService;
