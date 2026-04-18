
import React, { useState, useMemo } from 'react';
import { IdentityRole, WorkerPermission, User } from '../types.ts';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Shield, 
  Activity, 
  Mail, 
  Phone, 
  X, 
  Clock, 
  Calendar, 
  ClipboardCheck,
  History,
  Trash2,
  Edit,
  UserCheck,
  UserMinus,
  KeyRound,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Loader2,
  Layout,
  Briefcase,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

interface Props {
  store: any;
  navigate?: (page: string) => void;
}

const UshersPage: React.FC<Props> = ({ store, navigate }) => {
  const { 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    resetUserPassword, 
    attendance, 
    firstTimers,
    absentees,
    announcements
  } = store;

  const [showModal, setShowModal] = useState(false);
  const [editingUsher, setEditingUsher] = useState<User | null>(null);
  const [selectedUsher, setSelectedUsher] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [resetModalData, setResetModalData] = useState<{ user: User, tempPass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    identityRole: IdentityRole.MEMBER,
    workerPermissions: [] as WorkerPermission[],
    status: 'active' as 'active' | 'inactive',
    sermonAccessSuspended: false,
  });

  const handleOpenAdd = () => {
    setEditingUsher(null);
    setFormData({ 
      fullName: '', 
      username: '', 
      email: '', 
      phone: '', 
      password: '',
      identityRole: IdentityRole.MEMBER, 
      workerPermissions: [],
      status: 'active',
      sermonAccessSuspended: false
    });
    setShowModal(true);
  };

  const handleOpenEdit = (usher: User) => {
    setEditingUsher(usher);
    setFormData({
      fullName: usher.fullName,
      username: usher.username,
      email: usher.email,
      phone: usher.phone || '',
      password: '', // Don't show password on edit
      identityRole: usher.identityRole,
      workerPermissions: usher.workerPermissions || [],
      status: usher.status,
      sermonAccessSuspended: !!usher.sermonAccessSuspended,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUsher) {
        await updateUser(editingUsher.id, formData);
      } else {
        await addUser(formData, formData.password);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to provision account. Email might already be in use.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('WARNING: Are you sure you want to permanently delete this account? All associated portal credentials will be revoked immediately.')) {
      await deleteUser(id);
    }
  };

  const handleResetPassword = (usher: User) => {
    if (window.confirm(`Security Protocol: Send a password reset email to ${usher.fullName}?`)) {
      const status = resetUserPassword(usher.id);
      alert(status);
    }
  };

  const handleCopyPass = () => {
    if (resetModalData) {
      navigator.clipboard.writeText(resetModalData.tempPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleStatus = async (usher: User) => {
    await updateUser(usher.id, { status: usher.status === 'active' ? 'inactive' : 'active' });
  };

  const toggleSermonAccess = async (usher: User) => {
    await updateUser(usher.id, { sermonAccessSuspended: !usher.sermonAccessSuspended });
  };

  const filteredUshers = useMemo(() => {
    return users.filter((u: User) => {
      // Allow viewing both admins and ushers in the management screen if needed, 
      // but usually this is for staff (ushers)
      const matchesSearch = (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const getUsherActivity = (usher: User) => {
    const usherAttendance = attendance.filter((a: any) => a.recordedBy === usher.fullName);
    const usherVisitors = firstTimers.filter((f: any) => f.recordedBy === usher.fullName);
    const usherAbsentees = absentees.filter((ab: any) => ab.recordedBy === usher.fullName);
    const usherAnnouncements = announcements.filter((an: any) => an.submittedBy === usher.fullName);

    const logs = [
      ...usherAttendance.map((item: any) => ({ ...item, activityType: 'attendance' })),
      ...usherVisitors.map((item: any) => ({ ...item, activityType: 'first-timer' })),
      ...usherAbsentees.map((item: any) => ({ ...item, activityType: 'absentee' })),
      ...usherAnnouncements.map((item: any) => ({ ...item, activityType: 'announcement' }))
    ].sort((a: any, b: any) => {
      const dateA = a.createdAt || a.date;
      const dateB = b.createdAt || b.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return {
      logs,
      stats: {
        attendance: usherAttendance.length,
        visitors: usherVisitors.length,
        total: logs.length
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {navigate && (
            <button 
              onClick={() => navigate('dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              title="Back to Dashboard"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">Ministry Staff Registry</h2>
            <p className="text-gray-500">Manage volunteer ushers and provision portal access</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          Provision New Staff
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-3 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search staff by name, handle or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent font-medium"
          />
        </div>
        <div className="bg-white p-1 rounded-3xl shadow-sm border border-gray-100 flex shrink-0">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUshers.length > 0 ? (
          filteredUshers.map((usher: User) => (
            <div key={usher.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden ${usher.status === 'inactive' ? 'bg-gray-50/50' : ''}`}>
               <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${usher.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                        {usher.fullName.charAt(0)}
                     </div>
                     <div>
                        <h4 className={`font-bold transition-colors ${usher.status === 'active' ? 'text-gray-900 group-hover:text-indigo-600' : 'text-gray-400'}`}>
                          {usher.fullName}
                        </h4>
                        <p className="text-xs text-gray-400 font-mono">@{usher.username}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {usher.workerPermissions?.map(p => (
                            <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                              {p}
                            </span>
                          ))}
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                    <button onClick={() => handleResetPassword(usher)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl" title="Reset Credentials"><KeyRound size={18} /></button>
                    <button onClick={() => handleOpenEdit(usher)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Edit Profile"><Edit size={18} /></button>
                    <button onClick={() => toggleSermonAccess(usher)} className={`p-2 rounded-xl ${usher.sermonAccessSuspended ? 'text-rose-500 hover:bg-rose-50' : 'text-indigo-500 hover:bg-indigo-50'}`} title={usher.sermonAccessSuspended ? 'Restore Sermon Access' : 'Suspend Sermon Access'}>
                      <Shield size={18} className={usher.sermonAccessSuspended ? 'fill-current' : ''} />
                    </button>
                    <button onClick={() => toggleStatus(usher)} className={`p-2 rounded-xl ${usher.status === 'active' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`} title={usher.status === 'active' ? 'Suspend' : 'Activate'}>
                      {usher.status === 'active' ? <UserMinus size={18} /> : <UserCheck size={18} />}
                    </button>
                    <button onClick={() => handleDelete(usher.id)} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl" title="Delete Account"><Trash2 size={18} /></button>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                     <Mail size={14} className="text-indigo-600" />
                     {usher.email}
                  </div>
                  <div className="flex items-center justify-between pt-4">
                     <div className="flex items-center gap-1.5">
                       <div className={`w-2.5 h-2.5 rounded-full ${usher.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                       <p className={`text-[10px] font-black uppercase tracking-widest ${usher.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                         {usher.status}
                       </p>
                     </div>
                     <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{usher.identityRole}</span>
                  </div>
               </div>
               <button 
                  onClick={() => setSelectedUsher(usher)}
                  className="w-full mt-6 py-4 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
               >
                  Detailed Activity Log
               </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-40 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
             <ShieldCheck size={48} className="text-gray-200 mb-6" />
             <h3 className="text-xl font-bold text-gray-900">No matching staff accounts</h3>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="bg-indigo-900 p-10 text-white flex items-center gap-8 shrink-0">
                 <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shadow-xl">
                    {editingUsher ? <Edit size={32} /> : <ShieldCheck size={32} />}
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold font-poppins">{editingUsher ? 'Modify Profile' : 'Staff Provisioning'}</h3>
                    <p className="text-indigo-300 text-sm mt-1">{editingUsher ? 'Update authorization details' : 'Grant portal access permissions'}</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="ml-auto p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                      <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Handle</label>
                      <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" placeholder="j_doe" disabled={!!editingUsher} required />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="staff@ministry.org" required />
                 </div>
                 {!editingUsher && (
                   <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="••••••••" required={!editingUsher} />
                   </div>
                 )}
                 <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity Role</label>
                      <select value={formData.identityRole} onChange={e => setFormData({...formData, identityRole: e.target.value as IdentityRole})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                        {Object.values(IdentityRole).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                        <option value="active">Active</option>
                        <option value="inactive">Suspended</option>
                      </select>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={formData.sermonAccessSuspended} 
                          onChange={e => setFormData({...formData, sermonAccessSuspended: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${formData.sermonAccessSuspended ? 'bg-rose-500' : 'bg-gray-200'}`} />
                        <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.sermonAccessSuspended ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">Suspend Sermon Access</span>
                    </label>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Worker Permissions (Functional Overlays)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(WorkerPermission).map(permission => (
                        <button
                          key={permission}
                          type="button"
                          onClick={() => {
                            const newPermissions = formData.workerPermissions.includes(permission)
                              ? formData.workerPermissions.filter(p => p !== permission)
                              : [...formData.workerPermissions, permission];
                            setFormData({ ...formData, workerPermissions: newPermissions });
                          }}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${
                            formData.workerPermissions.includes(permission)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                              : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-indigo-200'
                          }`}
                        >
                          {permission}
                          {formData.workerPermissions.includes(permission) && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-sm font-bold text-gray-500">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-4 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 flex items-center justify-center gap-2">
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingUsher ? 'Update Profile' : 'Authorize Account')}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
      
      {resetModalData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setResetModalData(null)} />
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500 p-8 text-white flex items-center gap-5">
              <KeyRound size={32} />
              <div><h3 className="text-xl font-bold font-poppins">Temporary Key</h3><p className="text-amber-100 text-xs">For {resetModalData.user.fullName}</p></div>
              <button onClick={() => setResetModalData(null)} className="ml-auto p-2"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-amber-200 text-center relative group">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">One-Time Access Code</p>
                <div className="text-4xl font-mono font-black text-gray-900 tracking-widest select-all">{resetModalData.tempPass}</div>
              </div>
              <button onClick={handleCopyPass} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />} {copied ? 'Copied' : 'Copy Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UshersPage;
