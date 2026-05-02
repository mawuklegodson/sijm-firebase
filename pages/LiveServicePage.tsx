import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GiveModal from '../components/GiveModal.tsx';
import {
  Radio, Users, Heart, MessageSquare, Send, Youtube, Facebook,
  Eye, Wifi, WifiOff, X, Settings, Save, CheckCircle2,
  Flame, Hand, Zap, Gift, Bell, BellOff, Key, RefreshCw,
  AlertTriangle, Loader2, Link as LinkIcon, ToggleLeft,
  ToggleRight, Monitor, Play, ChevronDown, Info,
} from 'lucide-react';
import WebsiteLayout from '../components/WebsiteLayout.tsx';
import { WorkerPermission } from '../types.ts';
import { db, isMockMode } from '../lib/firebase.ts';
import {
  doc, setDoc, onSnapshot, collection,
  addDoc, serverTimestamp, query, orderBy, limit,
} from 'firebase/firestore';

// ─── Brand tokens ─────────────────────────────────────────────
const B = {
  navy:   '#0a1a6b',
  royal:  '#1a3acc',
  purple: '#7c3aed',
  gold:   '#f59e0b',
  red:    '#ef4444',
  green:  '#10b981',
  white:  '#ffffff',
};

// ─── Types ────────────────────────────────────────────────────
interface LiveMessage {
  id: string;
  name: string;
  text: string;
  type: 'chat' | 'prayer' | 'gift';
  avatar: string;
  time: string;
}

interface LiveStatus {
  isLive: boolean;
  platform: 'youtube' | 'facebook' | 'none';
  videoId: string;        // YouTube video ID or Facebook video URL
  title: string;
  viewerCount: number;
  thumbnail: string;
  checkedAt: number;
}

// Default offline state
const OFFLINE_STATUS: LiveStatus = {
  isLive: false, platform: 'none', videoId: '',
  title: '', viewerCount: 0, thumbnail: '', checkedAt: 0,
};

// ─── Pulsing LIVE dot ─────────────────────────────────────────
const LiveDot = () => (
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
  </span>
);

// ─── YouTube API helpers ──────────────────────────────────────
/**
 * Fetches the active live broadcast for a channel using YouTube Data API v3.
 * Requires: Data API key + channel ID.
 * Returns null if no live stream found or quota/error.
 */
async function fetchYouTubeLiveStatus(apiKey: string, channelId: string): Promise<LiveStatus | null> {
  if (!apiKey || !channelId) return null;
  try {
    // 1. Search for active live broadcasts on the channel
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    if (!searchData.items?.length) return null;

    const videoId = searchData.items[0].id.videoId;
    const snippet = searchData.items[0].snippet;

    // 2. Get live viewer count
    const statsUrl =
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=liveStreamingDetails,snippet&id=${videoId}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();
    const details = statsData.items?.[0]?.liveStreamingDetails;
    const viewers = parseInt(details?.concurrentViewers || '0', 10);

    return {
      isLive: true,
      platform: 'youtube',
      videoId,
      title: snippet?.title || '',
      viewerCount: viewers,
      thumbnail: snippet?.thumbnails?.high?.url || '',
      checkedAt: Date.now(),
    };
  } catch (e) {
    console.warn('[SIJM Live] YouTube API error:', e);
    return null;
  }
}

/**
 * Fetches live video from a Facebook Page using Graph API.
 * Requires: Page ID + Page Access Token.
 */
async function fetchFacebookLiveStatus(pageId: string, accessToken: string): Promise<LiveStatus | null> {
  if (!pageId || !accessToken) return null;
  try {
    const url =
      `https://graph.facebook.com/v19.0/${pageId}/live_videos?` +
      `fields=id,title,status,live_views,embed_html&status=LIVE&access_token=${accessToken}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.length) return null;

    const video = data.data[0];
    return {
      isLive: true,
      platform: 'facebook',
      videoId: video.id,
      title: video.title || 'Live Service',
      viewerCount: video.live_views || 0,
      thumbnail: '',
      checkedAt: Date.now(),
    };
  } catch (e) {
    console.warn('[SIJM Live] Facebook API error:', e);
    return null;
  }
}

// ─── Build embed URL ──────────────────────────────────────────
function buildEmbedUrl(status: LiveStatus, manualYt: string, manualFb: string): string {
  if (status.platform === 'youtube' && status.videoId) {
    return `https://www.youtube.com/embed/${status.videoId}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (status.platform === 'facebook' && status.videoId) {
    const encoded = encodeURIComponent(`https://www.facebook.com/video/${status.videoId}`);
    return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=true&width=1280`;
  }
  // Manual overrides
  if (manualYt) return manualYt;
  if (manualFb) {
    const encoded = encodeURIComponent(manualFb);
    return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=true`;
  }
  return '';
}

