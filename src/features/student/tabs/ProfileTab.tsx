import { useState, useEffect } from 'react';
import { User as UserIcon, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

export default function ProfileTab() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [profile, setProfile] = useState({
    studentName: "Sharugesh",
    studentId: "24CS036",
    email: "sharugesh@college.edu",
    department: "Computer Science",
    section: "A",
    year: "III",
    sprNo: "SPR-2024-089",
    semester: "VI Semester",
    phone: "+91 98765 43210"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (token === "debug_token") {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await apiClient.get('/api/v1/auth/me');
        if (response.data.success) {
          const resData = response.data.data;
          setProfile({
            studentName: resData.fullName || profile.studentName,
            studentId: resData.username || profile.studentId,
            email: resData.email || profile.email,
            section: resData.section || profile.section,
            year: resData.year || profile.year,
            sprNo: resData.sprNo || profile.sprNo,
            semester: resData.semester || profile.semester,
            phone: resData.phone || profile.phone,
            department: resData.department || profile.department,
          });
        }
      } catch {
        // keep mock values
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success("Signed out successfully");
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const ProfileRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2.5">
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
      <div className="text-[13px] font-bold text-slate-800 text-right">{value}</div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">My Profile</h1>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center mt-4 mb-6">
          <div className="w-28 h-28 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 shadow-sm">
            <UserIcon className="w-14 h-14 text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 text-center">{profile.studentName}</h2>
          <div className="text-sm font-medium text-slate-500 mt-1">Register ID: {profile.studentId}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <ProfileRow label="Role" value="STUDENT" />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="Full Name" value={profile.studentName} />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="Register No." value={profile.studentId} />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="SPR No." value={profile.sprNo} />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="Academic Year" value={`${profile.year} Year - Sec ${profile.section}`} />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="Semester" value={profile.semester} />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="Department" value={profile.department} />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="Email Address" value={profile.email} />
          <div className="h-px bg-slate-100 my-1" />
          <ProfileRow label="Phone No." value={profile.phone} />
        </div>

        <button 
          onClick={() => setShowLogoutModal(true)}
          className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

      <LogoutModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
