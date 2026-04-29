import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, IdentityRole, WorkerPermission } from '../types';
import { formatImageUrl } from '../store';
import NotificationBell from './NotificationBell.tsx';
import {
  LogOut, Menu, X, ChevronLeft, ChevronRight,
  Home, BookOpen, Calendar, Users2, Settings,
  Globe, MessageSquare, Heart, Users, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_FALLBACK = '/assets/logo.png';

interface MemberLayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  store?: any;
  showInstallButton?: boolean;
  onInstall?: () => void;
  sidebarOnly?: boolean;
}

// ─── Nav items ────────────────────────────────────────────────
interface NavItem { id: string; label: string; icon: any; }

function buildMenuItems(currentUser: User): NavItem[] {
  const perms = currentUser?.workerPermissions || [];
  const role  = currentUser?.identityRole;
  const isAdmin = perms.includes(WorkerPermission.ADMIN) || perms.includes(WorkerPermission.SUPER_ADMIN);
  const isLeader = [IdentityRole.PASTOR, IdentityRole.LEADER, IdentityRole.GROUP_HEAD,
    IdentityRole.BRANCH_HEAD, IdentityRole.REGIONAL_HEAD].includes(role as IdentityRole);
  const canPrayerReq = perms.some(p => [WorkerPermission.SUPER_ADMIN, WorkerPermission.ADMIN,
    WorkerPermission.PRAYER_TEAM].includes(p as WorkerPermission)) || isLeader;
  const canMembers = isLeader || perms.includes(WorkerPermission.SUPER_ADMIN);

  const items: NavItem[] = [
    { id: 'dashboard',  label: 'Home',       icon: Home },
    { id: 'downloads',  label: 'Sermons',    icon: BookOpen },
    { id: 'events',     label: 'Events',     icon: Calendar },
    { id: 'live',       label: 'Live',       icon: Globe },
    { id: 'groups',     label: 'Groups',     icon: Users2 },
    { id: 'chat',       label: 'Chat',       icon: MessageSquare },
    { id: 'prayer',     label: 'Prayer',     icon: Heart },
  ];
  if (canPrayerReq) items.push({ id: 'prayer_requests', label: 'Requests', icon: Heart });
  if (canMembers)   items.push({ id: 'my-members',      label: 'Members',  icon: Users });
  if (isAdmin)      items.push({ id: 'settings',        label: 'Settings', icon: Settings });
  return items;
}

// ─── Logo ─────────────────────────────────────────────────────
const Logo: React.FC<{ src: string | null; initial: string; collapsed: boolean }> = ({ src, initial, collapsed }) => {
  const size = collapsed ? 'w-9 h-9' : 'w-10 h-10';
  return src ? (
    <div className={`${size} bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0`}>
      <img src={src} alt="Logo" className="w-full h-full object-contain"
           onError={e => { (e.target as HTMLImageElement).src = LOGO_FALLBACK; }} />
    </div>
  ) : (
    <div className={`${size} rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0`}
         style={{ background: 'linear-gradient(135deg, #1a3acc, #7c3aed)' }}>
      {initial}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────
const Sidebar: React.FC<{
  items: NavItem[]; currentPage: string;
  onNavigate: (id: string) => void;
  collapsed: boolean; onCollapse: () => void;
  isMobile: boolean; onClose: () => void;
  currentUser: User; onLogout: () => void;
  store: any;
}> = ({ items, currentPage, onNavigate, collapsed, onCollapse, isMobile, onClose, currentUser, onLogout, store }) => {
  const branding = store?.settings?.branding;
  const general  = store?.settings?.general;
  const logoSrc  = branding?.logoUrl ? formatImageUrl(branding.logoUrl) : null;
  const name     = general?.churchName || 'SIJM';
  const sidebarBg = branding?.sidebarBg || '#0a1a6b';
  const activeColor = branding?.sidebarActiveBg || '#1a3acc';

  return (
    <aside
      className="flex flex-col h-full shadow-2xl"
      style={{ background: sidebarBg, color: '#fff', width: collapsed ? 72 : 260 }}
    >
      {/* Header */}
      <div className={`flex items-center p-4 border-b shrink-0 ${collapsed ? 'justify-center' : 'gap-3 justify-between'}`}
           style={{ borderColor: 'rgba(255,255,255,0.08)', minHeight: 64 }}>
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <Logo src={logoSrc} initial={name[0]} collapsed={false} />
            <span className="font-black text-[13px] truncate text-white">{name}</span>
          </div>
        )}
        {collapsed && <Logo src={logoSrc} initial={name[0]} collapsed={true} />}
        {!isMobile && (
          <button onClick={onCollapse}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 shrink-0">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-1">
        {items.map(item => {
          const active = currentPage === item.id ||
            (item.id === 'dashboard' && ['dashboard', 'member_dashboard'].includes(currentPage));
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-3 rounded-xl transition-all group relative`}
              style={active
                ? { background: activeColor, color: '#fff', fontWeight: 800 }
                : { color: 'rgba(255,255,255,0.55)' }}
              title={collapsed ? item.label : undefined}>
              {active && (
                <motion.div layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white" />
              )}
              <item.icon size={18} className={`shrink-0 ${active ? '' : 'group-hover:text-white'}`} />
              {!collapsed && (
                <span className="text-[11px] font-black uppercase tracking-widest truncate">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t shrink-0 space-y-2"
           style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-1'} mb-2`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shrink-0">
            {currentUser?.fullName?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[11px] truncate text-white">{currentUser?.fullName || 'Member'}</p>
              <p className="text-[9px] text-white/40 truncate">{currentUser?.email || ''}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all`}>
          <LogOut size={16} />
          {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

// ─── Main Layout ──────────────────────────────────────────────
const MemberLayout: React.FC<MemberLayoutProps> = ({
  children, currentUser, onLogout, currentPage, setCurrentPage,
  store, showInstallButton, onInstall,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setCollapsed(false);
    };
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [currentPage, isMobile]);

  const menuItems = useMemo(() => buildMenuItems(currentUser), [currentUser]);
  const sidebarW  = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg, #f8faff)' }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50"
           style={{ width: sidebarW }}>
        <Sidebar items={menuItems} currentPage={currentPage}
          onNavigate={setCurrentPage} collapsed={collapsed} onCollapse={() => setCollapsed(p => !p)}
          isMobile={false} onClose={() => {}} currentUser={currentUser}
          onLogout={onLogout} store={store} />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden">
            <Sidebar items={menuItems} currentPage={currentPage}
              onNavigate={setCurrentPage} collapsed={false} onCollapse={() => {}}
              isMobile={true} onClose={() => setSidebarOpen(false)} currentUser={currentUser}
              onLogout={onLogout} store={store} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="lg:min-h-screen" style={{ marginLeft: isMobile ? 0 : sidebarW }}>

        {/* Mobile top bar — only visible on mobile */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#f1f5f9' }}>
            <Menu size={18} className="text-slate-600" />
          </button>
          <span className="font-black text-[13px]" style={{ color: '#0a1a6b' }}>
            {store?.settings?.general?.churchName || 'SIJM'}
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell currentUser={currentUser}
              onNavigate={(link: string) => {
                const p = new URLSearchParams(link.split('?')[1]).get('page');
                if (p) setCurrentPage(p);
              }} />
          </div>
        </div>

        {/* Page content — no extra padding on mobile (MemberDashboard owns its own layout) */}
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default React.memo(MemberLayout);
