import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, Users, Heart, DollarSign, MessageSquare, Send, 
  Youtube, Facebook, Eye, Wifi, WifiOff, ChevronRight,
  Flame, Cross, Hand, Zap, Clock, Bell, Gift, X,
  Settings, Save, ToggleLeft, ToggleRight, Link as LinkIcon,
  CheckCircle2, AlertTriangle, Monitor, Tv
} from 'lucide-react';
import WebsiteLayout from '../components/WebsiteLayout.tsx';
import { WorkerPermission } from '../types.ts';

/* ─── types ─── */
interface LiveMessage { id: string; name: string; text: string; type: 'chat' | 'prayer' | 'gift'; avatar: string; time: string; }

interface LiveConfig {
  isLive: boolean;
  youtubeUrl: string;
  facebookUrl: string;
  sermonSeries: string;
  preacher: string;
  serviceType: string;
  sections: { label: string; count: number }[];
  chatEnabled: boolean;
  prayerEnabled: boolean;
  givingEnabled: boolean;
}

const DEFAULT_LIVE_CONFIG: LiveConfig = {
  isLive: false,
  youtubeUrl: '',
  facebookUrl: '',
  sermonSeries: 'Restoration Season',
  preacher: 'Apostle S.K. Mensah',
  serviceType: 'Sunday Morning',
  sections: [
    { label: 'Main Hall', count: 842 },
    { label: 'Gallery', count: 215 },
    { label: 'Children', count: 190 },
  ],
  chatEnabled: true,
  prayerEnabled: true,
  givingEnabled: true,
};

/* ─── pulse dot ─── */
const LiveDot = () => (
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
  </span>
);

/* ─── giving amounts ─── */
const AMOUNTS = [10, 20, 50, 100, 200, 500];

/* ─── mock messages ─── */
const MOCK_MESSAGES: LiveMessage[] = [
  { id: '1', name: 'Abena K.', text: 'Hallelujah! This word is powerful 🔥', type: 'chat', avatar: 'A', time: '2m ago' },
  { id: '2', name: 'Kofi M.', text: 'Please pray for my family\'s healing 🙏', type: 'prayer', avatar: 'K', time: '1m ago' },
  { id: '3', name: 'Ama O.', text: 'Gave ₵50 — God bless SIJM!', type: 'gift', avatar: 'A', time: '45s ago' },
  { id: '4', name: 'Emmanuel D.', text: 'Joining from Kumasi! 🇬🇭', type: 'chat', avatar: 'E', time: '30s ago' },
  { id: '5', name: 'Grace N.', text: 'This sermon is changing my life', type: 'chat', avatar: 'G', time: '15s ago' },
];

/* ════════════════════════════════════════════════════════════════
   ADMIN CONTROL PANEL — visible to Super Admin / Admin / Media Team
   ════════════════════════════════════════════════════════════════ */
