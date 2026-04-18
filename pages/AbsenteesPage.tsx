
import React, { useState, useMemo } from 'react';
import { Priority, Absentee, Member } from '../types.ts';
import { 
  UserX, Search, Plus, Phone, CheckCircle, Clock, X, 
  Calendar, Trash2, AlertTriangle, ClipboardList, 
  User, MessageCircle, MapPin, Edit3,
  UserCheck, Loader2, ChevronLeft
} from 'lucide-react';

interface Props {
  store: any;
  isUsherView?: boolean;
  navigate?: (page: string) => void;
}

const AbsenteesPage: React.FC<Props> = ({ store, isUsherView, navigate }) => {
  const { absentees, addAbsentee, updateAbsentee, deleteAbsentee, currentUser, members, settings, refresh } = store;
  const ui = settings.uiText;
  
  const [showAdd, setShowAdd] = useState(false);
  const [selectedAbsentee, setSelectedAbsentee] = useState<Absentee | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [memberSearch, setMemberSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    phone: '',
    lastSeenDate: '',
    weeksAbsent: 1,
    reason: '',
    priority: Priority.MEDIUM,
  });

  const memberSuggestions = useMemo(() => {
    if (!memberSearch.trim() || memberSearch === formData.memberName) return [];
    return members.filter((m: Member) => 
      (m.fullName || '').toLowerCase().includes(memberSearch.toLowerCase())
    ).slice(0, 5);
  }, [members, memberSearch, formData.memberName]);

  const handleSelectMember = (m: Member) => {
    setFormData({
      ...formData,
      memberId: m.id,
      memberName: m.fullName,
      phone: m.phone || ''
    });
    setMemberSearch(m.fullName);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    
    // addAbsentee handles the data mapping to snake_case in store.ts
    await addAbsentee({ 
      ...formData, 
      status: 'Recorded', 
      notes: '',
      recordedBy: currentUser.fullName
    });
    
    setIsSyncing(false);
    setShowAdd(false);
    setMemberSearch('');
    setFormData({ 
      memberId: '', memberName: '', phone: '', lastSeenDate: '', 
      weeksAbsent: 1, reason: '', priority: Priority.MEDIUM 
    });
    
    await refresh();

    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl z-[200] animate-in slide-in-from-bottom-4';
    toast.innerText = 'Absentee logged for pastoral follow-up.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleStatusUpdate = async (id: string, status: 'Contacted' | 'Resolved') => {
    await updateAbsentee(id, { status });
    if (selectedAbsentee?.id === id) {
      setSelectedAbsentee(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedAbsentee) return;
    await updateAbsentee(selectedAbsentee.id, { notes: editNotes });
    setSelectedAbsentee(prev => prev ? { ...prev, notes: editNotes } : null);
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl z-[200] animate-in slide-in-from-bottom-4';
    toast.innerText = 'Pastoral notes synchronized.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Archive this record? This will remove it from the active tracking lists.")) {
      await deleteAbsentee(id);
      setSelectedAbsentee(null);
    }
  };

  const filteredAbsentees = useMemo(() => {
    return absentees.filter((abs: Absentee) => {
      const matchesSearch = (abs.memberName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (abs.phone && abs.phone.includes(searchQuery));
      const matchesTab = activeTab === 'resolved' ? abs.status === 'Resolved' : abs.status !== 'Resolved';
      return matchesSearch && matchesTab;
    }).sort((a: Absentee, b: Absentee) => {
      const pMap = { [Priority.URGENT]: 3, [Priority.HIGH]: 2, [Priority.MEDIUM]: 1, [Priority.LOW]: 0 };
      if (pMap[a.priority as Priority] !== pMap[b.priority as Priority]) {
        return pMap[b.priority as Priority] - pMap[a.priority as Priority];
      }
      return b.weeksAbsent - a.weeksAbsent;
    });
  }, [absentees, searchQuery, activeTab]);

  const getPriorityStyles = (p: Priority) => {
    switch(p) {
      case Priority.URGENT: return 'bg-rose-100 text-rose-700 border-rose-200';
      case Priority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-100';
      case Priority.MEDIUM: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {navigate && (
            <button 
              onClick={() => navigate('dashboard')} 
              className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              title="Back to Dashboard"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">{ui.absentees_page_title}</h2>
            <p className="text-gray-500">{ui.absentees_page_desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
             <button onClick={() => { setActiveTab('pending'); setShowAdd(false); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' && !showAdd ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}>Follow-up ({absentees.filter((a: Absentee) => a.status !== 'Resolved').length})</button>
             <button onClick={() => { setActiveTab('resolved'); setShowAdd(false); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'resolved' && !showAdd ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}>Resolved ({absentees.filter((a: Absentee) => a.status === 'Resolved').length})</button>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-primary text-white px-5 py-2.5 rounded-button-enhanced font-bold flex items-center gap-2 hover:brightness-110 shadow-lg transition-all active:scale-95"><Plus size={18} />Log Missing Soul</button>
        </div>
      </div>

      {!showAdd && (
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input type="text" placeholder="Search by member name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 outline-none text-gray-700 bg-transparent text-sm font-medium" />
        </div>
      )}

      {showAdd ? (
        <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-indigo-900 p-8 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-poppins">Log Missing Soul</h3>
              <p className="text-indigo-200 text-sm mt-1">Register a member for pastoral follow-up</p>
            </div>
            <UserX size={48} className="opacity-20" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-1 relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Find Member</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={memberSearch}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => { setMemberSearch(e.target.value); setShowSuggestions(true); }}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="Type name to search directory..."
                  required
                />
                {showSuggestions && memberSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {memberSuggestions.map((m: Member) => (
                      <button 
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        className="w-full px-5 py-4 text-left hover:bg-indigo-50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{m.fullName}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.location || 'No Location'}</p>
                        </div>
                        <Plus size={16} className="text-gray-300 group-hover:text-indigo-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Last Seen Date</label>
                  <input 
                    type="date" 
                    value={formData.lastSeenDate} 
                    onChange={e => setFormData({...formData, lastSeenDate: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
               </div>
               <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Weeks Absent</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.weeksAbsent} 
                    onChange={e => setFormData({...formData, weeksAbsent: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
               </div>
            </div>

            <div className="space-y-1">
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Urgency Priority</label>
               <div className="flex gap-2">
                 {Object.values(Priority).map(p => (
                   <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={`flex-1 py-3 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${formData.priority === p ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                   >
                     {p}
                   </button>
                 ))}
               </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors">Cancel</button>
              <button type="submit" disabled={isSyncing} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                {isSyncing ? <Loader2 className="animate-spin" /> : <UserCheck size={20} />}
                Confirm Entry
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAbsentees.map((abs: Absentee) => (
            <div key={abs.id} className="bg-white rounded-enhanced shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl bg-gray-50 text-gray-400 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                     {(abs.memberName || 'M').charAt(0)}
                   </div>
                   <div className="min-w-0">
                     <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors truncate">{abs.memberName}</h4>
                     <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${getPriorityStyles(abs.priority)}`}>{abs.priority}</span>
                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-tighter">{abs.weeksAbsent} weeks away</p>
                     </div>
                   </div>
                 </div>
              </div>

              <div className="space-y-3 flex-1 text-xs text-gray-500 font-medium">
                 <div className="flex items-center gap-3"><Calendar size={14} className="text-indigo-300" /><span>Last Seen: <span className="text-gray-900 font-bold">{abs.lastSeenDate}</span></span></div>
                 {abs.phone && (
                   <a href={`tel:${abs.phone}`} className="flex items-center gap-3 hover:text-indigo-600 transition-colors group/tel">
                      <div className="p-2 bg-indigo-50 rounded-lg group-hover/tel:bg-indigo-600 group-hover/tel:text-white transition-all">
                        <Phone size={14} />
                      </div>
                      <span className="font-bold">{abs.phone}</span>
                   </a>
                 )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                 {abs.status !== 'Resolved' && (
                    <button onClick={() => handleStatusUpdate(abs.id, 'Resolved')} className="flex-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><CheckCircle size={14} /> Mark Reached</button>
                 )}
                 <button onClick={() => { setSelectedAbsentee(abs); setEditNotes(abs.notes || ''); }} className="px-4 py-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center"><Clock size={18} /></button>
              </div>
            </div>
          ))}
          {filteredAbsentees.length === 0 && (
             <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
                <CheckCircle size={48} className="text-gray-100 mb-4" />
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">No matching records in registry</p>
             </div>
          )}
        </div>
      )}

      {selectedAbsentee && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md" onClick={() => setSelectedAbsentee(null)} />
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className={`p-10 text-white flex items-center justify-between shrink-0 ${selectedAbsentee.status === 'Resolved' ? 'bg-emerald-600' : 'bg-indigo-900'}`}>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black shadow-2xl border border-white/20">{(selectedAbsentee.memberName || 'M').charAt(0)}</div>
                <div>
                  <h3 className="text-2xl font-bold font-poppins">{selectedAbsentee.memberName}</h3>
                  <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/20 uppercase tracking-widest">{selectedAbsentee.status}</span></div>
                </div>
              </div>
              <button onClick={() => setSelectedAbsentee(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={28} /></button>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Weeks Out</p><p className="text-sm font-bold text-gray-800">{selectedAbsentee.weeksAbsent}</p></div>
                 <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Last Seen</p><p className="text-sm font-bold text-gray-800">{selectedAbsentee.lastSeenDate}</p></div>
                 <a href={selectedAbsentee.phone ? `tel:${selectedAbsentee.phone}` : '#'} className={`p-4 rounded-3xl border border-gray-100 text-center transition-all ${selectedAbsentee.phone ? 'bg-indigo-50 hover:bg-indigo-600 hover:text-white hover:shadow-lg' : 'bg-gray-50 opacity-50'}`}><p className={`text-[9px] font-black uppercase mb-1 ${selectedAbsentee.phone ? 'text-indigo-400 group-hover:text-white' : 'text-gray-400'}`}>Call Member</p><Phone className="mx-auto" size={18} /></a>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={14} /> Pastoral Intervention Notes</h4>
                 <textarea 
                  value={editNotes} 
                  onChange={e => setEditNotes(e.target.value)} 
                  readOnly={isUsherView}
                  className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none leading-relaxed" 
                  placeholder={isUsherView ? "Pastoral notes are view-only for ushers..." : "Log follow-up calls, visits, or welfare outcomes here..."} 
                 />
                 {!isUsherView && (
                   <button onClick={handleUpdateNotes} className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Edit3 size={14} /> Synchronize Notes</button>
                 )}
              </div>

              <div className="pt-8 border-t border-gray-100 flex gap-4">
                 {!isUsherView && selectedAbsentee.status !== 'Resolved' && (
                   <button onClick={() => handleStatusUpdate(selectedAbsentee.id, 'Resolved')} className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"><CheckCircle size={20} /> Mark Resolved</button>
                 )}
                 {!isUsherView && selectedAbsentee.status === 'Resolved' && (
                   <div className="flex-[2] p-5 bg-emerald-50 rounded-2xl flex items-center justify-center gap-2 text-emerald-700 border border-emerald-100 font-black text-[10px] uppercase"><UserCheck size={18} /> Reconnection Successful</div>
                 )}
                 {!isUsherView && (
                   <button onClick={() => handleDeleteRecord(selectedAbsentee.id)} className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"><Trash2 size={20} /> Archive</button>
                 )}
                 {isUsherView && (
                   <button onClick={() => setSelectedAbsentee(null)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold">Back to Registry</button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenteesPage;
