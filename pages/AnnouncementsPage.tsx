
import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Clock, Filter, AlertCircle, CheckCircle2, Search, Trash2, X, ChevronRight, Package, Wrench, Info, List, Globe, Calendar, Send, Save, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Announcement, Broadcast, WorkerPermission } from '../types.ts';

interface Props {
  store: any;
  isUsherView?: boolean;
  navigate?: (page: string) => void;
  defaultView?: 'announcements' | 'broadcasts';
}

const AnnouncementsPage: React.FC<Props> = ({ store, isUsherView, navigate, defaultView = 'announcements' }) => {
  if (!store) return <div className="p-10 text-center text-slate-400 font-bold">Loading...</div>;
  const { announcements = [], broadcasts = [], addAnnouncement, updateAnnouncementStatus, deleteAnnouncement, addBroadcast, updateBroadcast, deleteBroadcast, currentUser, refresh } = store;
  
  const [activeView, setActiveView] = useState<'announcements' | 'broadcasts'>(defaultView);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  /* Site Broadcast State */
  const [isAddingBroadcast, setIsAddingBroadcast] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState<Partial<Broadcast>>({
    message: '',
    type: 'info',
    active: true,
    isClosable: true,
    pushEnabled: false
  });

  const canManageBroadcasts = currentUser?.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN) || 
                              currentUser?.workerPermissions?.includes(WorkerPermission.ADMIN);

  const [formData, setFormData] = useState({
    type: 'Announcement' as any,
    title: '',
    description: '',
    category: 'General',
    urgency: 'Routine' as any,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addAnnouncement({ ...formData, submittedBy: currentUser?.fullName || 'Staff' });
    
    if (success) {
      setShowAdd(false);
      if (refresh) await refresh();
      setFormData({ type: 'Announcement', title: '', description: '', category: 'General', urgency: 'Routine' });
      showToast('Request submitted for administrator review.');
    } else {
      showToast('Error submitting request. Please check permissions.', true);
    }
  };

  const handleSaveBroadcast = async () => {
    if (!newBroadcast.message?.trim()) {
      showToast('Broadcast message cannot be empty', true);
      return;
    }
    try {
      await addBroadcast(newBroadcast);
      setIsAddingBroadcast(false);
      setNewBroadcast({ message: '', type: 'info', active: true, isClosable: true, pushEnabled: false });
      showToast('Site broadcast published successfully!');
    } catch (e) {
      showToast('Failed to publish broadcast', true);
    }
  };

  const showToast = (msg: string, isError = false) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 ${isError ? 'bg-rose-600' : 'bg-indigo-600'} text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const filteredAnnouncements = useMemo(() => {
    return (announcements || []).filter((ann: Announcement) => {
      const matchesSearch = (ann.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (ann.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : ann.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [announcements, searchQuery, statusFilter]);

  const getUrgencyStyles = (u: string) => {
    switch (u) {
      case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Urgent': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Needed Soon': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusStyles = (s: string) => {
    switch (s) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-rose-100 text-rose-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getBroadcastStatus = (b: Broadcast) => {
    const now = new Date();
    const start = b.startDate ? new Date(b.startDate) : null;
    const end = b.endDate ? new Date(b.endDate) : null;
    if (!b.active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500' };
    if (start && now < start) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-600' };
    if (end && now > end) return { label: 'Expired', color: 'bg-orange-100 text-orange-600' };
    return { label: 'Live Now', color: 'bg-emerald-100 text-emerald-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {navigate && (
            <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title="Back to Dashboard">
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">Communications Hub</h2>
            <p className="text-gray-500">Coordinate announcements and resource requests</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
           <button 
             onClick={() => setActiveView('announcements')} 
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === 'announcements' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
           >
             <Megaphone size={14} /> Requests
           </button>
           {canManageBroadcasts && (
             <button 
               onClick={() => setActiveView('broadcasts')} 
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === 'broadcasts' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
             >
               <Globe size={14} /> Site Broadcasts
             </button>
           )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'announcements' ? (
          <motion.div key="ann" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1 w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <Search className="text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search communications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-sm bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                  {['All', 'Submitted', 'Approved', 'In Progress', 'Completed'].map(status => (
                    <button 
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowAdd(!showAdd)} 
                  className={`p-4 rounded-2xl transition-all shadow-lg ${showAdd ? 'bg-rose-500 text-white shadow-rose-100' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
                >
                  {showAdd ? <X size={20} /> : <Plus size={20} />}
                </button>
              </div>
            </div>

            {showAdd ? (
              <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-indigo-900 p-8 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-poppins">Post Announcement / Request</h3>
                    <p className="text-indigo-200 text-sm mt-1">Submission will be reviewed by administrators</p>
                  </div>
                  <Megaphone size={48} className="opacity-20" />
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type of Entry</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                          <option value="Announcement">Public Announcement</option>
                          <option value="Equipment">Equipment Request</option>
                          <option value="Supply">Supply Purchase</option>
                          <option value="Maintenance">Maintenance Need</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Urgency Level</label>
                        <select value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                          <option value="Routine">Routine (Next 30 Days)</option>
                          <option value="Needed Soon">Needed Soon (Next 7 Days)</option>
                          <option value="Urgent">Urgent (Current Service)</option>
                          <option value="Critical">Critical (Immediate Action)</option>
                        </select>
                     </div>
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Heading / Subject</label>
                      <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Summarize the announcement" required />
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Detailed Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none font-medium text-sm" placeholder="Provide full context or specific items needed..." required />
                   </div>
                   <div className="pt-4 flex gap-4">
                      <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors">Cancel</button>
                      <button type="submit" className="flex-1 py-4 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Submit Update</button>
                   </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((ann: Announcement) => (
                    <div key={ann.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
                       <div className={`w-16 h-16 rounded-[1.5rem] shrink-0 flex items-center justify-center shadow-sm ${ann.type === 'Announcement' ? 'bg-indigo-50 text-indigo-600' : ann.type === 'Equipment' ? 'bg-amber-50 text-amber-600' : ann.type === 'Maintenance' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {ann.type === 'Announcement' && <Megaphone size={28} />}
                         {ann.type === 'Equipment' && <Package size={28} />}
                         {ann.type === 'Maintenance' && <Wrench size={28} />}
                         {ann.type === 'Supply' && <Info size={28} />}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                         <div className="flex flex-wrap items-center gap-2 mb-2">
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${getStatusStyles(ann.status || 'Submitted')}`}>{ann.status || 'Submitted'}</span>
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${getUrgencyStyles(ann.urgency || 'Routine')}`}>{ann.urgency || 'Routine'}</span>
                           <span className="text-[10px] text-gray-400 font-bold ml-auto">{new Date(ann.createdAt || new Date()).toLocaleDateString()}</span>
                         </div>
                         <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{ann.title}</h4>
                         <p className="text-sm text-gray-500 mt-2 leading-relaxed">{ann.description}</p>
                         <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">{(ann.submittedBy || 'S').charAt(0)}</div>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ann.submittedBy || 'Staff'}</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {ann.category || 'General'}</span>
                         </div>
                       </div>

                       {!isUsherView && (
                         <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                           {ann.status === 'Submitted' && (
                             <>
                              <button onClick={() => updateAnnouncementStatus(ann.id, 'Approved')} className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"><CheckCircle2 size={20} /></button>
                              <button onClick={() => updateAnnouncementStatus(ann.id, 'Rejected')} className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"><AlertCircle size={20} /></button>
                             </>
                           )}
                           {ann.status === 'Approved' && (<button onClick={() => updateAnnouncementStatus(ann.id, 'In Progress')} className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex items-center gap-2">Start Work</button>)}
                           {(ann.status === 'In Progress') && (<button onClick={() => updateAnnouncementStatus(ann.id, 'Completed')} className="px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center gap-2">Mark Done</button>)}
                           <button onClick={() => deleteAnnouncement(ann.id)} className="p-3 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                         </div>
                       )}
                    </div>
                  ))
                ) : (
                  <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4"><Megaphone size={40} /></div>
                     <h3 className="text-xl font-bold text-gray-900">No requests found</h3>
                     <p className="text-gray-400 max-w-xs mt-2">Try adjusting your filters or post a new request.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="broadcasts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-2">
                  <Globe className="text-indigo-600" size={20} /> Site-wide Announcements
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Scrolling messages and mobile alerts</p>
              </div>
              <button 
                onClick={() => setIsAddingBroadcast(!isAddingBroadcast)} 
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {isAddingBroadcast ? <X size={16} /> : <Plus size={16} />} {isAddingBroadcast ? 'Cancel' : 'New Global Alert'}
              </button>
            </div>

            <AnimatePresence>
              {isAddingBroadcast && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Message to Scroll</label>
                      <textarea 
                        value={newBroadcast.message} 
                        onChange={e => setNewBroadcast({ ...newBroadcast, message: e.target.value })} 
                        className="w-full px-6 py-4 bg-white rounded-2xl border border-indigo-100 outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm transition-all min-h-[100px]" 
                        placeholder="Enter the message customers will see across the top of the site..." 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Style / Urgency</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'info', icon: Info, color: 'text-blue-500' },
                            { id: 'urgent', icon: AlertCircle, color: 'text-red-500' },
                            { id: 'promo', icon: Megaphone, color: 'text-amber-500' }
                          ].map(t => (
                            <button key={t.id} onClick={() => setNewBroadcast({...newBroadcast, type: t.id as any})} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${newBroadcast.type === t.id ? 'bg-white border-indigo-600 shadow-md' : 'bg-white/50 border-transparent hover:bg-white'}`}>
                              <t.icon size={18} className={t.color} />
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{t.id}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Scheduling</label>
                         <div className="grid grid-cols-2 gap-2">
                           <input type="datetime-local" value={newBroadcast.startDate} onChange={e => setNewBroadcast({...newBroadcast, startDate: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 text-[10px] outline-none" />
                           <input type="datetime-local" value={newBroadcast.endDate} onChange={e => setNewBroadcast({...newBroadcast, endDate: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 text-[10px] outline-none" />
                         </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Target Audience</label>
                         <select value={newBroadcast.target?.audience || 'all'} onChange={e => setNewBroadcast({...newBroadcast, target: { ...newBroadcast.target, audience: e.target.value as any }})} className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 text-sm outline-none">
                           <option value="all">All Users</option>
                           <option value="members">Members Only</option>
                           <option value="leadership">Leadership Only</option>
                         </select>
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Recurrence</label>
                         <div className="flex items-center gap-3 h-[46px]">
                           <label className="flex items-center gap-2 cursor-pointer">
                             <input type="checkbox" checked={newBroadcast.isRecurring || false} onChange={e => setNewBroadcast({...newBroadcast, isRecurring: e.target.checked})} className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                             <span className="text-sm font-medium">Recurring</span>
                           </label>
                           {newBroadcast.isRecurring && (
                             <select value={newBroadcast.recurringSchedule || 'weekly'} onChange={e => setNewBroadcast({...newBroadcast, recurringSchedule: e.target.value as any})} className="flex-1 px-4 py-2 bg-white rounded-xl border border-indigo-100 text-sm outline-none">
                               <option value="daily">Daily</option>
                               <option value="weekly">Weekly</option>
                               <option value="monthly">Monthly</option>
                             </select>
                           )}
                         </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-indigo-100">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => setNewBroadcast({...newBroadcast, pushEnabled: !newBroadcast.pushEnabled})} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${newBroadcast.pushEnabled ? 'bg-red-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${newBroadcast.pushEnabled ? 'left-7' : 'left-1'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Push Notification</span>
                          <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Alert mobile app users</span>
                        </div>
                      </label>

                      {newBroadcast.pushEnabled && (
                        <>
                          <label className="flex items-center gap-2 cursor-pointer ml-4">
                            <input type="checkbox" checked={newBroadcast.playSound !== false} onChange={e => setNewBroadcast({...newBroadcast, playSound: e.target.checked})} className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-bold text-gray-600">Play Sound</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newBroadcast.vibrate !== false} onChange={e => setNewBroadcast({...newBroadcast, vibrate: e.target.checked})} className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs font-bold text-gray-600">Vibrate</span>
                          </label>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-indigo-100">
                      <button onClick={handleSaveBroadcast} className="flex items-center gap-3 px-8 py-3.5 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        <Save size={16} /> Publish To All Users
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
              {broadcasts.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                  <Globe className="text-gray-300 mx-auto mb-4" size={48} />
                  <p className="text-sm font-bold text-gray-500">No site-wide broadcasts found</p>
                </div>
              ) : (
                broadcasts.map((b: Broadcast) => {
                  const status = getBroadcastStatus(b);
                  return (
                    <div key={b.id} className="group p-6 bg-white rounded-[2rem] border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition-all">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${b.type === 'urgent' ? 'bg-red-50 text-red-500' : b.type === 'promo' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                         {b.type === 'urgent' ? <AlertCircle size={24} /> : b.type === 'promo' ? <Megaphone size={24} /> : <Info size={24} />}
                       </div>
                       <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                            {b.pushEnabled && <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1"><Bell size={10} /> Push Sent</span>}
                          </div>
                          <p className="text-sm font-bold text-indigo-950">{b.message}</p>
                       </div>
                       <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => updateBroadcast(b.id, { active: !b.active })} className={`p-3 rounded-xl ${b.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}><CheckCircle2 size={18} /></button>
                          <button onClick={() => deleteBroadcast(b.id)} className="p-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18} /></button>
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsPage;
