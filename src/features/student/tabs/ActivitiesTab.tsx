import { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../store/authContext';
import { useXpStore } from '../../../store/xpStore';
import apiClient from '../../../services/apiClient';

export default function ActivitiesTab() {
  const { token } = useAuth();
  const { history } = useXpStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [expandedStageId, setExpandedStageId] = useState<number | null>(1); // 1 is default opened

  useEffect(() => {
    const initializeData = async () => {
      try {
        const response = await apiClient.get('/api/v1/admin/stages');
        if (response.data.success) {
          const fetchedStages = response.data.data || [];
          const mapped = [];

          for (const st of fetchedStages) {
            const fetchedSubgroups = st.subgroups || [];
            const substages = [];

            for (const sub of fetchedSubgroups) {
              const subId = sub.id;
              let activitiesList = [];

              try {
                const actRes = await apiClient.get(`/api/v1/admin/subgroups/${subId}/activities`);
                if (actRes.data.success) {
                  activitiesList = actRes.data.data || [];
                }
              } catch (error) {
                console.error(`Failed to fetch activities for subgroup ${subId}`);
              }

              substages.push({
                name: sub.name,
                threshold: sub.threshold || 0,
                activities: activitiesList.map((act: any) => ({
                  name: act.name || act.activityName || "",
                  description: act.description || act.activityDescription || "",
                  points: parseInt(act.xp || act.xpReward || "0", 10) || 0,
                  isDone: false,
                })),
              });
            }

            mapped.push({
              id: st.id,
              name: st.name,
              description: st.description || "",
              substages,
            });
          }

          mapped.sort((a, b) => a.id - b.id);
          setStages(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch stages, falling back to empty state");
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [token]);

  const isActivityDone = (act: any) => {
    if (isSimulationActive) return act.isDone;
    const name = (act.name || "").trim().toLowerCase();
    return history.some((tx: any) => 
      tx.status === "APPROVED" && (tx.activityName || "").trim().toLowerCase() === name
    );
  };

  const getSubstageScore = (substage: any) => {
    if (isSimulationActive) {
      return (substage.activities || []).reduce((sum: number, act: any) => 
        sum + (act.isDone ? act.points : 0)
      , 0);
    }
    
    let score = 0;
    const activityNames = new Set((substage.activities || []).map((act: any) => (act.name || "").trim().toLowerCase()));
    
    for (const tx of history) {
      if (tx.status === "APPROVED") {
        const txName = (tx.activityName || "").trim().toLowerCase();
        if (activityNames.has(txName)) {
          score += tx.xpPoints || 0;
        }
      }
    }
    return score;
  };

  const isSubstagePassed = (substage: any) => {
    return getSubstageScore(substage) >= (substage.threshold || 0);
  };

  const isStageFullyPassed = (stage: any) => {
    for (const sub of (stage.substages || [])) {
      if (!isSubstagePassed(sub)) return false;
    }
    return true;
  };

  const toggleActivity = (stageIndex: number, subIndex: number, actIndex: number, value: boolean) => {
    if (!isSimulationActive) return;
    const newStages = [...stages];
    newStages[stageIndex].substages[subIndex].activities[actIndex].isDone = value;
    setStages(newStages);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Activities & Stages</h1>
        <button 
          onClick={() => setIsSimulationActive(!isSimulationActive)}
          className={`p-2 rounded-full transition-colors ${isSimulationActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/20'}`}
          title="Toggle Simulator Mode"
        >
          {isSimulationActive ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">
        
        {isSimulationActive && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex gap-3 items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
            <span className="text-xs font-bold text-orange-900">
              Teacher Simulation Active (Click checkboxes to simulate approving marks)
            </span>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Action Items & Thresholds</h2>
          <p className="text-xs text-slate-500">
            You must meet the separate thresholds for MUST, INDIVIDUAL, and GROUP sections to unlock the next stage.
          </p>
        </div>

        <div className="space-y-4">
          {stages.map((stage, stageIdx) => {
            const isUnlocked = stageIdx === 0 ? true : isStageFullyPassed(stages[stageIdx - 1]);
            const passedCount = stage.substages.filter((sub: any) => isSubstagePassed(sub)).length;
            const isAllPassed = passedCount === stage.substages.length;
            const isExpanded = expandedStageId === stage.id && isUnlocked;

            return (
              <div 
                key={stage.id} 
                className={`rounded-2xl border transition-colors ${isUnlocked ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-100'}`}
              >
                {/* Accordion Header */}
                <div 
                  className={`p-4 flex items-center gap-4 cursor-pointer ${!isUnlocked ? 'opacity-70' : ''}`}
                  onClick={() => {
                    if (isUnlocked) {
                      setExpandedStageId(isExpanded ? null : stage.id);
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-indigo-50' : 'bg-slate-200'}`}>
                    {isUnlocked ? <Unlock className="w-5 h-5 text-indigo-600" /> : <Lock className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-[15px] truncate ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                      {stage.name}
                    </div>
                    <div className={`text-[11px] font-bold mt-0.5 ${isAllPassed ? 'text-green-600' : isUnlocked ? 'text-orange-600' : 'text-slate-500'}`}>
                      {isUnlocked ? `Substages Passed: ${passedCount} / ${stage.substages.length}` : 'Stage Locked'}
                    </div>
                  </div>
                  {isUnlocked && (
                    <div className="shrink-0 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  )}
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-4 pb-5 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-600 leading-relaxed mb-5">{stage.description}</p>

                    <div className="space-y-6">
                      {stage.substages.map((substage: any, subIdx: number) => {
                        const score = getSubstageScore(substage);
                        const threshold = substage.threshold || 0;
                        const isPassed = score >= threshold;

                        return (
                          <div key={subIdx}>
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">{substage.name}</h3>
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {isPassed ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Clock className="w-3.5 h-3.5 text-red-600" />}
                                <span className={`text-[10px] font-bold ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                                  {score} / {threshold} pts
                                </span>
                              </div>
                            </div>

                            {(!substage.activities || substage.activities.length === 0) ? (
                              <div className="text-xs text-slate-500 italic">No activities allocated under this section.</div>
                            ) : (
                              <div className="space-y-2">
                                {substage.activities.map((act: any, actIdx: number) => {
                                  const isDone = isActivityDone(act);

                                  return (
                                    <div 
                                      key={actIdx} 
                                      className={`flex items-start gap-3 p-3 rounded-xl border ${isDone ? 'bg-green-50/30 border-green-200/50' : 'bg-slate-50 border-slate-200/60'}`}
                                    >
                                      {isSimulationActive ? (
                                        <div className="pt-1">
                                          <input 
                                            type="checkbox" 
                                            checked={isDone}
                                            onChange={(e) => toggleActivity(stageIdx, subIdx, actIdx, e.target.checked)}
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                          />
                                        </div>
                                      ) : (
                                        <div className={`p-1 rounded-full mt-1 shrink-0 ${isDone ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                          {isDone ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                      )}
                                      
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <div className={`font-bold text-sm ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                          {act.name}
                                        </div>
                                        <div className={`text-xs mt-1 leading-relaxed ${isDone ? 'text-slate-400' : 'text-slate-600'}`}>
                                          {act.description}
                                        </div>
                                      </div>
                                      
                                      <div className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${isDone ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-700'}`}>
                                        {act.points} pts
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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
      </div>
    </div>
  );
}
