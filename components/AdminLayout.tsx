
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, WorkerPermission } from '../types.ts';
import { formatImageUrl } from '../store.ts';
import NotificationBell from './NotificationBell.tsx';
const logoImg = '/assets/logo.png';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  AlertCircle, 
  Package, 
  LogOut, 
  Menu, 
  CalendarCheck,
  UserX,
  Megaphone,
  FileBarChart,
  Settings,
  ShieldCheck,
  UserSquare2,
  Download,
  Globe,
  Heart,
  MessageSquare,
  Radio,
  BookOpen
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

const AdminLayout: React.FC<Props> = ({ children, currentUser, onLogout, currentPage, setCurrentPage, store, showInstallButton, onInstall }) => {
  const [isOpen, setIsOpen] = useState(false);
  const terminology = store?.settings?.terminology;
  const general = store?.settings?.general;
  const branding = store?.settings?.branding;

  const menuItems = [
    { id: 'landing', label: 'View Website', icon: Globe },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(currentUser.workerPermissions.includes(WorkerPermission.SUPER_ADMIN) ? [
      { id: 'landing_editor', label: 'Landing Page CMS', icon: Globe }
    ] : []),
    { id: 'attendance', label: terminology?.servicePlural || 'Attendance', icon: Clock },
    { id: 'members', label: terminology?.memberPlural || 'Members', icon: UserSquare2 },
    { id: 'first_timers', label: terminology?.firstTimerPlural || 'First Timers', icon: Users },
    { id: 'absentees', label: (terminology?.memberPlural ? terminology.memberPlural + ' Absentees' : 'Absentees'), icon: UserX },
    { id: 'reminders', label: 'Reminders', icon: CalendarCheck },
    { id: 'complaints', label: 'Complaints', icon: AlertCircle },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'prayer', label: 'Send Prayer Request', icon: Heart },
    { id: 'prayer_requests', label: 'Prayer Requests', icon: Heart },
    { id: 'chat', label: 'Divine Chat', icon: MessageSquare },
    { id: 'assets', label: 'Assets', icon: Package },
    { id: 'ushers', label: terminology?.usherPlural || 'Ushers', icon: ShieldCheck },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'live', label: 'Live Service', icon: Radio },
    { id: 'books', label: 'Books Manager', icon: BookOpen },
    ...(currentUser.workerPermissions.includes(WorkerPermission.SUPER_ADMIN) ? [
      { id: 'financials', label: 'Financial Hub', icon: FileBarChart },
      { id: 'broadcasts', label: 'Site Broadcasts', icon: Megaphone },
      { id: 'settings', label: 'Settings', icon: Settings }
    ] : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside 
        style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out shadow-xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block
        `}
      >
        <div className="p-6">
          <div className="flex items-center gap-3">
             {branding?.logoUrl ? (
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-white/20 overflow-hidden">
                 <img 
                   src={formatImageUrl(branding.logoUrl)} 
                   alt="Church Logo" 
                   className="w-10 h-10 object-contain" 
                   referrerPolicy="no-referrer"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     if (target.src !== logoImg) {
                       target.src = logoImg;
                     }
                   }}
                 />
               </div>
             ) : (
               <div 
                  style={{ 
                    background: `radial-gradient(circle at 30% 30%, ${branding?.secondaryColor || '#D4AF37'}, #B8860B)`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2), inset 0 0 10px rgba(255,255,255,0.2)'
                  }}
                  className="w-11 h-11 rounded-[0.85rem] flex items-center justify-center text-white text-xl font-black shrink-0 border border-white/20"
                >
                  {general?.churchName?.charAt(0) || 'S'}
                </div>
             )}
             <div className="min-w-0">
               <span className="truncate leading-tight text-base font-bold font-poppins block">{general?.churchName || 'Salvation In Jesus Ministry'}</span>
               <p style={{ opacity: 0.6 }} className="text-[8px] uppercase tracking-[0.2em] font-black truncate">{general?.tagline || 'Look Unto Jesus: The Only Name That Saves.'}</p>
             </div>
          </div>
        </div>
        
        <nav className="mt-6 px-4 space-y-2 pb-20 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setIsOpen(false); }}
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: isActive ? 'var(--sidebar-active-text)' : 'inherit'
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative
                  ${isActive 
                    ? 'shadow-xl shadow-black/20 scale-[1.02] font-bold' 
                    : 'hover:bg-white/5 opacity-60 hover:opacity-100'}
                `}
              >
                <item.icon size={20} className={`transition-transform duration-500 ${isActive ? 'stroke-[2.5] scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}

          {showInstallButton && onInstall && (
            <button
              onClick={onInstall}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 opacity-80 hover:opacity-100 mt-4 border border-white/10"
            >
              <Download size={18} />
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">Install App</span>
            </button>
          )}
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-8 opacity-70 hover:opacity-100 hover:text-rose-400 mt-auto transition-all border-t border-white/10"
          >
            <LogOut size={20} />
            <span className="font-bold uppercase tracking-widest text-xs">Logout</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header 
          style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)' }}
          className="shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300"
        >
          <button className="lg:hidden p-2 text-current" onClick={() => setIsOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell 
              currentUser={currentUser} 
              onNavigate={(link) => {
                const params = new URLSearchParams(link.split('?')[1]);
                const page = params.get('page');
                if (page) {
                  setCurrentPage(page);
                }
              }} 
            />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{currentUser.fullName}</p>
              <p className="text-[10px] opacity-60 font-black uppercase tracking-widest">{currentUser.identityRole}</p>
            </div>
            <div 
              style={{ backgroundColor: 'var(--color-primary)' }}
              className="w-10 h-10 text-white rounded-2xl flex items-center justify-center font-bold shadow-md"
            >
              {currentUser.fullName.charAt(0)}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-12 overflow-y-auto">
          {children}
        </main>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default AdminLayout;
