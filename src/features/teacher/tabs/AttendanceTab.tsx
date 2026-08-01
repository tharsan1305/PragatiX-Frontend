import { useState, useEffect } from 'react';
import { CalendarCheck, Save, UsersRound, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Student {
  studentId: number;
  studentName: string;
  registerNumber: string;
  status: 'PRESENT' | 'ABSENT';
  remarks?: string;
}

interface LookupOption {
  id: number;
  name: string;
}

export default function AttendanceTab() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [yearId, setYearId] = useState<number>(1);
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<number>(1);

  // Dynamic Lookup options
  const [years, setYears] = useState<LookupOption[]>([
    { id: 1, name: "First Year" },
    { id: 2, name: "Second Year" },
    { id: 3, name: "Third Year" },
    { id: 4, name: "Fourth Year" }
  ]);

  const [departments, setDepartments] = useState<LookupOption[]>([
    { id: 1, name: "Cyber Security" },
    { id: 2, name: "Computer Science" },
    { id: 3, name: "Information Technology" }
  ]);

  const [sections, setSections] = useState<LookupOption[]>([
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" }
  ]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [yearsRes, deptsRes, secsRes] = await Promise.allSettled([
          apiClient.get('/api/v1/admin/years'),
          apiClient.get('/api/v1/admin/departments'),
          apiClient.get('/api/v1/admin/sections')
        ]);

        if (yearsRes.status === 'fulfilled' && yearsRes.value?.data?.data?.length) {
          const formatted = yearsRes.value.data.data.map((y: any) => ({
            id: y.id,
            name: y.yearName || y.name || `Year ${y.id}`
          }));
          setYears(formatted);
          if (formatted.length > 0) setYearId(formatted[0].id);
        }

        if (deptsRes.status === 'fulfilled' && deptsRes.value?.data?.data?.length) {
          const formatted = deptsRes.value.data.data.map((d: any) => ({
            id: d.id,
            name: d.name || d.deptName || d.code || `Department ${d.id}`
          }));
          setDepartments(formatted);
          if (formatted.length > 0) setDepartmentId(formatted[0].id);
        }

        if (secsRes.status === 'fulfilled' && secsRes.value?.data?.data?.length) {
          const formatted = secsRes.value.data.data.map((s: any) => ({
            id: s.id,
            name: s.name || s.sectionName || `Section ${s.id}`
          }));
          setSections(formatted);
        }
      } catch (err) {
        console.warn('Could not load dynamic lookups, using default values', err);
      }
    };

    fetchLookups();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    setErrorMsg(null);
    setHasSearched(true);
    try {
      let url = `/api/teacher/attendance/students?date=${date}&period=${period}&yearId=${yearId}&departmentId=${departmentId}`;
      if (sectionId !== '') {
        url += `&sectionId=${sectionId}`;
      }

      const response = await apiClient.get(url);
      if (response.data && response.data.success) {
        const fetchedStudents = (response.data.data || []).map((s: any) => ({
          studentId: s.studentId || s.id,
          studentName: s.studentName || s.fullName || 'Student',
          registerNumber: s.registerNumber || s.regNo || s.username || '',
          status: s.status || 'PRESENT',
          remarks: s.remarks || ''
        }));
        setStudents(fetchedStudents);
      } else {
        setErrorMsg(response.data?.message || 'Failed to fetch students from server.');
        setStudents([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch students', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Error connecting to backend server.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: number) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.studentId === studentId) {
          return { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' };
        }
        return s;
      })
    );
  };

  const submitAttendance = async () => {
    if (students.length === 0) return;

    setSubmitting(true);
    const toastId = toast.loading("Saving attendance...");
    try {
      const payload = {
        date,
        period,
        academicYearId: 1,
        yearId,
        departmentId,
        sectionId: sectionId === '' ? null : sectionId,
        records: students.map(s => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks || ''
        }))
      };

      const response = await apiClient.post('/api/teacher/attendance/save', payload);
      toast.dismiss(toastId);
      if (response.data && response.data.success) {
        toast.success('Attendance saved successfully!');
      } else {
        toast.error(response.data?.message || 'Failed to save attendance');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Failed to save attendance', err);
      toast.error(err?.response?.data?.message || 'Error saving attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-slate-900 md:bg-indigo-600 text-white px-6 py-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CalendarCheck className="w-6 h-6" /> Mark Attendance
        </h1>
      </div>

      <div className="p-4 flex flex-col md:flex-row gap-6 h-full overflow-hidden">
        {/* Form Section */}
        <div className="w-full md:w-1/3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 overflow-y-auto">

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Year</label>
            <select
              value={yearId}
              onChange={(e) => setYearId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Section (Optional)</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Any Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} value={p}>Period {p}</option>)}
            </select>
          </div>

          <button
            onClick={loadStudents}
            disabled={loading}
            className="w-full mt-4 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-lg font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Loading...' : 'Load Students'}
          </button>
        </div>

        {/* Student List Section */}
        <div className="w-full md:w-2/3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
              </div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-slate-200 rounded"></div>
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-7 w-20 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : !hasSearched ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <UsersRound className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-medium">Select filters and click "Load Students"</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
              <h3 className="font-bold text-slate-800 text-lg mb-1">No Students Found</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {errorMsg || 'No students were found in the database matching your selected Year, Department, and Section.'}
              </p>
              <button
                onClick={loadStudents}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-sm rounded-lg hover:bg-indigo-100 transition"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 text-lg">Student List</h2>
                <div className="text-sm font-medium text-slate-500">
                  Total: {students.length} | Present: {students.filter(s => s.status === 'PRESENT').length} | Absent: {students.filter(s => s.status === 'ABSENT').length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {students.map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">{student.studentName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{student.registerNumber}</div>
                    </div>

                    <button
                      onClick={() => toggleAttendance(student.studentId)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        student.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300'
                      }`}
                    >
                      {student.status}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200">
                <button
                  onClick={submitAttendance}
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {submitting ? 'Saving...' : 'Submit Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
