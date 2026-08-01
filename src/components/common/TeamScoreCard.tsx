import React from 'react';

interface TeamScoreCardProps {
  teamName: string;
  rank?: number;
  totalScore: number;
  memberCount?: number;
}

export const TeamScoreCard: React.FC<TeamScoreCardProps> = ({
  teamName,
  rank,
  totalScore,
  memberCount,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="flex items-center space-x-3">
        {rank && (
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
            #{rank}
          </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-900">{teamName}</h4>
          {memberCount !== undefined && (
            <p className="text-xs text-gray-500">{memberCount} Members</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-indigo-600">{totalScore}</span>
        <span className="text-xs text-gray-400 block">Total Points</span>
      </div>
    </div>
  );
};

export default TeamScoreCard;
