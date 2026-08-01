import { useState, useEffect } from 'react';
import { Users, Star, RefreshCw } from 'lucide-react';
import apiClient from '../../../services/apiClient';

export default function HodPerformanceTab() {
  const [performanceData, setPerformanceData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/api/v1/students/department-performance');
      if (response.data.success) {
        setPerformanceData(response.data.data || {});
      } else {
        setErrorMessage(response.data.message || "Failed to load metrics");
      }
    } catch {
      setErrorMessage("Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
          <h1 className="text-xl font-bold">HOD Performance Dashboard</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-red-500 font-bold text-center text-lg">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const deptName = performanceData.departmentName || "Department";
  const overallAvg = parseFloat(performanceData.overallAverage) || 100.0;
  const totalStudents = parseInt(performanceData.totalStudents) || 0;
  const yearAvg = performanceData.yearWiseAverage || {};

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold truncate pr-4">{deptName} HOD Dashboard</h1>
        <button 
          onClick={fetchPerformance} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-[16px] font-bold text-slate-800 mb-4">
          Department Overview
        </p>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center">
            <Users className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium mb-1">Total Students</p>
            <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
          </div>
          
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center">
            <Star className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-xs text-slate-500 font-medium mb-1">Overall Avg Score</p>
            <p className="text-2xl font-bold text-slate-800">{overallAvg.toFixed(1)}</p>
          </div>
        </div>

        <p className="text-[16px] font-bold text-slate-800 mb-4">
          Year-wise Average Discipline Score
        </p>

        {Object.keys(yearAvg).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500 italic text-center">
              No student records found in this department.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(yearAvg).map(([year, scoreValue]) => {
              const score = parseFloat(scoreValue as string) || 0;
              let barColor = "bg-teal-500";
              if (score < 50) barColor = "bg-red-500";
              else if (score < 75) barColor = "bg-orange-500";

              return (
                <div key={year} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-[15px] text-slate-800">{year}</span>
                    <span className="font-bold text-sm text-slate-800">
                      {score.toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
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
