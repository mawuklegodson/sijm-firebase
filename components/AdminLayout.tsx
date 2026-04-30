import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, WorkerPermission } from '../types.ts';
import { formatImageUrl } from '../store.ts';
import NotificationBell from './NotificationBell.tsx';
import { useIsMobile } from '../hooks/useIsMobile.ts';
const logoImg = '/assets/logo.png';
import {
  LayoutDashboard, Users, Clock, AlertCircle, Package, LogOut,
  Menu, X, CalendarCheck, UserX, Megaphone, FileBarChart, Settings,
  ShieldCheck, UserSquare2, Download, Globe, Heart, MessageSquare,
  Radio, BookOpen, Home, MoreHorizontal, ChevronRight,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  store?: any;
  showInstallButton?: boolean;
  onInstall?: () => void;
}

const B = {
  navy: '#0a1a6b', royal: '#1a3acc', purple: '#7c3aed',
  white: '#ffffff', off: '#f8faff', text: '#0f172a', muted: '#64748b',
};

const AdminLayout: React.FC<Props> = ({
  children, currentUser, onLogout, currentPage, setCurrentPage,
  store, showInstallButton, onInstall,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen,    setMoreOpen]    = useState(false);
  const isMobile = useIsMobile();

  const terminology = store?.settings?.terminology;
  const general     = store?.settings?.general;
  const branding    = store?.settings?.branding;
  const isSuperAdmin = currentUser.workerPermissions.includes(WorkerPermission.SUPER_ADMIN);

  const menuItems = useMemo(() => [
    { id: 'dashboard',      label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'landing',        label: 'Website',      icon: Globe },
    { id: 'attendance',     label: terminology?.servicePlural || 'Attendance',   icon: Clock },
    { id: 'members',        label: terminology?.memberPlural  || 'Members',      icon: UserSquare2 },
    { id: 'first_timers',   label: terminology?.firstTimerPlural || 'First Timers', icon: Users },
    { id: 'absentees',      label: 'Absentees',    icon: UserX },
    { id: 'reminders',      label: 'Reminders',    icon: CalendarCheck },
    { id: 'complaints',     label: 'Complaints',   icon: AlertCircle },
    { id: 'announcements',  label: 'Announcements',icon: Megaphone },
    { id: 'prayer_requests',label: 'Prayer',       icon: Heart },
    { id: 'chat',           label: 'Chat',         icon: MessageSquare },
    { id: 'assets',         label: 'Assets',       icon: Package },
    { id: 'ushers',         label: terminology?.usherPlural || 'Ushers', icon: ShieldCheck },
    { id: 'reports',        label: 'Reports',      icon: FileBarChart },
    { id: 'downloads',      label: 'Downloads',    icon: Download },
    { id: 'live',           label: 'Live',         icon: Radio },
    { id: 'books',          label: 'Books',        icon: BookOpen },
    ...(isSuperAdmin ? [
      { id: 'financials',   label: 'Financials',   icon: FileBarChart },
      { id: 'broadcasts',   label: 'Broadcasts',   icon: Megaphone },
      { id: 'settings',     label: 'Settings',     icon: Settings },
    ] : []),
  ], [terminology, isSuperAdmin]);

  // Bottom nav tabs (mobile — 4 pinned + More)
  const bottomTabs = [
    { id: 'dashboard',   label: 'Home',    icon: Home },
    { id: 'members',     label: 'Members', icon: UserSquare2 },
    { id: 'attendance',  label: 'Services',icon: Clock },
    { id: 'reports',     label: 'Reports', icon: FileBarChart },
  ];

  const navigate = (id: string) => { setCurrentPage(id); setSidebarOpen(false); setMoreOpen(false); };

  const Sidebar = () => (
    <aside
      style={{ backgroundColor: 'var(--sidebar-bg, #0a1a6b)', color: 'var(--sidebar-text, white)' }}
      className="flex flex-col h-full w-64 shadow-2xl">
      <div className="p-5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
            <img src={branding?.logoUrl ? formatImageUrl(branding.logoUrl) : logoImg} alt="Logo"
              className="w-8 h-8 object-contain" referrerPolicy="no-referrer"
              onError={e => { if ((e.target as HTMLImageElement).src !== logoImg) (e.target as HTMLImageElement).src = logoImg; }} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-[13px] truncate">{general?.churchName || 'SIJM'}</p>
            <p className="text-[8px] uppercase tracking-[0.2em] opacity-50 font-black truncate">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
        {menuItems.map(item => {
          const active = currentPage === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              style={{
                backgroundColor: active ? 'var(--sidebar-active-bg, #1a3acc)' : 'transparent',
                color: active ? 'var(--sidebar-active-text, white)' : 'inherit',
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group
                ${active ? 'shadow-lg font-bold' : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}>
              {active && (
                <motion.div layoutId="admin-active"
                  className="absolute left-0 w-1 h-5 rounded-r-full bg-white" />
              )}
              <item.icon size={16} />
              <span className="text-[10px] uppercase tracking-widest font-black">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-black text-white text-sm">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[11px] truncate">{currentUser.fullName}</p>
            <p className="text-[9px] opacity-50 truncate">{currentUser.identityRole}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-60 hover:opacity-100 hover:text-red-400 transition-all">
          <LogOut size={15} />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen">

      {/* ── DESKTOP sidebar ── */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64">
        <Sidebar />
      </div>

      {/* ── MOBILE sidebar drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">

        {/* Top bar */}
        <header
          style={{ backgroundColor: 'var(--header-bg, white)', color: 'var(--header-text, #0f172a)' }}
          className="sticky top-0 z-30 h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-100 shadow-sm">

          {/* Mobile: hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button className="p-2 rounded-xl" style={{ background: B.off }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={18} style={{ color: B.muted }} />
            </button>
            <span className="font-black text-[13px]" style={{ color: B.navy }}>
              {general?.churchName || 'SIJM'}
            </span>
          </div>

          {/* Desktop: page title area (empty, filled by sidebar brand) */}
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <NotificationBell currentUser={currentUser}
              onNavigate={(link: string) => {
                const p = new URLSearchParams(link.split('?')[1]).get('page');
                if (p) setCurrentPage(p);
              }} />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">{currentUser.fullName}</p>
              <p className="text-[9px] opacity-60 font-black uppercase tracking-widest mt-0.5">{currentUser.identityRole}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                 style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
              {currentUser.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          {children}
        </main>

        {/* ── MOBILE bottom nav ── */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex"
               style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
            {bottomTabs.map(tab => {
              const active = currentPage === tab.id;
              return (
                <button key={tab.id} onClick={() => navigate(tab.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 transition-all">
                  <tab.icon size={19} style={{ color: active ? B.royal : B.muted }} fill={active && tab.id === 'dashboard' ? B.royal : 'none'} />
                  <span className="text-[9px] font-bold" style={{ color: active ? B.royal : B.muted }}>{tab.label}</span>
                  {active && <div className="w-1 h-1 rounded-full" style={{ background: B.royal }} />}
                </button>
              );
            })}

            {/* More button */}
            <button onClick={() => setMoreOpen(true)}
              className="flex-1 flex flex-col items-center gap-1 py-2">
              <MoreHorizontal size={19} style={{ color: B.muted }} />
              <span className="text-[9px] font-bold" style={{ color: B.muted }}>More</span>
            </button>
          </div>
        )}

        {/* ── More sheet (mobile) ── */}
        <AnimatePresence>
          {moreOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 flex items-end lg:hidden"
              onClick={() => setMoreOpen(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28 }}
                className="bg-white w-full rounded-t-3xl max-h-[75vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-4" />
                <div className="px-5 pb-10">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: B.muted }}>
                    All Sections
                  </p>
                  <div className="space-y-1">
                    {menuItems.map(item => {
                      const active = currentPage === item.id;
                      return (
                        <button key={item.id} onClick={() => navigate(item.id)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all"
                          style={{ background: active ? '#eff6ff' : 'transparent' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                               style={{ background: active ? B.royal : B.off }}>
                            <item.icon size={16} style={{ color: active ? B.white : B.muted }} />
                          </div>
                          <span className="font-black text-[13px]" style={{ color: active ? B.royal : B.text }}>
                            {item.label}
                          </span>
                          <ChevronRight size={13} style={{ color: B.muted, marginLeft: 'auto' }} />
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 mt-4 py-4 rounded-2xl text-red-500 font-black text-[13px]"
                    style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminLayout;
