import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { Users, Star, RefreshCw, UserX, Shield, Award, Calendar, BookOpen } from 'lucide-react';

interface TeamMember {
  studentId?: number;
  regNo: string;
  fullName: string;
  departmentName?: string;
  year?: string;
  section?: string;
  score?: number;
  stageLevel?: number;
  isCaptain?: boolean;
}

interface TeamData {
  teamId?: number;
  id?: number;
  teamName?: string;
  name?: string;
  captainId?: string;
  captainName?: string;
  activityName?: string;
  assignmentName?: string;
  departmentName?: string;
  academicYearName?: string;
  academicYear?: string;
  yearName?: string;
  sectionName?: string;
  currentStage?: number;
  teamMembers?: TeamMember[];
  members?: TeamMember[];
}

export default function CaptainGroupTab() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamData | null>(null);

  const fetchMyGroup = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/teams/my-team');
      if (response.data && response.data.success && response.data.data) {
        setTeam(response.data.data);
      } else {
        setTeam(null);
      }
    } catch (err: any) {
      console.error('Error fetching team:', err);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGroup();
  }, []);

  const getStageName = (level: number = 1) => {
    const stages: Record<number, string> = {
      1: 'Explorer',
      2: 'Builder',
      3: 'Innovator',
      4: 'Specialist',
      5: 'Leader',
      6: 'Mentor',
      7: 'Architect',
      8: 'Industry Ready',
    };
    return stages[level] || 'Explorer';
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Loading group details...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <UserX className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Team Assigned</h2>
          <p className="text-slate-500 max-w-md mb-6">
            You are not assigned to any group yet. Please contact your Class Coordinator for team placement.
          </p>
          <button
            onClick={fetchMyGroup}
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const teamMembers = team.teamMembers || team.members || [];
  const teamName = team.teamName || team.name || 'My Group';
  const activityName = team.activityName || team.assignmentName || 'Group Activity';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-full mb-3 border border-indigo-400/20">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              Captain Group
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">{teamName}</h1>
            <p className="text-indigo-200 text-sm mt-1">{activityName}</p>
          </div>

          <button
            onClick={fetchMyGroup}
            className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition border border-white/10 backdrop-blur-sm self-start md:self-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Metadata badges */}
        <div className="relative z-10 mt-6 pt-6 border-t border-indigo-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 text-indigo-100">
            <BookOpen className="w-5 h-5 text-indigo-300" />
            <div>
              <p className="text-xs text-indigo-300">Department</p>
              <p className="text-sm font-semibold">{team.departmentName || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-indigo-100">
            <Calendar className="w-5 h-5 text-indigo-300" />
            <div>
              <p className="text-xs text-indigo-300">Academic Year</p>
              <p className="text-sm font-semibold">{team.academicYearName || team.academicYear || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-indigo-100">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs text-indigo-300">Stage</p>
              <p className="text-sm font-semibold">{getStageName(team.currentStage || 1)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-indigo-100">
            <Users className="w-5 h-5 text-indigo-300" />
            <div>
              <p className="text-xs text-indigo-300">Total Members</p>
              <p className="text-sm font-semibold">{teamMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Group Members</h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            {teamMembers.length} Members
          </span>
        </div>

        {teamMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No members found in this group.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {teamMembers.map((member: any, idx: number) => {
              const isCaptain = member.regNo === team.captainId || member.isCaptain;
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        isCaptain
                          ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isCaptain ? <Star className="w-6 h-6 fill-amber-500 text-amber-500" /> : member.fullName?.[0] || 'S'}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-900">{member.fullName || 'Student'}</h3>
                        {isCaptain && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Captain
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{member.regNo}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {member.score !== undefined && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Score</p>
                        <p className="font-bold text-indigo-600">{member.score} pts</p>
                      </div>
                    )}
                    <span className="hidden sm:inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                      {member.departmentName || member.year || 'Member'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