// ─── MOCK chat messages ───────────────────────────────────────
const MOCK_MSGS: LiveMessage[] = [
  { id: '1', name: 'Abena K.',    text: 'Hallelujah! This word is powerful 🔥',       type: 'chat',   avatar: 'A', time: '2m' },
  { id: '2', name: 'Kofi M.',     text: 'Please pray for my family\'s healing 🙏',    type: 'prayer', avatar: 'K', time: '1m' },
  { id: '3', name: 'Ama O.',      text: 'Gave ₵50 — God bless SIJM!',                type: 'gift',   avatar: 'A', time: '45s' },
  { id: '4', name: 'Emmanuel D.', text: 'Joining from Kumasi! 🇬🇭',                   type: 'chat',   avatar: 'E', time: '30s' },
  { id: '5', name: 'Grace N.',    text: 'This sermon is changing my life',            type: 'chat',   avatar: 'G', time: '15s' },
];

const GIVE_AMOUNTS = [10, 20, 50, 100, 200, 500];

// ════════════════════════════════════════════════════════════════
// ADMIN PANEL — Media Team / Admin / Super Admin only
// ════════════════════════════════════════════════════════════════
const AdminPanel: React.FC<{
  cfg: any;
  onSave: (c: any) => void;
  onClose: () => void;
  liveStatus: LiveStatus;
  onCheckNow: () => void;
  checking: boolean;
}> = ({ cfg, onSave, onClose, liveStatus, onCheckNow, checking }) => {
  const [form, setForm] = useState({ ...cfg });
  const [saved, setSaved] = useState(false);

  const set = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-7 py-5 flex items-center justify-between shrink-0"
             style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Radio size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-[15px] uppercase tracking-widest">Live Stream Control</h3>
              <p className="text-white/50 text-[9px] font-black uppercase tracking-widest">Media Team Panel</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-7 space-y-6">

          {/* Live Status indicator */}
          <div className="flex items-center justify-between p-4 rounded-2xl border"
               style={{ background: liveStatus.isLive ? '#f0fdf4' : '#fafafa', borderColor: liveStatus.isLive ? '#bbf7d0' : '#e2e8f0' }}>
            <div className="flex items-center gap-3">
              {liveStatus.isLive ? <LiveDot /> : <WifiOff size={14} className="text-slate-400" />}
              <div>
                <p className="font-black text-[13px]" style={{ color: liveStatus.isLive ? '#15803d' : '#64748b' }}>
                  {liveStatus.isLive ? `LIVE on ${liveStatus.platform}` : 'No active stream detected'}
                </p>
                {liveStatus.isLive && (
                  <p className="text-[10px] text-slate-500">{liveStatus.title}</p>
                )}
              </div>
            </div>
            <button onClick={onCheckNow} disabled={checking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[11px] text-white"
              style={{ background: B.royal }}>
              {checking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {checking ? 'Checking…' : 'Check Now'}
            </button>
          </div>

          {/* ── YouTube API ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Youtube size={16} className="text-red-500" />
              <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-500">YouTube Data API v3</h4>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-700">
              <strong>How to get keys:</strong> Google Cloud Console → APIs & Services → Enable "YouTube Data API v3" → Create Credentials (API Key). Channel ID: YouTube Studio → Settings → Channel → Advanced.
            </div>
            {[
              { key: 'youtubeApiKey',    label: 'YouTube API Key',   ph: 'AIzaSy...',   icon: Key },
              { key: 'youtubeChannelId', label: 'YouTube Channel ID', ph: 'UCxxxxxxx...', icon: LinkIcon },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{f.label}</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                     style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
                  <f.icon size={13} className="text-slate-400 shrink-0" />
                  <input type="text" value={form[f.key] || ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.ph}
                    className="flex-1 bg-transparent outline-none text-[12px] font-mono text-slate-700 placeholder:text-slate-300" />
                </div>
              </div>
            ))}
          </div>

          {/* ── Facebook API ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Facebook size={16} className="text-blue-600" />
              <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-500">Facebook Graph API</h4>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-700">
              <strong>How to get keys:</strong> Facebook Developer Console → Your App → Graph API Explorer → Select Page → Generate Page Access Token. Page ID: Your Facebook Page → About section.
            </div>
            {[
              { key: 'facebookPageId',      label: 'Facebook Page ID',      ph: '1234567890',  icon: LinkIcon },
              { key: 'facebookAccessToken', label: 'Page Access Token',      ph: 'EAAxxxxxxxx…', icon: Key },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{f.label}</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                     style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
                  <f.icon size={13} className="text-slate-400 shrink-0" />
                  <input type="text" value={form[f.key] || ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.ph}
                    className="flex-1 bg-transparent outline-none text-[12px] font-mono text-slate-700 placeholder:text-slate-300" />
                </div>
              </div>
            ))}
          </div>

          {/* ── Preferred Platform ── */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              Preferred Platform (if both are live)
            </label>
            <div className="flex gap-2">
              {(['youtube', 'facebook', 'both'] as const).map(p => (
                <button key={p} onClick={() => set('preferredPlatform', p)}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                  style={form.preferredPlatform === p
                    ? { background: B.royal, color: B.white }
                    : { background: '#f1f5f9', color: '#64748b' }}>
                  {p === 'both' ? 'Both (let user choose)' : p}
                </button>
              ))}
            </div>
          </div>

          {/* ── Manual override ── */}
          <div className="space-y-3 p-4 rounded-2xl border border-orange-100 bg-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-[12px] text-orange-800">Manual Override</p>
                <p className="text-[10px] text-orange-600">Use when API auto-detect is unavailable (quota exceeded, etc.)</p>
              </div>
              <button onClick={() => set('manualOverride', !form.manualOverride)}
                className="shrink-0">
                {form.manualOverride
                  ? <ToggleRight size={28} style={{ color: B.royal }} />
                  : <ToggleLeft size={28} className="text-slate-300" />}
              </button>
            </div>
            {form.manualOverride && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-600">Mark as LIVE manually</span>
                  <button onClick={() => set('manualIsLive', !form.manualIsLive)}>
                    {form.manualIsLive
                      ? <ToggleRight size={24} className="text-red-500" />
                      : <ToggleLeft size={24} className="text-slate-300" />}
                  </button>
                </div>
                {[
                  { key: 'manualYoutubeUrl', label: 'YouTube Embed URL', ph: 'https://www.youtube.com/embed/VIDEO_ID' },
                  { key: 'manualFacebookUrl', label: 'Facebook Video URL', ph: 'https://www.facebook.com/watch/?v=VIDEO_ID' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{f.label}</label>
                    <input type="text" value={form[f.key] || ''}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder={f.ph}
                      className="w-full px-3 py-2.5 rounded-xl border text-[11px] font-mono outline-none"
                      style={{ background: '#f8faff', borderColor: '#e2e8f0' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Service info ── */}
          <div className="space-y-3">
            <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Flame size={13} /> Service Info (shown in app)
            </h4>
            {[
              { key: 'serviceType',  label: 'Service Type',  ph: 'Sunday Morning Service' },
              { key: 'preacher',     label: 'Preacher',       ph: 'Pastor Name' },
              { key: 'sermonSeries', label: 'Sermon Series',  ph: 'Series Title' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{f.label}</label>
                <input type="text" value={form[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.ph}
                  className="w-full px-3 py-2.5 rounded-xl border text-[12px] font-semibold outline-none"
                  style={{ background: '#f8faff', borderColor: '#e2e8f0' }} />
              </div>
            ))}
          </div>

          {/* ── Feature toggles ── */}
          <div className="space-y-3">
            <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-500">Feature Toggles</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'chatEnabled',   label: 'Live Chat',   Icon: MessageSquare },
                { key: 'prayerEnabled', label: 'Prayer Wall', Icon: Heart },
                { key: 'givingEnabled', label: 'Live Giving', Icon: Gift },
              ].map(t => (
                <button key={t.key} onClick={() => set(t.key, !form[t.key])}
                  className="p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all"
                  style={form[t.key]
                    ? { background: '#eff6ff', borderColor: '#bfdbfe', color: B.royal }
                    : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#cbd5e1' }}>
                  <t.Icon size={18} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                  <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full"
                        style={form[t.key] ? { background: '#dcfce7', color: '#15803d' } : { background: '#f1f5f9', color: '#94a3b8' }}>
                    {form[t.key] ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Notification ── */}
          <div className="space-y-3">
            <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Bell size={13} /> Push Notification (sent when auto-detected as live)
            </h4>
            {[
              { key: 'notificationTitle', label: 'Title', ph: 'We Are Live! 🔴' },
              { key: 'notificationBody',  label: 'Body',  ph: 'SIJM is streaming now. Tap to join.' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{f.label}</label>
                <input type="text" value={form[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.ph}
                  className="w-full px-3 py-2.5 rounded-xl border text-[12px] outline-none"
                  style={{ background: '#f8faff', borderColor: '#e2e8f0' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <p className="text-[9px] font-bold text-slate-400">API keys are stored encrypted in Firestore settings</p>
          <button onClick={handleSave}
            className="px-7 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 text-white transition-all"
            style={{ background: saved ? B.green : B.royal }}>
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Config</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN LIVE SERVICE PAGE
// ════════════════════════════════════════════════════════════════
const LiveServicePage: React.FC<{ onNavigate: (p: string) => void; store: any }> = ({ onNavigate, store }) => {
  const { settings, currentUser, addDonation } = store;
  const liveCfg = settings?.liveStream || {};

  // ── state ──────────────────────────────────────────────────
  const [liveStatus, setLiveStatus]     = useState<LiveStatus>(OFFLINE_STATUS);
  const [checking, setChecking]         = useState(false);
  const [showAdmin, setShowAdmin]       = useState(false);
  const [activePlatform, setActivePlatform] = useState<'youtube' | 'facebook'>('youtube');
  const [chatTab, setChatTab]           = useState<'chat' | 'prayer' | 'giving'>('chat');
  const [messages, setMessages]         = useState<LiveMessage[]>(MOCK_MSGS);
  const [inputText, setInputText]       = useState('');
  const [prayerText, setPrayerText]     = useState('');
  const [prayerSent, setPrayerSent]     = useState(false);
  const [giveAmount, setGiveAmount]         = useState<number | null>(null);
  const [customAmt, setCustomAmt]           = useState('');
  const [giveDone, setGiveDone]             = useState(false);
  const [showLiveGiveModal, setShowLiveGiveModal] = useState(false);
  const [serviceTimer, setServiceTimer] = useState(0);
  const [notifPerm, setNotifPerm]       = useState<NotificationPermission>('default');
  const chatRef = useRef<HTMLDivElement>(null);
  const prevLive = useRef(false);

  // ── permissions ────────────────────────────────────────────
  const canControl = (currentUser?.workerPermissions || []).some((p: WorkerPermission) =>
    [WorkerPermission.SUPER_ADMIN, WorkerPermission.ADMIN, WorkerPermission.MEDIA_TEAM].includes(p)
  );

  // ── Notification permission ────────────────────────────────
  useEffect(() => {
    if ('Notification' in window) setNotifPerm(Notification.permission);
  }, []);

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  };

  const sendNotification = useCallback((title: string, body: string) => {
    if (notifPerm === 'granted') {
      try {
        new Notification(title, { body, icon: '/assets/logo.png', badge: '/assets/logo.png' });
      } catch {}
    }
  }, [notifPerm]);

  // ── Core: detect live status ───────────────────────────────
  const detectLive = useCallback(async () => {
    setChecking(true);
    try {
      // Manual override takes priority
      if (liveCfg.manualOverride) {
        const platform = liveCfg.manualYoutubeUrl ? 'youtube' : liveCfg.manualFacebookUrl ? 'facebook' : 'none';
        const status: LiveStatus = {
          isLive: !!liveCfg.manualIsLive,
          platform: platform as any,
          videoId: '',
          title: liveCfg.serviceType || 'Live Service',
          viewerCount: 0,
          thumbnail: '',
          checkedAt: Date.now(),
        };
        setLiveStatus(status);
        // Trigger notification if newly live
        if (status.isLive && !prevLive.current) {
          sendNotification(liveCfg.notificationTitle || 'We Are Live! 🔴', liveCfg.notificationBody || 'Join us now.');
        }
        prevLive.current = status.isLive;
        return;
      }

      // Auto-detect based on preferred platform
      const pref = liveCfg.preferredPlatform || 'youtube';
      let status: LiveStatus | null = null;

      if (pref === 'youtube' || pref === 'both') {
        status = await fetchYouTubeLiveStatus(liveCfg.youtubeApiKey, liveCfg.youtubeChannelId);
      }
      if (!status && (pref === 'facebook' || pref === 'both')) {
        status = await fetchFacebookLiveStatus(liveCfg.facebookPageId, liveCfg.facebookAccessToken);
      }

      const finalStatus = status || OFFLINE_STATUS;
      setLiveStatus(finalStatus);

      // Notify when newly goes live
      if (finalStatus.isLive && !prevLive.current) {
        sendNotification(
          liveCfg.notificationTitle || 'We Are Live! 🔴',
          liveCfg.notificationBody  || `SIJM is streaming now. Tap to join.`
        );
      }
      prevLive.current = finalStatus.isLive;

    } catch (e) {
      console.error('[SIJM Live] detectLive error:', e);
    } finally {
      setChecking(false);
    }
  }, [liveCfg, sendNotification]);

  // ── Poll every 60s ─────────────────────────────────────────
  useEffect(() => {
    detectLive();
    const poll = setInterval(detectLive, 60_000);
    return () => clearInterval(poll);
  }, [detectLive]);

  // ── Service timer ──────────────────────────────────────────
  useEffect(() => {
    if (!liveStatus.isLive) { setServiceTimer(0); return; }
    const t = setInterval(() => setServiceTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [liveStatus.isLive]);

  // ── Firestore live config listener ────────────────────────
  useEffect(() => {
    if (isMockMode) return;
    const unsub = onSnapshot(doc(db, 'live_streams', 'default'), snap => {
      if (snap.exists()) {
        const d = snap.data();
        // Mirror any manual override changes from admin in real time
        if (d.manualOverride !== undefined) {
          setLiveStatus(prev => ({
            ...prev,
            isLive: d.manualIsLive ?? prev.isLive,
          }));
        }
      }
    }, err => console.warn('[SIJM Live] Firestore sync error:', err));
    return () => unsub();
  }, []);

  // ── Chat: Firestore listener ───────────────────────────────
  useEffect(() => {
    if (isMockMode || !liveStatus.isLive) return;
    try {
      const q = query(
        collection(db, 'live_streams', 'default', 'messages'),
        orderBy('createdAt', 'desc'), limit(100)
      );
      const unsub = onSnapshot(q, snap => {
        const msgs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name, text: data.text, type: data.type,
            avatar: data.avatar,
            time: data.createdAt
              ? new Date(data.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'just now',
          } as LiveMessage;
        });
        setMessages(msgs.reverse());
      }, err => console.warn('[SIJM Live] Chat sync error:', err));
      return () => unsub();
    } catch {}
  }, [liveStatus.isLive]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // ── Save config from admin panel ───────────────────────────
  const handleSaveConfig = async (newCfg: any) => {
    try {
      // Save to Firestore settings/global via store.updateSettings
      store.updateSettings?.('liveStream', newCfg);
      // Also mirror to live_streams/default for cross-device real-time
      if (!isMockMode) {
        await setDoc(doc(db, 'live_streams', 'default'), newCfg, { merge: true });
      }
    } catch (e) { console.error('[SIJM Live] Save config error:', e); }
  };

  // ── Chat send ──────────────────────────────────────────────
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const msgData = {
      name:      currentUser?.fullName || 'Member',
      text:      inputText,
      type:      'chat',
      avatar:    currentUser?.fullName?.[0] || 'M',
      createdAt: serverTimestamp(),
    };
    setInputText('');
    try {
      await addDoc(collection(db, 'live_streams', 'default', 'messages'), msgData);
    } catch {
      setMessages(p => [...p, { ...msgData, id: Date.now().toString(), time: 'just now', type: 'chat' }]);
    }
  };

  // ── Prayer send ────────────────────────────────────────────
  const handleSendPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;
    const msgData = {
      name:      currentUser?.fullName || 'Anonymous',
      text:      prayerText,
      type:      'prayer',
      avatar:    currentUser?.fullName?.[0] || 'A',
      createdAt: serverTimestamp(),
    };
    setPrayerText('');
    setPrayerSent(true);
    setTimeout(() => setPrayerSent(false), 3000);
    try {
      await addDoc(collection(db, 'live_streams', 'default', 'messages'), msgData);
    } catch {
      setMessages(p => [...p, { ...msgData, id: Date.now().toString(), time: 'just now', type: 'prayer' }]);
    }
  };

  // ── Giving ─────────────────────────────────────────────────
  const handleGive = async () => {
    const amt = giveAmount || parseInt(customAmt);
    if (!amt) return;
    await addDonation?.({
      donorName:     currentUser?.fullName || 'Anonymous Live Donor',
      donorEmail:    currentUser?.email    || '',
      amount:        amt,
      category:      'Live Offering',
      paymentMethod: 'Mobile Money (Live)',
      userId:        currentUser?.id,
    });
    const msg: LiveMessage = {
      id: Date.now().toString(),
      name: currentUser?.fullName || 'A member',
      text: `Gave ₵${amt} — God bless SIJM! 🙏`,
      type: 'gift', avatar: '💝', time: 'just now',
    };
    setMessages(p => [...p, msg]);
    setGiveDone(true);
    setTimeout(() => { setGiveDone(false); setGiveAmount(null); setCustomAmt(''); }, 4000);
  };

  // ── Helpers ────────────────────────────────────────────────
  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const embedUrl = buildEmbedUrl(liveStatus, liveCfg.manualYoutubeUrl || '', liveCfg.manualFacebookUrl || '');

  const showPlatformToggle = liveCfg.preferredPlatform === 'both' && liveStatus.isLive;

  const availableTabs = [
    liveCfg.chatEnabled !== false    && { id: 'chat'   as const, label: 'Chat',   Icon: MessageSquare },
    liveCfg.prayerEnabled !== false  && { id: 'prayer' as const, label: 'Prayer', Icon: Heart },
    liveCfg.givingEnabled !== false  && { id: 'giving' as const, label: 'Give',   Icon: Gift },
  ].filter(Boolean) as { id: 'chat' | 'prayer' | 'giving'; label: string; Icon: any }[];

  // ── Render ─────────────────────────────────────────────────
  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="live">
      {/* Admin Panel */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel cfg={liveCfg} onSave={handleSaveConfig} onClose={() => setShowAdmin(false)}
            liveStatus={liveStatus} onCheckNow={detectLive} checking={checking} />
        )}
      </AnimatePresence>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden text-white"
           style={{ background: `linear-gradient(135deg, ${B.navy} 0%, #1a1a4e 60%, #3b0764 100%)` }}>
        {/* animated radial pulses when live */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {liveStatus.isLive && [1, 2, 3].map(i => (
            <motion.div key={i}
              animate={{ scale: [1, 2.8], opacity: [0.12, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full border border-red-500/30" />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4">
            {/* Live / offline badge */}
            <div className="flex items-center gap-3">
              {liveStatus.isLive ? (
                <>
                  <LiveDot />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-400">
                    We Are Live Now
                  </span>
                  {liveStatus.platform !== 'none' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                      {liveStatus.platform === 'youtube' ? <Youtube size={10} className="text-red-400" /> : <Facebook size={10} className="text-blue-400" />}
                      via {liveStatus.platform}
                    </span>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                  {checking ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
                  {checking ? 'Checking for live stream…' : 'No live stream at the moment'}
                </span>
              )}
            </div>

            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none">
              {(liveCfg.serviceType || 'Live Service').split(' ')[0]}<br />
              <span className="text-yellow-400 italic">
                {(liveCfg.serviceType || 'Live Service').split(' ').slice(1).join(' ') || 'Service'}
              </span>
            </h1>

            {liveStatus.title && (
              <p className="text-white/50 text-sm max-w-sm">{liveStatus.title}</p>
            )}

            {/* Notification opt-in */}
            {notifPerm !== 'granted' && (
              <button onClick={requestNotifPermission}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all mt-2"
                style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.65)' }}>
                <Bell size={13} /> Enable Live Notifications
              </button>
            )}
            {notifPerm === 'granted' && (
              <div className="flex items-center gap-2 text-[10px] font-black text-green-400">
                <Bell size={11} /> Notifications enabled — you'll be alerted when we go live
              </div>
            )}

            {/* Admin control button */}
            {canControl && (
              <button onClick={() => setShowAdmin(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                <Settings size={13} /> Media Control Panel
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { Icon: Eye,   label: 'Watching',  value: liveStatus.isLive ? liveStatus.viewerCount.toLocaleString() || '—' : '—', color: 'text-yellow-400' },
              { Icon: RefreshCw, label: 'Auto-detect', value: checking ? '…' : liveStatus.checkedAt ? new Date(liveStatus.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', color: 'text-blue-300' },
              { Icon: Monitor,  label: 'Duration',  value: liveStatus.isLive ? formatTimer(serviceTimer) : '—', color: 'text-purple-300' },
            ].map(s => (
              <div key={s.label} className="text-center px-5 py-4 rounded-2xl min-w-[110px]"
                   style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <s.Icon size={18} className={`${s.color} mx-auto mb-2`} />
                <p className="text-[22px] font-black">{s.value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="min-h-screen" style={{ background: '#080820' }}>
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Video Panel ── */}
          <div className="xl:col-span-2 space-y-4">
            {/* Platform toggle (only when both are configured) */}
            {showPlatformToggle && (
              <div className="flex gap-2">
                {(['youtube', 'facebook'] as const).map(p => (
                  <button key={p} onClick={() => setActivePlatform(p)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                    style={activePlatform === p
                      ? { background: B.white, color: '#0f172a' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    {p === 'youtube'
                      ? <Youtube size={15} className="text-red-500" />
                      : <Facebook size={15} className="text-blue-500" />}
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Video embed */}
            <div className="relative aspect-video rounded-3xl overflow-hidden border"
                 style={{ background: '#0d0d2b', borderColor: 'rgba(255,255,255,0.05)' }}>
              {liveStatus.isLive && embedUrl ? (
                <iframe src={embedUrl} className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen title="SIJM Live Service" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-5">
                  <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}>
                    <Radio size={52} className="text-white/20" />
                  </motion.div>
                  <p className="font-black text-xl uppercase tracking-widest text-white/25">
                    {checking ? 'Checking for live stream…' : 'No Active Service'}
                  </p>
                  <p className="text-white/15 text-sm">
                    {liveCfg.youtubeApiKey || liveCfg.facebookAccessToken
                      ? 'Auto-detection is active. You\'ll be notified when we go live.'
                      : 'Live stream detection not yet configured.'}
                  </p>
                  {canControl && !liveCfg.youtubeApiKey && !liveCfg.facebookAccessToken && (
                    <button onClick={() => setShowAdmin(true)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest text-white"
                      style={{ background: B.royal }}>
                      <Key size={14} /> Configure API Keys
                    </button>
                  )}
                  {canControl && (liveCfg.youtubeApiKey || liveCfg.facebookAccessToken) && (
                    <button onClick={detectLive} disabled={checking}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest text-white"
                      style={{ background: '#065f46' }}>
                      {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {checking ? 'Checking…' : 'Check Now'}
                    </button>
                  )}
                </div>
              )}

              {/* LIVE badge overlay */}
              {liveStatus.isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
                  <LiveDot />
                  <span className="text-white text-[9px] font-black uppercase tracking-widest">Live</span>
                </div>
              )}

              {/* Auto-detect badge */}
              {!liveStatus.isLive && (liveCfg.youtubeApiKey || liveCfg.facebookAccessToken) && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
                     style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {checking
                    ? <Loader2 size={10} className="text-white/50 animate-spin" />
                    : <RefreshCw size={10} className="text-white/30" />}
                  <span className="text-[8px] font-black text-white/30 uppercase">
                    {checking ? 'Checking…' : 'Auto-detecting · every 60s'}
                  </span>
                </div>
              )}
            </div>

            {/* Service Info row */}
            {(liveCfg.sermonSeries || liveCfg.preacher || liveCfg.serviceType) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Sermon Series', value: liveCfg.sermonSeries, Icon: Flame },
                  { label: 'Preacher',      value: liveCfg.preacher,     Icon: Hand },
                  { label: 'Service Type',  value: liveCfg.serviceType,  Icon: Zap },
                ].map(info => info.value ? (
                  <div key={info.label} className="flex items-center gap-3 p-4 rounded-2xl"
                       style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <info.Icon size={16} className="text-yellow-400 shrink-0" />
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/25">{info.label}</p>
                      <p className="text-white text-[11px] font-bold mt-0.5">{info.value}</p>
                    </div>
                  </div>
                ) : null)}
              </div>
            )}

            {/* How it works info box (visible to admins when not configured) */}
            {canControl && !liveCfg.youtubeApiKey && !liveCfg.facebookAccessToken && (
              <div className="flex gap-3 p-5 rounded-2xl"
                   style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}>
                <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 font-black text-[12px] mb-1">How Automatic Live Detection Works</p>
                  <p className="text-blue-200/60 text-[11px] leading-relaxed">
                    The app checks your YouTube channel or Facebook page every 60 seconds using the API keys you configure.
                    When a live broadcast is detected, it automatically embeds the stream in the app and sends a push
                    notification to all members. No manual intervention needed — as soon as you go live on YouTube/Facebook,
                    the app picks it up automatically.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar: Chat / Prayer / Give ── */}
          {availableTabs.length > 0 && (
            <div className="flex flex-col rounded-3xl overflow-hidden"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 520 }}>

              {/* Tab bar */}
              <div className="flex border-b shrink-0"
                   style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {availableTabs.map(tab => (
                  <button key={tab.id} onClick={() => setChatTab(tab.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 text-[9px] font-black uppercase tracking-widest transition-all border-b-2"
                    style={chatTab === tab.id
                      ? { borderColor: B.gold, color: B.gold, background: 'rgba(245,158,11,0.05)' }
                      : { borderColor: 'transparent', color: 'rgba(255,255,255,0.25)' }}>
                    <tab.Icon size={13} />{tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* ── Chat ── */}
                {chatTab === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col flex-1 min-h-0">
                    <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                      {messages.map(msg => (
                        <div key={msg.id}
                             className={`flex gap-3 ${msg.type === 'gift' ? 'rounded-xl p-2' : ''}`}
                             style={msg.type === 'gift' ? { background: 'rgba(245,158,11,0.1)' } : {}}>
                          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                               style={{
                                 background: msg.type === 'prayer' ? 'rgba(239,68,68,0.15)'  :
                                             msg.type === 'gift'   ? 'rgba(245,158,11,0.15)' :
                                             'rgba(99,102,241,0.2)',
                                 color: msg.type === 'prayer' ? '#f87171'  :
                                        msg.type === 'gift'   ? '#fbbf24' : '#a5b4fc',
                               }}>
                            {msg.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase tracking-wide text-white/40">{msg.name}</span>
                              {msg.type === 'prayer' && <span className="text-[7px] px-1.5 rounded-full font-black uppercase" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>Prayer</span>}
                              {msg.type === 'gift'   && <span className="text-[7px] px-1.5 rounded-full font-black uppercase" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>Gift</span>}
                            </div>
                            <p className="text-[12px] text-white/65 mt-0.5 leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendChat} className="p-4 flex gap-2 shrink-0 border-t"
                          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <input value={inputText} onChange={e => setInputText(e.target.value)}
                        placeholder={liveStatus.isLive ? 'Say something…' : 'Join us live to chat…'}
                        maxLength={200} disabled={!liveStatus.isLive}
                        className="flex-1 rounded-xl px-4 py-2.5 text-[12px] outline-none placeholder:text-white/20 disabled:opacity-40"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.white }} />
                      <button type="submit" disabled={!liveStatus.isLive}
                        className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
                        style={{ background: B.gold, color: B.navy }}>
                        <Send size={15} />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── Prayer ── */}
                {chatTab === 'prayer' && (
                  <motion.div key="prayer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col flex-1 p-5 space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                           style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <Heart size={24} className="text-red-400" />
                      </div>
                      <h3 className="text-white font-black text-[13px] uppercase tracking-widest">Live Prayer Wall</h3>
                      <p className="text-white/30 text-[10px]">Your request goes directly to our prayer team</p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {messages.filter(m => m.type === 'prayer').map(msg => (
                        <div key={msg.id} className="rounded-xl p-3"
                             style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <p className="text-red-400 text-[9px] font-black uppercase tracking-widest">{msg.name}</p>
                          <p className="text-white/60 text-[11px] mt-1">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                    {prayerSent ? (
                      <div className="p-4 rounded-xl text-center text-[11px] font-black uppercase tracking-widest"
                           style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                        🙏 Prayer received — We're standing with you!
                      </div>
                    ) : (
                      <form onSubmit={handleSendPrayer} className="space-y-3 shrink-0">
                        <textarea value={prayerText} onChange={e => setPrayerText(e.target.value)}
                          rows={3} placeholder="Share your prayer request…"
                          className="w-full rounded-xl px-4 py-3 text-[12px] outline-none resize-none placeholder:text-white/20"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: B.white }} />
                        <button type="submit"
                          className="w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 text-white"
                          style={{ background: '#dc2626' }}>
                          <Send size={13} /> Send Prayer Request
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}

                {/* ── Giving ── */}
                {chatTab === 'giving' && (
                  <motion.div key="giving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col flex-1 p-5 space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                           style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <Gift size={24} className="text-yellow-400" />
                      </div>
                      <h3 className="text-white font-black text-[13px] uppercase tracking-widest">Give Online</h3>
                      <p className="text-white/30 text-[10px]">Your offering fuels the mission</p>
                    </div>

                    {giveDone ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <motion.div animate={{ scale: [0.8, 1.2, 1] }} transition={{ duration: 0.5 }}
                          className="text-4xl">🙌</motion.div>
                        <p className="text-green-400 font-black text-[13px] uppercase tracking-widest">Thank You!</p>
                        <p className="text-white/30 text-[11px] text-center">
                          Your gift has been received. God bless you!
                        </p>
                        <button onClick={() => setGiveDone(false)}
                          className="px-6 py-2 rounded-xl text-[11px] font-black"
                          style={{ background: B.gold, color: B.navy }}>
                          Give Again
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="p-4 rounded-2xl text-center"
                             style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <p className="text-yellow-300 text-[11px] font-bold">Secure Payment via Paystack & Stripe</p>
                          <p className="text-white/40 text-[10px] mt-1">Mobile Money · Card · Bank Transfer</p>
                        </div>
                        <button onClick={() => setShowLiveGiveModal(true)}
                          className="w-full py-4 rounded-xl font-black text-[13px] uppercase tracking-widest"
                          style={{ background: B.gold, color: B.navy }}>
                          Open Give Portal →
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      {showLiveGiveModal && (
        <GiveModal
          initialCategory="Live Offering"
          userEmail={currentUser?.email || ''}
          onClose={() => setShowLiveGiveModal(false)}
          onSuccess={() => { setShowLiveGiveModal(false); setGiveDone(true); }}
          store={store}
        />
      )}
    </WebsiteLayout>
  );
};

export default LiveServicePage;
