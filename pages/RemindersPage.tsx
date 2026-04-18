
import React, { useState, useMemo } from 'react';
import { ReminderType, FollowUpReminder, FirstTimer, WorkerPermission } from '../types.ts';
import { 
  Calendar as CalendarIcon, List, Plus, CheckCircle2, Clock, Phone, Mail, MapPin, ExternalLink,
  ChevronLeft, ChevronRight, MessageSquare, Search, Trash2, X, User as UserIcon, Filter
} from 'lucide-react';

interface Props {
  store: any;
  navigate?: (page: string) => void;
}

const RemindersPage: React.FC<Props> = ({ store, navigate }) => {
  const ui = store.settings.uiText;
  const { reminders, firstTimers, users, currentUser, addReminder, updateReminderStatus, deleteReminder } = store;
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'All'>('Pending');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstTimerId: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '10:00',
    type: ReminderType.CALL, 
    notes: '',
    assignedTo: currentUser?.fullName || ''
  });

  const isSuperAdmin = currentUser?.workerPermissions.includes(WorkerPermission.SUPER_ADMIN);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const ft = firstTimers.find((f: any) => f.id === formData.firstTimerId);
    if (!ft) return;
    addReminder({
      firstTimerId: ft.id, 
      firstTimerName: ft.fullName, 
      assignedTo: formData.assignedTo,
      date: formData.date, 
      time: formData.time, 
      type: formData.type, 
      status: 'Pending', 
      notes: formData.notes
    });
    setShowModal(false);
    setFormData({ 
      firstTimerId: '', 
      date: new Date().toISOString().split('T')[0], 
      time: '10:00', 
      type: ReminderType.CALL, 
      notes: '',
      assignedTo: currentUser?.fullName || ''
    });
  };

  const filteredReminders = useMemo(() => {
    return reminders.filter((r: FollowUpReminder) => {
      const matchesSearch = (r.firstTimerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : r.status === 'Pending';
      const matchesDate = selectedDate ? r.date === selectedDate : true;
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [reminders, searchQuery, statusFilter, selectedDate]);

  const getVisitorPhone = (name: string) => {
    return firstTimers.find((f: any) => f.fullName === name)?.phone || '';
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
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">{ui.reminders_page_title}</h2>
            <p className="text-gray-500">{ui.reminders_page_desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all">
            <Plus size={20} /> New Interaction
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
        <Search className="text-gray-400" size={18} />
        <input type="text" placeholder="Search interactions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 outline-none text-sm bg-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReminders.map((reminder: FollowUpReminder) => {
          const phone = getVisitorPhone(reminder.firstTimerName);
          return (
            <div key={reminder.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 flex items-center gap-5 group hover:shadow-xl transition-all">
              <a 
                href={phone ? `tel:${phone}` : '#'}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  phone 
                    ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white cursor-pointer active:scale-90 shadow-sm' 
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                title={phone ? `Call ${reminder.firstTimerName}` : 'No phone number available'}
              >
                 {reminder.type === ReminderType.CALL ? <Phone size={24} /> : <MapPin size={24} />}
              </a>
              <div className="flex-1 min-w-0">
                 <h4 className="font-bold text-gray-900 truncate">{reminder.firstTimerName}</h4>
                 <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{reminder.date} • {reminder.time}</p>
                    <span className="text-[9px] font-bold text-indigo-400">Assigned to: {reminder.assignedTo}</span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => updateReminderStatus(reminder.id, 'Completed')} 
                  className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                  title="Mark as Completed"
                >
                   <CheckCircle2 size={24} />
                </button>
                <button 
                  onClick={() => deleteReminder(reminder.id)} 
                  className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                   <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredReminders.length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
             <CalendarIcon className="mx-auto text-gray-200 mb-4" size={48} />
             <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No pending interactions scheduled</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
             <div className="bg-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold font-poppins">Schedule Interaction</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
             </div>
             <form onSubmit={handleAddReminder} className="p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Target</label>
                   <select required value={formData.firstTimerId} onChange={e => setFormData({...formData, firstTimerId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                     <option value="">Choose soul...</option>
                     {firstTimers.map((ft: any) => <option key={ft.id} value={ft.id}>{ft.fullName}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Execution Date</label>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time Window</label>
                      <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                   </div>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign To (Staff/Pastor)</label>
                     <select value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                       {users.map((u: any) => <option key={u.id} value={u.fullName}>{u.fullName} ({u.identityRole})</option>)}
                     </select>
                  </div>
                )}

                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 active:scale-95 transition-all">Schedule Task</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;
