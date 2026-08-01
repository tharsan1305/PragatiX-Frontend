import { useState, useEffect } from 'react';
import { Trophy, FilterX } from 'lucide-react';
import apiClient from '../../../services/apiClient';

export default function LeaderboardTab() {
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Re-use same filters as student side for better UX if desired, 
  // but Flutter implementation is simple list.
  // We'll stick strictly to Flutter's Teacher leaderboard UI which is just a list.

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await apiClient.get('/api/v1/students?page=0&size=1000&sortBy=fullName');
        if (response.data.success) {
          const list = response.data.data.content || [];
          list.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
          setLeaderboardList(list);
        }
      } catch {
        // Fallback mock
        setLeaderboardList([
          { studentId: "24CS036", fullName: "Sharugesh", departmentName: "CSE", score: 85 },
          { studentId: "22IT045", fullName: "Rahul Kumar", departmentName: "IT", score: 45 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex items-center gap-3">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h1 className="text-xl font-bold">Student Leaderboard</h1>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-[15px] font-bold text-slate-800 mb-4">
          Student Standings (Sorted by Discipline Score)
        </p>

        {leaderboardList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <FilterX className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No students found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboardList.map((s, index) => {
              const rank = index + 1;
              const name = s.fullName || '';
              const regNo = s.studentId || '';
              const dept = s.departmentName || '';
              const score = s.score || 0;

              return (
                <div key={regNo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-4">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-[13px] ${
                    rank === 1 ? 'bg-amber-100 text-amber-700' :
                    rank === 2 ? 'bg-slate-200 text-slate-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    #{rank}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] text-slate-800 truncate">{name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">{regNo} • {dept}</div>
                  </div>
                  
                  <div className="shrink-0 font-bold text-[15px] text-teal-600">
                    {score} pts
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