const AdminPanel: React.FC<{
  config: LiveConfig;
  setConfig: React.Dispatch<React.SetStateAction<LiveConfig>>;
  onClose: () => void;
}> = ({ config, setConfig, onClose }) => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateSection = (idx: number, field: 'label' | 'count', value: string | number) => {
    const newSections = [...config.sections];
    newSections[idx] = { ...newSections[idx], [field]: value };
    setConfig({ ...config, sections: newSections });
  };

  const addSection = () => {
    setConfig({ ...config, sections: [...config.sections, { label: 'New Section', count: 0 }] });
  };

  const removeSection = (idx: number) => {
    setConfig({ ...config, sections: config.sections.filter((_, i) => i !== idx) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/70 backdrop-blur-sm"
    >
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-indigo-950 px-8 py-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <Radio size={24} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest">Live Service Control</h3>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mt-0.5">Admin / Media Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-8 space-y-8">
          {/* Go Live Toggle */}
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.isLive ? 'bg-red-500' : 'bg-slate-200'}`}>
                <Tv size={22} className={config.isLive ? 'text-white' : 'text-slate-400'} />
              </div>
              <div>
                <p className="text-base font-black text-indigo-950 uppercase tracking-tight">{config.isLive ? 'CURRENTLY LIVE' : 'OFFLINE'}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{config.isLive ? 'Service is streaming to the public' : 'Click to start broadcasting'}</p>
              </div>
            </div>
            <button
              onClick={() => setConfig({ ...config, isLive: !config.isLive })}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                config.isLive 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200'
              }`}
            >
              {config.isLive ? '⛔ Stop Live' : '🔴 Go Live'}
            </button>
          </div>

          {/* Stream URLs */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LinkIcon size={14} /> Stream Embed URLs</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <Youtube size={18} className="text-red-500" />
                </div>
                <input
                  type="text"
                  value={config.youtubeUrl}
                  onChange={e => setConfig({ ...config, youtubeUrl: e.target.value })}
                  placeholder="YouTube embed URL (e.g. https://www.youtube.com/embed/...)"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Facebook size={18} className="text-blue-600" />
                </div>
                <input
                  type="text"
                  value={config.facebookUrl}
                  onChange={e => setConfig({ ...config, facebookUrl: e.target.value })}
                  placeholder="Facebook video embed URL"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Sermon Info */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Flame size={14} /> Service Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sermon Series</label>
                <input
                  type="text"
                  value={config.sermonSeries}
                  onChange={e => setConfig({ ...config, sermonSeries: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preacher</label>
                <input
                  type="text"
                  value={config.preacher}
                  onChange={e => setConfig({ ...config, preacher: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Type</label>
                <input
                  type="text"
                  value={config.serviceType}
                  onChange={e => setConfig({ ...config, serviceType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings size={14} /> Feature Toggles</h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'chatEnabled' as const, label: 'Live Chat', icon: MessageSquare },
                { key: 'prayerEnabled' as const, label: 'Prayer Wall', icon: Heart },
                { key: 'givingEnabled' as const, label: 'Live Giving', icon: Gift },
              ].map(toggle => (
                <button
                  key={toggle.key}
                  onClick={() => setConfig({ ...config, [toggle.key]: !config[toggle.key] })}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    config[toggle.key]
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-slate-50 border-slate-100 text-slate-300'
                  }`}
                >
                  <toggle.icon size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{toggle.label}</span>
                  <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    config[toggle.key] ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>{config[toggle.key] ? 'ON' : 'OFF'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Attendance Sections</h4>
              <button
                onClick={addSection}
                className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
              >
                + Add Section
              </button>
            </div>
            <div className="space-y-3">
              {config.sections.map((section, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={section.label}
                    onChange={e => updateSection(idx, 'label', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                    placeholder="Section name"
                  />
                  <input
                    type="number"
                    value={section.count}
                    onChange={e => updateSection(idx, 'count', parseInt(e.target.value) || 0)}
                    className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none text-center"
                  />
                  <button
                    onClick={() => removeSection(idx)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-[9px] font-bold text-slate-400">Changes apply in real-time</p>
          <button
            onClick={handleSave}
            className={`px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl ${
              saved
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save Config</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN LIVE SERVICE PAGE
   ════════════════════════════════════════════════════════════════ */
const LiveServicePage: React.FC<{ onNavigate: (p: string) => void; store: any }> = ({ onNavigate, store }) => {
  const [liveConfig, setLiveConfig] = useState<LiveConfig>(DEFAULT_LIVE_CONFIG);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab]       = useState<'youtube' | 'facebook'>('youtube');
  const [chatTab, setChatTab]           = useState<'chat' | 'prayer' | 'giving'>('chat');
  const [messages, setMessages]         = useState<LiveMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText]       = useState('');
  const [viewerCount, setViewerCount]   = useState(342);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [givingDone, setGivingDone]     = useState(false);
  const [prayerText, setPrayerText]     = useState('');
  const [prayerSent, setPrayerSent]     = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(1247);
  const [serviceTimer, setServiceTimer] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  /* Check admin access: Super Admin, Admin, or Media Team */
  const permissions = store?.currentUser?.workerPermissions || [];
  const canControlLive = permissions.includes(WorkerPermission.SUPER_ADMIN) ||
                          permissions.includes(WorkerPermission.ADMIN) ||
                          permissions.includes(WorkerPermission.MEDIA_TEAM);

  /* simulate live updates */
  useEffect(() => {
    if (!liveConfig.isLive) return;
    const interval = setInterval(() => {
      setViewerCount(v => v + Math.floor(Math.random() * 5 - 2));
      setAttendanceCount(v => v + Math.floor(Math.random() * 3));
      setServiceTimer(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [liveConfig.isLive]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const msg: LiveMessage = {
      id: Date.now().toString(), name: store?.currentUser?.fullName || 'You',
      text: inputText, type: 'chat', avatar: (store?.currentUser?.fullName?.[0] || 'Y'), time: 'just now'
    };
    setMessages(prev => [...prev, msg]);
    setInputText('');
  };

  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;
    const msg: LiveMessage = {
      id: Date.now().toString(), name: store?.currentUser?.fullName || 'Anonymous',
      text: prayerText, type: 'prayer', avatar: (store?.currentUser?.fullName?.[0] || 'A'), time: 'just now'
    };
    setMessages(prev => [...prev, msg]);
    setPrayerText('');
    setPrayerSent(true);
    setTimeout(() => setPrayerSent(false), 3000);
  };

  const handleGive = async () => {
    const amountVal = selectedAmount || parseInt(customAmount);
    if (!amountVal) return;
    
    // Persist to Firestore
    if (store.addDonation) {
      await store.addDonation({
        donorName: store?.currentUser?.fullName || 'Anonymous Live Donor',
        donorEmail: store?.currentUser?.email || 'anonymous@live.sijm',
        amount: amountVal,
        category: 'Live Offering',
        paymentMethod: 'Mobile Money (Live)',
        userId: store?.currentUser?.id
      });
    }

    const msg: LiveMessage = {
      id: Date.now().toString(), name: store?.currentUser?.fullName || 'A member',
      text: `Gave ₵${amountVal} — God bless SIJM! 🙏`, type: 'gift', avatar: '💝', time: 'just now'
    };
    setMessages(prev => [...prev, msg]);
    setGivingDone(true);
    setTimeout(() => { setGivingDone(false); setSelectedAmount(null); setCustomAmount(''); }, 4000);
  };

  /* dynamic embed URLs from admin config */
  const ytUrl  = liveConfig.youtubeUrl || 'https://www.youtube.com/embed/live_stream?channel=UCxxxxxxxxxxxxxxx&autoplay=1';
  const fbUrl  = liveConfig.facebookUrl || 'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fsijm%2Fvideos&show_text=false&autoplay=true';

  /* active tabs based on admin config */
  const availableTabs = [
    liveConfig.chatEnabled && { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    liveConfig.prayerEnabled && { id: 'prayer' as const, label: 'Prayer', icon: Heart },
    liveConfig.givingEnabled && { id: 'giving' as const, label: 'Give', icon: Gift },
  ].filter(Boolean) as { id: 'chat' | 'prayer' | 'giving'; label: string; icon: any }[];

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === chatTab)) {
      setChatTab(availableTabs[0].id);
    }
  }, [liveConfig.chatEnabled, liveConfig.prayerEnabled, liveConfig.givingEnabled]);

  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="live">
      {/* Admin control panel modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <AdminPanel config={liveConfig} setConfig={setLiveConfig} onClose={() => setShowAdminPanel(false)} />
        )}
      </AnimatePresence>

      {/* Hero banner */}
      <div className="relative bg-indigo-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-indigo-950 to-indigo-950" />
        {/* animated radial pulse */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {liveConfig.isLive && [1,2,3].map(i => (
            <motion.div key={i} animate={{ scale: [1, 2.5], opacity: [0.15, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
              className="absolute w-64 h-64 rounded-full border border-red-500/30" />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {liveConfig.isLive ? (
                <>
                  <LiveDot />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-400">
                    We Are Live Now
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">
                  Next Service Soon
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              {liveConfig.serviceType.split(' ')[0]}<br /><span className="text-amber-400 italic">{liveConfig.serviceType.split(' ').slice(1).join(' ') || 'Service'}</span><br />Service
            </h1>
            <p className="text-white/50 text-sm font-medium max-w-sm">
              Join thousands worldwide as we encounter the manifest presence of God together.
            </p>

            {/* Admin control button */}
            {canControlLive && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest mt-4"
              >
                <Settings size={14} />
                Control Panel
              </button>
            )}
          </div>

          {/* stats row */}
          <div className="flex flex-wrap gap-4">
            {[
              { icon: Eye, label: 'Watching', value: liveConfig.isLive ? viewerCount.toLocaleString() : '—', color: 'text-amber-400' },
              { icon: Users, label: 'In Attendance', value: liveConfig.isLive ? attendanceCount.toLocaleString() : '—', color: 'text-emerald-400' },
              { icon: Clock, label: 'Duration', value: liveConfig.isLive ? formatTimer(serviceTimer) : '—', color: 'text-indigo-300' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-6 py-4 text-center min-w-[120px]">
                <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Video Panel ── */}
          <div className="xl:col-span-2 space-y-4">
            {/* platform switcher */}
            <div className="flex items-center gap-2">
              {(['youtube', 'facebook'] as const).map(p => (
                <button key={p} onClick={() => setActiveTab(p)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === p ? 'bg-white text-slate-900' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {p === 'youtube' ? <Youtube size={16} className="text-red-500" /> : <Facebook size={16} className="text-blue-500" />}
                  {p}
                </button>
              ))}
            </div>

            {/* video embed */}
            <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
              {liveConfig.isLive ? (
                <iframe
                  src={activeTab === 'youtube' ? ytUrl : fbUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Live Stream"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                  <Wifi size={48} className="text-white/20" />
                  <p className="font-black text-xl uppercase tracking-widest text-white/30">Service Not Started</p>
                  <p className="text-white/20 text-sm">Next service: Sunday 9:00 AM GMT</p>
                  {canControlLive && (
                    <button
                      onClick={() => setShowAdminPanel(true)}
                      className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2"
                    >
                      <Radio size={16} />
                      Start Live Service
                    </button>
                  )}
                </div>
              )}
              {liveConfig.isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                  <LiveDot /><span className="text-white text-[9px] font-black uppercase tracking-widest">Live</span>
                </div>
              )}
            </div>

            {/* service info from admin config */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Sermon Series', value: liveConfig.sermonSeries, icon: Flame },
                { label: 'Preacher', value: liveConfig.preacher, icon: Hand },
                { label: 'Service Type', value: liveConfig.serviceType, icon: Zap },
              ].map(info => (
                <div key={info.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                  <info.icon size={18} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{info.label}</p>
                    <p className="text-white text-xs font-bold mt-0.5">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sidebar ── */}
          {availableTabs.length > 0 && (
            <div className="flex flex-col h-[600px] xl:h-auto bg-white/3 border border-white/8 rounded-[2rem] overflow-hidden">
              {/* tab bar */}
              <div className="flex border-b border-white/5 shrink-0">
                {availableTabs.map(tab => (
                  <button key={tab.id} onClick={() => setChatTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${chatTab === tab.id ? 'border-amber-400 text-amber-400 bg-amber-400/5' : 'border-transparent text-white/30 hover:text-white/60'}`}
                  >
                    <tab.icon size={14} />{tab.label}
                  </button>
                ))}
              </div>

              {/* ── Chat tab ── */}
              <AnimatePresence mode="wait">
                {chatTab === 'chat' && liveConfig.chatEnabled && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 min-h-0">
                    <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.type === 'gift' ? 'bg-amber-400/10 rounded-xl p-2' : ''}`}>
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${
                            msg.type === 'prayer' ? 'bg-rose-500/20 text-rose-400' :
                            msg.type === 'gift'   ? 'bg-amber-400/20 text-amber-400' :
                            'bg-indigo-500/20 text-indigo-300'}`}>
                            {msg.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-white/50 uppercase tracking-wide">{msg.name}</span>
                              {msg.type === 'prayer' && <span className="text-[7px] bg-rose-500/20 text-rose-400 px-1.5 rounded-full font-black uppercase">Prayer</span>}
                              {msg.type === 'gift' && <span className="text-[7px] bg-amber-400/20 text-amber-400 px-1.5 rounded-full font-black uppercase">Gift</span>}
                            </div>
                            <p className="text-white/70 text-xs mt-0.5 leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 flex gap-2 shrink-0">
                      <input value={inputText} onChange={e => setInputText(e.target.value)}
                        placeholder="Say something..." maxLength={200}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none placeholder:text-white/20 focus:border-amber-400/50" />
                      <button type="submit" className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-indigo-950 hover:bg-amber-300 transition-colors">
                        <Send size={16} />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── Prayer tab ── */}
                {chatTab === 'prayer' && liveConfig.prayerEnabled && (
                  <motion.div key="prayer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 p-6 space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
                        <Heart size={28} className="text-rose-400" />
                      </div>
                      <h3 className="text-white font-black text-sm uppercase tracking-widest">Live Prayer Wall</h3>
                      <p className="text-white/30 text-[10px]">Your request goes directly to our prayer team on ground</p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {messages.filter(m => m.type === 'prayer').map(msg => (
                        <div key={msg.id} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                          <p className="text-rose-300 text-[9px] font-black uppercase tracking-widest">{msg.name}</p>
                          <p className="text-white/60 text-xs mt-1">{msg.text}</p>
                        </div>
                      ))}
                    </div>

                    {prayerSent ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-emerald-400 text-xs font-black uppercase tracking-widest">
                        🙏 Prayer received — We're standing with you!
                      </div>
                    ) : (
                      <form onSubmit={handlePrayerSubmit} className="space-y-3 shrink-0">
                        <textarea value={prayerText} onChange={e => setPrayerText(e.target.value)} rows={3}
                          placeholder="Share your prayer request..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none placeholder:text-white/20 focus:border-rose-400/50 resize-none" />
                        <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-colors flex items-center justify-center gap-2">
                          <Send size={14} /> Send Prayer Request
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}

                {/* ── Giving tab ── */}
                {chatTab === 'giving' && liveConfig.givingEnabled && (
                  <motion.div key="giving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 p-6 space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto">
                        <Gift size={28} className="text-amber-400" />
                      </div>
                      <h3 className="text-white font-black text-sm uppercase tracking-widest">Give Online</h3>
                      <p className="text-white/30 text-[10px]">Your offering fuels the mission</p>
                    </div>

                    {givingDone ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <motion.div animate={{ scale: [0.8, 1.2, 1] }} transition={{ duration: 0.5 }}
                          className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-4xl">
                          🙌
                        </motion.div>
                        <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">Thank you!</p>
                        <p className="text-white/30 text-xs text-center">Your gift of ₵{selectedAmount || customAmount} has been received. God bless you!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1">
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Select Amount (GHS ₵)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {AMOUNTS.map(a => (
                              <button key={a} onClick={() => { setSelectedAmount(a); setCustomAmount(''); }}
                                className={`py-2.5 rounded-xl text-xs font-black transition-all ${selectedAmount === a ? 'bg-amber-400 text-indigo-950' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                                ₵{a}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Or Custom Amount</p>
                          <input type="number" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                            placeholder="Enter amount..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none placeholder:text-white/20 focus:border-amber-400/50" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Payment Method</p>
                          <div className="grid grid-cols-2 gap-2">
                            {['Mobile Money', 'Bank Transfer'].map(m => (
                              <button key={m} className="py-2 bg-white/5 text-white/40 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">{m}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {!givingDone && (
                      <button onClick={handleGive}
                        className="w-full py-4 bg-amber-400 text-indigo-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20 shrink-0">
                        Give ₵{selectedAmount || customAmount || '—'} Now
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Attendance counter banner */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 rounded-[2rem] p-8 flex flex-wrap items-center justify-between gap-6 border border-indigo-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Users size={24} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Total In-Person Attendance</p>
                <motion.p key={attendanceCount} initial={{ scale: 1.2, color: '#fbbf24' }} animate={{ scale: 1, color: '#ffffff' }}
                  className="text-4xl font-black text-white mt-1">{liveConfig.isLive ? attendanceCount.toLocaleString() : '—'}</motion.p>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              {liveConfig.sections.map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{liveConfig.isLive ? s.count : '—'}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
              {liveConfig.isLive ? <LiveDot /> : <WifiOff size={12} className="text-slate-400" />}
              <span className={`text-[9px] font-black uppercase tracking-widest ${liveConfig.isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {liveConfig.isLive ? 'Updating Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default LiveServicePage;
