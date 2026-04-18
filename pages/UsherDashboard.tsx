
import React, { useEffect } from 'react';
import { WorkerPermission, IdentityRole } from '../types.ts';
import { PlusCircle, UserPlus, AlertTriangle, ListChecks, ArrowRight, Bell, UserX, Megaphone, ShieldCheck, Activity, RefreshCw, Globe, Users, Heart } from 'lucide-react';

interface Props {
  store: any;
  navigate: (page: string) => void;
}

const UsherDashboard: React.FC<Props> = ({ store, navigate }) => {
  const { currentUser, attendance, firstTimers, settings, refresh } = store;
  const ui = settings.uiText;

  useEffect(() => {
    // Sync data on dashboard entry
    refresh();
  }, [refresh]);

  const actions = [
    { id: 'record_attendance', label: 'Attendance', icon: PlusCircle, color: 'bg-indigo-600', text: 'Log counts for current service' },
    { id: 'first_timers', label: 'First Timer', icon: UserPlus, color: 'bg-amber-500', text: 'Register new visitors' },
    { id: 'my-members', label: 'My Members', icon: Users, color: 'bg-indigo-500', text: 'View and export member list' },
    { id: 'absentees', label: 'Log Absentee', icon: UserX, color: 'bg-rose-500', text: 'Report a missing member' },
    { id: 'prayer', label: 'Prayer Request', icon: Heart, color: 'bg-rose-600', text: 'Submit a spiritual need' },
    { id: 'announcements', label: 'Communication', icon: Megaphone, color: 'bg-emerald-600', text: 'Post needs or announcements' },
    { id: 'complaints', label: 'Report Issue', icon: AlertTriangle, color: 'bg-gray-700', text: 'Facility or security needs' },
    ...(currentUser.workerPermissions.includes(WorkerPermission.SUPER_ADMIN) ? [
      { id: 'landing_editor', label: 'Landing Page CMS', icon: Globe, color: 'bg-indigo-900', text: 'Manage public website content' }
    ] : [])
  ];

  const usherSubmissions = (attendance.filter((a: any) => a.recordedBy === currentUser.fullName).length) + 
                          (firstTimers.filter((f: any) => f.recordedBy === currentUser.fullName).length);

  return (
    <div className="space-y-6 lg:space-y-16 max-w-full mx-auto animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="bg-indigo-700 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-16 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-indigo-200">
               <ShieldCheck size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Authorized Access Active</span>
            </div>
            <p className="text-indigo-100 text-sm font-medium mt-4">{ui.usher_dash_welcome}</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-poppins mt-1 break-words">{currentUser.fullName}</h2>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/10 shadow-lg flex-1 min-w-[100px] sm:min-w-[120px]">
              <p className="text-indigo-100 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5 sm:mb-1">My Activity</p>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                 <p className="text-xl sm:text-3xl font-black">{usherSubmissions}</p>
                 <Activity size={12} className="text-emerald-400 sm:size-14" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/10 shadow-lg flex-1 min-w-[100px] sm:min-w-[120px]">
              <p className="text-indigo-100 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5 sm:mb-1">Latest Attend.</p>
              <p className="text-xl sm:text-3xl font-black">{attendance[0]?.totalCount || 0}</p>
            </div>
          </div>
        </div>
        {/* Decor elements */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-gray-800">{ui.usher_dash_cta}</h3>
        <button onClick={refresh} className="p-2 text-gray-400 hover:text-indigo-600 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
           <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.id)}
            className="group flex items-center gap-5 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 active:scale-95 transition-all text-left hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}>
              <action.icon size={26} />
            </div>
            <div className="flex-1">
              <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{action.label}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1 leading-tight">{action.text}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
               <ArrowRight size={18} />
            </div>
          </button>
        ))}
      </div>

      {/* System Announcements */}
      <div className="bg-amber-50 border border-amber-100 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 text-amber-800 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
             <Bell size={18} />
          </div>
          <h4 className="font-bold text-sm uppercase tracking-widest">Administrative Brief</h4>
        </div>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Sync Reminder</p>
            <p className="text-sm text-gray-700 mt-1 font-medium leading-relaxed">Ensure all first-timer forms include Residential Area for accurate pastoral follow-up mapping.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsherDashboard;
