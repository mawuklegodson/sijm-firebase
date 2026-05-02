import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Calendar, Heart, BookOpen, Radio, Users,
  Search, Bell, ChevronRight, Bookmark, MapPin,
  Sparkles, Megaphone, Gift, Share2, LogIn, Music,
  ArrowRight, Eye, Download, X, Globe, Zap,
} from 'lucide-react';
import { formatImageUrl, getDriveDirectLink, getEmbedUrl,
  resourceSupportsInlineAudio, resourceSupportsInlineVideo } from '../store.ts';
import { WorkerPermission, SermonAccessLevel } from '../types.ts';
import WebsiteLayout from '../components/WebsiteLayout.tsx';
import { useIsMobile } from '../hooks/useIsMobile.ts';

// ─── Smart dashboard routing ──────────────────────────────────
function getDashboardPage(currentUser: any): string {
  if (!currentUser) return 'login';
  const perms: string[] = currentUser.workerPermissions || [];
  if (perms.includes('Super Admin') || perms.includes('Admin')) return 'dashboard'; // AdminDashboard
  if (perms.includes('Usher') || perms.includes('Media Team') || perms.includes('Prayer Team') || perms.includes('Prayer Head')) return 'dashboard'; // UsherDashboard
  return 'dashboard'; // MemberDashboard
}

const LOGO = '/assets/logo.png';

const B = {
  navy:   '#0a1a6b',
  royal:  '#1a3acc',
  purple: '#7c3aed',
  gold:   '#f59e0b',
  white:  '#ffffff',
  off:    '#f8faff',
  gray:   '#94a3b8',
  text:   '#0f172a',
  muted:  '#64748b',
};

const GRADS = [
  `linear-gradient(135deg, ${B.navy}, ${B.royal})`,
  `linear-gradient(135deg, #6d28d9, ${B.purple})`,
  `linear-gradient(135deg, #0e7490, #0891b2)`,
  `linear-gradient(135deg, #9f1239, #e11d48)`,
  `linear-gradient(135deg, #065f46, #059669)`,
  `linear-gradient(135deg, #92400e, #d97706)`,
];

const fmtDate = (d: any) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

