
import React, { useState, useEffect } from 'react';
import { useCMSStore, DEFAULT_SETTINGS, formatImageUrl } from './store.ts';
const logoImg = '/assets/logo.png';
import { IdentityRole, WorkerPermission } from './types.ts';
import PrayerPage from './pages/PrayerPage.tsx';
import PrayerRequestsPage from './pages/PrayerRequestsPage.tsx';
import MembersListPage from './pages/MembersListPage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import SermonsPage from './pages/SermonsPage.tsx';
import EventsPage from './pages/EventsPage.tsx';
import GivingPage from './pages/GivingPage.tsx';
import LandingPageEditor from './pages/LandingPageEditor.tsx';
import LoginPage from './pages/LoginPage.tsx';
import BroadcastEditor from './pages/BroadcastEditor.tsx';
import FinancialDashboard from './pages/FinancialDashboard.tsx';
import AdminLayout from './components/AdminLayout.tsx';
import UsherLayout from './components/UsherLayout.tsx';
import MemberLayout from './components/MemberLayout.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import UsherDashboard from './pages/UsherDashboard.tsx';
import MemberDashboard from './pages/MemberDashboard.tsx';
import AttendancePage from './pages/AttendancePage.tsx';
import FirstTimersPage from './pages/FirstTimersPage.tsx';
import MembersPage from './pages/MembersPage.tsx';
import AssetsPage from './pages/AssetsPage.tsx';
import ComplaintsPage from './pages/ComplaintsPage.tsx';
import RemindersPage from './pages/RemindersPage.tsx';
import AbsenteesPage from './pages/AbsenteesPage.tsx';
import AnnouncementsPage from './pages/AnnouncementsPage.tsx';
import UshersPage from './pages/UshersPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import DownloadsPage from './pages/DownloadsPage.tsx';
import GroupsPage from './pages/GroupsPage.tsx';
import ResourceCategoryPage from './pages/ResourceCategoryPage.tsx';
import ChatPage from './pages/ChatPage.tsx';
import LiveServicePage from './pages/LiveServicePage.tsx';
import BooksPage from './pages/BooksPage.tsx';
import { WifiOff, Loader2 } from 'lucide-react';
import { isMockMode, firebaseConfig } from './lib/firebase.ts';
import GlobalAnnounceBar from './components/GlobalAnnounceBar.tsx';


