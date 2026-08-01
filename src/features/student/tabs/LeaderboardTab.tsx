import { useState, useEffect } from 'react';
import { Trophy, ChevronDown, FilterX, Medal, Star } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface StudentProfile {
  studentId: string;
  fullName: string;
  departmentName: string;
  year: string;
  section: string;
  score: number;
}

const MOCK_DATA: StudentProfile[] = [
  { studentId: "24CS036", fullName: "Sharugesh", departmentName: "CSE", year: "III", section: "A", score: 95 },
  { studentId: "25CS010", fullName: "Priya K", departmentName: "CSE", year: "I", section: "A", score: 92 },
  { studentId: "24CS002", fullName: "Venkat", departmentName: "CSE", year: "III", section: "A", score: 90 },
  { studentId: "24IT089", fullName: "Jagadheesh", departmentName: "IT", year: "III", section: "B", score: 88 },
  { studentId: "22CS045", fullName: "Rahul Kumar", departmentName: "CSE", year: "IV", section: "A", score: 85 },
  { studentId: "25IT004", fullName: "Sanjay M", departmentName: "IT", year: "I", section: "B", score: 84 },
  { studentId: "24EE015", fullName: "Divya T", departmentName: "EEE", year: "III", section: "B", score: 81 },
  { studentId: "23EE012", fullName: "Kavya S", departmentName: "EEE", year: "II", section: "A", score: 80 },
  { studentId: "22ME022", fullName: "Arjun P", departmentName: "MECH", year: "IV", section: "C", score: 79 },
  { studentId: "23ME033", fullName: "Vijay R", departmentName: "MECH", year: "II", section: "B", score: 75 },
];

