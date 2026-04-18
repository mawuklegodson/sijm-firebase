import React, { useState, useMemo } from 'react';
import { 
  Heart, Search, Filter, CheckCircle, Clock, 
  MessageSquare, User, Mail, Shield, Trash2, 
  MoreVertical, ChevronRight, Lock, Globe, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkerPermission } from '../types.ts';

interface PrayerRequestsPageProps {
  store: any;
  navigate?: (page: string) => void;
}

const PrayerRequestsPage: React.FC<PrayerRequestsPageProps> = ({ store, navigate }) => {
  const { 
    prayerRequests, 
    updatePrayerRequest, 
    deletePrayerRequest, 
    addPrayerNote,
    updatePrayerNote,
    deletePrayerNote,
    usePrayerNotes,
    currentUser,
    isLoading 
  } = store;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'prayed' | 'answered'>('all');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    let list = [...prayerRequests];

    // Filter by visibility for non-admins and non-prayer team
    const { isSuperAdmin } = store;
    const isAdmin = isSuperAdmin || currentUser?.workerPermissions?.includes(WorkerPermission.ADMIN) || currentUser?.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN);
    const isPrayerHead = currentUser?.workerPermissions?.includes(WorkerPermission.PRAYER_HEAD);
    const isPrayerTeam = currentUser?.workerPermissions?.includes(WorkerPermission.PRAYER_TEAM);
    
    if (!isAdmin && !isPrayerHead) {
      list = list.filter(r => {
        // If it's public, everyone in the team can see it
        if (!r.isPrivate) return true;
        
        // Prayer team members can see all private requests in their branch
        if (isPrayerTeam && r.branch === currentUser.branch) return true;

        // If it's private and user is not in team, check if specifically visible to them
        if (r.visibleToIds && r.visibleToIds.length > 0) {
          return r.visibleToIds.includes(currentUser.id);
        }
        
        // The user who created it can always see it
        if (r.userId === currentUser.id) return true;

        return false;
      });
    }

    if (activeTab !== 'all') {
      list = list.filter(r => (r.status || '').toLowerCase() === activeTab.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        (r.subject || '').toLowerCase().includes(q) || 
        (r.content || '').toLowerCase().includes(q) || 
        (r.userName || '').toLowerCase().includes(q) ||
        (r.branch || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [prayerRequests, activeTab, searchQuery, currentUser]);

    const handleStatusUpdate = async (id: string, status: string) => {
      try {
        // Normalize status to capitalized version for storage
        const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        await updatePrayerRequest(id, { status: normalizedStatus });
        
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4';
        toast.innerText = `Status updated to ${normalizedStatus}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } catch (error) {
        console.error('Error updating prayer request status:', error);
      }
    };

  const handleDelete = async (id: string) => {
    try {
      await deletePrayerRequest(id);
    } catch (error) {
      console.error('Error deleting prayer request:', error);
    }
  };

  const PrayerNoteSection = ({ requestId }: { requestId: string }) => {
    const { notes, isLoading: notesLoading } = usePrayerNotes(requestId);
    const [newNote, setNewNote] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const handleAddNote = async () => {
      if (!newNote.trim()) return;
      try {
        await addPrayerNote(requestId, {
          text: newNote,
          isPrivate,
          authorId: currentUser.id,
          authorName: currentUser.fullName,
          createdAt: new Date().toISOString()
        });
        setNewNote('');
      } catch (error) {
        console.error('Error adding note:', error);
      }
    };

    const handleUpdateNote = async (noteId: string) => {
      try {
        await updatePrayerNote(requestId, noteId, { text: editText });
        setEditingNoteId(null);
      } catch (error) {
        console.error('Error updating note:', error);
      }
    };

    const handleDeleteNote = async (noteId: string) => {
      try {
        await deletePrayerNote(requestId, noteId);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    };

    return (
      <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <MessageSquare size={14} /> Prayer Log & Notes
          </h5>
        </div>

        <div className="space-y-4">
          {notes?.map((note: any) => (
            <div 
              key={note.id} 
              className={`p-4 rounded-2xl border ${
                note.isPrivate ? 'bg-amber-50/50 border-amber-100' : 'bg-indigo-50/50 border-indigo-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-900">{note.authorName}</span>
                  {note.isPrivate ? (
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1">
                      <Lock size={8} /> Team Only
                    </span>
                  ) : (
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1">
                      <Globe size={8} /> Shared with Member
                    </span>
                  )}
                </div>
                {note.authorId === currentUser.id && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditText(note.text);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-indigo-600"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <textarea 
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingNoteId(null)} className="px-3 py-1 text-[10px] font-bold text-slate-400">Cancel</button>
                    <button onClick={() => handleUpdateNote(note.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">Save</button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 text-sm">{note.text}</p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
          <textarea 
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Add a note or message..."
            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                  isPrivate ? 'bg-amber-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                <Lock size={10} /> Private Note
              </button>
              <button
                onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                  !isPrivate ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                <Globe size={10} /> Public Message
              </button>
            </div>
            <button 
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'all', label: 'All Requests', icon: MessageSquare },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'prayed', label: 'Prayed', icon: Heart },
    { id: 'answered', label: 'Answered', icon: CheckCircle },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {navigate && (
            <button 
              onClick={() => navigate('dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              title="Back to Dashboard"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <div className="w-14 h-14 bg-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-rose-100">
            <Heart className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prayer Team Hub</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manage and intercede for community requests</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search by subject, content or member name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] h-64 animate-pulse border border-slate-100" />
          ))
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req, idx) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-rose-500/5 transition-all group relative overflow-hidden"
            >
              {/* Status Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                (req.status || '').toLowerCase() === 'answered' ? 'bg-emerald-500' :
                (req.status || '').toLowerCase() === 'prayed' ? 'bg-indigo-500' :
                'bg-slate-300'
              }`} />

              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-rose-600">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{req.userName}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(req.createdAt).toLocaleString()}</span>
                        <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{req.branch}</span>
                        {req.isPrivate ? (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                            <Lock size={8} /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Globe size={8} /> Public
                          </span>
                        )}
                        {(req.status || '').toLowerCase() === 'answered' && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle size={8} /> Answered
                          </span>
                        )}
                        {(req.status || '').toLowerCase() === 'prayed' && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Heart size={8} /> Prayed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <a href={`mailto:${req.userEmail}`} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-600 transition-colors">
                          <Mail size={12} /> {req.userEmail}
                        </a>
                        {req.userPhone && (
                          <a href={`tel:${req.userPhone}`} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-600 transition-colors">
                            <Phone size={12} /> {req.userPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={(req.status || '').toLowerCase()}
                      onChange={(e) => handleStatusUpdate(req.id, e.target.value)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer transition-all ${
                        (req.status || '').toLowerCase() === 'answered' ? 'bg-emerald-50 text-emerald-600' :
                        (req.status || '').toLowerCase() === 'prayed' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-slate-50 text-slate-400'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="prayed">Prayed</option>
                      <option value="answered">Answered</option>
                    </select>
                    <button 
                      onClick={() => handleDelete(req.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h4 className="text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">{req.subject}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                    "{req.content}"
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'prayed')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        (req.status || '').toLowerCase() === 'prayed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <Heart size={14} /> Intercede
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'answered')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        (req.status || '').toLowerCase() === 'answered' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle size={14} /> Mark Answered
                    </button>
                  </div>
                  <button 
                    onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      expandedRequestId === req.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare size={16} /> 
                    {expandedRequestId === req.id ? 'Hide Log' : 'Prayer Log'}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedRequestId === req.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <PrayerNoteSection requestId={req.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Heart size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No prayer requests</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">There are no requests matching your current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerRequestsPage;
