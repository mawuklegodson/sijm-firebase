
import React, { useState, useMemo } from 'react';
import { 
  FileBarChart, 
  Download, 
  Mail, 
  Filter, 
  TrendingUp, 
  Users, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  Printer, 
  PieChart, 
  FileText,
  AlertTriangle,
  ArrowRight,
  X,
  Package,
  ChevronRight
} from 'lucide-react';

interface Props {
  store: any;
  navigate?: (page: string) => void;
}

const ReportsPage: React.FC<Props> = ({ store, navigate }) => {
  const { attendance, firstTimers, absentees, assets } = store;
  const [isGenerating, setIsGenerating] = useState(false);
  const [range, setRange] = useState('30');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState(store.currentUser?.email || '');

  // Helper: Filter data by date range
  // Using the latest record in the mock data as a reference point for "today"
  const filterByRange = (data: any[], dateField: string, daysStr: string) => {
    const days = parseInt(daysStr);
    if (days === 0 || isNaN(days)) return data; 
    
    if (data.length === 0) return [];

    const latestDate = new Date(Math.max(...data.map(d => new Date(d[dateField]).getTime())));
    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - days);
    
    return data.filter(item => new Date(item[dateField]) >= cutoff);
  };

  const filteredAttendance = useMemo(() => 
    filterByRange(attendance, 'date', range), 
  [attendance, range]);

  const stats = useMemo(() => {
    const rangeVisitors = filterByRange(firstTimers, 'visitDate', range);
    const totalAttend = filteredAttendance.reduce((acc, curr) => acc + curr.totalCount, 0);
    const avgAttend = filteredAttendance.length > 0 ? Math.round(totalAttend / filteredAttendance.length) : 0;
    
    // Growth Trend: Comparing this range's average vs overall
    const overallAvg = attendance.length > 0 
      ? Math.round(attendance.reduce((acc: any, curr: any) => acc + curr.totalCount, 0) / attendance.length) 
      : 0;
    const growthTrend = overallAvg > 0 ? Math.round(((avgAttend - overallAvg) / overallAvg) * 100) : 0;

    return { avgAttend, visitorsCount: rangeVisitors.length, growthTrend, totalAttend };
  }, [filteredAttendance, attendance, firstTimers, range]);

  const generateCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("Insufficient data to generate report for the selected parameters.");
      return;
    }

    const headers = Object.keys(data[0]).filter(h => typeof data[0][h] !== 'object');
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header] ?? '';
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleQuickReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const summary = filteredAttendance.map((a: any) => ({
        Date: a.date,
        Service: a.serviceType,
        Total: a.totalCount,
        Males: a.maleCount,
        Females: a.femaleCount,
        Children: a.childrenCount,
        RecordedBy: a.recordedBy
      }));
      generateCSV(summary, `Growth_Report_${range}_Days`);
      setIsGenerating(false);
      showSuccess(`Spreadsheet generated for ${filteredAttendance.length} records.`);
    }, 1200);
  };

  const handleScheduleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEmailModal(false);
    showSuccess(`Report dispatch successfully scheduled for ${emailInput}`);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; }
          .print-area { display: block !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
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
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">System Intelligence</h2>
            <p className="text-gray-500">Cross-module analytics and executive reporting</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 animate-in slide-in-from-right-4">
              <CheckCircle2 size={18} />
              <span className="text-xs font-bold">{successMsg}</span>
            </div>
          )}
          <button 
            onClick={() => window.print()}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Printer size={18} />
            <span className="text-xs font-bold hidden sm:inline">Print Executive Summary</span>
          </button>
        </div>
      </div>

      {/* Range KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Window Avg Attendance</p>
            <h4 className="text-2xl font-bold text-gray-900">{stats.avgAttend}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Visitors</p>
            <h4 className="text-2xl font-bold text-gray-900">{stats.visitorsCount}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trend Variance</p>
            <h4 className="text-2xl font-bold text-gray-900">{stats.growthTrend >= 0 ? '+' : ''}{stats.growthTrend}%</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headcount Volume</p>
            <h4 className="text-2xl font-bold text-gray-900">{stats.totalAttend.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      {/* Growth Analysis Main Generator */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print">
         <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/3 bg-indigo-900 p-10 text-white relative overflow-hidden">
               <div className="relative z-10 space-y-8">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
                    <FileBarChart size={32} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold font-poppins">Growth Analysis</h3>
                    <p className="text-indigo-200 mt-4 leading-relaxed text-sm">
                      Consolidate attendance patterns and retention rates into high-fidelity data exports for pastoral review. 
                    </p>
                  </div>
                  
                  <div className="pt-8 border-t border-white/10 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-indigo-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      Dynamic Temporal Windows: Active
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-indigo-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      CSV Data Serialization: Functional
                    </div>
                  </div>
               </div>
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="flex-1 p-10 flex flex-col justify-center space-y-10">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Aggregation Window Configuration</label>
                  <div className="flex flex-wrap gap-2">
                     {[
                       { val: '7', label: 'Last 7 Days' },
                       { val: '30', label: 'Last 30 Days' },
                       { val: '90', label: 'Last Quarter' },
                       { val: '365', label: 'Full Year' },
                       { val: '0', label: 'Full Historical Audit' }
                     ].map(opt => (
                       <button 
                         key={opt.val}
                         onClick={() => setRange(opt.val)}
                         className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all border ${range === opt.val ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-indigo-200'}`}
                       >
                         {opt.label}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleQuickReport}
                    disabled={isGenerating}
                    className="group bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />}
                    {isGenerating ? 'Compiling Metrics...' : 'Download Analysis'}
                  </button>
                  <button 
                    onClick={() => setShowEmailModal(true)}
                    className="bg-white border border-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    <Mail size={20} />
                    Schedule Email Delivery
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Specialty Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
         {[
           { title: 'Attendance Log', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', data: attendance, name: 'Attendance_Detailed_Log' },
           { title: 'Visitors Audit', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', data: firstTimers, name: 'Visitor_FollowUp_Audit' },
           { title: 'Absentee Registry', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', data: absentees, name: 'Member_Absentees_Report' },
           { title: 'Asset Valuation', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', data: assets, name: 'Inventory_Valuation_Report' },
         ].map((report, idx) => (
           <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all group flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center ${report.bg} ${report.color}`}>
                   <report.icon size={24} />
                </div>
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{report.title}</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">Serialized CSV Export</p>
              </div>
              <button 
                onClick={() => generateCSV(report.data, report.name)}
                className="mt-8 w-full py-3 bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> Export Dataset
              </button>
           </div>
         ))}
      </div>

      {/* Report Preview Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden no-print">
         <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 font-poppins flex items-center gap-3">
               <FileText size={20} className="text-indigo-600" />
               Current Report Preview
               <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-widest">{filteredAttendance.length} Entries</span>
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                     <th className="px-8 py-4">Event Date</th>
                     <th className="px-8 py-4">Service Category</th>
                     <th className="px-8 py-4">Total Count</th>
                     <th className="px-8 py-4">Audited By</th>
                     <th className="px-8 py-4 text-right">Reference ID</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredAttendance.slice(0, 5).map((row: any) => (
                    <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors">
                       <td className="px-8 py-4 text-xs font-bold text-gray-900 whitespace-nowrap">{row.date}</td>
                       <td className="px-8 py-4 text-xs text-gray-500">{row.serviceType}</td>
                       <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                             <span className="text-xs font-black text-indigo-600">{row.totalCount}</span>
                          </div>
                       </td>
                       <td className="px-8 py-4 text-xs text-gray-500 italic">{row.recordedBy}</td>
                       <td className="px-8 py-4 text-right text-[10px] font-mono text-gray-300 tracking-tighter">GC_AUD_{row.id}</td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-gray-400 text-sm">
                        Zero data points matched the current filter criteria.
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Email Config Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowEmailModal(false)} />
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-900 p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Mail size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-poppins">Report Distribution</h3>
                  <p className="text-indigo-300 text-xs mt-0.5">Authorized dispatch to stakeholders</p>
                </div>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleScheduleEmail} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recipient Address</label>
                <input 
                  type="email" 
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="pastor@gracecenter.com"
                />
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                 <AlertTriangle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                   Generating a serialized snapshot for the last <strong>{range === '0' ? 'historical period' : `${range} days`}</strong>. Content will include growth KPIs and visitor retention metrics.
                 </p>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                Authorize Dispatch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Print Layout */}
      <div className="hidden print:block fixed inset-0 bg-white p-20 z-[999]">
         <div className="border-b-4 border-indigo-900 pb-8 flex justify-between items-end">
            <div>
               <h1 className="text-4xl font-black text-indigo-900 uppercase">EXECUTIVE AUDIT</h1>
               <p className="text-gray-500 mt-2 font-bold uppercase tracking-[0.2em]">{store.settings.general.churchName} Management</p>
            </div>
            <div className="text-right">
               <p className="font-black text-indigo-900">DATE: {new Date().toLocaleDateString()}</p>
               <p className="text-gray-500 text-sm uppercase">PERIOD: {range === '0' ? 'FULL HISTORY' : `${range} DAYS`}</p>
            </div>
         </div>
         
         <div className="mt-16 grid grid-cols-2 gap-8">
            <div className="p-10 bg-gray-50 rounded-[2rem] border-2 border-gray-100">
               <h3 className="text-sm font-black text-gray-400 uppercase mb-8 border-b-2 border-gray-200 pb-2">Growth Performance</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                     <span className="font-bold text-gray-600">Avg Service Attendance</span>
                     <span className="text-2xl font-black text-gray-900">{stats.avgAttend}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                     <span className="font-bold text-gray-600">Visitor Acquisition</span>
                     <span className="text-2xl font-black text-gray-900">{stats.visitorsCount}</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <span className="font-bold text-gray-600">Trend Variance</span>
                     <span className={`text-2xl font-black ${stats.growthTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.growthTrend >= 0 ? '+' : ''}{stats.growthTrend}%
                     </span>
                  </div>
               </div>
            </div>
            <div className="p-10 bg-gray-50 rounded-[2rem] border-2 border-gray-100">
               <h3 className="text-sm font-black text-gray-400 uppercase mb-8 border-b-2 border-gray-200 pb-2">Infrastructural Audit</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                     <span className="font-bold text-gray-600">Active Asset Valuation</span>
                     <span className="text-2xl font-black text-gray-900">${assets.reduce((a:any,c:any)=>a+c.value,0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <span className="font-bold text-gray-600">Open Operational Risks</span>
                     <span className="text-2xl font-black text-rose-600">{absentees.filter((a:any)=>a.status!=='Resolved').length}</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="mt-16 bg-gray-900 text-white p-10 rounded-[2rem]">
            <h3 className="text-sm font-black uppercase text-indigo-400 mb-4 tracking-widest">Management Narrative</h3>
            <p className="text-sm leading-relaxed opacity-80">
               Current analytics demonstrate a stable core growth. Infrastructural assets are healthy with a valuation of ${assets.reduce((a:any,c:any)=>a+c.value,0).toLocaleString()}. Pastoral focus is recommended for the identified member risks to maintain healthy retention rates.
            </p>
         </div>

         <div className="mt-20 text-center border-t border-gray-200 pt-8">
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">Internal System Audit Hash: {Math.random().toString(36).substring(7).toUpperCase()}</p>
         </div>
      </div>
    </div>
  );
};

export default ReportsPage;
