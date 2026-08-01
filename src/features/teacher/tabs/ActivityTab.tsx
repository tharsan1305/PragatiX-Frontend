import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

export default function ActivityTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [stagesList, setStagesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await apiClient.get('/api/v1/admin/stages');
        if (response.data.success) {
          setStagesList(response.data.data || []);
        }
      } catch {
        // Fallback
        setStagesList([
          {
            id: 1,
            name: "Stage 1",
            description: "Initial threshold limits",
            subgroups: [
              { id: 1, name: "must (individual)", threshold: 30 },
              { id: 2, name: "individual", threshold: 20 },
              { id: 3, name: "groups", threshold: 50 }
            ]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStages();
  }, []);

  const handleSubgroupClick = (sub: any, stageName: string) => {
    toast(`Managing activities for subgroup: ${sub.name} in ${stageName}`, { icon: 'ℹ️' });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Department Activities</h1>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-[16px] font-bold text-slate-800 mb-4">
          System Stages configured by Admin
        </p>

        <div className="space-y-5">
          {stagesList.map((stage, index) => {
            const subgroups = stage.subgroups || [];
            
            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5">
                  <h2 className="text-lg font-bold text-slate-800">{stage.name}</h2>
                  <p className="text-[13px] text-slate-600 mt-1">{stage.description || "No description"}</p>
                  
                  <div className="my-4 h-px bg-slate-100" />
                  
                  {subgroups.length === 0 ? (
                    <p className="text-[13px] text-slate-500 italic py-2">
                      No subgroups configured for this stage.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {subgroups.map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => handleSubgroupClick(sub, stage.name)}
                          className="w-full flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-3 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                        >
                          <span className="font-semibold text-sm text-slate-800 text-left">
                            {sub.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-600 text-sm">
                              Threshold: {sub.threshold} pts
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
