
import React, { useState } from 'react';
import { FIRST_TIMER_SOURCES } from '../constants.tsx';
import { Gender, AgeGroup, FirstTimer } from '../types.ts';
import { UserPlus, List, Phone, Mail, Search, CheckCircle2, X, MapPin, Calendar, Heart, User, ChevronRight, MessageCircle, Clock, Info, ExternalLink, Users, Compass, Loader2, AlertCircle, Edit3 } from 'lucide-react';

interface Props { store: any; navigate: (page: string) => void; }

const FirstTimersPage: React.FC<Props> = ({ store, navigate }) => {
  const ui = store.settings.uiText;
  const { firstTimers, addFirstTimer, currentUser } = store;
  const updateFirstTimer = store.updateFirstTimer;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState('');
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ 
    fullName: '', 
    phone: '', 
    email: '', 
    gender: Gender.MALE, 
    ageGroup: AgeGroup.ADULT, 
    source: FIRST_TIMER_SOURCES[0], 
    invitedBy: '', 
    visitDate: new Date().toISOString().split('T')[0], 
    location: '', 
    notes: '',
    occupation: '',
    maritalStatus: 'Single',
    prayerRequest: '',
    preferredContactMethod: 'Phone Call'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setStatus('idle');
    setSyncError('');
    try {
      let success = false;
      if (view === 'edit' && editingId) {
        success = await updateFirstTimer(editingId, { ...formData });
      } else {
        success = await addFirstTimer({ ...formData, followUpStatus: 'Not Contacted' });
      }
      setIsSyncing(false);
      if (success) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setView('list');
          setEditingId(null);
          setFormData({
            fullName: '', phone: '', email: '', gender: Gender.MALE, ageGroup: AgeGroup.ADULT,
            source: FIRST_TIMER_SOURCES[0], invitedBy: '', visitDate: new Date().toISOString().split('T')[0],
            location: '', notes: '', occupation: '', maritalStatus: 'Single', prayerRequest: '', preferredContactMethod: 'Phone Call'
          });
        }, 2000);
      } else { setStatus('error'); setSyncError('Save failed. Please check your connection and try again.'); }
    } catch (err: any) {
      setIsSyncing(false);
      setStatus('error');
      setSyncError(err?.message || 'Database write failed. Check connection and permissions.');
    }
  };

  const handleEdit = (ft: FirstTimer) => {
    setFormData({
      fullName: ft.fullName || '',
      phone: ft.phone || '',
      email: ft.email || '',
      gender: (ft.gender as Gender) || Gender.MALE,
      ageGroup: (ft.ageGroup as AgeGroup) || AgeGroup.ADULT,
      source: ft.source || FIRST_TIMER_SOURCES[0],
      invitedBy: ft.invitedBy || '',
      visitDate: ft.visitDate || new Date().toISOString().split('T')[0],
      location: ft.location || '',
      notes: ft.notes || '',
      occupation: (ft as any).occupation || '',
      maritalStatus: (ft as any).maritalStatus || 'Single',
      prayerRequest: (ft as any).prayerRequest || '',
      preferredContactMethod: (ft as any).preferredContactMethod || 'Phone Call',
    });
    setEditingId(ft.id);
    setView('edit');
  };

  const filteredFirstTimers = firstTimers.filter((ft: FirstTimer) => (ft.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (ft.phone || '').includes(searchQuery));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('dashboard')} 
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
            title="Back to Dashboard"
          >
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">{ui.first_timers_page_title}</h2>
            <p className="text-gray-500 text-sm">{ui.first_timers_page_desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => { setView('list'); setEditingId(null); }} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}><List size={14} />Registry</button>
          <button onClick={() => { setView('add'); setEditingId(null); setFormData({ fullName: '', phone: '', email: '', gender: Gender.MALE, ageGroup: AgeGroup.ADULT, source: FIRST_TIMER_SOURCES[0], invitedBy: '', visitDate: new Date().toISOString().split('T')[0], location: '', notes: '', occupation: '', maritalStatus: 'Single', prayerRequest: '', preferredContactMethod: 'Phone Call' }); }} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'add' || view === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}><UserPlus size={14} />{view === 'edit' ? 'Editing' : 'Enlist'}</button>
        </div>
      </div>

      {(view === 'add' || view === 'edit') ? (
        <div className="space-y-4">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => setView('list')} 
              className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-sm transition-all"
            >
              <ChevronRight className="rotate-180" size={18} />
              Back to Registry
            </button>
          </div>
          <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 mb-20">
          <div className="bg-indigo-900 p-8 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-poppins">{view === 'edit' ? 'Edit Visitor Record' : 'Soul Registration'}</h3>
              <p className="text-indigo-200 text-xs">{view === 'edit' ? `Updating entry for ${formData.fullName}` : 'Capturing entry data for pastoral follow-up'}</p>
            </div>
            {view === 'edit' ? <Edit3 size={48} className="opacity-20" /> : <UserPlus size={48} className="opacity-20" />}
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {status === 'success' && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-bounce"><CheckCircle2 size={20} /><span className="font-bold text-sm">{view === 'edit' ? 'Record updated successfully!' : 'Visitor successfully logged!'}</span></div>}
            {status === 'error' && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Save Failed</p>
                  <p className="text-xs mt-1 opacity-80">{syncError || 'Check your connection and try again.'}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label><input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. John Doe" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Phone</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="+233..." /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Optional)</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="john@sijm.com" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Residential Area</label><input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. Kasseh, Opposite Market" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as Gender})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"><option value={Gender.MALE}>Male</option><option value={Gender.FEMALE}>Female</option></select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Age Group</label><select value={formData.ageGroup} onChange={(e) => setFormData({...formData, ageGroup: e.target.value as AgeGroup})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none">{Object.values(AgeGroup).map(ag => <option key={ag} value={ag}>{ag}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marital Status</label><select value={formData.maritalStatus} onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Occupation</label><input type="text" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. Software Engineer" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Contact</label><select value={formData.preferredContactMethod} onChange={(e) => setFormData({...formData, preferredContactMethod: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"><option value="Phone Call">Phone Call</option><option value="WhatsApp">WhatsApp</option><option value="Email">Email</option><option value="SMS">SMS</option></select></div>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
              <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2"><Compass size={16} className="text-amber-500" /> Discovery Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">How did you hear about us?</label><select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none">{FIRST_TIMER_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Invited By</label><input type="text" value={formData.invitedBy} onChange={(e) => setFormData({...formData, invitedBy: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Member or Friend's Name" /></div>
              </div>
            </div>

            <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prayer Request / Notes</label><textarea rows={3} value={formData.prayerRequest} onChange={(e) => setFormData({...formData, prayerRequest: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold resize-none" placeholder="Any specific prayer request or additional information..." /></div>

            <div className="flex gap-4">
               <button type="button" onClick={() => setView('list')} className="flex-1 py-4 text-sm font-black uppercase text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
               <button type="submit" disabled={isSyncing} className={`flex-[2] py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isSyncing ? 'bg-gray-400 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                 {isSyncing ? <Loader2 className="animate-spin" /> : view === 'edit' ? <Edit3 size={18} /> : <UserPlus size={18} />}
                 {isSyncing ? 'Saving...' : view === 'edit' ? 'Save Changes' : 'Register Soul'}
               </button>
            </div>
          </form>
        </div>
      </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-3 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input type="text" placeholder="Search visitors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 outline-none text-sm font-medium bg-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFirstTimers.map((ft: any) => (
              <div key={ft.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${ft.gender === Gender.MALE ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'}`}>{ft.fullName.charAt(0)}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{ft.fullName}</h4>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{ft.ageGroup}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(ft)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                    title="Edit first timer">
                    <Edit3 size={14} />
                  </button>
                </div>
                <div className="space-y-3 mt-4 text-xs text-gray-500 font-medium border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-3"><Phone size={12} className="text-indigo-400" /> {ft.phone}</div>
                  <div className="flex items-center gap-3"><MapPin size={12} className="text-gray-400" /> {ft.location || 'N/A'}</div>
                  <div className="flex items-center gap-3"><Heart size={12} className="text-rose-400" /> {ft.prayerRequest ? 'Has Prayer Request' : 'No Request'}</div>
                  <div className="flex items-center gap-3"><MessageCircle size={12} className="text-amber-400" /> {ft.preferredContactMethod}</div>
                </div>
                {ft.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-[10px] text-gray-400 italic line-clamp-2">
                    "{ft.notes}"
                  </div>
                )}
              </div>
            ))}
                <div className="space-y-3 mt-4 text-xs text-gray-500 font-medium border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-3"><Phone size={12} className="text-indigo-400" /> {ft.phone}</div>
                  <div className="flex items-center gap-3"><MapPin size={12} className="text-gray-400" /> {ft.location || 'N/A'}</div>
                  <div className="flex items-center gap-3"><Heart size={12} className="text-rose-400" /> {ft.prayerRequest ? 'Has Prayer Request' : 'No Request'}</div>
                  <div className="flex items-center gap-3"><MessageCircle size={12} className="text-amber-400" /> {ft.preferredContactMethod}</div>
                </div>
                {ft.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-[10px] text-gray-400 italic line-clamp-2">
                    "{ft.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

export default FirstTimersPage;
