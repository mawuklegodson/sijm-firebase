import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users, TrendingUp, Calendar, Heart, ArrowUpRight, ArrowDownRight,
  Clock, Phone, MapPin, ChevronRight, KeyRound, UserMinus, UserCheck,
  ShieldCheck, AlertTriangle, CheckCircle2, Copy, X, ShieldAlert,
  Sparkles, BrainCircuit, Zap, RefreshCw, Loader2, Eye, ImageIcon,
  Activity, Globe, AlertCircle
} from 'lucide-react';
import { ReminderType, IdentityRole, WorkerPermission, User } from '../types.ts';
import { SystemActivity } from '../store.ts';
import { GoogleGenAI } from "@google/genai";
import { useIsMobile } from '../hooks/useIsMobile.ts';
import { motion } from 'framer-motion';

interface Props {
  store: any;
  navigate: (page: string) => void;
}

const AdminDashboard: React.FC<Props> = ({ store, navigate }) => {
  const { 
    attendance, firstTimers, reminders, complaints, 
    users, resetUserPassword, updateUser, settings, 
    currentUser, activities, assets, members
  } = store;
  const ui = settings.uiText;
  const isMobile = useIsMobile();

  const isSuperAdmin = currentUser?.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN);

  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiVisionUrl, setAiVisionUrl] = useState<string | null>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);

  // Advanced Markdown Formatter for Divine Intel
  const formatDivineIntel = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n').filter(l => l.trim() !== '');
    
    return lines.map((line, idx) => {
      // Handle Headers (###)
      if (line.trim().startsWith('###')) {
        return (
          <h4 key={idx} className="text-sm font-black text-indigo-900 uppercase tracking-[0.15em] mt-8 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {line.replace(/^###\s*/, '').trim()}
          </h4>
        );
      }
      
      // Handle Bullet Points
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const cleanLine = line.trim().replace(/^[*-]\s*/, '');

      // Handle Bold text **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      
      return (
        <div key={idx} className={`mb-3 flex items-start gap-3 ${isBullet ? 'pl-4' : ''}`}>
          {isBullet && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />}
          <p className="text-base leading-relaxed text-gray-700 font-medium">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="font-black text-gray-900 bg-amber-50 px-1 rounded border-b border-amber-200">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        </div>
      );
    });
  };

  const fetchAIInsights = async () => {
    if (!settings.ai.divineIntelligenceEnabled) return;
    setIsAiLoading(true);
    try {
      // Corrected: Use process.env.GEMINI_API_KEY directly as per guidelines.
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not available");
      
      const ai = new GoogleGenAI({ apiKey });
      const dataSummary = {
        churchName: settings.general.churchName,
        totalMembers: members.length,
        latestAttendance: attendance.slice(0, 5).map((a: any) => ({ date: a.date, total: a.totalCount })),
        visitorStats: { total: firstTimers.length },
        openIssues: complaints.filter((c: any) => c.status === 'Open').length
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze church growth for ${dataSummary.churchName}. 
        Context: ${settings.ai.customAiSystemPrompt}. 
        Data: ${JSON.stringify(dataSummary)}. 
        Provide 3 distinct strategic insights. 
        Formatting: Use ### for headers and **bold** for key metrics or focus terms. 
        Tone: Your response should be concise yet comprehensive and deeply professional.`,
      });
      // Corrected: Use .text property directly instead of .text().
      setAiInsights(response.text || "Insights pending...");
    } catch (error) {
      console.error("AI Insights Error:", error);
      setAiInsights("### System Alert\nDivine Intelligence engine is currently recalibrating for a more **accurate prophetic analysis**.");
    } finally { setIsAiLoading(false); }
  };

  const generateDivineVision = async () => {
    if (!settings.ai.propheticVisionsEnabled) return;
    setIsVisionLoading(true);
    try {
      // Corrected: Use process.env.GEMINI_API_KEY directly as per guidelines.
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not available");
      
      const ai = new GoogleGenAI({ apiKey });
      const currentAttendance = attendance[0]?.totalCount || 0;
      
      const prompt = `A magnificent, celestial digital painting of a church sanctuary filled with light. A glowing tree in the center whose leaves are sparks of golden light, representing a harvest of ${currentAttendance} souls. Ethereal, peaceful, inspiring, cinematic lighting, 4k, spiritual masterpiece.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        // Corrected: Recommended format for multimodal inputs.
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            setAiVisionUrl(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Vision Generation Error:", error);
    } finally { setIsVisionLoading(false); }
  };

  useEffect(() => {
    if (!aiInsights && settings.ai.divineIntelligenceEnabled) fetchAIInsights();
  }, [settings.ai.divineIntelligenceEnabled]);

  const vitalityScore = useMemo(() => {
    const attendTrend = (attendance[0]?.totalCount || 0) > (attendance[1]?.totalCount || 0) ? 10 : 0;
    const visitorFactor = Math.min(firstTimers.length * 2, 30);
    const complaintsFactor = Math.max(0, 20 - (complaints.filter((c:any)=>c.status==='Open').length * 4));
    return Math.min(100, 40 + attendTrend + visitorFactor + complaintsFactor);
  }, [attendance, firstTimers, complaints]);

  const kpis = [
    { label: 'Avg Attendance', value: Math.round(attendance.reduce((a:any,c:any)=>a+c.totalCount,0)/(attendance.length||1)), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: 12 },
    { label: 'Latest Service', value: attendance[0]?.totalCount || 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100', trend: 8 },
    { label: 'Total Souls', value: members.length + firstTimers.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: 5 },
    { label: 'Profile Updates', value: users.filter((u: any) => u.profileUpdateRequested).length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100', trend: 0 },
  ];

  const B = { navy: '#0a1a6b', royal: '#1a3acc', purple: '#7c3aed', off: '#f8faff', text: '#0f172a', muted: '#64748b' };

  const mobileStats = [
    { label: 'Members',     value: members?.length || 0,                                                            grad: `linear-gradient(135deg,${B.navy},${B.royal})` },
    { label: 'Attendance',  value: attendance?.[0]?.totalCount || 0,                                                grad: `linear-gradient(135deg,#065f46,#059669)` },
    { label: 'First Timers',value: firstTimers?.length || 0,                                                        grad: `linear-gradient(135deg,#d97706,#92400e)` },
    { label: 'Open Issues', value: complaints?.filter((c: any) => c.status === 'Open').length || 0,                 grad: `linear-gradient(135deg,#be185d,#e11d48)` },
  ];

  const mobileActions = [
    { id: 'members',      label: 'Members',      Icon: Users },
    { id: 'attendance',   label: 'Attendance',   Icon: Clock },
    { id: 'first_timers', label: 'First Timers', Icon: Users },
    { id: 'announcements',label: 'Announce',     Icon: AlertCircle },
    { id: 'reports',      label: 'Reports',      Icon: TrendingUp },
    { id: 'settings',     label: 'Settings',     Icon: ShieldCheck },
  ];

  if (isMobile) {
    return (
      <div className="pb-6" style={{ background: B.off }}>
        <div className="px-4 pt-2 pb-8"
             style={{ background: `linear-gradient(135deg,${B.navy},${B.royal})` }}>
          <p className="text-white/70 text-[11px] mb-1">{ui?.admin_dash_subtitle || 'Ministry overview'}</p>
          <h2 className="text-white font-black text-[20px]">{ui?.admin_dash_title || 'Admin Dashboard'}</h2>
        </div>
        <div className="-mt-4 rounded-t-3xl pt-4" style={{ background: B.off }}>
          <div className="grid grid-cols-2 gap-3 px-4 mb-4">
            {mobileStats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4 text-white" style={{ background: s.grad }}>
                <p className="text-[22px] font-black">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="px-4 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: B.muted }}>Quick Navigation</p>
            <div className="grid grid-cols-3 gap-2">
              {mobileActions.map(a => (
                <button key={a.id} onClick={() => navigate(a.id)}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white border border-slate-100 active:scale-95 transition-all">
                  <a.Icon size={18} style={{ color: B.royal }} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: B.muted }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          {activities?.length > 0 && (
            <div className="px-4">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: B.muted }}>Recent Activity</p>
              <div className="space-y-2">
                {activities.slice(0, 6).map((act: any, idx: number) => (
                  <div key={act.id || idx} className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: B.off }}>
                      <Activity size={14} style={{ color: B.royal }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold line-clamp-1" style={{ color: B.text }}>{act.description || act.title}</p>
                      <p className="text-[9px]" style={{ color: B.muted }}>{act.time || act.date || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-20 max-w-full mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-poppins tracking-tight">{ui.admin_dash_title}</h2>
            <p className="text-gray-500 text-sm">{ui.admin_dash_subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
             <button 
                onClick={() => navigate('prayer')}
                className="bg-rose-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-rose-200 flex items-center gap-2 hover:scale-105 transition-all flex-1 sm:flex-none justify-center"
             >
                <Heart size={14} className="sm:size-16" />
                Send Prayer Request
             </button>
             {isSuperAdmin && (
               <button 
                  onClick={() => navigate('landing_editor')}
                  className="bg-white border border-gray-200 text-gray-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-all flex-1 sm:flex-none justify-center"
               >
                  <Globe size={14} className="sm:size-16" />
                  Landing Page CMS
               </button>
             )}
             {settings.ai.propheticVisionsEnabled && (
               <button 
                  onClick={generateDivineVision}
                  disabled={isVisionLoading}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 flex items-center gap-2 hover:scale-105 transition-all flex-1 sm:flex-none justify-center"
               >
                  {isVisionLoading ? <Loader2 size={14} className="animate-spin sm:size-16" /> : <Eye size={14} className="sm:size-16" />}
                  Prophetic Vision
               </button>
             )}
          </div>
        </div>

        {aiVisionUrl && (
          <div className="relative group rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl animate-in zoom-in-95 duration-500">
             <img src={aiVisionUrl} alt="Divine Vision" className="w-full aspect-[21/9] object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div>
                   <h3 className="text-2xl font-bold text-white font-poppins">Ethereal Vision of Growth</h3>
                   <p className="text-white/70 text-sm mt-2 max-w-2xl">Reflecting spiritual momentum within {settings.general.churchName}.</p>
                </div>
             </div>
             <button onClick={() => setAiVisionUrl(null)} className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors"><X size={20}/></button>
          </div>
        )}

        {settings.ai.divineIntelligenceEnabled && (
          <div className="relative overflow-hidden glass-card rounded-[2.5rem] border border-indigo-100 shadow-2xl">
            <div className="flex flex-col md:flex-row min-h-[300px]">
              <div className="md:w-1/4 bg-primary p-10 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 shadow-2xl border border-white/20 overflow-hidden">
                    {settings.ai.aiLogoUrl ? (
                      <img src={settings.ai.aiLogoUrl} alt="AI Personality" className="w-full h-full object-cover" />
                    ) : (
                      <BrainCircuit size={40} className="text-white animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-poppins">Divine Intel</h3>
                  <p className="text-[9px] uppercase tracking-widest font-black text-indigo-200 mt-2">Gemini 3 Pro Active</p>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400/10 rounded-full" />
              </div>
              
              <div className="flex-1 p-10 bg-white/40 backdrop-blur-sm">
                {isAiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="relative">
                      <Loader2 size={40} className="text-primary animate-spin" />
                      <Sparkles size={16} className="text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling Ministry Strategy...</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">Growth Analysis</div>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                      {formatDivineIntel(aiInsights || "")}
                    </div>
                    <button 
                      onClick={fetchAIInsights}
                      className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <RefreshCw size={12} /> Recalibrate Insights
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 sm:p-10 rounded-enhanced shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex items-start justify-between">
              <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={26} />
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-black ${kpi.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(kpi.trend)}%
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">{kpi.label}</h3>
              <p className="text-3xl font-black text-gray-900 mt-1">{kpi.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
         <div className="bg-white p-6 sm:p-8 rounded-enhanced shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg font-bold text-gray-900 font-poppins flex items-center gap-3">
                <Clock size={20} className="text-primary" />
                Urgent Tasks
              </h3>
            </div>
            <div className="space-y-4">
              {reminders.filter((r: any) => r.status === 'Pending').slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-lg transition-all group">
                  <div className={`p-3 rounded-xl transition-colors ${r.type === ReminderType.CALL ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'}`}>
                    {r.type === ReminderType.CALL ? <Phone size={18} /> : <MapPin size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{r.firstTimerName}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">{r.date} • {r.time}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-enhanced shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 font-poppins mb-6 sm:mb-8 flex items-center gap-3">
              <ShieldCheck size={20} className="text-primary" />
              Active Logins
            </h3>
            <div className="space-y-4">
              {users.filter((u: User) => u.status === 'active').slice(0, 5).map((u: User) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-lg transition-all">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black bg-indigo-50 text-indigo-600">
                       {u.fullName.charAt(0)}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-900">{u.fullName}</p>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">@{u.username}</p>
                     </div>
                   </div>
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-enhanced shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 font-poppins mb-6 sm:mb-8">Global Activity Audit</h3>
            <div className="space-y-5 max-h-[350px] overflow-y-auto pr-3 no-scrollbar">
              {activities.slice(0, 10).map((activity: SystemActivity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    activity.type === 'SECURITY' ? 'bg-indigo-600' :
                    activity.type === 'ATTENDANCE' ? 'bg-emerald-500' :
                    activity.type === 'VISITOR' ? 'bg-amber-500' : 'bg-gray-300'
                  }`} />
                  <div className="min-w-0 flex-1">
                     <p className="text-xs font-bold text-gray-800 leading-snug">{activity.details}</p>
                     <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-1">
                       {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activity.user}
                     </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;