// ─── Media player modal ───────────────────────────────────────
const PlayerModal: React.FC<{ resource: any; onClose: () => void }> = ({ resource, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-black/90 flex flex-col" onClick={onClose}>
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
      className="flex-1 flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex-1 bg-black relative min-h-0">
        {resourceSupportsInlineVideo(resource.fileUrl)
          ? <iframe src={getEmbedUrl(resource.fileUrl)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={resource.title} />
          : resourceSupportsInlineAudio(resource.fileUrl)
          ? <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8"
                 style={{ background: `linear-gradient(160deg, ${B.navy}, ${B.royal})` }}>
              <div className="w-28 h-28 rounded-full flex items-center justify-center"
                   style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)' }}>
                <Music size={40} className="text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-white font-black text-[17px] mb-1">{resource.title}</h3>
                <p className="text-white/60 text-[12px]">{resource.category}</p>
              </div>
              <audio src={getDriveDirectLink(resource.fileUrl)} controls autoPlay className="w-full max-w-sm" />
            </div>
          : <div className="w-full h-full flex items-center justify-center text-white/30"><BookOpen size={40} /></div>
        }
        <button onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <X size={16} className="text-white" />
        </button>
      </div>
      <div className="bg-white p-4 flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="font-black text-[14px] line-clamp-1" style={{ color: B.text }}>{resource.title}</p>
          <p className="text-[11px] mt-0.5" style={{ color: B.muted }}>{resource.category}</p>
        </div>
        <button onClick={() => window.open(getDriveDirectLink(resource.fileUrl, 'download'), '_blank')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-[12px] font-black shrink-0"
          style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
          <Download size={13} /> Download
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// MOBILE HOME FEED (< lg)
// ═══════════════════════════════════════════════════════════════
const MobileHomeFeed: React.FC<{
  store: any; onNavigate: (p: string) => void;
  upEvents: any[]; publicSermons: any[]; announcements: any[];
  onPlay: (r: any) => void;
}> = ({ store, onNavigate, upEvents, publicSermons, announcements, onPlay }) => {
  const [heroIdx, setHeroIdx] = useState(0);
  const { currentUser } = store;
  const logo = store?.settings?.branding?.logoUrl ? formatImageUrl(store.settings.branding.logoUrl) : null;
  const name = store?.settings?.general?.churchName || 'SIJM';

  const heroItems = [
    ...upEvents.slice(0, 3).map((e: any) => ({ type: 'event', title: e.title, sub: e.date ? fmtDate(e.date) : '', img: e.imageUrl })),
    ...announcements.filter((a: any) => a.status === 'Approved').slice(0, 2).map((a: any) => ({
      type: 'announce', title: a.title, sub: (a.message || a.description || '').slice(0, 60) + '…', img: a.imageUrl,
    })),
  ];

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroItems.length), 5000);
    return () => clearInterval(t);
  }, [heroItems.length]);

  const qaImages = store?.landingPageConfig?.quickActionImages || {};

  const QA = [
    { id: 'giving',   label: 'Give',      grad: GRADS[0], img: qaImages.give },
    { id: 'sermons',  label: 'Sermons',   grad: GRADS[1], img: qaImages.sermons },
    { id: 'events',   label: 'Events',    grad: GRADS[2], img: qaImages.events },
    { id: 'live',     label: 'Live',      grad: GRADS[3], img: qaImages.live },
    { id: 'about',    label: 'About',     grad: GRADS[4], img: qaImages.about },
    { id: 'books',    label: 'Books',     grad: GRADS[5], img: qaImages.books },
  ];

  return (
    <div className="min-h-screen pb-6" style={{ background: B.off }}>
      {/* Top nav */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = LOGO; }} />
              : <span style={{ color: B.royal, fontSize: 14, fontWeight: 900 }}>✝</span>}
          </div>
          <span className="font-black text-[13px]" style={{ color: B.navy }}>{name}</span>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: B.off }}>
            <Search size={14} style={{ color: B.muted }} />
          </div>
          <button onClick={() => onNavigate(currentUser ? getDashboardPage(currentUser) : 'login')}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: B.off }}>
            <LogIn size={14} style={{ color: B.muted }} />
          </button>
        </div>
      </div>

      {/* Hero carousel */}
      <div className="mx-4 mt-3 relative">
        {heroItems.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div key={heroIdx}
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
                className="relative h-44 rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: GRADS[heroIdx % GRADS.length] }}
                onClick={() => onNavigate('events')}>
                {heroItems[heroIdx]?.img && (
                  <img src={formatImageUrl(heroItems[heroIdx].img)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1 block">
                    {heroItems[heroIdx]?.type === 'event' ? '📅 Upcoming Event' : '📢 Announcement'}
                  </span>
                  <p className="text-white font-black text-[15px] leading-tight line-clamp-2">{heroItems[heroIdx]?.title}</p>
                  {heroItems[heroIdx]?.sub && <p className="text-white/60 text-[10px] mt-1">{heroItems[heroIdx].sub}</p>}
                </div>
              </motion.div>
            </AnimatePresence>
            {heroItems.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {heroItems.map((_, i) => (
                  <button key={i} onClick={() => setHeroIdx(i)}
                    className="transition-all rounded-full"
                    style={{ width: i === heroIdx ? 16 : 6, height: 6, background: i === heroIdx ? B.royal : '#e2e8f0' }} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-44 rounded-2xl flex items-center justify-center"
               style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
            <p className="text-white/40 text-[12px] font-bold">No upcoming events</p>
          </div>
        )}
      </div>

      {/* New Sermons */}
      {publicSermons.length > 0 && (
        <div className="mt-5 mb-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-[15px] font-black" style={{ color: B.text }}>New Sermons</h2>
            <button onClick={() => onNavigate('sermons')} className="text-[11px] font-bold" style={{ color: B.royal }}>See All →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
            {publicSermons.map((r: any, i: number) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="shrink-0 w-[145px] cursor-pointer" onClick={() => onPlay(r)}>
                <div className="h-[95px] rounded-2xl relative overflow-hidden mb-2"
                     style={{ background: GRADS[i % GRADS.length] }}>
                  <span className="absolute bottom-2 left-3 text-[26px] font-black text-white/15 leading-none select-none">
                    {(r.title || 'WORD').split(' ')[0].toUpperCase()}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <Play size={13} fill={B.royal} style={{ color: B.royal }} />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-bold leading-tight line-clamp-1" style={{ color: B.text }}>{r.title}</p>
                <p className="text-[9px] mt-0.5" style={{ color: B.muted }}>{r.date ? fmtDate(r.date) : ''}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upEvents.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-[15px] font-black" style={{ color: B.text }}>Upcoming Events</h2>
            <button onClick={() => onNavigate('events')} className="text-[11px] font-bold" style={{ color: B.royal }}>See All →</button>
          </div>
          {upEvents.map((e: any, i: number) => {
            const d = e.date ? new Date(e.date) : new Date();
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="mx-4 mb-2 bg-white rounded-2xl border border-slate-100 flex overflow-hidden cursor-pointer"
                onClick={() => onNavigate('events')}>
                <div className="flex flex-col items-center justify-center px-4 py-3 shrink-0"
                     style={{ background: B.royal, minWidth: 56 }}>
                  <span className="text-[22px] font-black text-white leading-none">{d.toLocaleDateString('en-GB', { day: '2-digit' })}</span>
                  <span className="text-[9px] font-black text-white/70 uppercase">{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <p className="text-[12px] font-black line-clamp-1" style={{ color: B.text }}>{e.title}</p>
                  <div className="flex items-center gap-1 mt-1" style={{ color: B.muted }}>
                    <MapPin size={9} />
                    <span className="text-[10px] line-clamp-1">{e.location || e.time || 'SIJM'}</span>
                  </div>
                </div>
                <div className="flex items-center pr-3"><ChevronRight size={14} style={{ color: B.gray }} /></div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-5 px-4">
        <h2 className="text-[15px] font-black mb-3" style={{ color: B.text }}>Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {QA.map((qa, i) => (
            <motion.button key={qa.id}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate(qa.id)}
              className="relative rounded-2xl overflow-hidden h-[80px] flex items-end p-3"
              style={qa.img
                ? { backgroundImage: `url(${qa.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: qa.grad }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%)' }} />
              <span className="relative z-10 text-white text-[12px] font-black drop-shadow">{qa.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Member CTA */}
      {!currentUser && (
        <div className="mx-4 mb-5 rounded-2xl overflow-hidden"
             style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.purple})` }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Member Access</span>
            </div>
            <h3 className="text-white font-black text-[16px] mb-1">Sign in to unlock more</h3>
            <p className="text-white/60 text-[12px] mb-4">
              Prayer requests, live chat, giving history & member sermons.
            </p>
            <button onClick={() => onNavigate('login')}
              className="px-6 py-3 bg-white rounded-full text-[12px] font-black"
              style={{ color: B.navy }}>
              Sign In / Register →
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-[9px] pb-4" style={{ color: B.gray }}>
        © {new Date().getFullYear()} Salvation In Jesus Ministry
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DESKTOP WEBSITE (≥ lg) — Award-winning layout
// ═══════════════════════════════════════════════════════════════
const DesktopHome: React.FC<{
  store: any; onNavigate: (p: string) => void;
  upEvents: any[]; publicSermons: any[]; announcements: any[];
  onPlay: (r: any) => void;
}> = ({ store, onNavigate, upEvents, publicSermons, announcements, onPlay }) => {
  const { currentUser } = store;
  const name = store?.settings?.general?.churchName || 'Salvation In Jesus Ministry';
  const tagline = store?.settings?.general?.tagline || 'Connecting believers in faith, prayer, and community';

  return (
    <div>
      {/* ── Hero section ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden"
               style={{ background: `linear-gradient(135deg, ${B.navy} 0%, #1a1060 50%, #3b0764 100%)` }}>
        {/* Background orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-10"
             style={{ background: `radial-gradient(circle, ${B.royal}, transparent)` }} />
        <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
             style={{ background: `radial-gradient(circle, ${B.purple}, transparent)` }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-24 grid grid-cols-2 gap-16 items-center w-full">
          {/* Left: copy */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-12 rounded-full" style={{ background: B.gold }} />
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">
                Salvation In Jesus Ministry
              </span>
            </div>
            <h1 className="font-black leading-none mb-6" style={{ fontSize: 'clamp(48px, 6vw, 80px)', color: B.white }}>
              Where Faith<br />
              <span style={{ color: B.gold }}>Comes Alive</span>
            </h1>
            <p className="text-white/60 text-[18px] leading-relaxed mb-10 max-w-[480px]">
              {tagline}
            </p>
            <div className="flex gap-4">
              <button onClick={() => onNavigate(currentUser ? getDashboardPage(currentUser) : 'login')}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[14px] transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})`, color: B.white }}>
                {currentUser ? 'My Dashboard' : 'Join Us'} <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate('live')}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[14px] border transition-all hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: B.white }}>
                <Radio size={16} /> Watch Live
              </button>
            </div>
          </motion.div>

          {/* Right: feature cards */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-2 gap-4">
            {[
              { icon: Radio,    label: 'Live Streaming',  desc: 'Watch live services directly in the app', grad: GRADS[0] },
              { icon: BookOpen, label: 'Sermons Library',  desc: 'Access hundreds of messages', grad: GRADS[1] },
              { icon: Heart,    label: 'Prayer Wall',      desc: 'Submit and intercede together', grad: GRADS[2] },
              { icon: Calendar, label: 'Events',           desc: 'Stay connected to every service', grad: GRADS[3] },
            ].map((f, i) => (
              <motion.div key={f.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-5 rounded-2xl cursor-pointer transition-transform hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                     style={{ background: f.grad }}>
                  <f.icon size={18} className="text-white" />
                </div>
                <p className="font-black text-[13px] text-white mb-1">{f.label}</p>
                <p className="text-[11px] text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </div>
      </section>

      {/* ── Sermons section ── */}
      {publicSermons.length > 0 && (
        <section className="py-24 px-8" style={{ background: '#080820' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: B.gold }}>
                  ✦ Sermons
                </p>
                <h2 className="font-black text-white" style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.05 }}>
                  Latest Messages
                </h2>
              </div>
              <button onClick={() => onNavigate('sermons')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest border transition-all hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-5">
              {publicSermons.slice(0, 8).map((r: any, i: number) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="group cursor-pointer" onClick={() => onPlay(r)}>
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-3"
                       style={{ background: GRADS[i % GRADS.length] }}>
                    <span className="absolute bottom-3 left-3 text-[36px] font-black text-white/12 leading-none select-none">
                      {(r.title || 'WORD').split(' ')[0].toUpperCase()}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl">
                        <Play size={20} fill={B.royal} style={{ color: B.royal }} />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                         style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <Eye size={10} className="text-white/60" />
                      <span className="text-[9px] font-bold text-white/60">{r.downloadCount || 0}</span>
                    </div>
                  </div>
                  <p className="text-white font-black text-[13px] leading-tight line-clamp-1 mb-1">{r.title}</p>
                  <p className="text-white/30 text-[11px]">{r.date ? fmtDate(r.date) : ''}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Events + Announcements ── */}
      <section className="py-24 px-8" style={{ background: B.off }}>
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
          {/* Events */}
          <div className="col-span-2">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: B.royal }}>✦ Calendar</p>
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-black text-[36px]" style={{ color: B.text, lineHeight: 1.05 }}>
                Upcoming Events
              </h2>
              <button onClick={() => onNavigate('events')}
                className="flex items-center gap-2 text-[12px] font-black" style={{ color: B.royal }}>
                See All <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {upEvents.length > 0 ? upEvents.map((e: any, i: number) => {
                const d = e.date ? new Date(e.date) : new Date();
                return (
                  <motion.div key={e.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onNavigate('events')}>
                    <div className="flex flex-col items-center justify-center rounded-xl px-4 py-3 shrink-0"
                         style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})`, minWidth: 64 }}>
                      <span className="text-[28px] font-black text-white leading-none">{d.toLocaleDateString('en-GB', { day: '2-digit' })}</span>
                      <span className="text-[10px] font-black text-white/70 uppercase">{d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[15px] mb-1" style={{ color: B.text }}>{e.title}</h3>
                      {e.description && <p className="text-[12px] line-clamp-2 mb-2" style={{ color: B.muted }}>{e.description}</p>}
                      <div className="flex items-center gap-4" style={{ color: B.muted }}>
                        {e.time && <span className="flex items-center gap-1 text-[11px]"><Zap size={11} />{e.time}</span>}
                        {e.location && <span className="flex items-center gap-1 text-[11px]"><MapPin size={11} />{e.location}</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: B.gray, alignSelf: 'center', flexShrink: 0 }} />
                  </motion.div>
                );
              }) : (
                <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200">
                  <Calendar size={28} style={{ color: B.gray }} className="mx-auto mb-3" />
                  <p className="text-[13px] font-bold" style={{ color: B.muted }}>No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          {/* Announcements sidebar */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: B.purple }}>✦ Updates</p>
            <h2 className="font-black text-[28px] mb-8" style={{ color: B.text, lineHeight: 1.1 }}>
              Announcements
            </h2>
            <div className="space-y-3">
              {announcements.filter((a: any) => a.status === 'Approved').slice(0, 4).map((a: any, i: number) => (
                <div key={a.id} className="p-4 rounded-2xl"
                     style={{ background: i === 0 ? `linear-gradient(135deg, ${B.navy}, ${B.purple})` : B.white,
                               border: `1px solid ${i === 0 ? 'transparent' : '#f1f5f9'}` }}>
                  <p className={`font-black text-[13px] mb-1 ${i === 0 ? 'text-white' : ''}`} style={{ color: i === 0 ? undefined : B.text }}>
                    {a.title}
                  </p>
                  <p className={`text-[11px] line-clamp-2 ${i === 0 ? 'text-white/60' : ''}`} style={{ color: i === 0 ? undefined : B.muted }}>
                    {a.message || a.description || ''}
                  </p>
                </div>
              ))}
              {announcements.filter((a: any) => a.status === 'Approved').length === 0 && (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200">
                  <Megaphone size={24} style={{ color: B.gray }} className="mx-auto mb-2" />
                  <p className="text-[12px]" style={{ color: B.muted }}>No announcements</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-8"
               style={{ background: `linear-gradient(135deg, ${B.navy} 0%, ${B.royal} 50%, ${B.purple} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50 mb-4">✦ Community</p>
          <h2 className="font-black text-white mb-6" style={{ fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.05 }}>
            {currentUser ? `Welcome back, ${currentUser.fullName?.split(' ')[0]}!` : 'Be Part of Something Greater'}
          </h2>
          <p className="text-white/60 text-[18px] leading-relaxed mb-10 max-w-2xl mx-auto">
            {currentUser
              ? 'Access your full member experience — sermons, prayer, giving, and more.'
              : 'Join thousands of believers. Access member sermons, prayer requests, live services, and community.'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onNavigate(currentUser ? getDashboardPage(currentUser) : 'login')}
              className="flex items-center gap-2 px-10 py-5 rounded-2xl font-black text-[15px] bg-white transition-all hover:scale-105"
              style={{ color: B.navy }}>
              {currentUser ? 'Go to Dashboard' : 'Join SIJM'} <ArrowRight size={18} />
            </button>
            <button onClick={() => onNavigate('about')}
              className="flex items-center gap-2 px-10 py-5 rounded-2xl font-black text-[15px] border transition-all hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: B.white }}>
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT: detects mobile vs desktop and renders accordingly
// ═══════════════════════════════════════════════════════════════
const LandingPage: React.FC<{ onNavigate: (page: string) => void; store: any }> = ({ onNavigate, store }) => {
  const { resources = [], events = [], announcements = [] } = store;
  const isMobile = useIsMobile();
  const [playing, setPlaying] = useState<any | null>(null);

  const sorted = [...resources].sort((a: any, b: any) =>
    new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
  );

  const publicSermons = sorted.filter((r: any) =>
    r.category === 'Sermon' &&
    (!r.accessLevel || r.accessLevel === SermonAccessLevel.PUBLIC || r.accessLevel === 'General Public')
  ).slice(0, 8);

  const upEvents = [...events]
    .sort((a: any, b: any) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .filter((e: any) => new Date(e.date) >= new Date())
    .slice(0, 3);

  const sharedProps = { store, onNavigate, upEvents, publicSermons, announcements, onPlay: setPlaying };

  return (
    <>
      {isMobile ? (
        <MobileHomeFeed {...sharedProps} />
      ) : (
        <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="landing">
          <DesktopHome {...sharedProps} />
        </WebsiteLayout>
      )}
      <AnimatePresence>
        {playing && <PlayerModal resource={playing} onClose={() => setPlaying(null)} />}
      </AnimatePresence>
    </>
  );
};

export default LandingPage;
