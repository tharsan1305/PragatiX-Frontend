import { useState, useEffect } from 'react';
import { LogOut, Shield, KeyRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

export default function AdminProfileTab() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "System Administrator",
    email: "admin@spdms.com",
    role: "ADMIN"
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/api/v1/auth/me');
        if (response.data.success) {
          const d = response.data.data;
          setProfileData({
            name: d.fullName || d.username || "System Administrator",
            email: d.email || "admin@spdms.com",
            role: d.role || "ADMIN"
          });
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    toast.success("Signed out successfully");
    navigate('/login');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }

    setIsChangingPass(true);
    const toastId = toast.loading("Updating password...");
    try {
      await apiClient.post('/api/v1/auth/change-password', { newPassword: newPassword.trim() });
      toast.dismiss(toastId);
      toast.success("Password updated successfully!");
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to update password");
    } finally {
      setIsChangingPass(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9]">
      <div className="bg-slate-900 text-white px-4 py-4 shadow-sm z-10 flex items-center">
        <h1 className="text-xl font-bold">Admin Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center pt-10 pb-6 px-6">
        <div className="w-[120px] h-[120px] rounded-full bg-[#EA4335]/10 shadow-md flex items-center justify-center mb-5">
          <Shield className="w-16 h-16 text-[#EA4335] fill-current" />
        </div>

        <h2 className="text-[22px] font-bold text-[#1E293B]">{profileData.name}</h2>
        <p className="text-[15px] text-gray-500 mt-1 mb-8">{profileData.email}</p>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-gray-500">Role</span>
              <span className="text-[15px] font-bold text-[#1E293B]">
                {profileData.role.replace("ROLE_", "")}
              </span>
            </div>
            <div className="h-px bg-slate-100" />
            
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-gray-500">Access Level</span>
              <span className="text-[15px] font-bold text-[#1E293B]">Full System Access</span>
            </div>
            <div className="h-px bg-slate-100" />
            
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-gray-500">System</span>
              <span className="text-[15px] font-bold text-[#1E293B]">PragatiX (SPDMS)</span>
            </div>
          </div>
        </div>

        <div className="mt-8 w-full max-w-md space-y-3 pb-6">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full py-3.5 px-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
          >
            <KeyRound className="w-5 h-5" /> Change Password
          </button>

          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full py-3.5 px-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors border border-rose-100"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Change Admin Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 font-semibold hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={isChangingPass} className="px-5 py-2 text-sm bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                  {isChangingPass ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
