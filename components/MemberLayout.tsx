import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, IdentityRole, WorkerPermission } from '../types';
import { formatImageUrl } from '../store';
import NotificationBell from './NotificationBell.tsx';
import { 
  LayoutDashboard, Download, LogOut, Menu, 
  Bell, Search, X, ChevronLeft, ChevronRight, Heart, Users,
  Home, BookOpen, Calendar, Users2, Settings, Sparkles, Globe, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_FALLBACK = '/assets/logo.png';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface StoreSettings {
  general?: { churchName?: string };
  branding?: { logoUrl?: string; secondaryColor?: string };
}

interface MemberLayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  store?: { settings?: StoreSettings };
  showInstallButton?: boolean;
  onInstall?: () => void;
  sidebarOnly?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

interface SidebarHeaderProps {
  isCollapsed: boolean;
  isMobile: boolean;
  branding?: StoreSettings['branding'];
  general?: StoreSettings['general'];
  onCollapse: () => void;
  onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = React.memo(({
  isCollapsed, isMobile, branding, general, onCollapse, onClose
}) => {
  const logoUrl = branding?.logoUrl ? formatImageUrl(branding.logoUrl) : null;
  const churchName = general?.churchName || 'Salvation In Jesus Ministry';
  const initial = churchName.charAt(0);
  const gradient = `linear-gradient(135deg, ${branding?.secondaryColor || '#D4AF37'}, #B8860B)`;

  return (
    <div className={`p-6 shrink-0 border-b border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
      <div className="flex items-center justify-between w-full">
        {!isCollapsed && (
          <div className="flex items-center gap-4 min-w-0">
            {logoUrl ? (
              <LogoImage src={logoUrl} alt="Church Logo" />
            ) : (
              <LogoFallback initial={initial} gradient={gradient} />
            )}
            <span className="truncate text-lg font-bold font-poppins block text-white">
              {churchName}
            </span>
          </div>
        )}

        {isCollapsed && logoUrl && (
          <LogoImage src={logoUrl} alt="Logo" size="sm" />
        )}

        {!isMobile && (
          <CollapseToggle isCollapsed={isCollapsed} onToggle={onCollapse} />
        )}
        {isMobile && (
          <MobileCloseButton onClose={onClose} />
        )}
      </div>
    </div>
  );
});
SidebarHeader.displayName = 'SidebarHeader';

// ─────────────────────────────────────────────────────────────

const LogoImage: React.FC<{ src: string; alt: string; size?: 'sm' | 'md' }> = React.memo(
  ({ src, alt, size = 'md' }) => {
    const dimensions = size === 'sm' 
      ? { container: 'w-10 h-10', image: 'w-8 h-8' }
      : { container: 'w-12 h-12', image: 'w-10 h-10' };

    return (
      <div className={`${dimensions.container} bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-white/20 overflow-hidden`}>
        <img 
          src={src} 
          alt={alt} 
          className={`${dimensions.image} object-contain`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== LOGO_FALLBACK) target.src = LOGO_FALLBACK;
          }}
          loading="lazy"
        />
      </div>
    );
  }
);
LogoImage.displayName = 'LogoImage';

// ─────────────────────────────────────────────────────────────

const LogoFallback: React.FC<{ initial: string; gradient: string }> = React.memo(
  ({ initial, gradient }) => (
    <motion.div 
      whileHover={{ rotate: 180 }}
      transition={{ duration: 0.3 }}
      style={{ background: gradient, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 border border-white/20"
    >
      {initial}
    </motion.div>
  )
);
LogoFallback.displayName = 'LogoFallback';

// ─────────────────────────────────────────────────────────────

interface CollapseToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const CollapseToggle: React.FC<CollapseToggleProps> = React.memo(({ isCollapsed, onToggle }) => (
  <button 
    onClick={onToggle}
    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    aria-expanded={!isCollapsed}
  >
    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
  </button>
));
CollapseToggle.displayName = 'CollapseToggle';

// ─────────────────────────────────────────────────────────────

const MobileCloseButton: React.FC<{ onClose: () => void }> = React.memo(({ onClose }) => (
  <button 
    onClick={onClose}
    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white lg:hidden"
    aria-label="Close menu"
  >
    <X size={20} />
  </button>
));
MobileCloseButton.displayName = 'MobileCloseButton';

// ─────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface SidebarNavProps {
  items: NavItem[];
  currentPage: string;
  onNavigate: (id: string) => void;
  isCollapsed: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = React.memo(({ items, currentPage, onNavigate, isCollapsed }) => (
  <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar" role="navigation">
    {items.map((item) => {
      const isActive = currentPage === item.id;
      return (
        <motion.button
          key={item.id}
          whileHover={{ x: isCollapsed ? 0 : 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(item.id)}
          className={`
            w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-5'} py-4 rounded-2xl transition-all duration-500 group relative
            ${isActive 
              ? 'bg-[var(--sidebar-active-bg,#D4AF37)] text-white shadow-xl shadow-black/20 font-bold' 
              : 'text-white hover:bg-white/5 opacity-60 hover:opacity-100'}
            focus:outline-none focus:ring-2 focus:ring-white/30
          `}
          aria-current={isActive ? 'page' : undefined}
          title={isCollapsed ? item.label : undefined}
        >
          <item.icon size={20} className={`transition-transform duration-500 ${isActive ? 'stroke-[2.5] scale-110' : 'group-hover:scale-110'}`} />
          {!isCollapsed && <span className="text-[10px] uppercase tracking-[0.2em] font-black">{item.label}</span>}
          {isActive && (
            <motion.div 
              layoutId="member-active-indicator"
              className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            />
          )}
        </motion.button>
      );
    })}
  </nav>
));
SidebarNav.displayName = 'SidebarNav';

// ─────────────────────────────────────────────────────────────

interface SidebarFooterProps {
  isCollapsed: boolean;
  showInstallButton?: boolean;
  onInstall?: () => void;
  onLogout: () => void;
  currentUser: User;
}

const SidebarFooter: React.FC<SidebarFooterProps> = React.memo(({ isCollapsed, showInstallButton, onInstall, onLogout, currentUser }) => (
  <div className="p-4 border-t border-white/10 shrink-0 space-y-4">
    {/* User Section */}
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-lg">
        {currentUser?.fullName?.charAt(0) || 'U'}
      </div>
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate text-white">{currentUser?.fullName || 'Member'}</p>
          <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'member@church.org'}</p>
        </div>
      )}
    </div>

    <div className="space-y-2">
      {showInstallButton && onInstall && (
        <ActionButton
          isCollapsed={isCollapsed}
          icon={Download}
          label="Install App"
          onClick={onInstall}
          variant="install"
        />
      )}
      <ActionButton
        isCollapsed={isCollapsed}
        icon={LogOut}
        label="Logout"
        onClick={onLogout}
        variant="logout"
      />
    </div>
  </div>
));
SidebarFooter.displayName = 'SidebarFooter';

// ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  isCollapsed: boolean;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  variant: 'install' | 'logout';
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(({ isCollapsed, icon: Icon, label, onClick, variant }) => {
  const baseClasses = `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-5'} py-4 rounded-2xl transition-all focus:outline-none focus:ring-2`;
  
  const variants = {
    install: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 focus:ring-emerald-400/30',
    logout: 'opacity-70 hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 focus:ring-rose-400/30 text-white'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]}`}
      title={isCollapsed ? label : undefined}
    >
      <Icon size={20} />
      {!isCollapsed && <span className="font-bold uppercase tracking-widest text-sm">{label}</span>}
    </motion.button>
  );
});
ActionButton.displayName = 'ActionButton';

// ─────────────────────────────────────────────────────────────
// Main Component - ENHANCED LAYOUT
// ─────────────────────────────────────────────────────────────

const MemberLayout: React.FC<MemberLayoutProps> = ({ 
  children, 
  currentUser, 
  onLogout, 
  currentPage, 
  setCurrentPage, 
  store, 
  showInstallButton, 
  onInstall,
  sidebarOnly = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const general = store?.settings?.general;
  const branding = store?.settings?.branding;

  // 📱 Responsive handling
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    
    const handleResize = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setIsCollapsed(false);
    };
    
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // 🔄 Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [currentPage, isMobile]);

  // ⌨️ Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // 🔐 Permission helpers
  const canSeeMembers = useMemo(() => {
    const adminRoles = [
      IdentityRole.GROUP_HEAD, IdentityRole.BRANCH_HEAD, IdentityRole.REGIONAL_HEAD,
      IdentityRole.NATIONAL_HEAD, IdentityRole.GENERAL_HEAD
    ];
    return adminRoles.includes(currentUser.identityRole) || 
           currentUser.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN);
  }, [currentUser.identityRole, currentUser.workerPermissions]);

  const canSeePrayerRequests = useMemo(() => {
    const adminPerms = [WorkerPermission.SUPER_ADMIN, WorkerPermission.ADMIN, WorkerPermission.PRAYER_TEAM];
    const hasPerm = currentUser.workerPermissions?.some(p => adminPerms.includes(p as WorkerPermission));
    const hasRole = [IdentityRole.PASTOR, IdentityRole.LEADER].includes(currentUser.identityRole);
    return hasPerm || hasRole;
  }, [currentUser.workerPermissions, currentUser.identityRole]);

  // 🧭 Menu items
  const menuItems = useMemo<NavItem[]>(() => {
    const isAdmin = currentUser?.workerPermissions?.includes(WorkerPermission.ADMIN) || 
                    currentUser?.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN) ||
                    [IdentityRole.PASTOR, IdentityRole.LEADER].includes(currentUser?.identityRole);

    const items: NavItem[] = [
      { id: 'landing', label: 'Website', icon: Globe },
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'downloads', label: 'Sermons', icon: BookOpen },
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'prayer', label: 'Prayer', icon: Heart },
      { id: 'chat', label: 'Divine Chat', icon: MessageSquare },
      { id: 'groups', label: 'Groups', icon: Users2 },
    ];

    if (canSeePrayerRequests) items.push({ id: 'prayer_requests', label: 'Prayer Requests', icon: Heart });
    if (canSeeMembers) items.push({ id: 'my-members', label: 'My Members', icon: Users });
    if (isAdmin) items.push({ id: 'settings', label: 'Settings', icon: Settings });
    
    return items;
  }, [currentUser, canSeeMembers]);

  // 🎯 Handlers
  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleMobileOpen = useCallback(() => setIsOpen(true), []);
  const handleMobileClose = useCallback(() => setIsOpen(false), []);

  // 🎨 Sidebar configuration
  const sidebarWidth = isCollapsed ? 80 : 288;

  if (sidebarOnly) {
    // 🎯 SIDEBAR ONLY LAYOUT - FIXED: No gap, full-width content
    return (
      <div className="min-h-screen bg-[var(--sidebar-bg,#002366)]">
        {/* 🌑 Mobile Overlay */}
        <AnimatePresence>
          {isOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
              onClick={handleMobileClose}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* 🧭 Sidebar - Fixed position */}
        <motion.aside 
          initial={false}
          animate={{ 
            x: isOpen || !isMobile ? 0 : '-100%',
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            backgroundColor: 'var(--sidebar-bg, #002366)',
            color: 'var(--sidebar-text, #ffffff)',
            width: isCollapsed ? '80px' : '288px',
          }}
          className={`
            fixed inset-y-0 left-0 z-50 shadow-2xl flex flex-col
            ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
          `}
          role="navigation"
          aria-label="Main navigation"
          id="sidebar"
        >
          <SidebarHeader 
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            branding={branding}
            general={general}
            onCollapse={handleCollapse}
            onClose={handleMobileClose}
          />
          
          <SidebarNav 
            items={menuItems}
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isCollapsed={isCollapsed}
          />

          <SidebarFooter 
            isCollapsed={isCollapsed}
            showInstallButton={showInstallButton}
            onInstall={onInstall}
            onLogout={onLogout}
            currentUser={currentUser}
          />
        </motion.aside>

        {/* ✅ Content Area - NO GAP, starts immediately after sidebar */}
        <main 
          className="min-h-screen"
          style={{
            marginLeft: isMobile ? 0 : sidebarWidth,
          }}
        >
          <AnimatePresence mode="wait">
            {children && (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // 📄 TRADITIONAL LAYOUT - With right panel (fallback)
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 🌑 Mobile Overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={handleMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 🧭 Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isOpen || !isMobile ? 0 : '-100%',
          width: `${sidebarWidth}px`
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          backgroundColor: 'var(--sidebar-bg, #002366)',
          color: 'var(--sidebar-text, #ffffff)',
        }}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 shadow-2xl flex flex-col
          ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
          lg:translate-x-0
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <SidebarHeader 
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          branding={branding}
          general={general}
          onCollapse={handleCollapse}
          onClose={handleMobileClose}
        />
        
        <SidebarNav 
          items={menuItems}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isCollapsed={isCollapsed}
        />

        <SidebarFooter 
          isCollapsed={isCollapsed}
          showInstallButton={showInstallButton}
          onInstall={onInstall}
          onLogout={onLogout}
          currentUser={currentUser}
        />
      </motion.aside>

      {/* 📄 Main Content - Traditional Layout */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        {/* 🔝 Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" 
            onClick={handleMobileOpen}
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls="sidebar"
          >
            <Menu size={24} />
          </motion.button>
          
          <div className="flex items-center gap-4 ml-auto">
            {/* 🔍 Search */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search size={18} className="text-slate-400" aria-hidden="true" />
              <input 
                type="search" 
                placeholder="Search..." 
                className="bg-transparent outline-none text-sm w-40 placeholder:text-slate-400"
                aria-label="Search"
              />
            </div>
            
            {/* 🔔 Notifications */}
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
            
            {/* 👤 User Profile */}
            <div className="h-8 w-px bg-slate-100 hidden sm:block" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{currentUser?.fullName}</p>
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Member</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-indigo-200 border-2 border-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
                title="View Profile"
                aria-label={`Profile: ${currentUser?.fullName}`}
              >
                {currentUser?.fullName?.charAt(0) || 'U'}
              </motion.button>
            </div>
          </div>
        </header>
        
        {/* 📋 Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default React.memo(MemberLayout);