import React, { useEffect } from 'react';
import { WorkerPermission } from '../types.ts';
import {
  PlusCircle, UserPlus, AlertTriangle, Users, ArrowRight,
  Bell, UserX, Megaphone, ShieldCheck, Activity, RefreshCw,
  Globe, Heart, Clock, TrendingUp, ChevronRight, Sparkles, Hand
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '../hooks/useIsMobile.ts';

const B = {
  navy: '#0a1a6b', royal: '#1a3acc', purple: '#7c3aed',
  gold: '#f59e0b', white: '#ffffff', off: '#f8faff',
  text: '#0f172a', muted: '#64748b',
};

interface Props { store: any; navigate: (page: string) => void; }

const UsherDashboard: React.FC<Props> = ({ store, navigate }) => {
  const { currentUser, attendance, firstTimers, settings, refresh, announcements = [] } = store;
  const isMobile = useIsMobile();
  const ui = settings?.uiText || {};

  useEffect(() => { refresh?.(); }, []);

  const perms: WorkerPermission[] = currentUser?.workerPermissions || [];
  const isUsher      = perms.includes(WorkerPermission.USHER);
  const isPrayerTeam = perms.includes(WorkerPermission.PRAYER_TEAM) || perms.includes(WorkerPermission.PRAYER_HEAD);
  const isSuperAdmin = perms.includes(WorkerPermission.SUPER_ADMIN);

  const myActivity   = (attendance.filter((a: any) => a.recordedBy === currentUser?.fullName).length) +
                       (firstTimers.filter((f: any) => f.recordedBy === currentUser?.fullName).length);
  const latestAttend = attendance[0]?.totalCount || 0;
  const latestFT     = firstTimers.slice(-7).length;
  const briefing     = announcements.filter((a: any) => a.status === 'Approved')[0];

  type Action = { id: string; label: string; desc: string; icon: React.ReactNode; grad: string };
  const actions: Action[] = [
    isUsher      && { id: 'record_attendance', label: 'Record Attendance',   desc: 'Log service headcount',               icon: <PlusCircle size={20} />,   grad: `linear-gradient(135deg,${B.navy},${B.royal})` },
    isUsher      && { id: 'first_timers',      label: 'Register First Timer', desc: 'Add a new visitor',                   icon: <UserPlus size={20} />,     grad: `linear-gradient(135deg,#d97706,#f59e0b)` },
    isUsher      && { id: 'my-members',        label: 'Members',              desc: 'View and manage members',             icon: <Users size={20} />,        grad: `linear-gradient(135deg,#4f46e5,${B.purple})` },
    isUsher      && { id: 'absentees',         label: 'Log Absentee',         desc: 'Report missing member',               icon: <UserX size={20} />,        grad: `linear-gradient(135deg,#be185d,#e11d48)` },
                    { id: 'prayer',            label: 'Prayer Request',       desc: 'Submit a spiritual need',             icon: <Heart size={20} />,        grad: `linear-gradient(135deg,#dc2626,#ef4444)` },
    isPrayerTeam && { id: 'prayer_requests',   label: 'Prayer Wall',          desc: 'Review and intercede on requests',    icon: <Hand size={20} />,         grad: `linear-gradient(135deg,#7c2d12,#c2410c)` },
    isUsher      && { id: 'announcements',     label: 'Post Announcement',    desc: 'Notify the congregation',             icon: <Megaphone size={20} />,    grad: `linear-gradient(135deg,#065f46,#059669)` },
                    { id: 'complaints',        label: 'Report an Issue',      desc: 'Facility or security concerns',       icon: <AlertTriangle size={20} />, grad: `linear-gradient(135deg,#374151,#6b7280)` },
    isSuperAdmin && { id: 'landing_editor',    label: 'Website CMS',          desc: 'Manage public landing page',          icon: <Globe size={20} />,        grad: `linear-gradient(135deg,#1e3a8a,#1d4ed8)` },
  ].filter(Boolean) as Action[];

  const stats = [
    { label: 'My Activity',  value: myActivity,   icon: <Activity size={14} className="text-white" />,      grad: `linear-gradient(135deg,${B.royal},${B.navy})` },
    { label: 'Latest Att.',  value: latestAttend, icon: <TrendingUp size={14} className="text-white" />,    grad: `linear-gradient(135deg,#059669,#065f46)` },
    { label: 'New Visitors', value: latestFT,     icon: <Sparkles size={14} className="text-yellow-200" />, grad: `linear-gradient(135deg,#d97706,#92400e)` },
  ];

  // ── MOBILE ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen pb-28" style={{ background: B.off }}>
        <div className="px-4 pt-4 pb-10" style={{ background: `linear-gradient(135deg,${B.navy},${B.royal})` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-yellow-300" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Staff Portal</span>
            </div>
            <button onClick={refresh}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <RefreshCw size={13} className="text-white" />
            </button>
          </div>
          <p className="text-white/70 text-[12px]">Welcome back,</p>
          <p className="text-white font-black text-[22px]">{currentUser?.fullName?.split(' ')[0] || 'Usher'} 👋</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {perms.slice(0, 3).map((p: string) => (
              <span key={p} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                {p.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="-mt-5 rounded-t-3xl pt-4" style={{ background: B.off }}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 px-4 mb-4">
            {stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-3 flex flex-col items-center text-center text-white"
                style={{ background: s.grad }}>
                {s.icon}
                <p className="text-[20px] font-black leading-tight mt-1">{s.value}</p>
                <p className="text-[8px] font-black uppercase tracking-wide text-white/60 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {briefing && (
            <div className="mx-4 mb-4 rounded-2xl p-4"
                 style={{ background: `linear-gradient(135deg,${B.navy},${B.purple})` }}>
              <div className="flex items-center gap-2 mb-1">
                <Bell size={10} className="text-yellow-300" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Briefing</span>
              </div>
              <p className="text-white font-bold text-[12px] leading-snug line-clamp-2">{briefing.title}</p>
            </div>
          )}

          <div className="px-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: B.muted }}>Your Actions</p>
            {actions.map((a, i) => (
              <motion.button key={a.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate(a.id)}
                className="w-full flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 text-left hover:shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white"
                     style={{ background: a.grad }}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[13px]" style={{ color: B.text }}>{a.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: B.muted }}>{a.desc}</p>
                </div>
                <ChevronRight size={14} style={{ color: B.muted }} />
              </motion.button>
            ))}
          </div>

          <div className="mx-4 mt-4 p-4 rounded-2xl" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-yellow-700 mb-1">Sync Reminder</p>
            <p className="text-[11px] text-yellow-800 leading-relaxed font-medium">
              Ensure all first-timer forms include Residential Area for accurate pastoral follow-up mapping.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP ────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-full mx-auto animate-in fade-in duration-700">
      <div className="rounded-3xl p-10 text-white relative overflow-hidden"
           style={{ background: `linear-gradient(135deg,${B.navy},${B.royal} 60%,${B.purple})` }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle,white,transparent)' }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <ShieldCheck size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Authorized Access Active</span>
            </div>
            <p className="text-white/70 text-sm">{ui.usher_dash_welcome || 'Welcome back,'}</p>
            <h2 className="text-3xl font-black mt-1">{currentUser?.fullName}</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {stats.map(s => (
              <div key={s.label} className="rounded-2xl p-5 border border-white/10 min-w-[120px]"
                   style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-white/60 text-[9px] uppercase font-black tracking-widest mb-1">{s.label}</p>
                <p className="text-3xl font-black">{s.value}</p>
              </div>
            ))}
            <button onClick={refresh}
              className="self-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((a, i) => (
          <motion.button key={a.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate(a.id)}
            className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 text-left hover:shadow-lg hover:border-slate-200 transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white"
                 style={{ background: a.grad }}>{a.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[13px]" style={{ color: B.text }}>{a.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: B.muted }}>{a.desc}</p>
            </div>
            <ArrowRight size={14} style={{ color: B.muted }} />
          </motion.button>
        ))}
      </div>

      <div className="p-6 rounded-2xl" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
        <div className="flex items-center gap-3 text-yellow-800 mb-2">
          <Bell size={16} /><h4 className="font-black text-xs uppercase tracking-widest">Sync Reminder</h4>
        </div>
        <p className="text-sm text-yellow-800 font-medium leading-relaxed">
          Ensure all first-timer forms include Residential Area for accurate pastoral follow-up mapping.
        </p>
      </div>
    </div>
  );
};

export default UsherDashboard;
