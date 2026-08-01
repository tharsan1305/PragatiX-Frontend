import { useState, useEffect } from 'react';
import { AlertTriangle, Check, RefreshCw, Clock, ArrowLeft, CheckCircle2, XCircle, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  onBack?: () => void;
}

export default function CCInboxTab({ onBack }: Props) {
  const [inbox, setInbox] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    fetchCcInbox();
  }, []);

  const fetchCcInbox = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/penalties/cc-inbox');
      } catch (e) {
        response = await apiClient.get('/api/v1/penalties/cc-inbox');
      }

      if (response.data?.success) {
        const raw = response.data.data;
        setInbox(Array.isArray(raw) ? raw : (raw?.content || []));
      }
    } catch (e) {
      console.error("Failed to fetch CC inbox:", e);
      toast.error("Failed to fetch CC inbox");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const toastId = toast.loading("Approving penalty request...");
    try {
      let response;
      try {
        response = await apiClient.put(`/api/penalties/${id}/approve`);
      } catch (e) {
        response = await apiClient.put(`/api/v1/penalties/${id}/approve`);
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success("Penalty approved successfully");
        fetchCcInbox();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Failed to approve penalty:", e);
      toast.error(e.response?.data?.message || 'Failed to approve penalty');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    const toastId = toast.loading("Rejecting penalty request...");
    try {
      let response;
      try {
        response = await apiClient.put(`/api/penalties/${rejectingItem.id}/reject`, {
          reason: rejectReason
        });
      } catch (e) {
        response = await apiClient.put(`/api/v1/penalties/${rejectingItem.id}/reject`, {
          reason: rejectReason
        });
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success("Penalty rejected");
        setRejectingItem(null);
        setRejectReason('');
        fetchCcInbox();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Failed to reject penalty:", e);
      toast.error(e.response?.data?.message || 'Failed to reject penalty');
    }
  };

  const formatDate = (dStr: any) => {
    if (!dStr) return 'N/A';
    try {
      return new Date(dStr).toLocaleString();
    } catch {
      return String(dStr);
    }
  };

  const pendingList = inbox.filter(r => (r.status || 'PENDING').toUpperCase() === 'PENDING');
  const approvedList = inbox.filter(r => ['APPROVED', 'AUTO_APPROVED'].includes((r.status || '').toUpperCase()));
  const rejectedList = inbox.filter(r => (r.status || '').toUpperCase() === 'REJECTED');

  const currentList = activeTab === 'PENDING' ? pendingList : activeTab === 'APPROVED' ? approvedList : rejectedList;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Header Bar */}
      <div className="bg-[#1E293B] px-6 pt-10 pb-5 shadow-md text-white">
        <div className="flex items-center space-x-4 mb-4">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">CC Disciplinary Inbox</h1>
            <p className="text-xs text-slate-400 mt-0.5">Review student penalty requests, point deductions, and status decisions</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Pending ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'APPROVED' ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Approved ({approvedList.length})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'REJECTED' ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Rejected ({rejectedList.length})
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No {activeTab.toLowerCase()} penalty requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map(req => {
              const studentName = req.studentName || req.student?.fullName || req.fullName || 'Student';
              const regNo = req.registerNumber || req.regNo || req.student?.registerNumber || 'N/A';
              const penaltyXP = req.penaltyXP ?? req.pointsDeducted ?? req.points ?? 0;
              const activity = req.penaltyActivity || req.activityName || 'Custom Penalty';
              const reason = req.reason || req.description || 'No reason provided';
              const status = (req.status || 'PENDING').toUpperCase();
              const submittedBy = req.submittedBy || 'Teacher';
              const submittedTime = req.submittedTime || req.createdAt;
              const approvedBy = req.approvedBy || req.reviewedBy;
              const approvalTime = req.approvalTime || req.reviewedAt;
              const rejectedReason = req.rejectedReason || req.rejectionReason;

              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0 border border-rose-200/60 font-bold text-base">
                        -{penaltyXP} XP
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 text-base">{studentName}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          REG: {regNo} {req.department ? `• ${req.department}` : ''} {req.year ? `• Year ${req.year}` : ''} {req.section ? `• Sec ${req.section}` : ''}
                        </p>
                        <p className="text-xs font-semibold text-rose-700">Activity: {activity}</p>
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">Reason: {reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                        status === 'APPROVED' || status === 'AUTO_APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                        <span>{status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center gap-4">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5" />
                      <span>By: {submittedBy}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Requested: {formatDate(submittedTime)}</span>
                    </span>
                    {approvedBy && (
                      <span className="text-emerald-600 font-medium">
                        {status === 'REJECTED' ? 'Rejected' : 'Approved'} by {approvedBy} on {formatDate(approvalTime)}
                      </span>
                    )}
                  </div>

                  {rejectedReason && status === 'REJECTED' && (
                    <p className="mt-2 text-xs text-rose-600 italic">Rejection Reason: {rejectedReason}</p>
                  )}

                  {activeTab === 'PENDING' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end space-x-3">
                      <button
                        onClick={() => setRejectingItem(req)}
                        className="px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-semibold text-xs transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Penalty</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reject Penalty Request</h3>
            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting penalty request for <span className="font-semibold text-slate-700">{rejectingItem.studentName}</span>.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
