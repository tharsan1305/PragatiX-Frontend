import { useState, useEffect } from 'react';
import { Users, School, Building2, AlertTriangle, RefreshCw, Activity, Shield, Key } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface Props {
  onPushView?: (name: string, props?: any) => void;
}

export default function OverviewTab({ onPushView = () => {} }: Props) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    departments: 0,
    alerts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/v1/admin/stats');
      } catch {
        response = await apiClient.get('/api/admin/dashboard/stats');
      }
      if (response && response.data) {
        const resObj = response.data.data || response.data;
        setStats({
          students: resObj.totalStudents ?? resObj.students ?? resObj.studentCount ?? 0,
          teachers: resObj.teachersCount ?? resObj.totalTeachers ?? resObj.teachers ?? resObj.teacherCount ?? resObj.totalFaculty ?? resObj.facultyCount ?? 0,
          departments: resObj.totalDepartments ?? resObj.departments ?? resObj.departmentCount ?? 0,
          alerts: resObj.totalAlerts ?? resObj.alerts ?? resObj.alertCount ?? resObj.pendingBadgeRequests ?? resObj.atRiskCount ?? 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-slate-900 px-6 pt-12 pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
          <button onClick={fetchStats} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, System Admin</h2>
          <p className="text-sm text-slate-300">Here is a summary of the PragatiX system metrics.</p>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6 pt-8 pb-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Students"
                count={stats.students.toString()}
                icon={Users}
                color="text-blue-500"
                bgColor="bg-blue-50"
                onClick={() => onPushView('students')}
              />
              <StatCard
                title="Teachers"
                count={stats.teachers.toString()}
                icon={School}
                color="text-green-500"
                bgColor="bg-green-50"
                onClick={() => onPushView('teachers')}
              />
              <StatCard
                title="Departments"
                count={stats.departments.toString()}
                icon={Building2}
                color="text-amber-500"
                bgColor="bg-amber-50"
                onClick={() => onPushView('departments')}
              />
              <StatCard
                title="Alerts/Actions"
                count={stats.alerts.toString()}
                icon={AlertTriangle}
                color="text-red-500"
                bgColor="bg-red-50"
                onClick={() => onPushView('badge_requests')}
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Quick Navigation</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => onPushView('attendance')}
                  className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Attendance</span>
                </button>

                <button
                  onClick={() => onPushView('badge_requests')}
                  className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Badge Requests</span>
                </button>

                <button
                  onClick={() => onPushView('create_stage')}
                  className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <School className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Create Stage</span>
                </button>

                <button
                  onClick={() => onPushView('students')}
                  className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Students</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick System Overview</h3>
              <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
                <OverviewRow icon={Activity} title="Database Status" value="Online & Healthy" statusColor="text-green-600" />
                <div className="h-px bg-slate-100"></div>
                <OverviewRow icon={Shield} title="Security Level" value="JWT Enabled" statusColor="text-blue-600" />
                <div className="h-px bg-slate-100"></div>
                <OverviewRow icon={Key} title="Self-Registration" value="Disabled (Admin Only)" statusColor="text-orange-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, count, icon: Icon, color, bgColor, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-md p-4 transition-transform ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div>
        <h4 className="text-2xl font-bold text-slate-900">{count}</h4>
        <p className="text-sm font-medium text-slate-600 mt-1">{title}</p>
      </div>
    </div>
  );
}

function OverviewRow({ icon: Icon, title, value, statusColor }: any) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-4">
        <Icon className="w-5 h-5 text-slate-500" />
        <span className="font-semibold text-slate-900 text-[15px]">{title}</span>
      </div>
      <div>
        <span className={`text-[15px] font-bold ${statusColor}`}>{value}</span>
      </div>
    </div>
  );
}
