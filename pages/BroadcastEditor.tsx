import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Calendar, Clock, Bell, Info, Megaphone, 
  CheckCircle2, X, AlertCircle, Send, Save, Globe 
} from 'lucide-react';
import { Broadcast } from '../types.ts';

interface BroadcastEditorProps {
  store: any;
}

const BroadcastEditor: React.FC<BroadcastEditorProps> = ({ store }) => {
  const { broadcasts, addBroadcast, updateBroadcast, deleteBroadcast } = store;
  const [isAdding, setIsAdding] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState<Partial<Broadcast>>({
    message: '',
    type: 'info',
    active: true,
    isClosable: true,
    pushEnabled: false
  });

  const handleSave = async (b: Partial<Broadcast>) => {
    try {
      if (b.id) {
        await updateBroadcast(b.id, b);
      } else {
        await addBroadcast(b);
      }
      setIsAdding(false);
      setNewBroadcast({
        message: '',
        type: 'info',
        active: true,
        isClosable: true,
        pushEnabled: false
      });
    } catch (e) {
      console.error('Failed to save broadcast', e);
    }
  };

  const getStatus = (b: Broadcast) => {
    const now = new Date();
    const start = b.startDate ? new Date(b.startDate) : null;
    const end = b.endDate ? new Date(b.endDate) : null;

    if (!b.active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500' };
    if (start && now < start) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-600' };
    if (end && now > end) return { label: 'Expired', color: 'bg-orange-100 text-orange-600' };
    return { label: 'Live Now', color: 'bg-emerald-100 text-emerald-600' };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-2">
            <Globe className="text-indigo-600" size={20} /> Site-wide Broadcasts
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Manage global announcements and push notifications</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />} 
          {isAdding ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 bg-indigo-50/50 rounded-3xl border-2 border-dashed border-indigo-100 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Message Content</label>
                  <textarea
                    value={newBroadcast.message}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                    className="w-full px-6 py-4 bg-white rounded-2xl border border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm transition-all min-h-[100px]"
                    placeholder="Enter the broadcast message..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Announcement Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { id: 'urgent', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
                      { id: 'promo', icon: Megaphone, color: 'text-amber-500', bg: 'bg-amber-50' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setNewBroadcast({ ...newBroadcast, type: type.id as any })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          newBroadcast.type === type.id 
                            ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105' 
                            : 'bg-white/50 border-transparent hover:bg-white'
                        }`}
                      >
                        <type.icon size={20} className={type.color} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{type.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 ml-2">Scheduling (Optional)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="datetime-local"
                        value={newBroadcast.startDate}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, startDate: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-indigo-100 text-[10px] outline-none"
                        placeholder="Start Date"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="datetime-local"
                        value={newBroadcast.endDate}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, endDate: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-indigo-100 text-[10px] outline-none"
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 md:col-span-2 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${newBroadcast.active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={newBroadcast.active}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, active: e.target.checked })}
                        className="hidden" 
                      />
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${newBroadcast.active ? 'left-7' : 'left-1'}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-indigo-900 transition-colors">Initially Active</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${newBroadcast.isClosable ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={newBroadcast.isClosable}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, isClosable: e.target.checked })}
                        className="hidden" 
                      />
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${newBroadcast.isClosable ? 'left-7' : 'left-1'}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-indigo-900 transition-colors">Users can Close</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${newBroadcast.pushEnabled ? 'bg-red-500' : 'bg-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={newBroadcast.pushEnabled}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, pushEnabled: e.target.checked })}
                        className="hidden" 
                      />
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${newBroadcast.pushEnabled ? 'left-7' : 'left-1'}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-600 transition-colors">Mobile Push Notification</span>
                      <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Sends to all registered devices</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-8 border-t border-indigo-100">
                <button
                  onClick={() => handleSave(newBroadcast)}
                  className="flex items-center gap-3 px-8 py-4 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
                >
                  <Save size={16} /> Publish Announcement
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {broadcasts.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-100">
              <Megaphone className="text-gray-300" size={32} />
            </div>
            <p className="text-sm font-bold text-gray-500">No active or scheduled broadcasts found.</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-2">Start by creating your first global announcement above.</p>
          </div>
        ) : (
          broadcasts.map((b: Broadcast) => {
            const status = getStatus(b);
            return (
              <motion.div
                key={b.id}
                layout
                className="group p-6 bg-white rounded-[2rem] border border-gray-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 flex flex-col md:flex-row items-start md:items-center gap-6"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  b.type === 'urgent' ? 'bg-red-50 text-red-500' : b.type === 'promo' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  {b.type === 'urgent' ? <AlertCircle size={24} /> : b.type === 'promo' ? <Megaphone size={24} /> : <Info size={24} />}
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${status.color}`}>
                      {status.label}
                    </span>
                    {b.pushEnabled && (
                      <span className="px-4 py-1.5 rounded-full bg-red-50 text-[8px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                        <Bell size={10} /> Push Sent
                      </span>
                    )}
                    {b.startDate && (
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} /> {new Date(b.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-indigo-950 leading-relaxed truncate">{b.message}</p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button
                    onClick={() => updateBroadcast(b.id, { active: !b.active })}
                    className={`p-3 rounded-xl transition-all ${b.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    title={b.active ? 'Deactivate' : 'Activate'}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteBroadcast(b.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BroadcastEditor;
