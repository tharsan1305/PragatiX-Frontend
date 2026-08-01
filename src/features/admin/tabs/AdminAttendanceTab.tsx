import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Users, ArrowLeft, Filter, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  onBack?: () => void;
}

export default function AdminAttendanceTab({ onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [yearId, setYearId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');

  const [years, setYears] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);

  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingLookups, setIsLoadingLookups] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'present' | 'absent'>('present');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    setIsLoadingLookups(true);
    try {
      const [yearRes, deptRes, secRes] = await Promise.all([
        apiClient.get('/api/v1/admin/years'),
        apiClient.get('/api/v1/admin/departments'),
        apiClient.get('/api/v1/admin/sections')
      ]);

      const fetchedYears = yearRes.data?.data || [];
      const fetchedDepts = deptRes.data?.data || [];
      const fetchedSecs = secRes.data?.data || [];

      setYears(fetchedYears);
      setDepartments(fetchedDepts);
      setSections(fetchedSecs);

      if (fetchedYears.length > 0) setYearId(fetchedYears[0].id.toString());
      if (fetchedDepts.length > 0) {
        const defaultDeptId = fetchedDepts[0].id.toString();
        setDepartmentId(defaultDeptId);
        const subSecs = fetchedSecs.filter((s: any) => 
          s.departmentId?.toString() === defaultDeptId || s.department?.id?.toString() === defaultDeptId
        );
        setFilteredSections(subSecs);
        if (subSecs.length === 1) {
          setSectionId(subSecs[0].id.toString());
        }
      }
    } catch (e) {
      console.error("Failed to load lookups:", e);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    setSectionId('');
    if (!newDeptId) {
      setFilteredSections([]);
      return;
    }
    const subSecs = sections.filter((s: any) => 
      s.departmentId?.toString() === newDeptId || s.department?.id?.toString() === newDeptId
    );
    setFilteredSections(subSecs);
    if (subSecs.length === 1) {
      setSectionId(subSecs[0].id.toString());
    }
  };

  const fetchSummary = async () => {
    if (!yearId || !departmentId) {
      alert('Please select Year and Department');
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        period: selectedPeriod.toString(),
        yearId: yearId,
        departmentId: departmentId,
      });
      if (sectionId) params.append('sectionId', sectionId);

      let response;
      try {
        response = await apiClient.get(`/api/admin/attendance/summary?${params.toString()}`);
      } catch (e) {
        response = await apiClient.get(`/api/v1/admin/attendance/summary?${params.toString()}`);
      }

      if (response.data?.success) {
        setSummary(response.data.data);
      } else if (response.data) {
        setSummary(response.data);
      }
    } catch (e: any) {
      console.error("Failed to fetch attendance summary:", e);
      toast.error(e.response?.data?.message || 'Error loading attendance summary');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = (list: any[]) => {
    if (!list) return [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((st: any) => {
      const name = (st.studentName || st.fullName || '').toLowerCase();
      const reg = (st.registerNumber || st.regNo || '').toLowerCase();
      return name.includes(q) || reg.includes(q);
    });
  };

  const presentFiltered = filterStudents(summary?.presentStudents || []);
  const absentFiltered = filterStudents(summary?.absentStudents || []);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Header Bar */}
      <div className="bg-[#1E293B] px-6 pt-10 pb-5 shadow-md text-white">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Attendance Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">Filter by academic year, department, period, and view daily reports</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Filters Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-700 tracking-wide flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Attendance Filters</span>
          </h2>

          {isLoadingLookups ? (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span>Loading filters...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Year *</label>
                  <select 
                    value={yearId} 
                    onChange={e => setYearId(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                  >
                    <option value="">-- Select Year --</option>
                    {years.map(y => (
                      <option key={y.id} value={y.id}>
                        {y.yearNo !== undefined ? `Year ${y.yearNo}` : (y.yearName || y.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Department *</label>
                  <select 
                    value={departmentId} 
                    onChange={e => handleDepartmentChange(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code || d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Section (Optional)</label>
                  <select 
                    value={sectionId} 
                    onChange={e => setSectionId(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                  >
                    <option value="">All Sections</option>
                    {filteredSections.map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.sectionName || sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Date</label>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Period</label>
                  <select 
                    value={selectedPeriod} 
                    onChange={e => setSelectedPeriod(Number(e.target.value))} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={fetchSummary}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#1E293B] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-sm flex items-center space-x-2"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Load Dashboard</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Dashboard Results View */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Header / Export Action Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">
                Showing report for <span className="font-bold text-slate-800">{selectedDate}</span> • Period <span className="font-bold text-slate-800">{selectedPeriod}</span>
              </div>
              <button
                onClick={() => {
                  const presentList = summary.presentStudents || [];
                  const absentList = summary.absentStudents || [];
                  const rows = [
                    ['Status', 'Student Name', 'Register Number'],
                    ...presentList.map((s: any) => ['Present', s.studentName || s.fullName || '', s.registerNumber || s.regNo || '']),
                    ...absentList.map((s: any) => ['Absent', s.studentName || s.fullName || '', s.registerNumber || s.regNo || ''])
                  ];
                  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `attendance_${selectedDate}_period${selectedPeriod}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <span>Export CSV Report</span>
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Students</p>
                  <h3 className="text-2xl font-bold text-slate-900">{summary.totalStudents ?? 0}</h3>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Present</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{summary.totalPresent ?? 0}</h3>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Absent</p>
                  <h3 className="text-2xl font-bold text-rose-600">{summary.totalAbsent ?? 0}</h3>
                </div>
              </div>
            </div>

            {/* Search and List Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search student by name or reg no..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button
                  onClick={() => setActiveTab('present')}
                  className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'present'
                      ? 'border-emerald-600 text-emerald-600 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Present Students ({presentFiltered.length})
                </button>
                <button
                  onClick={() => setActiveTab('absent')}
                  className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'absent'
                      ? 'border-rose-600 text-rose-600 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Absent Students ({absentFiltered.length})
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'present' ? (
                  presentFiltered.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No present students matching query.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {presentFiltered.map((st: any, idx: number) => (
                        <div key={st.id || idx} className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                              {(st.studentName || st.fullName || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{st.studentName || st.fullName}</p>
                              <p className="text-xs text-slate-400">REG: {st.registerNumber || st.regNo || 'N/A'}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                            Present
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  absentFiltered.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No absent students matching query.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {absentFiltered.map((st: any, idx: number) => (
                        <div key={st.id || idx} className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-bold text-sm">
                              {(st.studentName || st.fullName || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{st.studentName || st.fullName}</p>
                              <p className="text-xs text-slate-400">REG: {st.registerNumber || st.regNo || 'N/A'}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
                            Absent
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Select filters above and click <span className="font-semibold text-slate-700">Load Dashboard</span> to view attendance.
          </div>
        )}
      </div>
    </div>
  );
}

