import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Shield, Stars, Users, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../../store/authContext';
import { useXpStore } from '../../../store/xpStore';
import apiClient from '../../../services/apiClient';

interface ProfileData {
  studentName: string;
  studentId: string;
  department: string;
  section: string;
  year: string;
  score: number;
  rank: number;
  currentStage: number;
  isCaptain: boolean;
}

const LEVEL_THRESHOLDS = [
  { level: 1, title: "Explorer", min: 0, max: 100 },
  { level: 2, title: "Builder", min: 101, max: 500 },
  { level: 3, title: "Innovator", min: 501, max: 1500 },
  { level: 4, title: "Specialist", min: 1501, max: 3000 },
  { level: 5, title: "Leader", min: 3001, max: 5000 },
  { level: 6, title: "Mentor", min: 5001, max: 7000 },
  { level: 7, title: "Architect", min: 7001, max: 10000 },
  { level: 8, title: "Industry Ready", min: 10001, max: 99999 },
];

export default function DashboardTab() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { xpByCategory, streaks, history, isLoading: isXpLoading, totalXp, fetchSummary, fetchHistory, fetchStreaks } = useXpStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    studentName: "",
    studentId: "",
    department: "",
    section: "",
    year: "",
    score: 0,
    rank: 1,
    currentStage: 1,
    isCaptain: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (token === 'debug_token') {
          setIsLoading(false);
          return; // Skip fetch for mock login
        }
        const res = await apiClient.get('/api/v1/auth/me');
        if (res.data.success && res.data.data) {
          const p = res.data.data;
          const regNo = p.username || p.sprNo || "";
          setProfile(prev => ({
            ...prev,
            studentName: p.fullName || prev.studentName,
            studentId: regNo,
            section: p.section || prev.section,
            year: p.year || prev.year,
            department: p.department || prev.department,
            score: p.score ?? p.totalXp ?? prev.score,
            rank: p.rank || prev.rank,
            currentStage: p.stage ?? prev.currentStage,
            isCaptain: p.isCaptain ?? prev.isCaptain,
          }));

          if (regNo) {
            fetchSummary(regNo);
            fetchHistory(regNo);
            fetchStreaks(regNo);
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [token, fetchSummary, fetchHistory, fetchStreaks]);

  useEffect(() => {
    if (profile.studentId && profile.studentId !== "24IT077" && !isLoading) {
      fetchSummary(profile.studentId);
      fetchHistory(profile.studentId);
      fetchStreaks(profile.studentId);
    }
  }, [profile.studentId, isLoading, fetchSummary, fetchHistory, fetchStreaks]);

  const getLevelInfo = (xp: number) => {
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp <= LEVEL_THRESHOLDS[i].max) {
        return LEVEL_THRESHOLDS[i];
      }
    }
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  };

  const levelInfo = getLevelInfo(totalXp);
  const progress = Math.min(1, Math.max(0, (totalXp - levelInfo.min) / (levelInfo.max - levelInfo.min)));

  if (isLoading || isXpLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const chartData = [
    { name: 'Acad', xp: xpByCategory["ACADEMIC"] || 0, fill: '#3b82f6' },
    { name: 'Skill', xp: xpByCategory["SKILL"] || 0, fill: '#a855f7' },
    { name: 'Comm', xp: xpByCategory["COMMUNICATION"] || 0, fill: '#6366f1' },
    { name: 'Lead', xp: xpByCategory["LEADERSHIP"] || 0, fill: '#fbbf24' },
    { name: 'Inno', xp: xpByCategory["INNOVATION"] || 0, fill: '#f97316' },
    { name: 'Plac', xp: xpByCategory["PLACEMENT"] || 0, fill: '#22c55e' },
    { name: 'Disc', xp: xpByCategory["DISCIPLINE"] || 0, fill: '#ef4444' },
    { name: 'Commu', xp: xpByCategory["COMMUNITY"] || 0, fill: '#14b8a6' },
    { name: 'Sport', xp: xpByCategory["SPORTS"] || 0, fill: '#ec4899' },
    { name: 'Cult', xp: xpByCategory["CULTURAL"] || 0, fill: '#06b6d4' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Student Dashboard</h1>
        <button 
          onClick={() => navigate('/captain')}
          className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors"
          title="My Group"
        >
          <Users className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div>
          <p className="text-slate-500 font-medium text-sm mb-1">Welcome back,</p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">{profile.studentName}</h2>
            {profile.isCaptain && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                <Stars className="w-3 h-3" />
                CAPTAIN
              </span>
            )}
          </div>
        </div>

        {/* Discipline Score Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-indigo-100 font-medium">Discipline Score</span>
            <Shield className="w-6 h-6 text-white/90" />
          </div>
          <div className="text-4xl font-bold mb-5">{(totalXp || profile.score || 0)} Points</div>
          
          <div className="h-px bg-white/20 mb-4" />
          
          <div className="flex justify-between items-center text-sm">
            <div>
              <div className="text-indigo-200 text-xs mb-1">Department</div>
              <div className="font-semibold">{profile.department}</div>
            </div>
            <div className="text-right">
              <div className="text-indigo-200 text-xs mb-1">Section & Year</div>
              <div className="font-semibold">{profile.year} Year - Sec {profile.section}</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Level {levelInfo.level} — {levelInfo.title}</h3>
            <Stars className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {totalXp} / {levelInfo.max} XP to next level
          </p>
        </div>

        {/* Stage Banner */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((stage) => (
              <div 
                key={stage}
                className={`w-3 h-3 rounded-full ${stage === profile.currentStage ? 'bg-indigo-600' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <div className="flex-1 font-bold text-sm text-slate-800">
            Stage {Math.max(1, profile.currentStage)} — {Math.max(1, profile.currentStage) === 1 ? 'Roots' : Math.max(1, profile.currentStage) === 2 ? 'Branches' : 'Fruits'} | {totalXp} / {Math.max(1, profile.currentStage) === 1 ? 500 : 1200} XP
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100/50 rounded-full">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Leaderboard Rank</div>
              <div className="text-lg font-bold text-slate-800">#{profile.rank}</div>
            </div>
          </div>
          <div className="bg-teal-50 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-teal-100/50 rounded-full">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Active Stage</div>
              <div className="text-lg font-bold text-slate-800">Stage {Math.max(1, profile.currentStage)}</div>
            </div>
          </div>
        </div>

        {/* Active Streaks */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">Active Streaks</h3>
          {streaks.length === 0 ? (
            <p className="text-slate-500 text-sm">No active streaks recorded.</p>
          ) : (
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
              {streaks.map((s, idx) => (
                <div key={idx} className={`snap-start shrink-0 w-32 p-3 rounded-2xl border-2 bg-white ${s.isBroken ? 'border-red-200' : 'border-green-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-800 truncate w-20">
                      {s.streakType.replace('_', ' ')}
                    </span>
                    <span className="text-xs">{s.isBroken ? "❄️" : "🔥"}</span>
                  </div>
                  <div className={`text-sm font-bold ${s.isBroken ? 'text-red-500' : 'text-green-500'}`}>
                    {s.isBroken ? "Broken" : `${s.currentStreak} Days`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XP Summary Grid */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">XP Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center p-2.5 rounded-xl border" style={{ backgroundColor: `${item.fill}10`, borderColor: `${item.fill}20` }}>
                <div className="w-1.5 self-stretch rounded-full mr-2.5" style={{ backgroundColor: item.fill }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 truncate">{item.name} XP</div>
                  <div className="text-sm font-bold" style={{ color: item.fill }}>{item.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
          <div className="h-px bg-slate-100 mb-4" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-sm">Total XP</span>
            <span className="font-bold text-indigo-600 text-lg">{totalXp} XP</span>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">XP by Category</h3>
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  interval={0}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">Recent Point Actions</h3>
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-500 border border-slate-100 shadow-sm">
              No recent activities recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((log, idx) => {
                const isPositive = log.xpPoints > 0;
                return (
                  <div key={idx} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-slate-100 shadow-sm">
                    <div className={`p-2.5 rounded-full ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                      <TrendingUp className={`w-5 h-5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate text-sm">
                        {log.activityName || log.category}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.submittedAt).toLocaleDateString()} • {log.status}
                      </div>
                    </div>
                    <div className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{log.xpPoints}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