export default function LeaderboardTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [filteredList, setFilteredList] = useState<StudentProfile[]>([]);
  
  const [currentStudentId, setCurrentStudentId] = useState("24CS036");
  const [currentStudentName, setCurrentStudentName] = useState("Sharugesh");
  const [currentUserScore, setCurrentUserScore] = useState(0);

  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");

  const [deptOptions, setDeptOptions] = useState<string[]>(["All"]);
  const [sectionOptions, setSectionOptions] = useState<string[]>(["All"]);

  const yearOptions = ["All", "I", "II", "III", "IV"];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const profileRes = await apiClient.get('/api/v1/auth/me');
        if (profileRes.data.success) {
          setCurrentStudentId(profileRes.data.data.username || "24CS036");
          setCurrentStudentName(profileRes.data.data.fullName || "Sharugesh");
        }

        const studentsRes = await apiClient.get('/api/v1/students?page=0&size=1000&sortBy=fullName');
        if (studentsRes.data.success) {
          const content = studentsRes.data.data.content || [];
          const students = content.map((s: any) => ({
            studentId: s.studentId || "",
            fullName: s.fullName || "",
            departmentName: s.departmentName || "",
            year: s.year || "",
            section: s.section || "",
            score: s.score || 0
          }));
          setAllStudents(students);
          
          const depts = Array.from(new Set(students.map((s: any) => s.departmentName).filter((d: any) => !!d))) as string[];
          const sections = Array.from(new Set(students.map((s: any) => s.section).filter((sec: any) => !!sec))) as string[];
          setDeptOptions(["All", ...depts]);
          setSectionOptions(["All", ...sections]);
        }
      } catch {
        setAllStudents(MOCK_DATA);
        setDeptOptions(["All", "CSE", "IT", "EEE", "MECH"]);
        setSectionOptions(["All", "A", "B", "C"]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let temp = [...allStudents];
    if (selectedYear !== "All") temp = temp.filter(s => s.year === selectedYear);
    if (selectedDept !== "All") temp = temp.filter(s => s.departmentName === selectedDept);
    if (selectedSection !== "All") temp = temp.filter(s => s.section === selectedSection);
    
    temp.sort((a, b) => b.score - a.score);
    setFilteredList(temp);

    const me = allStudents.find(s => s.studentId === currentStudentId);
    if (me) setCurrentUserScore(me.score);
  }, [selectedYear, selectedDept, selectedSection, allStudents, currentStudentId]);

  const userRankIndex = filteredList.findIndex(s => s.studentId === currentStudentId);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : -1;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const topThree = filteredList.slice(0, 3);
  const remaining = filteredList.slice(3);

  const renderPodiumCell = (student: StudentProfile, rank: number, height: string, iconColor: string, isCurrentUser: boolean) => {
    if (!student) return null;
    return (
      <div className="flex flex-col items-center justify-end" style={{ height: '220px' }}>
        <Trophy className="w-6 h-6 mb-1" style={{ color: iconColor }} />
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${isCurrentUser ? 'bg-indigo-600' : 'bg-slate-700'}`}>
              {student.fullName[0] || 'S'}
            </div>
          </div>
        </div>
        <div className="mt-2 w-20 text-center text-white font-bold text-[11px] truncate">{student.fullName}</div>
        <div className="text-white/70 text-[9px] font-medium mb-1.5">{student.departmentName} • {student.score} pts</div>
        
        <div className={`w-20 ${height} rounded-t-xl border flex items-center justify-center text-lg font-bold`} 
             style={{ backgroundColor: `${iconColor}20`, borderColor: `${iconColor}50`, color: iconColor }}>
          #{rank}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-16">
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      <div className="bg-slate-800 px-4 py-3 flex gap-2 shadow-inner">
        {[ 
          { label: "Year", value: selectedYear, options: yearOptions, set: setSelectedYear },
          { label: "Dept", value: selectedDept, options: deptOptions, set: setSelectedDept },
          { label: "Sec", value: selectedSection, options: sectionOptions, set: setSelectedSection }
        ].map((filter, idx) => (
          <div key={idx} className="flex-1 relative">
            <select
              value={filter.value}
              onChange={(e) => filter.set(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white text-sm font-bold rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {filter.options.map(opt => (
                <option key={opt} value={opt} className="text-slate-800">{opt === "All" ? `All ${filter.label}` : opt}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {filteredList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <FilterX className="w-16 h-16 mb-3" />
            <p className="text-sm font-medium">No student records match selected filters.</p>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="bg-slate-800 rounded-b-3xl pt-2 pb-6 px-4 flex justify-evenly items-end">
                {topThree.length > 1 && renderPodiumCell(topThree[1], 2, 'h-[80px]', '#94a3b8', topThree[1].studentId === currentStudentId)}
                {renderPodiumCell(topThree[0], 1, 'h-[110px]', '#fbbf24', topThree[0].studentId === currentStudentId)}
                {topThree.length > 2 && renderPodiumCell(topThree[2], 3, 'h-[70px]', '#fb923c', topThree[2].studentId === currentStudentId)}
              </div>
            )}

            <div className="flex-1 px-5 py-4 overflow-y-auto">
              {remaining.map((s, idx) => {
                const rank = idx + 4;
                const isCurrentUser = s.studentId === currentStudentId;
                
                return (
                  <div 
                    key={s.studentId}
                    className={`mb-2 rounded-2xl border flex items-center p-3 shadow-sm ${
                      isCurrentUser ? 'bg-indigo-50 border-indigo-200 shadow-indigo-100' : 'bg-white border-slate-100 shadow-slate-100/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                      #{rank}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${isCurrentUser ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {s.fullName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {s.studentId} • {s.departmentName} • Year {s.year} - {s.section}
                      </div>
                    </div>
                    <div className="ml-3 font-bold text-indigo-600 text-sm whitespace-nowrap">
                      {s.score} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {filteredList.length > 0 && (
        <div className={`fixed bottom-[72px] inset-x-0 mx-auto max-w-3xl rounded-t-3xl px-6 py-3.5 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-10 flex items-center gap-3 ${
          userRank !== -1 ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white'
        }`}>
          {userRank !== -1 ? <Star className="w-6 h-6 shrink-0" /> : <Medal className="w-6 h-6 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-white/70">
              {userRank !== -1 ? "Your Standing in this View" : "Filtered View Standing"}
            </div>
            <div className="text-[13px] font-bold truncate">
              {userRank !== -1 
                ? `Rank #${userRank} | ${currentStudentName} (${currentUserScore} pts)` 
                : "You are not present in the current filtered standing."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