const App: React.FC = () => {
  const store = useCMSStore();
  const [currentPage, setCurrentPage] = useState<string>('landing');

  const [hasRedirected, setHasRedirected] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  useEffect(() => {
    if (store.currentUser && currentPage === 'landing' && !hasRedirected) {
      const permissions = store.currentUser.workerPermissions || [];
      const isWorker = permissions.includes(WorkerPermission.ADMIN) || 
                       permissions.includes(WorkerPermission.SUPER_ADMIN) || 
                       permissions.includes(WorkerPermission.USHER) || 
                       permissions.includes(WorkerPermission.MEDIA_TEAM);
      
      if (isWorker) {
        setCurrentPage('dashboard');
        setHasRedirected(true);
      }
    }
    if (!store.currentUser && hasRedirected) {
      setHasRedirected(false);
    }
  }, [store.currentUser, currentPage, hasRedirected]);

  useEffect(() => {
    // Robust Defensive Check: Ensure settings and nested properties exist
    const branding = store.settings?.branding || DEFAULT_SETTINGS.branding;
    const general = store.settings?.general || DEFAULT_SETTINGS.general;
    const root = document.documentElement;
    
    try {
      document.title = `${general.churchName || 'SIJM'} - Portal`;

      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      
      // Ensure the URL is transformed for Google Drive compatibility
      const favUrl = formatImageUrl(branding.faviconUrl || logoImg);
      link.href = favUrl;

      // Fallbacks ensure colors always exist even if settings row is partial
      root.style.setProperty('--color-primary', branding.primaryColor || '#002366');
      root.style.setProperty('--color-secondary', branding.secondaryColor || '#D4AF37');
      root.style.setProperty('--sidebar-bg', branding.sidebarBg || '#002366');
      root.style.setProperty('--sidebar-text', branding.sidebarText || '#ffffff');
      root.style.setProperty('--sidebar-active-bg', branding.sidebarActiveBg || '#D4AF37');
      root.style.setProperty('--sidebar-active-text', branding.sidebarActiveText || '#ffffff');
      root.style.setProperty('--header-bg', branding.headerBg || '#ffffff');
      root.style.setProperty('--header-text', branding.headerText || '#002366');
      root.style.setProperty('--page-bg', branding.pageBg || '#f8fafc');
      root.style.setProperty('--card-bg', branding.cardBg || '#ffffff');
      root.style.setProperty('--color-success', branding.successColor || '#10b981');
      root.style.setProperty('--color-warning', branding.warningColor || '#f59e0b');
      root.style.setProperty('--color-danger', branding.dangerColor || '#ef4444');
      root.style.setProperty('--radius-main', branding.borderRadius || '1.5rem');
      root.style.setProperty('--glass-opacity', branding.glassIntensity || '0.1');
      root.style.setProperty('--font-main', branding.fontFamily === 'Serif' ? 'Playfair Display, serif' : 'Inter, sans-serif');
    } catch (e) {
      console.error("Theme Application Error:", e);
    }
  }, [store.settings]);


  if (store.isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verifying Divine Authority...</p>
      </div>
    );
  }

  if (!store.currentUser && currentPage !== 'landing') {
    return (
      <LoginPage 
        store={store} 
        onLogin={store.login} 
        onBack={() => setCurrentPage('landing')} 
      />
    );
  }

  if (['landing', 'about', 'sermons', 'events', 'giving', 'live', 'books'].includes(currentPage)) {
    switch (currentPage) {
      case 'about': return <AboutPage onNavigate={setCurrentPage} store={store} />;
      case 'sermons': return <SermonsPage onNavigate={setCurrentPage} store={store} />;
      case 'events': return <EventsPage onNavigate={setCurrentPage} store={store} />;
      case 'giving': return <GivingPage onNavigate={setCurrentPage} store={store} />;
      case 'live': return <LiveServicePage onNavigate={setCurrentPage} store={store} />;
      case 'books': return <BooksPage onNavigate={setCurrentPage} store={store} />;
      default: return <LandingPage onNavigate={setCurrentPage} store={store} />;
    }
  }

  const renderContent = () => {
    if (!store.currentUser) return null;
    const permissions = store.currentUser.workerPermissions || [];
    const isSuperAdmin = permissions.includes(WorkerPermission.SUPER_ADMIN);
    const isAdmin = permissions.includes(WorkerPermission.ADMIN) || isSuperAdmin;
    const isUsher = permissions.includes(WorkerPermission.USHER);
    const isMedia = permissions.includes(WorkerPermission.MEDIA_TEAM);
    const isLeadership = [
      IdentityRole.PASTOR, IdentityRole.APOSTLE, IdentityRole.PROPHET, 
      IdentityRole.TEACHER, IdentityRole.EVANGELIST, IdentityRole.LEADER,
      IdentityRole.GROUP_HEAD, IdentityRole.BRANCH_HEAD, IdentityRole.REGIONAL_HEAD,
      IdentityRole.NATIONAL_HEAD, IdentityRole.GENERAL_HEAD
    ].includes(store.currentUser.identityRole as IdentityRole);
    
    const settingsPermissions = store.settings?.permissions || DEFAULT_SETTINGS.permissions;

    if (isAdmin) {
      switch (currentPage) {
        case 'dashboard': return <AdminDashboard store={store} navigate={setCurrentPage} />;
        case 'landing_editor': return <LandingPageEditor store={store} navigate={setCurrentPage} />;
        case 'attendance': return <AttendancePage store={store} navigate={setCurrentPage} />;
        case 'members': return <MembersPage store={store} navigate={setCurrentPage} />;
        case 'first_timers': return <FirstTimersPage store={store} navigate={setCurrentPage} />;
        case 'absentees': return <AbsenteesPage store={store} navigate={setCurrentPage} />;
        case 'reminders': return <RemindersPage store={store} navigate={setCurrentPage} />;
        case 'complaints': return <ComplaintsPage store={store} navigate={setCurrentPage} />;
        case 'announcements': return <AnnouncementsPage store={store} navigate={setCurrentPage} />;
        case 'prayer_requests': return <PrayerRequestsPage store={store} navigate={setCurrentPage} />;
        case 'assets': return <AssetsPage store={store} navigate={setCurrentPage} />;
        case 'ushers': return <UshersPage store={store} navigate={setCurrentPage} />;
        case 'reports': return <ReportsPage store={store} navigate={setCurrentPage} />;
        case 'financials': return <FinancialDashboard store={store} currentUser={store.currentUser} onLogout={store.logout} navigate={setCurrentPage} />;
        case 'broadcasts': return <AnnouncementsPage store={store} navigate={setCurrentPage} defaultView="broadcasts" />;
        case 'settings': return (isSuperAdmin || isAdmin) ? <SettingsPage store={store} navigate={setCurrentPage} /> : <AdminDashboard store={store} navigate={setCurrentPage} />;
        case 'downloads': return <DownloadsPage store={store} isAdmin={isAdmin || isMedia} navigate={setCurrentPage} />;
        case 'groups': return <GroupsPage navigate={setCurrentPage} />;
        case 'prayer': return <PrayerPage store={store} navigate={setCurrentPage} />;
        case 'chat': return <ChatPage store={store} navigate={setCurrentPage} />;
        case 'live': return <LiveServicePage onNavigate={setCurrentPage} store={store} />;
        case 'books': return <BooksPage onNavigate={setCurrentPage} store={store} />;
        default: return <AdminDashboard store={store} navigate={setCurrentPage} />;
      }
    } else if (isUsher || isMedia || isLeadership || store.currentUser?.workerPermissions?.includes(WorkerPermission.PRAYER_TEAM)) {
      switch (currentPage) {
        case 'dashboard': return (isUsher || isLeadership) ? <UsherDashboard store={store} navigate={setCurrentPage} /> : <DownloadsPage store={store} isAdmin={isMedia} navigate={setCurrentPage} />;
        case 'record_attendance': return <AttendancePage store={store} isUsherView navigate={setCurrentPage} />;
        case 'first_timers': return <FirstTimersPage store={store} navigate={setCurrentPage} />;
        case 'absentees': return <AbsenteesPage store={store} isUsherView navigate={setCurrentPage} />;
        case 'announcements': return <AnnouncementsPage store={store} isUsherView navigate={setCurrentPage} />;
        case 'prayer_requests': return <PrayerRequestsPage store={store} navigate={setCurrentPage} />;
        case 'complaints': return <ComplaintsPage store={store} isUsherView navigate={setCurrentPage} />;
        case 'assets': return <AssetsPage store={store} navigate={setCurrentPage} />;
        case 'downloads': return <DownloadsPage store={store} isAdmin={isMedia} navigate={setCurrentPage} />;
        case 'groups': return <GroupsPage navigate={setCurrentPage} />;
        case 'my-members': return <MembersListPage store={store} navigate={setCurrentPage} />;
        case 'prayer': return <PrayerPage store={store} navigate={setCurrentPage} />;
        case 'chat': return <ChatPage store={store} navigate={setCurrentPage} />;
        case 'live': return <LiveServicePage onNavigate={setCurrentPage} store={store} />;
        case 'books': return <BooksPage onNavigate={setCurrentPage} store={store} />;
        default: return isUsher ? <UsherDashboard store={store} navigate={setCurrentPage} /> : <DownloadsPage store={store} isAdmin={isMedia} navigate={setCurrentPage} />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard': return <MemberDashboard store={store} navigate={setCurrentPage} />;
        case 'prayer': return <PrayerPage store={store} navigate={setCurrentPage} />;
        case 'events': return <EventsPage store={store} onNavigate={() => setCurrentPage('dashboard')} />;
        case 'downloads': return <DownloadsPage store={store} navigate={setCurrentPage} />;
        case 'groups': return <GroupsPage navigate={setCurrentPage} />;
        case 'bible_studies': return <ResourceCategoryPage category="Bible Studies" onBack={() => setCurrentPage('dashboard')} />;
        case 'morning_devotion': return <ResourceCategoryPage category="Morning Devotion" onBack={() => setCurrentPage('dashboard')} />;
        case 'prayer_guides': return <ResourceCategoryPage category="Prayer Guides" onBack={() => setCurrentPage('dashboard')} />;
        case 'evening_reflection': return <ResourceCategoryPage category="Evening Reflection" onBack={() => setCurrentPage('dashboard')} />;
        case 'explore_devotionals': return <ResourceCategoryPage category="Explore Devotionals" onBack={() => setCurrentPage('dashboard')} />;
        case 'my-members': return <MembersListPage store={store} navigate={setCurrentPage} />;
        case 'member_dashboard': return <MemberDashboard store={store} navigate={setCurrentPage} />;
        case 'chat': return <ChatPage store={store} navigate={setCurrentPage} />;
        case 'live': return <LiveServicePage onNavigate={setCurrentPage} store={store} />;
        case 'books': return <BooksPage onNavigate={setCurrentPage} store={store} />;
        default: return <LandingPage onNavigate={setCurrentPage} store={store} />;
      }
    }
  };

  const getLayout = () => {
    if (!store.currentUser) return ({ children }: any) => <>{children}</>;
    const permissions = store.currentUser.workerPermissions || [];
    const isLeadership = [
      IdentityRole.PASTOR, IdentityRole.APOSTLE, IdentityRole.PROPHET, 
      IdentityRole.TEACHER, IdentityRole.EVANGELIST, IdentityRole.LEADER,
      IdentityRole.GROUP_HEAD, IdentityRole.BRANCH_HEAD, IdentityRole.REGIONAL_HEAD,
      IdentityRole.NATIONAL_HEAD, IdentityRole.GENERAL_HEAD
    ].includes(store.currentUser.identityRole as IdentityRole);

    if (permissions.includes(WorkerPermission.ADMIN) || permissions.includes(WorkerPermission.SUPER_ADMIN)) return AdminLayout;
    if (
      permissions.includes(WorkerPermission.USHER) || 
      permissions.includes(WorkerPermission.MEDIA_TEAM) || 
      permissions.includes(WorkerPermission.PRAYER_TEAM) ||
      isLeadership
    ) return UsherLayout;
    return MemberLayout;
  };

  const Layout = getLayout();

  return (
    <Layout 
      currentUser={store.currentUser!} 
      onLogout={store.logout} 
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      store={store}
      showInstallButton={showInstallButton}
      onInstall={handleInstallClick}
    >
      <style>{`
        :root {
          --radius-card: var(--radius-main);
          --radius-button: calc(var(--radius-main) * 0.7);
        }
        body { 
          background-color: var(--page-bg); 
          transition: background-color 0.3s ease; 
          font-family: var(--font-main);
        }
        .bg-primary { background-color: var(--color-primary); }
        .text-primary { color: var(--color-primary); }
        .border-primary { border-color: var(--color-primary); }
        .bg-secondary { background-color: var(--color-secondary); }
        .text-secondary { color: var(--color-secondary); }
        .bg-sidebar { background-color: var(--sidebar-bg); }
        .text-sidebar { color: var(--sidebar-text); }
        .bg-header { background-color: var(--header-bg); }
        .text-header { color: var(--header-text); }
        .bg-success { background-color: var(--color-success); }
        .bg-warning { background-color: var(--color-warning); }
        .bg-danger { background-color: var(--color-danger); }
        .bg-card { background-color: var(--card-bg); }
        
        .rounded-enhanced { border-radius: var(--radius-card); }
        .rounded-button-enhanced { border-radius: var(--radius-button); }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, var(--glass-opacity));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {!store.isOnline && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-rose-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <WifiOff size={18} />
          <span className="text-sm font-bold">Offline Mode: Data will be saved locally</span>
        </div>
      )}
      
      <GlobalAnnounceBar broadcasts={store.broadcasts} />

      {renderContent()}

    </Layout>
  );
};

export default App;
