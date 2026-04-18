
import React, { useState, useMemo } from 'react';
import { SERVICE_TYPES, BRANCHES, ATTENDANCE_SEGMENTS } from '../constants.tsx';
import { Plus, Table, CheckCircle, Calculator, WifiOff, Save, ChevronLeft, AlertCircle, Loader2, Trash2, Edit, MapPin, Layers, Filter } from 'lucide-react';
import { WorkerPermission } from '../types.ts';

interface Props {
  store: any;
  isUsherView?: boolean;
  navigate?: (page: string) => void;
}

const AttendancePage: React.FC<Props> = ({ store, isUsherView, navigate }) => {
  const ui = store.settings.uiText;
  const { currentUser, attendance, addAttendance, updateAttendance, deleteAttendance, settings } = store;
  
  const serviceTypes = settings?.serviceTypes || SERVICE_TYPES;
  const branches = settings?.branches || BRANCHES;
  const attendanceSegments = settings?.attendanceSegments || ATTENDANCE_SEGMENTS;

  const [showForm, setShowForm] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    serviceType: serviceTypes[0],
    branch: currentUser?.branch || branches[0],
    segmentName: attendanceSegments[0],
    maleCount: '',
    femaleCount: '',
    childrenCount: '',
    notes: '',
  });
  
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'logs' | 'summary'>('summary');
  const [filterBranch, setFilterBranch] = useState('All');

  const total = Number(formData.maleCount || 0) + Number(formData.femaleCount || 0) + Number(formData.childrenCount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setStatus('idle');
    
    const payload = {
      date: formData.date,
      serviceType: formData.serviceType,
      branch: formData.branch,
      segmentName: formData.segmentName,
      maleCount: Number(formData.maleCount),
      femaleCount: Number(formData.femaleCount),
      childrenCount: Number(formData.childrenCount),
      totalCount: total,
      notes: formData.notes,
    };

    let result;
    if (editingId) {
      const success = await updateAttendance(editingId, payload);
      result = success ? 'saved' : 'error';
    } else {
      result = await addAttendance(payload);
    }
    
    setIsSyncing(false);
    
    if (result === 'saved') {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setEditingId(null);
        if (!isUsherView) setShowForm(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          serviceType: serviceTypes[0],
          branch: currentUser?.branch || branches[0],
          segmentName: attendanceSegments[0],
          maleCount: '',
          femaleCount: '',
          childrenCount: '',
          notes: '',
        });
      }, 2000);
    } else {
      setStatus('error');
    }
  };

  const handleEdit = (rec: any) => {
    setEditingId(rec.id);
    setFormData({
      date: rec.date,
      serviceType: rec.serviceType,
      branch: rec.branch,
      segmentName: rec.segmentName,
      maleCount: rec.maleCount.toString(),
      femaleCount: rec.femaleCount.toString(),
      childrenCount: rec.childrenCount.toString(),
      notes: rec.notes || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      await deleteAttendance(id);
    }
  };

  const branchSummaries = useMemo(() => {
    const summaries: Record<string, any> = {};
    
    attendance.forEach((rec: any) => {
      const key = `${rec.date}_${rec.serviceType}_${rec.branch}`;
      if (!summaries[key]) {
        summaries[key] = {
          date: rec.date,
          serviceType: rec.serviceType,
          branch: rec.branch,
          male: 0,
          female: 0,
          children: 0,
          total: 0,
          logs: []
        };
      }
      summaries[key].male += rec.maleCount;
      summaries[key].female += rec.femaleCount;
      summaries[key].children += rec.childrenCount;
      summaries[key].total += rec.totalCount;
      summaries[key].logs.push(rec);
    });
    
    return Object.values(summaries).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance]);

  const filteredLogs = useMemo(() => {
    return attendance.filter((a: any) => filterBranch === 'All' || a.branch === filterBranch);
  }, [attendance, filterBranch]);

  const canEdit = (rec: any) => {
    return currentUser?.id === rec.recordedById || currentUser?.workerPermissions.includes(WorkerPermission.SUPER_ADMIN);
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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 font-poppins">{ui.attendance_page_title}</h2>
              {!store.isOnline && (
                <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <WifiOff size={10} /> Offline
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{ui.attendance_page_desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowForm(!showForm); if(showForm) setEditingId(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
              showForm ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {showForm ? <Table size={18} /> : <Plus size={18} />}
            {showForm ? 'View Registry' : 'New Entry'}
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 mb-10">
            <div className="bg-indigo-900 p-10 text-white flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-2xl font-bold font-poppins tracking-tight">{editingId ? 'Edit Record' : 'Protocol Registry'}</h3>
                <p className="text-indigo-200 text-xs mt-2 uppercase font-black tracking-widest">
                  {editingId ? 'Modifying existing entry' : 'Service Headcount Intake'}
                </p>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <Calculator size={32} className="text-indigo-300" />
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
              {status === 'success' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
                  <CheckCircle size={20} />
                  <span className="font-bold text-sm">Attendance synced with ministry portal!</span>
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <span className="font-bold text-sm">Sync Error: Verify your database connection.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Service Tier</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none font-bold"
                  >
                    {serviceTypes.map((st: string) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ministry Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none font-bold"
                  >
                    {branches.map((b: string) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Counting Segment</label>
                  <select
                    value={formData.segmentName}
                    onChange={(e) => setFormData({...formData, segmentName: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none font-bold"
                  >
                    {attendanceSegments.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Males', key: 'maleCount', bg: 'bg-indigo-50/50', border: 'focus:border-indigo-600' },
                  { label: 'Females', key: 'femaleCount', bg: 'bg-pink-50/50', border: 'focus:border-pink-600' },
                  { label: 'Children', key: 'childrenCount', bg: 'bg-amber-50/50', border: 'focus:border-amber-600' },
                ].map((input) => (
                  <div key={input.key}>
                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-3 tracking-widest text-center">{input.label}</label>
                    <input
                      type="number"
                      required
                      value={formData[input.key as keyof typeof formData]}
                      onChange={(e) => setFormData({...formData, [input.key]: e.target.value})}
                      className={`w-full text-center px-2 py-5 text-2xl font-black ${input.bg} border-2 border-transparent ${input.border} rounded-[2rem] outline-none transition-all`}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">Segment Total</p>
                    <p className="text-sm font-medium text-indigo-300">Audited Sum</p>
                  </div>
                </div>
                <div className="text-5xl font-black font-poppins">{total}</div>
              </div>

              <div className="pt-4 flex gap-4">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setShowForm(false); }}
                    className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-lg uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSyncing}
                  className={`flex-[2] py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${
                    isSyncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {isSyncing ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {isSyncing ? 'Synchronizing...' : (editingId ? 'Update Record' : 'Confirm Submission')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex p-1 bg-gray-50 rounded-xl">
              <button 
                onClick={() => setViewMode('summary')}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                Branch Summary
              </button>
              <button 
                onClick={() => setViewMode('logs')}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                Detailed Logs
              </button>
            </div>
            
            {viewMode === 'logs' && (
              <div className="flex items-center gap-3 px-4">
                <Filter size={16} className="text-gray-400" />
                <select 
                  value={filterBranch} 
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="text-xs font-bold text-gray-600 bg-transparent outline-none"
                >
                  <option value="All">All Branches</option>
                  {branches.map((b: string) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}
          </div>

          {viewMode === 'summary' ? (
            <div className="grid grid-cols-1 gap-6">
              {branchSummaries.map((summary: any, idx: number) => (
                <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-tight">{summary.branch}</h4>
                        <p className="text-xs text-gray-500 font-medium">{summary.date} • {summary.serviceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Segments</p>
                        <p className="text-lg font-black text-indigo-600">{summary.logs.length}</p>
                      </div>
                      <div className="h-8 w-[1px] bg-gray-200" />
                      <div className="text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Branch Total</p>
                        <p className="text-2xl font-black text-gray-900">{summary.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Males</p>
                        <p className="text-xl font-black text-indigo-700">{summary.male}</p>
                      </div>
                      <div className="bg-pink-50/30 p-4 rounded-2xl border border-pink-100/50">
                        <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">Females</p>
                        <p className="text-xl font-black text-pink-700">{summary.female}</p>
                      </div>
                      <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Children</p>
                        <p className="text-xl font-black text-amber-700">{summary.children}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Segment Breakdown</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {summary.logs.map((log: any) => (
                          <div key={log.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                            <div className="flex items-center gap-2">
                              <Layers size={14} className="text-gray-400" />
                              <span className="text-xs font-bold text-gray-700">{log.segmentName}</span>
                            </div>
                            <span className="text-xs font-black text-indigo-600">{log.totalCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {branchSummaries.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <Calculator size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No branch summaries available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Audit Date</th>
                      <th className="px-8 py-5">Branch / Segment</th>
                      <th className="px-8 py-5">Service Tier</th>
                      <th className="px-8 py-5">Breakdown</th>
                      <th className="px-8 py-5">Total</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((rec: any) => (
                      <tr key={rec.id} className="hover:bg-indigo-50/20 transition-colors group">
                        <td className="px-8 py-5 text-sm font-bold text-gray-900 whitespace-nowrap">{rec.date}</td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{rec.branch}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{rec.segmentName}</p>
                        </td>
                        <td className="px-8 py-5 text-xs font-medium text-gray-500 whitespace-nowrap uppercase tracking-widest">{rec.serviceType}</td>
                        <td className="px-8 py-5 text-xs text-gray-400 font-bold">
                          M: {rec.maleCount} • F: {rec.femaleCount} • C: {rec.childrenCount}
                        </td>
                        <td className="px-8 py-5">
                           <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-black border border-indigo-100">{rec.totalCount}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {canEdit(rec) && (
                              <>
                                <button onClick={() => handleEdit(rec)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(rec.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">No detailed logs found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
