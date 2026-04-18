
import React, { useState, useMemo } from 'react';
import { COMPLAINT_CATEGORIES } from '../constants.tsx';
import { Priority, Complaint } from '../types.ts';
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  MoreVertical, 
  X, 
  Calendar, 
  User, 
  Tag, 
  ShieldAlert, 
  Trash2, 
  PlayCircle,
  List,
  ChevronRight
} from 'lucide-react';

interface Props {
  store: any;
  isUsherView?: boolean;
  navigate?: (page: string) => void;
}

const ComplaintsPage: React.FC<Props> = ({ store, isUsherView, navigate }) => {
  const { complaints, addComplaint, updateComplaintStatus, deleteComplaint, currentUser, refresh } = store;
  const [showAdd, setShowAdd] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    category: COMPLAINT_CATEGORIES[0],
    title: '',
    description: '',
    priority: Priority.MEDIUM,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addComplaint({
      ...formData,
      submittedBy: currentUser.fullName
    });
    
    setShowAdd(false);
    await refresh();

    setFormData({
      category: COMPLAINT_CATEGORIES[0],
      title: '',
      description: '',
      priority: Priority.MEDIUM,
    });
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4';
    toast.innerText = 'Issue logged successfully for admin review.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c: Complaint) => {
      const matchesSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'resolved' 
        ? (c.status === 'Resolved' || c.status === 'Closed')
        : (c.status === 'Open' || c.status === 'In Progress');
      return matchesSearch && matchesTab;
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [complaints, searchQuery, activeTab]);

  const getPriorityStyles = (p: Priority) => {
    switch(p) {
      case Priority.URGENT: return 'bg-rose-50 text-rose-700 border-rose-100';
      case Priority.HIGH: return 'bg-orange-50 text-orange-700 border-orange-100';
      case Priority.MEDIUM: return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
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
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">Incident Reporting</h2>
            <p className="text-gray-500">Track and manage facility & operational issues</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
             <button 
               onClick={() => {setActiveTab('active'); setShowAdd(false);}}
               className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'active' && !showAdd ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
             >
               <List size={14} /> Active
             </button>
             <button 
               onClick={() => {setActiveTab('resolved'); setShowAdd(false);}}
               className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'resolved' && !showAdd ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
             >
               <CheckCircle size={14} /> Resolved
             </button>
           </div>
           <button
             onClick={() => setShowAdd(true)}
             className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all ${showAdd ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-100'}`}
           >
             <Plus size={18} /> Log Incident
           </button>
        </div>
      </div>

      {!showAdd && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search issues by title or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-700 bg-transparent text-sm"
          />
        </div>
      )}

      {showAdd ? (
        <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-rose-600 p-8 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-poppins">Report an Issue</h3>
              <p className="text-rose-100 text-sm mt-1">Capture details for maintenance & admin teams</p>
            </div>
            <ShieldAlert size={48} className="opacity-20" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-medium appearance-none"
                >
                  {COMPLAINT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Urgency</label>
                <div className="flex gap-2">
                   {Object.values(Priority).map(p => (
                     <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p})}
                        className={`flex-1 py-2.5 text-[10px] font-black rounded-xl border transition-all uppercase tracking-tighter ${formData.priority === p ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                     >
                       {p}
                     </button>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Short Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                placeholder="e.g. AC leaking in Choir stand"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Incident Details</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 h-32 resize-none font-medium text-sm"
                placeholder="Describe the exact location and nature of the problem..."
                required
              />
            </div>

            <div className="pt-4 flex gap-4">
               <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors">Cancel</button>
               <button type="submit" className="flex-1 py-4 text-sm font-bold bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all">Submit Incident</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((c: Complaint) => (
              <div 
                key={c.id} 
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                onClick={() => setSelectedComplaint(c)}
              >
                <div className="flex items-start justify-between mb-4">
                   <div className={`p-3 rounded-2xl ${
                     c.priority === Priority.URGENT ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                   }`}>
                     <AlertCircle size={24} />
                   </div>
                   <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getPriorityStyles(c.priority)}`}>
                     {c.priority}
                   </div>
                </div>

                <div className="flex-1">
                   <h4 className="font-bold text-gray-900 line-clamp-1 leading-tight">{c.title}</h4>
                   <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                     {c.description}
                   </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase">
                        {c.submittedBy.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.category}</span>
                   </div>
                   <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${
                     c.status === 'Resolved' ? 'text-emerald-600' : 
                     c.status === 'In Progress' ? 'text-blue-600' : 'text-rose-500'
                   }`}>
                     {c.status === 'In Progress' ? <Clock size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                     {c.status}
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                 <CheckCircle size={40} />
               </div>
               <h3 className="text-xl font-bold text-gray-900">All clear</h3>
               <p className="text-gray-400 max-w-xs mt-2">No incidents match your current search or status filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)} />
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className={`${
              selectedComplaint.status === 'Resolved' ? 'bg-emerald-600' : 
              selectedComplaint.status === 'In Progress' ? 'bg-blue-600' : 'bg-rose-600'
            } p-8 text-white flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-3xl">
                  <ShieldAlert />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-poppins line-clamp-1">{selectedComplaint.title}</h3>
                  <p className="text-white/70 text-sm mt-0.5">Status: {selectedComplaint.status}</p>
                </div>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                      <Calendar size={12} /> Date Logged
                    </p>
                    <p className="text-sm font-bold text-gray-800">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                      <User size={12} /> Reported By
                    </p>
                    <p className="text-sm font-bold text-gray-800 truncate">{selectedComplaint.submittedBy}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Incident Profile</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${getPriorityStyles(selectedComplaint.priority)}`}>
                    {selectedComplaint.priority} Priority
                  </span>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                   <div className="flex items-center gap-2 mb-3 text-indigo-600">
                      <Tag size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">{selectedComplaint.category}</span>
                   </div>
                   <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                     {selectedComplaint.description}
                   </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {!isUsherView && (
                  <>
                    {selectedComplaint.status !== 'Resolved' ? (
                      <>
                        {selectedComplaint.status === 'Open' && (
                          <button 
                            onClick={() => { updateComplaintStatus(selectedComplaint.id, 'In Progress'); setSelectedComplaint(null); }}
                            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                          >
                            <PlayCircle size={18} /> Mark In-Progress
                          </button>
                        )}
                        <button 
                          onClick={() => { updateComplaintStatus(selectedComplaint.id, 'Resolved'); setSelectedComplaint(null); }}
                          className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <CheckCircle size={18} /> Mark Resolved
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { deleteComplaint(selectedComplaint.id); setSelectedComplaint(null); }}
                        className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                      >
                        <Trash2 size={18} /> Archive Record
                      </button>
                    )}
                  </>
                )}
                {isUsherView && (
                  <button onClick={() => setSelectedComplaint(null)} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Back to Registry</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
