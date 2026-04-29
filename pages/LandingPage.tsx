import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Calendar, Heart, BookOpen, Radio, Users,
  Search, Bell, ChevronRight, Bookmark, MapPin,
  Sparkles, Megaphone, Gift, Share2, LogIn,
  X, Menu, Home, Tv, Globe, MoreHorizontal, Music
} from 'lucide-react';
import { formatImageUrl, getDriveDirectLink, getEmbedUrl,
  resourceSupportsInlineAudio, resourceSupportsInlineVideo } from '../store.ts';
import { WorkerPermission } from '../types.ts';

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
];

const fmtDate = (d: any) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

// ─── Public top nav ───────────────────────────────────────────
const TopNav: React.FC<{ store: any; onNavigate: (p: string) => void }> = ({ store, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const logo = store?.settings?.branding?.logoUrl ? formatImageUrl(store.settings.branding.logoUrl) : null;
  const name = store?.settings?.general?.churchName || 'SIJM';

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
            {logo
              ? <img src={logo} alt="Logo" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = LOGO; }} />
              : <span style={{ color: B.royal, fontSize: 14, fontWeight: 900 }}>✝</span>}
          </div>
          <span className="font-black text-[13px]" style={{ color: B.navy }}>{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: B.off }}>
            <Search size={14} style={{ color: B.muted }} />
          </div>
          <button onClick={() => onNavigate('login')}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: B.off }}>
            <LogIn size={14} style={{ color: B.muted }} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Hero banner (events/announcements carousel) ──────────────
