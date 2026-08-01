import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityService } from '../api/activityService';
import type { ActivityModel } from '../types/ActivityTypes';
import ActivityForm from '../components/ActivityForm';

interface EditActivityPageProps {
  onBack: () => void;
  activity: ActivityModel;
}

export default function EditActivityPage({ onBack, activity }: EditActivityPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Updating event...");
    try {
      await activityService.updateActivity(activity.id, data);
      toast.dismiss(toastId);
      toast.success("Event updated successfully!");
      onBack();
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Flutter Parity Top Bar */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Edit Event</h1>
        </div>
        <button 
          type="submit" 
          form="activity-form"
          disabled={isSubmitting} 
          className="text-white font-bold text-sm px-4 py-2 bg-[#EA4335] hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 p-6">
        <ActivityForm 
          initialData={activity} 
          onSubmit={handleSubmit} 
          onCancel={onBack}
          isSubmitting={isSubmitting} 
        />
      </div>
    </div>
  );
}
