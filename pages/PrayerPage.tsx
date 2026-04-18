import React, { useState, useMemo } from 'react';
import { Heart, Send, Lock, Globe, History, CheckCircle, Clock, MessageSquare, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrayerPageProps {
  store: any;
  navigate: (page: string) => void;
}

const PrayerPage: React.FC<PrayerPageProps> = ({ store, navigate }) => {
  const { 
    currentUser, 
    prayerRequests, 
    addPrayerRequest, 
    updatePrayerRequest,
    users,
    usePrayerNotes,
    isLoading 
  } = store;
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [visibleToIds, setVisibleToIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const myRequests = prayerRequests.filter((r: any) => r.userId === currentUser?.id);

  const prayerTeamInBranch = useMemo(() => {
    if (!currentUser?.branch || !users) return [];
    return users.filter((u: any) => 
      (u.workerPermissions?.includes('Prayer Team') || u.worker_permissions?.includes('Prayer Team') || 
       u.workerPermissions?.includes('Prayer Head') || u.worker_permissions?.includes('Prayer Head')) && 
      u.branch === currentUser.branch &&
      u.id !== currentUser.id
    );
  }, [users, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;

    setIsSubmitting(true);
    try {
      await addPrayerRequest({
        userId: currentUser.id,
        userName: currentUser.fullName,
        subject,
        content,
        isPrivate,
        status: 'Pending',
        userEmail: currentUser.email || '',
        userPhone: currentUser.phone || '',
        branch: currentUser.branch || '',
        visibleToIds: isPrivate ? visibleToIds : [],
        createdAt: new Date().toISOString()
      });
      setSubject('');
      setContent('');
      setVisibleToIds([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting prayer request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAnswered = async (requestId: string) => {
    try {
      await updatePrayerRequest(requestId, { status: 'Answered' });
    } catch (error) {
      console.error('Error marking as answered:', error);
    }
  };

  const PrayerRequestCard = ({ req }: { req: any }) => {
    const { notes } = usePrayerNotes(req.id);
    const publicNotes = notes?.filter((n: any) => !n.isPrivate) || [];

    return (
      <motion.div
        key={req.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
              (req.status || '').toLowerCase() === 'answered' ? 'bg-emerald-50 text-emerald-600' :
              (req.status || '').toLowerCase() === 'prayed' ? 'bg-indigo-50 text-indigo-600' :
              'bg-slate-50 text-slate-400'
            }`}>
              {req.status}
            </span>
            {req.isPrivate ? (
              <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                <Lock size={8} /> Private
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                <Globe size={8} /> Public
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-300 font-bold">
            {new Date(req.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h4 className="font-bold text-slate-900 mb-2 line-clamp-1">{req.subject}</h4>
        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4 italic">"{req.content}"</p>

        {publicNotes.length > 0 && (
          <div className="mb-4 space-y-2">
            <h5 className="text-[8px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1">
              <MessageSquare size={10} /> Team Messages
            </h5>
            {publicNotes.map((note: any) => (
              <div key={note.id} className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                <p className="text-slate-700 text-[10px]">{note.text}</p>
                <p className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest mt-1">— {note.authorName}</p>
              </div>
            ))}
          </div>
        )}

        {(req.status || '').toLowerCase() !== 'answered' && (
          <button
            onClick={() => handleMarkAnswered(req.id)}
            className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={12} /> Mark Answered
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12">
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prayer Sanctuary</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Submit your requests and see God's faithfulness</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                <input 
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g., Healing for my mother, Financial breakthrough..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Request Details</label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Share your request with us..."
                  rows={6}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-slate-900 resize-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isPrivate ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Private Request</p>
                      <p className="text-[10px] text-slate-400 font-medium">Only visible to prayer team</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-rose-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {isPrivate && prayerTeamInBranch.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                      <Shield size={12} /> Select Prayer Partners
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium italic">Choose specific team members to see your request. Leave empty for the whole team.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {prayerTeamInBranch.map((member: any) => (
                        <label key={member.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-rose-200 transition-all group">
                          <input 
                            type="checkbox"
                            checked={visibleToIds.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) setVisibleToIds([...visibleToIds, member.id]);
                              else setVisibleToIds(visibleToIds.filter(id => id !== member.id));
                            }}
                            className="w-4 h-4 rounded border-slate-200 text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-rose-600">{member.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-rose-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Submit Request
                  </>
                )}
              </motion.button>
            </form>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-3 justify-center font-bold text-sm"
                >
                  <CheckCircle size={20} />
                  Your request has been submitted successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History size={20} className="text-rose-600" /> My History
            </h2>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">
              {myRequests.length}
            </span>
          </div>

          <div className="space-y-4">
            {myRequests.length > 0 ? (
              myRequests.map((req: any) => (
                <PrayerRequestCard key={req.id} req={req} />
              ))
            ) : (
              <div className="py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6">
                <MessageSquare size={32} className="text-slate-300 mb-4" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No requests yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerPage;
