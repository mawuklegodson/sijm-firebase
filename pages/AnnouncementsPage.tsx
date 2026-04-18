
import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Clock, Filter, AlertCircle, CheckCircle2, Search, Trash2, X, ChevronRight, Package, Wrench, Info, List } from 'lucide-react';
import { Announcement } from '../types.ts';

interface Props {
  store: any;
  isUsherView?: boolean;
  navigate?: (page: string) => void;
}

const AnnouncementsPage: React.FC<Props> = ({ store, isUsherView, navigate }) => {
  if (!store) return <div className="p-10 text-center text-slate-400 font-bold">Loading...</div>;
  const { announcements = [], addAnnouncement, updateAnnouncementStatus, deleteAnnouncement, currentUser, refresh } = store;
  // Initialize with list view even for ushers, or allow toggle
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
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
      if (refresh) await refresh(); // Ensure list is up to date
      
      setFormData({ 
        type: 'Announcement', 
        title: '', 
        description: '', 
        category: 'General', 
        urgency: 'Routine' 
      });

      const toast = document.createElement('div');
      toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4';
      toast.innerText = 'Request submitted for administrator review.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } else {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4';
      toast.innerText = 'Error submitting request. Please check your permissions.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return (announcements || []).filter((ann: Announcement) => {
      const matchesSearch = (ann.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (ann.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : ann.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
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
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">Communications Hub</h2>
            <p className="text-gray-500">Coordinate announcements and resource requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
           <button 
             onClick={() => setShowAdd(false)} 
             className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${!showAdd ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
           >
             <List size={14} /> Registry
           </button>
           <button 
             onClick={() => setShowAdd(true)} 
             className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${showAdd ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
           >
             <Plus size={14} /> New Post
           </button>
        </div>
      </div>

      {!showAdd && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Search className="text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search communications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent"
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
            {['All', 'Submitted', 'Approved', 'In Progress', 'Completed'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === status ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

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
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Announcement">Public Announcement</option>
                    <option value="Equipment">Equipment Request</option>
                    <option value="Supply">Supply Purchase</option>
                    <option value="Maintenance">Maintenance Need</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Urgency Level</label>
                  <select 
                    value={formData.urgency} 
                    onChange={e => setFormData({...formData, urgency: e.target.value as any})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Routine">Routine (Next 30 Days)</option>
                    <option value="Needed Soon">Needed Soon (Next 7 Days)</option>
                    <option value="Urgent">Urgent (Current Service)</option>
                    <option value="Critical">Critical (Immediate Action)</option>
                  </select>
               </div>
             </div>
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Heading / Subject</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                  placeholder="Summarize the announcement" 
                  required 
                />
             </div>
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Detailed Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none font-medium text-sm" 
                  placeholder="Provide full context or specific items needed..." 
                  required 
                />
             </div>
             <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                  Submit Update
                </button>
             </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((ann: Announcement) => (
              <div key={ann.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
                 <div className={`w-16 h-16 rounded-[1.5rem] shrink-0 flex items-center justify-center shadow-sm ${
                   ann.type === 'Announcement' ? 'bg-indigo-50 text-indigo-600' : 
                   ann.type === 'Equipment' ? 'bg-amber-50 text-amber-600' :
                   ann.type === 'Maintenance' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                 }`}>
                   {ann.type === 'Announcement' && <Megaphone size={28} />}
                   {ann.type === 'Equipment' && <Package size={28} />}
                   {ann.type === 'Maintenance' && <Wrench size={28} />}
                   {ann.type === 'Supply' && <Info size={28} />}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <div className="flex flex-wrap items-center gap-2 mb-2">
                     <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${getStatusStyles(ann.status || 'Submitted')}`}>
                       {ann.status || 'Submitted'}
                     </span>
                     <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${getUrgencyStyles(ann.urgency || 'Routine')}`}>
                       {ann.urgency || 'Routine'}
                     </span>
                     <span className="text-[10px] text-gray-400 font-bold ml-auto">{new Date(ann.createdAt || new Date()).toLocaleDateString()}</span>
                   </div>
                   
                   <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{ann.title}</h4>
                   <p className="text-sm text-gray-500 mt-2 leading-relaxed">{ann.description}</p>
                   
                   <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">
                           {(ann.submittedBy || 'S').charAt(0)}
                         </div>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ann.submittedBy || 'Staff'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {ann.category || 'General'}</span>
                   </div>
                 </div>

                 {/* Admin Controls */}
                 {!isUsherView && (
                   <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                     {ann.status === 'Submitted' && (
                       <>
                        <button 
                          onClick={() => updateAnnouncementStatus(ann.id, 'Approved')}
                          className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                          title="Approve"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        <button 
                          onClick={() => updateAnnouncementStatus(ann.id, 'Rejected')}
                          className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"
                          title="Reject"
                        >
                          <AlertCircle size={20} />
                        </button>
                       </>
                     )}
                     {ann.status === 'Approved' && (
                       <button 
                         onClick={() => updateAnnouncementStatus(ann.id, 'In Progress')}
                         className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex items-center gap-2"
                       >
                         Start Work
                       </button>
                     )}
                     {(ann.status === 'In Progress') && (
                        <button 
                          onClick={() => updateAnnouncementStatus(ann.id, 'Completed')}
                          className="px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center gap-2"
                        >
                          Mark Done
                        </button>
                     )}
                     <button 
                       onClick={() => deleteAnnouncement(ann.id)}
                       className="p-3 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                       title="Delete"
                     >
                       <Trash2 size={20} />
                     </button>
                   </div>
                 )}
              </div>
            ))
          ) : (
            <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                 <Megaphone size={40} />
               </div>
               <h3 className="text-xl font-bold text-gray-900">No communications found</h3>
               <p className="text-gray-400 max-w-xs mt-2">Try adjusting your filters or post a new announcement to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