const HeroBanner: React.FC<{ events: any[]; announcements: any[]; onNavigate: (p: string) => void }> = ({ events, announcements, onNavigate }) => {
  const [idx, setIdx] = useState(0);
  const items = [
    ...events.slice(0, 3).map(e => ({ type: 'event', title: e.title, sub: e.date ? fmtDate(e.date) : '', img: e.imageUrl, id: e.id })),
    ...announcements.filter((a: any) => a.status === 'Approved').slice(0, 2).map((a: any) => ({ type: 'announce', title: a.title, sub: a.message?.slice(0, 60) + '…' || '', img: a.imageUrl, id: a.id })),
  ];

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return (
    <div className="mx-4 mt-3 h-36 rounded-2xl flex items-center justify-center"
         style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
      <p className="text-white/50 text-[12px] font-bold">No upcoming events</p>
    </div>
  );

  const cur = items[idx % items.length];
  return (
    <div className="mx-4 mt-3 relative">
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.4 }}
          className="relative h-44 rounded-2xl overflow-hidden cursor-pointer"
          style={{ background: GRADS[idx % GRADS.length] }}
          onClick={() => onNavigate('events')}>
          {cur.img && (
            <img src={formatImageUrl(cur.img)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1 block">
              {cur.type === 'event' ? '📅 Upcoming Event' : '📢 Announcement'}
            </span>
            <p className="text-white font-black text-[15px] leading-tight line-clamp-2">{cur.title}</p>
            {cur.sub && <p className="text-white/60 text-[10px] mt-1">{cur.sub}</p>}
          </div>
        </motion.div>
      </AnimatePresence>
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="transition-all rounded-full"
              style={{ width: i === idx ? 16 : 6, height: 6, background: i === idx ? B.royal : '#e2e8f0' }} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Section header ───────────────────────────────────────────
const SH: React.FC<{ title: string; onSeeAll?: () => void }> = ({ title, onSeeAll }) => (
  <div className="flex items-center justify-between px-4 mb-3">
    <h2 className="text-[15px] font-black" style={{ color: B.text }}>{title}</h2>
    {onSeeAll && <button onClick={onSeeAll} className="text-[11px] font-bold" style={{ color: B.royal }}>See All →</button>}
  </div>
);

// ─── New Sermons row ──────────────────────────────────────────
const SermonCard: React.FC<{ resource: any; index: number; onPlay: (r: any) => void }> = ({ resource, index, onPlay }) => {
  const word = (resource.title || 'WORD').split(' ')[0].toUpperCase();
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="shrink-0 w-[145px] cursor-pointer" onClick={() => onPlay(resource)}>
      <div className="h-[95px] rounded-2xl relative overflow-hidden mb-2"
           style={{ background: GRADS[index % GRADS.length] }}>
        <span className="absolute bottom-2 left-3 text-[26px] font-black text-white/15 leading-none select-none">{word}</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow">
            <Play size={13} fill={B.royal} style={{ color: B.royal }} />
          </div>
        </div>
      </div>
      <p className="text-[11px] font-bold leading-tight line-clamp-1" style={{ color: B.text }}>{resource.title}</p>
      <p className="text-[9px] mt-0.5" style={{ color: B.muted }}>{resource.date ? fmtDate(resource.date) : ''}</p>
    </motion.div>
  );
};

// ─── Quick Actions 2×N grid ───────────────────────────────────
const QA = [
  { id: 'giving',   label: 'Give',           grad: GRADS[0] },
  { id: 'sermons',  label: 'Sermons',        grad: GRADS[1] },
  { id: 'events',   label: 'Events',         grad: GRADS[2] },
  { id: 'live',     label: 'Live',           grad: GRADS[3] },
  { id: 'about',    label: 'About Us',       grad: GRADS[4] },
  { id: 'books',    label: 'Books',          grad: `linear-gradient(135deg, #92400e, #d97706)` },
];

// ─── Event card ───────────────────────────────────────────────
const EventRow: React.FC<{ event: any; index: number; onClick: () => void }> = ({ event, index, onClick }) => {
  const d = event.date ? new Date(event.date) : new Date();
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="mx-4 mb-2 bg-white rounded-2xl border border-slate-100 flex overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onClick}>
      <div className="flex flex-col items-center justify-center px-4 py-3 shrink-0"
           style={{ background: B.royal, minWidth: 56 }}>
        <span className="text-[22px] font-black text-white leading-none">{d.toLocaleDateString('en-GB', { day: '2-digit' })}</span>
        <span className="text-[9px] font-black text-white/70 uppercase">{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
      </div>
      <div className="flex-1 p-3 min-w-0">
        <p className="text-[12px] font-black line-clamp-1" style={{ color: B.text }}>{event.title}</p>
        <div className="flex items-center gap-1 mt-1" style={{ color: B.muted }}>
          <MapPin size={9} />
          <span className="text-[10px] line-clamp-1">{event.location || event.time || 'SIJM'}</span>
        </div>
      </div>
      <div className="flex items-center pr-3"><ChevronRight size={14} style={{ color: B.gray }} /></div>
    </motion.div>
  );
};

// ─── Media player modal ───────────────────────────────────────
const PlayerModal: React.FC<{ resource: any; onClose: () => void }> = ({ resource, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/90 flex flex-col" onClick={onClose}>
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
      className="flex-1 flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex-1 bg-black relative">
        {resourceSupportsInlineVideo(resource.fileUrl)
          ? <iframe src={getEmbedUrl(resource.fileUrl)} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
          : resourceSupportsInlineAudio(resource.fileUrl)
          ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8"
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
          )
          : <div className="w-full h-full flex items-center justify-center text-white/30"><BookOpen size={40} /></div>
        }
        <button onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <X size={16} className="text-white" />
        </button>
      </div>
      <div className="bg-white p-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-black text-[14px] line-clamp-1" style={{ color: B.text }}>{resource.title}</p>
          <p className="text-[11px] mt-0.5" style={{ color: B.muted }}>{resource.category}</p>
        </div>
        <button onClick={() => window.open(getDriveDirectLink(resource.fileUrl, 'download'), '_blank')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-[12px] font-black shrink-0 ml-4"
          style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
          Download
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
const LandingPage: React.FC<{ onNavigate: (page: string) => void; store: any }> = ({ onNavigate, store }) => {
  const { resources = [], events = [], announcements = [], currentUser } = store;
  const [playing, setPlaying] = useState<any | null>(null);

  const sorted = [...resources].sort((a: any, b: any) =>
    new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
  );

  const publicSermons = sorted.filter((r: any) => {
    const lvl = (r.accessLevel || '').toLowerCase();
    return !lvl || lvl.includes('public') || lvl === 'all' || lvl === '';
  }).filter((r: any) => r.category === 'Sermon').slice(0, 8);

  const upEvents = [...events]
    .sort((a: any, b: any) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .filter((e: any) => new Date(e.date) >= new Date())
    .slice(0, 3);

  const approvedAnnouncements = announcements.filter((a: any) => a.status === 'Approved');

  return (
    <div className="min-h-screen" style={{ background: B.off }}>
      <TopNav store={store} onNavigate={page => {
        if (page === 'login') { onNavigate('login'); } else onNavigate(page);
      }} />

      <div className="pb-6">

        {/* Hero Carousel */}
        <HeroBanner events={upEvents} announcements={approvedAnnouncements} onNavigate={onNavigate} />

        {/* New Sermons */}
        {publicSermons.length > 0 && (
          <div className="mt-6 mb-5">
            <SH title="New Sermons" onSeeAll={() => onNavigate('sermons')} />
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
              {publicSermons.map((r: any, i: number) => (
                <SermonCard key={r.id} resource={r} index={i} onPlay={setPlaying} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upEvents.length > 0 && (
          <div className="mb-5">
            <SH title="Upcoming Events" onSeeAll={() => onNavigate('events')} />
            {upEvents.map((e: any, i: number) => (
              <EventRow key={e.id} event={e} index={i} onClick={() => onNavigate('events')} />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-5 px-4">
          <SH title="Quick Actions" />
          <div className="grid grid-cols-2 gap-2.5">
            {QA.map((qa, i) => (
              <motion.button key={qa.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate(qa.id)}
                className="relative rounded-2xl overflow-hidden h-[80px] flex items-end p-3"
                style={{ background: qa.grad }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
                <span className="relative z-10 text-white text-[12px] font-black">{qa.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Sign in CTA (if not logged in) */}
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
                Access prayer requests, live chat, giving history, and member resources.
              </p>
              <button onClick={() => onNavigate('login')}
                className="px-6 py-3 bg-white rounded-full text-[12px] font-black"
                style={{ color: B.navy }}>
                Sign In / Register →
              </button>
            </div>
          </div>
        )}

        {/* Latest announcement text */}
        {approvedAnnouncements[0] && (
          <div className="mx-4 mb-5 rounded-2xl p-4"
               style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
            <div className="flex items-center gap-2 mb-2">
              <Megaphone size={11} className="text-yellow-300" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Latest Announcement</span>
            </div>
            <p className="text-white font-bold text-[13px] leading-snug line-clamp-3">
              {approvedAnnouncements[0].title}
            </p>
            {approvedAnnouncements[0].message && (
              <p className="text-white/60 text-[11px] mt-1 line-clamp-2">{approvedAnnouncements[0].message}</p>
            )}
          </div>
        )}

        {/* Footer links */}
        <div className="mx-4 mt-2 flex flex-wrap gap-3 justify-center pb-4">
          {[
            { label: 'About Us', page: 'about' },
            { label: 'Sermons',  page: 'sermons' },
            { label: 'Events',   page: 'events' },
            { label: 'Give',     page: 'giving' },
            { label: 'Live',     page: 'live' },
          ].map(l => (
            <button key={l.page} onClick={() => onNavigate(l.page)}
              className="px-4 py-2 rounded-full text-[11px] font-black transition-all"
              style={{ background: B.off, color: B.muted, border: '1px solid #e2e8f0' }}>
              {l.label}
            </button>
          ))}
        </div>

        <p className="text-center text-[9px] pb-4" style={{ color: B.gray }}>
          © {new Date().getFullYear()} Salvation In Jesus Ministry
        </p>
      </div>

      {/* Media player */}
      <AnimatePresence>
        {playing && <PlayerModal resource={playing} onClose={() => setPlaying(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
