import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, RefreshCw, UserPlus, X, Star, User, Users, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface Props {
  stageId: number;
  stageName: string;
  stageDescription?: string;
  teachersList?: any[];
  onBack: () => void;
  onPushView?: (name: string, props?: any) => void;
}

export default function StageDetailsPage({ 
  stageId, 
  stageName, 
  stageDescription = '', 
  teachersList = [],
  onBack,
  onPushView = () => {} 
}: Props) {
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [stageDetails, setStageDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubgroup, setEditingSubgroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'individual',
    threshold: '150'
  });

  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [selectedSubgroupForFaculty, setSelectedSubgroupForFaculty] = useState<any>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; subId: number | null; subName: string }>({
    open: false,
    subId: null,
    subName: ''
  });

  const openModal = (sub: any = null) => {
    setEditingSubgroup(sub);
    if (sub) {
      setFormData({
        name: sub.name || '',
        category: (sub.category || 'individual').toLowerCase(),
        threshold: sub.threshold?.toString() || '0'
      });
    } else {
      setFormData({
        name: '',
        category: 'individual',
        threshold: '150'
      });
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchSubgroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  const fetchSubgroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/v1/admin/stages');
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const stages = response.data.data;
        const currentStage = stages.find((s: any) => s.id === stageId);
        if (currentStage) {
          setStageDetails(currentStage);
          
          const mustTh = currentStage.mustThreshold ?? 150;
          const indTh = currentStage.individualThreshold ?? 150;
          const grpTh = currentStage.groupThreshold ?? 150;

          const existingSubs = currentStage.subgroups as any[] || [];
          if (existingSubs.length > 0) {
            const seenNames = new Set<string>();
            const parsedSubs: any[] = [];
            for (const s of existingSubs) {
              const name = s.name || s.subgroupName || '';
              if (name && !seenNames.has(name.toLowerCase())) {
                seenNames.add(name.toLowerCase());
                parsedSubs.push({
                  id: s.id,
                  name: name,
                  threshold: s.threshold || 0,
                  category: s.category || name.toLowerCase()
                });
              }
            }
            setSubgroups(parsedSubs.length > 0 ? parsedSubs : [
              { id: 1, name: 'Must', threshold: mustTh, category: 'must' },
              { id: 2, name: 'Individual', threshold: indTh, category: 'individual' },
              { id: 3, name: 'Group', threshold: grpTh, category: 'group' }
            ]);
          } else {
            setSubgroups([
              { id: 1, name: 'Must', threshold: mustTh, category: 'must' },
              { id: 2, name: 'Individual', threshold: indTh, category: 'individual' },
              { id: 3, name: 'Group', threshold: grpTh, category: 'group' }
            ]);
          }
        } else {
          setError(`Stage with ID ${stageId} not found.`);
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch stage details:', e);
      setSubgroups([
        { id: 1, name: 'Must', threshold: 150, category: 'must' },
        { id: 2, name: 'Individual', threshold: 150, category: 'individual' },
        { id: 3, name: 'Group', threshold: 150, category: 'group' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subgroup Name is required');
      return;
    }

    const toastId = toast.loading("Saving subgroup...");
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        threshold: parseInt(formData.threshold) || 0
      };

      if (editingSubgroup && editingSubgroup.id > 10) {
        await apiClient.put(`/api/v1/admin/stages/${stageId}/subgroups/${editingSubgroup.id}`, payload);
      } else {
        await apiClient.post(`/api/v1/admin/stages/${stageId}/subgroups`, payload);
      }
      
      toast.dismiss(toastId);
      toast.success("Subgroup saved successfully!");
      setIsModalOpen(false);
      fetchSubgroups();
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to save subgroup');
    }
  };

  const triggerDelete = (sub: any) => {
    setDeleteConfirmModal({
      open: true,
      subId: sub.id,
      subName: sub.name || 'this subgroup'
    });
  };

  const confirmDeleteSubgroup = async () => {
    const { subId } = deleteConfirmModal;
    if (!subId) return;

    setDeleteConfirmModal({ open: false, subId: null, subName: '' });
    const toastId = toast.loading("Deleting subgroup...");
    try {
      if (subId > 10) {
        await apiClient.delete(`/api/v1/admin/stages/${stageId}/subgroups/${subId}`);
      }
      toast.dismiss(toastId);
      toast.success("Subgroup deleted successfully!");
      fetchSubgroups();
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete subgroup');
    }
  };

  const openFacultyModal = (sub: any) => {
    setSelectedSubgroupForFaculty(sub);
    setSelectedFacultyId('');
    setIsFacultyModalOpen(true);
  };

  const handleAssignFaculty = async () => {
    if (!selectedFacultyId || !selectedSubgroupForFaculty) return;
    const toastId = toast.loading("Assigning faculty...");
    try {
      if (selectedSubgroupForFaculty.id > 10) {
        await apiClient.put(`/api/v1/admin/stages/${stageId}/subgroups/${selectedSubgroupForFaculty.id}/assign?facultyId=${selectedFacultyId}`);
      }
      toast.dismiss(toastId);
      toast.success("Faculty assigned successfully!");
      setIsFacultyModalOpen(false);
      fetchSubgroups();
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to assign faculty');
    }
  };

  const displayName = stageDetails?.name || stageName;
  const displayDesc = stageDetails?.description || stageDescription;
  const mustXP = stageDetails?.mustThreshold ?? 150;
  const individualXP = stageDetails?.individualThreshold ?? 150;
  const groupXP = stageDetails?.groupThreshold ?? 150;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Top Bar */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
        </div>
        <button onClick={fetchSubgroups} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Stage Overview & Threshold Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
            <p className="text-sm text-slate-500 mt-1">{displayDesc || 'Stage configuration & thresholds'}</p>
          </div>

          <div className="h-px bg-slate-100" />

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Stage Progression Thresholds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center space-x-3">
                <div className="p-2 bg-rose-500 text-white rounded-xl">
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-600">Must</p>
                  <p className="text-lg font-bold text-slate-900">{mustXP} XP</p>
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center space-x-3">
                <div className="p-2 bg-blue-500 text-white rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600">Individual</p>
                  <p className="text-lg font-bold text-slate-900">{individualXP} XP</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center space-x-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600">Group</p>
                <p className="text-lg font-bold text-slate-900">{groupXP} XP</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Activity Categories / Subgroups Roster */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Activity Categories</h3>
            <button 
              onClick={() => openModal()}
              className="flex items-center space-x-1.5 bg-[#EA4335] hover:bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subgroup</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {subgroups.map((sub, idx) => {
                const subName = sub.name || `Subgroup ${idx + 1}`;
                const catLower = (sub.category || subName || '').toLowerCase();
                const IconComponent = catLower.includes('must') ? Star : (catLower.includes('group') ? Users : User);
                
                return (
                  <div 
                    key={sub.id || idx}
                    onClick={() => onPushView('activity_list', { 
                      subgroup: sub, 
                      subgroupId: sub.id, 
                      stageId: stageId, 
                      subgroupName: subName 
                    })}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">{subName}</h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openFacultyModal(sub); }}
                        className="hidden sm:flex px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors items-center"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1 text-slate-500" /> 
                        {sub.faculty ? 'Faculty' : 'Assign'}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal(sub); }}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); triggerDelete(sub); }}
                        className="p-2 text-rose-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Subgroup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingSubgroup ? 'Edit Subgroup' : 'Add New Subgroup'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Subgroup Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Must, Individual, Group"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Category Type *</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                >
                  <option value="must">Must-Do Activity (must)</option>
                  <option value="individual">Individual Activity (individual)</option>
                  <option value="group">Group Activity (group)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Threshold (XP) *</label>
                <input 
                  required 
                  type="number" 
                  value={formData.threshold} 
                  onChange={e => setFormData({...formData, threshold: e.target.value})} 
                  placeholder="e.g. 150"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md">
                  {editingSubgroup ? 'Update' : 'Save Subgroup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {isFacultyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Assign Faculty</h2>
              <button onClick={() => setIsFacultyModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">Assign a faculty member to manage <strong>{selectedSubgroupForFaculty?.name}</strong>.</p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Faculty *</label>
                <select value={selectedFacultyId} onChange={e => setSelectedFacultyId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                  <option value="">-- Select Teacher --</option>
                  {teachersList.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName || t.username}</option>
                  ))}
                </select>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsFacultyModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button onClick={handleAssignFaculty} disabled={!selectedFacultyId} className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md disabled:opacity-50">
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal.open}
        title="Delete Subgroup"
        description={`Are you sure you want to delete "${deleteConfirmModal.subName}" and all associated tasks? This action cannot be undone.`}
        confirmText="Delete Subgroup"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDeleteSubgroup}
        onCancel={() => setDeleteConfirmModal({ open: false, subId: null, subName: '' })}
      />
    </div>
  );
}
