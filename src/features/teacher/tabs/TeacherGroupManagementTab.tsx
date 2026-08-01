import { useState, useEffect } from 'react';
import { UsersRound, RefreshCw, ChevronDown, ChevronUp, UserPlus, Edit2, Shield, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

export default function TeacherGroupManagementTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  
  const [depts, setDepts] = useState<string[]>(["All"]);
  const [years, setYears] = useState<string[]>(["All"]);
  const [sections, setSections] = useState<string[]>(["All"]);

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/teams');
      const rawData = response.data?.data || response.data || [];
      const data = Array.isArray(rawData) ? rawData : (rawData.teamId || rawData.id ? [rawData] : []);
      
      setGroups(data);
      
      const deptSet = new Set<string>();
      const yearSet = new Set<string>();
      const sectionSet = new Set<string>();
      
      data.forEach((g: any) => {
        const dept = g.departmentName || (typeof g.department === 'string' ? g.department : g.department?.name);
        const year = g.yearName || g.year || g.academicYearName;
        const sec = g.sectionName || (typeof g.section === 'string' ? g.section : g.section?.sectionName);
        
        if (dept) deptSet.add(dept);
        if (year) yearSet.add(year.toString());
        if (sec) sectionSet.add(sec);

        const members = g.teamMembers || g.members || g.students || [];
        members.forEach((m: any) => {
          const mDept = m.departmentName || (typeof m.department === 'string' ? m.department : m.department?.name);
          const mYear = m.yearName || m.year || m.academicYear;
          const mSec = m.sectionName || (typeof m.section === 'string' ? m.section : m.section?.sectionName);
          
          if (mDept) deptSet.add(mDept);
          if (mYear) yearSet.add(mYear.toString());
          if (mSec) sectionSet.add(mSec);
        });
      });
      
      setDepts(["All", ...Array.from(deptSet).sort()]);
      setYears(["All", ...Array.from(yearSet).sort()]);
      setSections(["All", ...Array.from(sectionSet).sort()]);
    } catch (e: any) {
      console.error("Error fetching teams", e);
      toast.error("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredGroups = () => {
    return groups.filter(g => {
      const dept = g.departmentName || (typeof g.department === 'string' ? g.department : g.department?.name);
      const year = g.yearName || g.year || g.academicYearName;
      const sec = g.sectionName || (typeof g.section === 'string' ? g.section : g.section?.sectionName);
      const members = g.teamMembers || g.members || g.students || [];

      if (selectedDept !== "All") {
        const matchDept = dept === selectedDept || members.some((m: any) => 
          (m.departmentName || (typeof m.department === 'string' ? m.department : m.department?.name)) === selectedDept
        );
        if (!matchDept) return false;
      }

      if (selectedYear !== "All") {
        const matchYear = year?.toString() === selectedYear || members.some((m: any) => 
          (m.yearName || m.year || m.academicYear)?.toString() === selectedYear
        );
        if (!matchYear) return false;
      }

      if (selectedSection !== "All") {
        const matchSec = sec === selectedSection || members.some((m: any) => 
          (m.sectionName || (typeof m.section === 'string' ? m.section : m.section?.sectionName)) === selectedSection
        );
        if (!matchSec) return false;
      }

      return true;
    });
  };

  const [activeLimitTeam, setActiveLimitTeam] = useState<{ id: number; size: number } | null>(null);
  const [newLimitInput, setNewLimitInput] = useState('');
  
  const [activeAddTeamId, setActiveAddTeamId] = useState<number | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openLimitModal = (teamId: number, currentSize: number) => {
    setActiveLimitTeam({ id: teamId, size: currentSize });
    setNewLimitInput(currentSize.toString());
  };

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLimitTeam) return;
    const newSize = parseInt(newLimitInput, 10);
    if (isNaN(newSize) || newSize <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Updating group limit...");
    try {
      const response = await apiClient.put(`/api/v1/teams/${activeLimitTeam.id}/limit?size=${newSize}`);
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success("Group limit updated successfully");
        setActiveLimitTeam(null);
        fetchGroups();
      } else {
        toast.error(response.data.message || "Failed to update group limit");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddMemberModal = (teamId: number) => {
    setActiveAddTeamId(teamId);
    setStudentIdInput('');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAddTeamId || !studentIdInput.trim()) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading("Adding member to group...");
    try {
      const response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/add-member?studentId=${studentIdInput.trim()}`);
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success("Member added successfully");
        setActiveAddTeamId(null);
        setStudentIdInput('');
        fetchGroups();
      } else {
        toast.error(response.data.message || "Failed to add member");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMember = async (teamId: number, studentId: string, name: string) => {
    const toastId = toast.loading(`Removing ${name}...`);
    try {
      const response = await apiClient.post(`/api/v1/teams/${teamId}/remove-member?studentId=${studentId}`);
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success(`Removed ${name} from group`);
        fetchGroups();
      } else {
        toast.error(response.data.message || "Failed to remove member");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    }
  };

  const filteredGroups = getFilteredGroups();

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-indigo-600 text-white px-6 py-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">View Groups</h1>
        <button 
          onClick={fetchGroups} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-indigo-50 p-3 flex gap-2 border-b border-indigo-100 z-10 sticky top-[60px]">
        <select 
          className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
        >
          <option disabled>Dept</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select 
          className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
        >
          <option disabled>Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select 
          className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
        >
          <option disabled>Section</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <UsersRound className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm font-medium">No groups found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map(g => {
              const tId = g.teamId || g.id;
              const isExpanded = expandedGroupId === tId;
              const captainName = g.captainName || g.captain?.fullName || g.captain?.username || "No Captain";
              const members = g.teamMembers || g.members || g.students || [];
              const memberCount = members.length;
              const size = g.teamCapacity || g.size || g.maxTeamSize || 10;
              const groupName = g.teamName || g.name || g.groupName || `Group #${tId}`;

              return (
                <div key={tId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedGroupId(isExpanded ? null : tId)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                        <UsersRound className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] text-slate-800 truncate">{groupName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Captain: {captainName} • {memberCount}/{size} members
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      <div className="p-3 flex justify-end gap-2 border-b border-slate-100">
                        <button 
                          onClick={() => openLimitModal(g.teamId, size)}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Limit
                        </button>
                        <button 
                          onClick={() => openAddMemberModal(g.teamId)}
                          className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Member
                        </button>
                      </div>
                      
                      <div className="flex flex-col">
                        {members.map((m: any, i: number) => {
                          const isCaptain = m.studentId === g.captainId;
                          return (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCaptain ? 'bg-amber-500 text-white shadow-sm' : 'bg-indigo-100 text-indigo-600'}`}>
                                  {isCaptain ? <Shield className="w-4 h-4" /> : <div className="font-bold text-xs">{m.fullName?.charAt(0)}</div>}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-800 truncate">{m.fullName || "Student"}</div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {m.studentId} • {m.department || ''} {m.year || ''} {m.section || ''}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="shrink-0 flex items-center gap-2">
                                {isCaptain && (
                                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                    Captain
                                  </span>
                                )}
                                {!isCaptain && (
                                  <button 
                                    onClick={() => removeMember(g.teamId, m.studentId, m.fullName || "Student")}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove Member"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Group Limit Modal */}
      {activeLimitTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-bold text-slate-800">Edit Member Limit</h2>
              <p className="text-xs text-slate-500 mt-1">Set maximum capacity limit for this group.</p>
            </div>
            
            <form onSubmit={handleSaveLimit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Max Member Limit *</label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  value={newLimitInput} 
                  onChange={e => setNewLimitInput(e.target.value)} 
                  placeholder="e.g. 10"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setActiveLimitTeam(null)} 
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 text-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Update Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {activeAddTeamId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-bold text-slate-800">Add Group Member</h2>
              <p className="text-xs text-slate-500 mt-1">Enter student registration number or ID to assign to this group.</p>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Student Register No / ID *</label>
                <input 
                  required 
                  type="text" 
                  value={studentIdInput} 
                  onChange={e => setStudentIdInput(e.target.value)} 
                  placeholder="e.g. 24CS01, 24CSC122"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setActiveAddTeamId(null)} 
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 text-sm"
                >
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
