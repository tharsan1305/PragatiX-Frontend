import React, { useEffect, useState } from 'react';
import captainService from '../../services/captainService';
import ScoreBadge from '../../components/common/ScoreBadge';

export const CaptainDashboard: React.FC = () => {
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const userStr = localStorage.getItem('spdms_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user?.id) {
          const res = await captainService.getMyTeam(user.id);
          setTeam(res.data);
        }
      } catch (err) {
        console.error('Failed to load team data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Team Captain Portal</h1>
          <p className="text-gray-500 text-sm">Monitor your team's overall score, activity log, and performance.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading team statistics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Team Name</h3>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{team?.name || 'My Team'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Team Score</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              <ScoreBadge score={team?.totalScore || 100} />
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Members Count</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{team?.members?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainDashboard;
