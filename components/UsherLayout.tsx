
import React, { useRef, useState, useEffect } from 'react';
import { User, WorkerPermission } from '../types.ts';
import { formatImageUrl } from '../store.ts';
import NotificationBell from './NotificationBell.tsx';
const logoImg = '/assets/logo.png';
import { 
  Home, 
  PlusCircle, 
  UserPlus, 
  LogOut,
  UserX,
  Megaphone,
  Menu,
  Download,
  Heart,
  Users,
  MoreHorizontal,
  Globe,
  PlayCircle,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const UsherLayout: React.FC<Props> = ({ children, currentUser, onLogout, currentPage, setCurrentPage, store, showInstallButton, onInstall }) => {
  const branding = store?.settings?.branding;
  const general = store?.settings?.general;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isUsher = currentUser.workerPermissions?.includes(WorkerPermission.USHER);
  const isMedia = currentUser.workerPermissions?.includes(WorkerPermission.MEDIA_TEAM);
  const isPrayerTeam = currentUser.workerPermissions?.includes(WorkerPermission.PRAYER_TEAM);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      checkScroll();
      scrollEl.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.preventDefault();
          scrollEl.scrollLeft += e.deltaY;
        }
      };
      scrollEl.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        scrollEl.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        scrollEl.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'landing', label: 'Website', icon: Globe },
    { id: 'sermons', label: 'Sermons', icon: BookOpen },
    ...(isUsher ? [
      { id: 'record_attendance', label: 'Record', icon: PlusCircle },
      { id: 'first_timers', label: 'Register', icon: UserPlus },
      { id: 'my-members', label: 'Members', icon: Users },
      { id: 'absentees', label: 'Absentees', icon: UserX },
    ] : []),
    { id: 'prayer', label: 'Prayer', icon: Heart },
    ...(isPrayerTeam ? [
      { id: 'prayer_requests', label: 'Requests', icon: Heart },
    ] : []),
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    ...(isUsher ? [
      { id: 'announcements', label: 'Post', icon: Megaphone },
    ] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white h-16 flex items-center justify-between px-6 sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-gray-100 overflow-hidden">
            <img 
              src={branding?.logoUrl ? formatImageUrl(branding.logoUrl) : logoImg} 
              alt="Logo" 
              className="w-8 h-8 object-contain" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== logoImg) {
                  target.src = logoImg;
                }
              }}
            />
          </div>
          <div>
            <span className="font-poppins font-black text-gray-900 tracking-tighter block leading-none">
              {general?.churchName || 'Salvation In Jesus Ministry'}
            </span>
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1 block">Staff Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
           {showInstallButton && onInstall && (
             <button 
               onClick={onInstall}
               className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
               title="Install App"
             >
               <Download size={20} />
             </button>
           )}
           <div className="text-right hidden sm:block">
             <span className="text-xs font-black text-gray-900 block leading-none">{currentUser.fullName}</span>
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 block">Usher Authorization</span>
           </div>
           <button onClick={onLogout} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-40 p-4 sm:p-10 lg:p-16 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-6 inset-x-4 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 bg-white/80 backdrop-blur-2xl border border-white/20 h-24 flex items-center z-40 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] safe-area-inset-bottom lg:w-max lg:min-w-[600px] overflow-hidden">
        {/* Scroll Indicators */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
              className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/90 to-transparent z-10 flex items-center justify-start pl-4 hover:opacity-100 transition-opacity group"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform border border-gray-50">
                <ChevronLeft size={20} />
              </div>
            </motion.button>
          )}
          {showRightArrow && (
            <motion.button 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
              className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent z-10 flex items-center justify-end pr-4 hover:opacity-100 transition-opacity group"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform border border-gray-50">
                <ChevronRight size={20} />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <div 
          ref={scrollRef}
          className="flex items-center px-8 gap-4 min-w-full overflow-x-auto no-scrollbar scroll-smooth py-2"
        >
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center transition-all duration-500 relative shrink-0 min-w-[84px] group ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-3.5 rounded-[1.25rem] transition-all duration-500 mb-1.5 ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 -translate-y-1' : 'bg-gray-50/50 group-hover:bg-gray-100'}`}>
                  <item.icon size={isActive ? 22 : 20} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.25em] transition-all duration-500 whitespace-nowrap ${isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-95 group-hover:opacity-60'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute -bottom-3 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default UsherLayout;
