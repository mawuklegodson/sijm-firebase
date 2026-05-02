import React, { useState, useEffect, useCallback } from 'react';
import { Gender, IdentityRole, WorkerPermission, SermonAccessLevel } from '../types';
import { filterResources, canAccessResource, getUserClearance, getAccessBadge, SUSPENSION_MESSAGE } from '../utils/accessControl.ts';
import GiveModal from '../components/GiveModal.tsx';
import {
  Play, Download, BookOpen, Music, Calendar, Heart,
  User as UserIcon, MapPin, Phone, Cake, Save, X,
  Loader2, Bell, Users, MessageCircle, CheckCircle,
  Users2, HandHeart, Sparkles, Megaphone, Bookmark,
  ChevronRight, Search, Home, Tv, Radio, MoreHorizontal,
  AlertCircle, Globe, Share2, Zap, Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDriveDirectLink,
  getEmbedUrl,
  resourceSupportsInlineAudio,
  resourceSupportsInlineVideo,
} from '../store';

// ─── Brand tokens ─────────────────────────────────────────────
const B = {
  navy:        '#0a1a6b',
  royal:       '#1a3acc',
  blue:        '#2563eb',
  bluePale:    '#dbeafe',
  blueLight:   '#eff6ff',
  purple:      '#7c3aed',
  purpleLight: '#ede9fe',
  purpleMid:   '#6d28d9',
  white:       '#ffffff',
  offWhite:    '#f8faff',
  gray:        '#94a3b8',
  grayLight:   '#f1f5f9',
  text:        '#0f172a',
  textMuted:   '#64748b',
  gold:        '#f59e0b',
  teal:        '#0891b2',
};

const GRADIENTS = [
  `linear-gradient(135deg, ${B.navy}, ${B.royal})`,
  `linear-gradient(135deg, ${B.purpleMid}, ${B.purple})`,
  `linear-gradient(135deg, #0e7490, #0891b2)`,
  `linear-gradient(135deg, #9f1239, #e11d48)`,
  `linear-gradient(135deg, #065f46, #059669)`,
  `linear-gradient(135deg, #92400e, #d97706)`,
];

const DATE_COLORS = [B.navy, B.purpleMid, B.teal, '#065f46', '#92400e'];

const DAILY_SCRIPTURES = [
  { ref: 'Psalm 23:1',    text: 'The Lord is my shepherd; I shall not want.' },
  { ref: 'John 3:16',     text: 'For God so loved the world that He gave His only Son…' },
  { ref: 'Phil 4:13',     text: 'I can do all things through Christ who strengthens me.' },
  { ref: 'Jer 29:11',     text: 'For I know the plans I have for you, declares the Lord…' },
  { ref: 'Prov 3:5',      text: 'Trust in the Lord with all your heart.' },
  { ref: 'Isaiah 40:31',  text: 'But those who hope in the Lord will renew their strength.' },
  { ref: 'Matt 6:33',     text: 'But seek first the kingdom of God and His righteousness.' },
];

// ─── Helpers ──────────────────────────────────────────────────
const getHour = () => new Date().getHours();
const greeting = () =>
  getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening';

const fmtDate = (d: string | Date) => {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

// ─── Sub-components ───────────────────────────────────────────

/** Section header with optional "See All" */
const SectionHead: React.FC<{ title: string; onSeeAll?: () => void }> = ({ title, onSeeAll }) => (
  <div className="flex items-center justify-between px-4 mb-3">
    <h2 className="text-[15px] font-black" style={{ color: B.text }}>{title}</h2>
    {onSeeAll && (
      <button onClick={onSeeAll} className="text-[11px] font-bold" style={{ color: B.royal }}>
        See All →
      </button>
    )}
  </div>
);

/** Rolling announcement banner */
const AnnouncementBanner: React.FC<{ items: any[] }> = ({ items }) => {
  const [idx, setIdx] = useState(0);
  const visible = items.slice(0, 5);
  if (!visible.length) return null;
  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative"
         style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
          className="p-4 pr-12">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={10} className="text-yellow-300" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Announcement</span>
          </div>
          <p className="text-white text-[12px] font-bold leading-snug line-clamp-2">
            {visible[idx].title}
          </p>
        </motion.div>
      </AnimatePresence>
      {visible.length > 1 && (
        <button onClick={() => setIdx(i => (i + 1) % visible.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.2)' }}>
          <ChevronRight size={14} className="text-white" />
        </button>
      )}
    </div>
  );
};

/** Today's Word card */
const DailyWordCard: React.FC<{ topResource?: any; onNavigate: (p: string) => void }> = ({ topResource, onNavigate }) => {
  const scripture = DAILY_SCRIPTURES[new Date().getDay() % DAILY_SCRIPTURES.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden mx-4 mb-4 cursor-pointer"
      onClick={() => onNavigate('downloads')}
      style={{ background: `linear-gradient(135deg, ${B.purpleMid}, ${B.purple} 60%, ${B.royal})` }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="relative z-10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={10} className="text-yellow-300" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            Today's Word · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <h3 className="text-white font-black text-[15px] leading-tight mb-1">
          {topResource?.title || 'Daily Devotional'}
        </h3>
        <p className="text-white/80 text-[12px] italic leading-relaxed mb-3 line-clamp-2">
          "{scripture.text}" — {scripture.ref}
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white text-[11px] font-black rounded-full"
                  style={{ color: B.purple }}>
            Read Now
          </button>
          <button
            onClick={e => { e.stopPropagation(); if (navigator.share) navigator.share({ title: 'Daily Word – SIJM', text: `"${scripture.text}" — ${scripture.ref}` }); }}
            className="px-4 py-2 bg-white/20 border border-white/30 text-white text-[11px] font-black rounded-full">
            Share
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/** Horizontal sermon card */
const SermonTile: React.FC<{
  resource: any; index: number;
  bookmarked: boolean;
  onBookmark: (id: string) => void;
  onPlay: (r: any) => void;
}> = ({ resource, index, bookmarked, onBookmark, onPlay }) => {
  const word = (resource.title || 'WORD').split(' ')[0].toUpperCase();
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="shrink-0 w-[140px] cursor-pointer"
      onClick={() => onPlay(resource)}>
      <div className="w-full h-[95px] rounded-2xl relative overflow-hidden mb-2"
           style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
        <span className="absolute bottom-2 left-3 text-[28px] font-black text-white/15 select-none leading-none">
          {word}
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play size={13} fill={B.royal} style={{ color: B.royal }} />
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onBookmark(resource.id); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <Bookmark size={10} fill={bookmarked ? 'white' : 'none'} className="text-white" />
        </button>
      </div>
      <p className="text-[11px] font-bold leading-tight line-clamp-1" style={{ color: B.text }}>
        {resource.title}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: B.textMuted }}>
        {resource.date ? fmtDate(resource.date) : ''}
      </p>
    </motion.div>
  );
};

/** Quick action 2×2 grid */
const QA_ITEMS = [
  { id: 'giving',           label: 'Give',           gradient: `linear-gradient(135deg, ${B.navy}, ${B.royal})` },
  { id: 'prayer-requests',  label: 'Prayer Request', gradient: `linear-gradient(135deg, ${B.purpleMid}, ${B.purple})` },
  { id: 'live-service',     label: 'Live Service',   gradient: 'linear-gradient(135deg, #0e7490, #0891b2)' },
  { id: 'books',            label: 'Bookstore',      gradient: 'linear-gradient(135deg, #9f1239, #e11d48)' },
];

const QuickActions: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <div className="mb-5 px-4">
    <SectionHead title="Quick Actions" />
    <div className="grid grid-cols-2 gap-2">
      {QA_ITEMS.map((qa, i) => (
        <motion.button key={qa.id}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 + i * 0.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate(qa.id)}
          className="relative rounded-2xl overflow-hidden h-[80px] flex items-end p-3"
          style={{ background: qa.gradient }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
          <span className="relative z-10 text-white text-[12px] font-black">{qa.label}</span>
        </motion.button>
      ))}
    </div>
  </div>
);

/** Event card */
const EventCard: React.FC<{ event: any; index: number }> = ({ event, index }) => {
  const d = event.date ? new Date(event.date) : new Date();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="mx-4 mb-2 bg-white rounded-2xl border border-slate-100 flex overflow-hidden cursor-pointer active:scale-[0.99] transition-transform">
      <div className="flex flex-col items-center justify-center px-4 py-3"
           style={{ background: B.royal, minWidth: 56 }}>
        <span className="text-[22px] font-black text-white leading-none">
          {d.toLocaleDateString('en-GB', { day: '2-digit' })}
        </span>
        <span className="text-[9px] font-black text-white/70 uppercase tracking-wide">
          {d.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
      </div>
      <div className="flex-1 p-3 min-w-0">
        <p className="text-[12px] font-black leading-tight line-clamp-1" style={{ color: B.text }}>
          {event.title}
        </p>
        <div className="flex items-center gap-1 mt-1" style={{ color: B.textMuted }}>
          <MapPin size={9} />
          <span className="text-[10px] line-clamp-1">{event.location || event.time || 'SIJM'}</span>
        </div>
      </div>
      <div className="flex items-center pr-3">
        <ChevronRight size={14} style={{ color: B.gray }} />
      </div>
    </motion.div>
  );
};

/** Sermon list item (for category view) */
const SermonListItem: React.FC<{
  resource: any; index: number;
  bookmarked: boolean;
  onBookmark: (id: string) => void;
  onPlay: (r: any) => void;
}> = ({ resource, index, bookmarked, onBookmark, onPlay }) => {
  const word = (resource.title || 'WORD').split(' ')[0].toUpperCase();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="mx-4 mb-3 bg-white rounded-2xl border border-slate-100 flex gap-3 p-3 cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => onPlay(resource)}>
      <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center"
           style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
        <span className="absolute text-[16px] font-black text-white/15 select-none">{word}</span>
        <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center relative z-10">
          <Play size={10} fill={B.royal} style={{ color: B.royal }} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black leading-tight line-clamp-1 mb-0.5" style={{ color: B.text }}>
          {resource.title}
        </p>
        <p className="text-[10px] line-clamp-1 mb-2" style={{ color: B.textMuted }}>
          {resource.description || resource.category}
        </p>
        <div className="flex items-center gap-3" style={{ color: B.textMuted }}>
          <span className="flex items-center gap-1 text-[9px]">
            <Calendar size={9} />
            {resource.date ? fmtDate(resource.date) : ''}
          </span>
          <span className="flex items-center gap-1 text-[9px]">
            <Download size={9} />
            {resource.downloadCount || 0}
          </span>
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onBookmark(resource.id); }}
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center self-center"
        style={{ background: bookmarked ? '#fef3c7' : B.grayLight }}>
        <Bookmark size={12} fill={bookmarked ? B.gold : 'none'}
                  style={{ color: bookmarked ? B.gold : B.gray }} />
      </button>
    </motion.div>
  );
};

// ─── Sermon Categories Page ───────────────────────────────────
const SermonCategoriesPage: React.FC<{
  resources: any[];
  onClose: () => void;
  onPlay: (r: any) => void;
  bookmarked: Set<string>;
  onBookmark: (id: string) => void;
}> = ({ resources, onClose, onPlay, bookmarked, onBookmark }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const cats = ['All', ...Array.from(new Set(resources.map((r: any) => r.category).filter(Boolean)))];
  const displayed = !selected || selected === 'All'
    ? resources
    : resources.filter((r: any) => r.category === selected);

  const catGrad: Record<string, string> = {
    'Sermon':              GRADIENTS[0],
    'Morning Devotion':    GRADIENTS[1],
    'Evening Reflection':  GRADIENTS[2],
    'Bible Studies':       GRADIENTS[3],
    'Prayer Guides':       GRADIENTS[4],
    'Music':               GRADIENTS[5],
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: B.offWhite }}>
      <div className="px-4 pt-4 pb-5"
           style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <X size={14} className="text-white" />
            </button>
            <h1 className="text-white font-black text-[17px]">Sermons</h1>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
               style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Search size={14} className="text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-full"
             style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Search size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Search sermons, series…
          </span>
        </div>
      </div>

      <div className="flex-1 pb-6">
        {!selected ? (
          <div className="grid grid-cols-2 gap-3 p-4">
            {cats.map((cat, i) => {
              const count = cat === 'All' ? resources.length : resources.filter((r: any) => r.category === cat).length;
              const grad = catGrad[cat] || GRADIENTS[i % GRADIENTS.length];
              const word = cat.split(' ')[0].toUpperCase();
              return (
                <motion.button key={cat}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setSelected(cat)}
                  className="relative rounded-2xl overflow-hidden flex flex-col justify-end p-4"
                  style={{ background: grad, aspectRatio: '1' }}>
                  <span className="absolute inset-0 flex items-center justify-center text-[32px] font-black text-white/12 select-none">
                    {word}
                  </span>
                  <p className="relative z-10 text-white font-black text-[13px]">{cat}</p>
                  <p className="relative z-10 text-white/60 text-[10px] mt-0.5">
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: B.grayLight }}>
                <X size={13} style={{ color: B.text }} />
              </button>
              <h2 className="font-black text-[14px] flex-1" style={{ color: B.text }}>{selected}</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: B.bluePale, color: B.royal }}>
                {displayed.length}
              </span>
            </div>
            {displayed.length > 0
              ? displayed.map((r: any, i: number) => (
                  <SermonListItem key={r.id} resource={r} index={i}
                    bookmarked={bookmarked.has(r.id)} onBookmark={onBookmark} onPlay={onPlay} />
                ))
              : (
                <div className="text-center py-16 px-8">
                  <BookOpen size={28} style={{ color: B.gray }} className="mx-auto mb-3" />
                  <p className="font-bold text-[13px]" style={{ color: B.textMuted }}>
                    No resources in this category yet
                  </p>
                </div>
              )
            }
          </>
        )}
      </div>
    </div>
  );
};

// ─── Faith Digest Page ────────────────────────────────────────
const FALLBACK_DEVOTIONALS = [
  { title: 'Live Positively Every Day',   scripture: '"Take no thought for your life…" — Matthew 6:25',          date: new Date() },
  { title: 'Walking in Grace',            scripture: '"God is able to make all grace abound…" — 2 Cor 9:8',       date: new Date(Date.now() - 864e5 * 3) },
  { title: 'Let Your Yes Be Yes',         scripture: '"Let your communication be Yea, yea…" — Matthew 5:37',     date: new Date(Date.now() - 864e5 * 7) },
  { title: 'The Lord Is My Shepherd',     scripture: '"The Lord is my shepherd; I shall not want." — Psalm 23:1', date: new Date(Date.now() - 864e5 * 10) },
  { title: 'Faith Over Fear',             scripture: '"God has not given us a spirit of fear…" — 2 Tim 1:7',      date: new Date(Date.now() - 864e5 * 14) },
];

const FaithDigestPage: React.FC<{ resources: any[]; onClose: () => void }> = ({ resources, onClose }) => {
  const devCats = ['Morning Devotion', 'Evening Reflection', 'Prayer Guides', 'Explore Devotionals'];
  const devs = resources.filter((r: any) => devCats.includes(r.category));
  const items = devs.length > 0
    ? devs.map((r: any) => ({ title: r.title, scripture: r.description, date: new Date(r.date || r.createdAt) }))
    : FALLBACK_DEVOTIONALS;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: B.offWhite }}>
      <div className="px-4 pt-4 pb-6"
           style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.purple})` }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <X size={14} className="text-white" />
          </button>
          <div>
            <h1 className="text-white font-black text-[17px]">Faith Digest</h1>
            <p className="text-white/60 text-[11px]">Daily devotionals to ignite your spirit</p>
          </div>
        </div>
      </div>
      <div className="p-4 pb-8 space-y-3">
        {items.map((item, i) => {
          const d = item.date instanceof Date ? item.date : new Date(item.date);
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 flex gap-3 p-4 cursor-pointer active:scale-[0.99] transition-transform">
              <div className="rounded-xl flex flex-col items-center justify-center px-3 py-2 shrink-0 text-center"
                   style={{ background: DATE_COLORS[i % DATE_COLORS.length], minWidth: 50 }}>
                <span className="text-[8px] font-black uppercase text-white/60">
                  {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                </span>
                <span className="text-[22px] font-black text-white leading-none">
                  {d.toLocaleDateString('en-GB', { day: '2-digit' })}
                </span>
                <span className="text-[8px] font-black uppercase text-white/60">
                  {d.toLocaleDateString('en-GB', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black leading-tight mb-1" style={{ color: B.text }}>
                  {item.title}
                </p>
                <p className="text-[11px] italic leading-relaxed line-clamp-2" style={{ color: B.textMuted }}>
                  {item.scripture}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Give Tab — uses GiveModal (Paystack + Stripe) ───────────
const GiveTab: React.FC<{ store: any }> = ({ store }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('Tithes & Offerings');
  const [done, setDone] = useState(false);

  const cats = ['Tithes & Offerings', 'Missions & Outreach', 'Building Project', 'Special Seed'];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: B.offWhite }}>
      {/* Hero */}
      <div className="px-4 pt-10 pb-14 text-center"
           style={{ background: `linear-gradient(160deg, ${B.navy} 0%, ${B.royal} 65%, ${B.purple} 100%)` }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">Give to SIJM</p>
        <div className="text-[52px] font-black text-white leading-none mb-1">₵</div>
        <p className="text-white/60 text-[12px]">{category}</p>
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="text-5xl mb-4">🙌</motion.div>
          <h2 className="font-black text-[20px] mb-2" style={{ color: B.text }}>Thank You!</h2>
          <p className="text-[13px]" style={{ color: B.textMuted }}>Your gift has been received. God bless you!</p>
          <button onClick={() => setDone(false)} className="mt-6 px-8 py-3 rounded-full text-white font-black text-[13px]"
            style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
            Give Again
          </button>
        </div>
      ) : (
        <div className="mx-4 -mt-7 bg-white rounded-2xl border border-slate-100 p-4 mb-4"
             style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: B.textMuted }}>Give Towards</p>
          <div className="flex gap-2 flex-wrap mb-5">
            {cats.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-[11px] font-black transition-all"
                style={cat === category
                  ? { background: B.royal, color: B.white }
                  : { background: B.bluePale, color: B.royal }}>
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 text-center">
            <p className="text-[12px] font-bold text-blue-800 mb-1">Secure Payment Processing</p>
            <p className="text-[11px] text-blue-600">Powered by Paystack & Stripe — Mobile Money, Card, Bank Transfer</p>
          </div>

          <button onClick={() => setModalOpen(true)}
            className="w-full py-4 rounded-full text-white text-[15px] font-black"
            style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
            Proceed to Give →
          </button>
          <p className="text-center text-[10px] mt-3" style={{ color: B.textMuted }}>
            Secure & encrypted. All transactions protected.
          </p>
        </div>
      )}

      {/* GiveModal with full Paystack/Stripe integration */}
      {modalOpen && (
        <GiveModal
          initialCategory={category}
          userEmail={store.currentUser?.email || ''}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); setDone(true); }}
          store={store}
        />
      )}
    </div>
  );
};

// ─── More Tab ─────────────────────────────────────────────────
const MoreTabPage: React.FC<{
  store: any;
  onNavigate: (p: string) => void;
  onFaithDigest: () => void;
  onProfile: () => void;
}> = ({ store, onNavigate, onFaithDigest, onProfile }) => {
  const { currentUser } = store;
  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SJ';

  const sections = [
    {
      title: 'My Account',
      rows: [
        { icon: UserIcon,     bg: B.bluePale,     ic: B.royal,   label: 'Edit Profile',      desc: 'Update personal information',     act: onProfile },
        { icon: Heart,        bg: B.purpleLight,  ic: B.purple,  label: 'Giving History',    desc: 'View your giving record',         act: () => onNavigate('financial') },
        { icon: Bookmark,     bg: '#dcfce7',      ic: '#15803d', label: 'Saved Sermons',     desc: 'Sermons you bookmarked',          act: () => onNavigate('downloads') },
      ],
    },
    {
      title: 'Explore',
      rows: [
        { icon: Sparkles,     bg: '#fef3c7',      ic: '#d97706', label: 'Faith Digest',      desc: 'Daily devotionals',               act: onFaithDigest },
        { icon: Users2,       bg: B.bluePale,     ic: B.royal,   label: 'My Groups',         desc: 'Cells & departments',             act: () => onNavigate('groups') },
        { icon: Megaphone,    bg: '#ffe4e6',      ic: '#e11d48', label: 'Announcements',     desc: 'Church announcements',            act: () => onNavigate('announcements') },
        { icon: HandHeart,    bg: B.purpleLight,  ic: B.purple,  label: 'Prayer Requests',   desc: 'Submit & view requests',          act: () => onNavigate('prayer-requests') },
        { icon: Calendar,     bg: B.bluePale,     ic: B.royal,   label: 'Events',            desc: 'Upcoming services & events',      act: () => onNavigate('events') },
      ],
    },
    {
      title: 'Help & Settings',
      rows: [
        { icon: MessageCircle, bg: B.grayLight, ic: B.textMuted, label: 'Chat',           desc: 'Message ministry team',          act: () => onNavigate('chat') },
        { icon: Share2,        bg: B.grayLight, ic: B.textMuted, label: 'Invite a Friend',desc: 'Tell a brethren about SIJM',     act: () => { try { navigator.share({ title: 'SIJM', url: window.location.href }); } catch {} } },
        { icon: Zap,           bg: B.grayLight, ic: B.textMuted, label: 'Settings',       desc: 'Customise your experience',      act: () => onNavigate('settings') },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: B.offWhite }}>
      {/* Profile banner */}
      <div className="px-4 pt-4 pb-10 flex items-center gap-4"
           style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-[18px] text-white shrink-0"
             style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)' }}>
          {initials}
        </div>
        <div>
          <p className="text-white font-black text-[16px]">{currentUser?.fullName || 'Guest'}</p>
          <p className="text-white/65 text-[11px] mt-0.5">{currentUser?.branch || 'SIJM Community'}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black text-white"
                style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
            {currentUser?.identityRole || 'Member'}
          </span>
        </div>
      </div>

      <div className="-mt-5 rounded-t-3xl pt-4 pb-8 space-y-1"
           style={{ background: B.offWhite }}>
        {sections.map(sec => (
          <div key={sec.title} className="px-4">
            <p className="text-[10px] font-black uppercase tracking-widest mt-3 mb-2"
               style={{ color: B.textMuted }}>{sec.title}</p>
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-100">
              {sec.rows.map((row, i) => (
                <button key={row.label} onClick={row.act}
                  className="w-full flex items-center gap-3 p-3.5 transition-all active:bg-slate-50"
                  style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: row.bg }}>
                    <row.icon size={16} style={{ color: row.ic }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-black" style={{ color: B.text }}>{row.label}</p>
                    <p className="text-[10px]" style={{ color: B.textMuted }}>{row.desc}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: B.gray }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Profile Edit Modal ───────────────────────────────────────
const ProfileModal: React.FC<{ store: any; onClose: () => void }> = ({ store, onClose }) => {
  const { currentUser, updateProfile } = store;
  const [form, setForm] = useState({
    fullName:   currentUser?.fullName   || '',
    phone:      currentUser?.phone      || '',
    email:      currentUser?.email      || '',
    branch:     currentUser?.branch     || '',
    birthday:   currentUser?.birthday   || '',
    location:   currentUser?.location   || '',
    occupation: currentUser?.occupation || '',
    gender:     (currentUser?.gender    || Gender.MALE) as Gender,
  });
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const submit = async () => {
    if (!form.fullName.trim()) { setSaveError('Full name is required.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile(currentUser.id, form);
      setSaved(true);
      setTimeout(onClose, 1600);
    } catch (e: any) {
      setSaveError(e?.message || 'Save failed. Please check your connection and try again.');
    } finally { setSaving(false); }
  };

  const fields = [
    { key: 'fullName',   label: 'Full Name',   type: 'text',  ph: 'Your full name',       Icon: UserIcon },
    { key: 'phone',      label: 'Phone',        type: 'tel',   ph: '+233 800 000 000',     Icon: Phone    },
    { key: 'email',      label: 'Email',        type: 'email', ph: 'you@example.com',      Icon: Mail     },
    { key: 'branch',     label: 'Branch',       type: 'text',  ph: 'e.g. Main Sanctuary',  Icon: Globe    },
    { key: 'birthday',   label: 'Birthday',     type: 'date',  ph: '',                     Icon: Cake     },
    { key: 'location',   label: 'Location',     type: 'text',  ph: 'Residential area',     Icon: MapPin   },
    { key: 'occupation', label: 'Occupation',   type: 'text',  ph: 'e.g. Teacher, Nurse',  Icon: Zap      },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 flex items-end" onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28 }}
        className="bg-white w-full rounded-t-3xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h2 className="font-black text-[17px]" style={{ color: B.text }}>Edit Profile</h2>
            <p className="text-[11px] mt-0.5" style={{ color: B.textMuted }}>All changes sync to your ministry record</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: B.grayLight }}>
            <X size={14} style={{ color: B.text }} />
          </button>
        </div>
        <div className="px-5 pb-10 space-y-3">
          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-2xl"
                 style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
              <CheckCircle size={13} style={{ color: '#15803d' }} />
              <span className="text-[12px] font-black" style={{ color: '#15803d' }}>Profile saved and synced!</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-start gap-2 p-3 rounded-2xl"
                 style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle size={13} style={{ color: '#dc2626' }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black" style={{ color: '#dc2626' }}>Save Failed</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#ef4444' }}>{saveError}</p>
              </div>
            </div>
          )}
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                     style={{ color: B.textMuted }}>{f.label}</label>
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl border"
                   style={{ background: B.offWhite, borderColor: '#e2e8f0' }}>
                <f.Icon size={14} style={{ color: B.gray }} />
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:text-slate-300"
                  style={{ color: B.text }} />
              </div>
            </div>
          ))}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                   style={{ color: B.textMuted }}>Gender</label>
            <div className="flex gap-2">
              {(['Male', 'Female'] as Gender[]).map(g => (
                <button key={g} onClick={() => setForm({ ...form, gender: g })}
                  className="flex-1 py-3 rounded-2xl text-[12px] font-black transition-all"
                  style={form.gender === g
                    ? { background: B.royal, color: B.white }
                    : { background: B.offWhite, color: B.textMuted, border: '1px solid #e2e8f0' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={saving}
            className="w-full py-4 rounded-2xl text-white font-black text-[14px] flex items-center justify-center gap-2"
            style={{ background: saving ? '#94a3b8' : `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Profile</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Media Player Modal ───────────────────────────────────────
const MediaModal: React.FC<{ resource: any; store: any; onClose: () => void }> = ({ resource, store, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/90 flex flex-col" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="flex-1 flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex-1 bg-black relative">
        {resourceSupportsInlineVideo(resource.fileUrl) ? (
          <iframe src={getEmbedUrl(resource.fileUrl)} className="w-full h-full"
                  allow="autoplay; encrypted-media" allowFullScreen />
        ) : resourceSupportsInlineAudio(resource.fileUrl) ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-6"
               style={{ background: `linear-gradient(160deg, ${B.navy}, ${B.royal})` }}>
            <div className="w-28 h-28 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)' }}>
              <Music size={40} className="text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-black text-[17px] mb-1">{resource.title}</h3>
              <p className="text-white/60 text-[12px]">{resource.category}</p>
            </div>
            <audio src={getDriveDirectLink(resource.fileUrl)} controls autoPlay
                   className="w-full max-w-sm" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: B.gray }}>
            <AlertCircle size={40} />
          </div>
        )}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <X size={16} className="text-white" />
        </button>
      </div>
      <div className="bg-white p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-black text-[14px] line-clamp-1" style={{ color: B.text }}>{resource.title}</p>
          <p className="text-[11px] mt-0.5" style={{ color: B.textMuted }}>{resource.category}</p>
        </div>
        <button
          onClick={() => { store.incrementDownloadCount?.(resource.id); window.open(getDriveDirectLink(resource.fileUrl, 'download'), '_blank'); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-[12px] font-black shrink-0"
          style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
          <Download size={13} /> Download
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Bottom Nav (mobile only) ─────────────────────────────────
interface TabDef { id: string; label: string; }

const TABS: TabDef[] = [
  { id: 'home',   label: 'Home'    },
  { id: 'sermons',label: 'Sermons' },
  { id: 'live',   label: 'Live'    },
  { id: 'give',   label: 'Give'    },
  { id: 'more',   label: 'More'    },
];

const TabIcon: React.FC<{ id: string; active: boolean }> = ({ id, active }) => {
  const col = active ? B.royal : B.gray;
  const fill = active ? B.royal : 'none';
  const s = 20;
  switch (id) {
    case 'home':    return <Home    size={s} style={{ color: col }} fill={fill} />;
    case 'sermons': return <Tv      size={s} style={{ color: col }} />;
    case 'live':    return <Radio   size={s} style={{ color: col }} />;
    case 'give':    return <Heart   size={s} style={{ color: col }} fill={fill} />;
    case 'more':    return <MoreHorizontal size={s} style={{ color: col }} />;
    default:        return null;
  }
};

const MobileBottomNav: React.FC<{ active: string; onSelect: (id: string) => void }> = ({ active, onSelect }) => (
  <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex"
       style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
    {TABS.map(tab => (
      <button key={tab.id} onClick={() => onSelect(tab.id)}
        className="flex-1 flex flex-col items-center gap-1 py-2 transition-all">
        <TabIcon id={tab.id} active={active === tab.id} />
        <span className="text-[9px] font-bold tracking-wide"
              style={{ color: active === tab.id ? B.royal : B.gray }}>
          {tab.label}
        </span>
        {active === tab.id && (
          <motion.div layoutId="nav-dot"
            className="w-1 h-1 rounded-full" style={{ background: B.royal }} />
        )}
      </button>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
interface MemberDashboardProps {
  store: any;
  navigate: (page: string) => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ store, navigate }) => {
  const { currentUser, resources = [], announcements = [], events = [], isLoading } = store;

  const [activeTab,       setActiveTab]       = useState('home');
  const [showSermons,     setShowSermons]      = useState(false);
  const [showFaithDigest, setShowFaithDigest]  = useState(false);
  const [showProfile,     setShowProfile]      = useState(false);
  const [selectedMedia,   setSelectedMedia]    = useState<any | null>(null);
  const [bookmarked,      setBookmarked]       = useState<Set<string>>(new Set());
  const [dismissedBanner, setDismissedBanner]  = useState(false);

  // Restore bookmarks from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem('sijm_bookmarks');
      if (s) setBookmarked(new Set(JSON.parse(s)));
    } catch {}
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('sijm_bookmarks', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const clearance = getUserClearance(currentUser);
  const isSuspended = clearance === 'none';

  const handleTabSelect = (tab: string) => {
    if (tab === 'sermons') { setShowSermons(true); return; }
    if (tab === 'live')    { navigate('live-service'); return; }
    setShowSermons(false);
    setShowFaithDigest(false);
    setActiveTab(tab);
  };

  // Sorted + access-filtered resources
  const sorted = filterResources(
    [...resources].sort((a: any, b: any) =>
      new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
    ),
    currentUser
  );

  const newSermons = sorted.filter((r: any) => r.category === 'Sermon').slice(0, 8);

  const upcomingEvents = [...events]
    .sort((a: any, b: any) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .filter((e: any) => new Date(e.date) >= new Date())
    .slice(0, 3);

  const topDevotional = sorted.find((r: any) =>
    ['Morning Devotion', 'Evening Reflection', 'Prayer Guides', 'Explore Devotionals'].includes(r.category)
  );

  const approvedAnnouncements = announcements.filter((a: any) =>
    a.status === 'Approved' || a.urgency === 'Critical' || a.urgency === 'Urgent'
  );

  // ── Loading splash ─────────────────────────────────────────
  if (isLoading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: B.offWhite }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
               style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.royal})` }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-9 h-9 rounded-full"
              style={{ border: '3px solid rgba(255,255,255,0.25)', borderTopColor: 'white' }} />
          </div>
          <p className="font-bold text-[13px]" style={{ color: B.textMuted }}>
            Preparing your sanctuary…
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Sermons full-screen view ───────────────────────────────
  if (showSermons) {
    return (
      <>
        <SermonCategoriesPage
          resources={sorted}
          onClose={() => setShowSermons(false)}
          onPlay={setSelectedMedia}
          bookmarked={bookmarked}
          onBookmark={toggleBookmark}
        />
        <AnimatePresence>
          {selectedMedia && (
            <MediaModal resource={selectedMedia} store={store} onClose={() => setSelectedMedia(null)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Faith Digest full-screen view ─────────────────────────
  if (showFaithDigest) {
    return <FaithDigestPage resources={sorted} onClose={() => setShowFaithDigest(false)} />;
  }

  // ── Main Layout ────────────────────────────────────────────
  return (
    <div className="relative min-h-screen" style={{ background: B.offWhite }}>

      {/* ── HOME TAB ── */}
      {activeTab === 'home' && (
        <div className="pb-24 lg:pb-8">
          {/* Header bar */}
          <div className="px-4 pt-4 pb-10"
               style={{ background: `linear-gradient(135deg, ${B.navy} 0%, ${B.royal} 100%)` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <span style={{ color: B.royal, fontSize: 15, fontWeight: 900, lineHeight: 1 }}>✝</span>
                </div>
                <span className="text-white font-black text-[14px]">SIJM</span>
              </div>
              <div className="flex gap-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                     style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Search size={14} className="text-white" />
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                     style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Bell size={14} className="text-white" />
                </div>
              </div>
            </div>
            <p className="text-white/70 text-[12px]">{greeting()},</p>
            <p className="text-white font-black text-[22px]">
              {currentUser?.fullName?.split(' ')[0] || 'Beloved'} 👋
            </p>
          </div>

          {/* Content overlapping header */}
          <div className="-mt-5 rounded-t-3xl overflow-hidden pt-4"
               style={{ background: B.offWhite }}>

            {/* Profile update banner */}
            <AnimatePresence>
              {currentUser?.profileUpdateRequested && !dismissedBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-4 mb-4 rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <AlertCircle size={16} className="text-white shrink-0" />
                  <div className="flex-1">
                    <p className="text-white font-black text-[12px]">Profile Update Required</p>
                    <p className="text-white/80 text-[10px]">Complete your membership details to unlock all features</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowProfile(true)}
                      className="px-3 py-1.5 bg-white rounded-full text-[10px] font-black"
                      style={{ color: '#d97706' }}>
                      Update
                    </button>
                    <button onClick={() => setDismissedBanner(true)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suspension banner */}
            {isSuspended && (
              <div className="mx-4 mb-4 rounded-2xl p-4 flex items-start gap-3"
                   style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-[12px] text-red-700">Sermon Access Suspended</p>
                  <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">{SUSPENSION_MESSAGE}</p>
                </div>
              </div>
            )}

            {/* Announcements */}
            {approvedAnnouncements.length > 0 && (
              <AnnouncementBanner items={approvedAnnouncements} />
            )}

            {/* Today's Word */}
            <DailyWordCard topResource={topDevotional} onNavigate={handleNavigate} />

            {/* New Sermons */}
            {newSermons.length > 0 && (
              <div className="mb-5">
                <SectionHead title="New Sermons" onSeeAll={() => setShowSermons(true)} />
                <div className="flex gap-3 overflow-x-auto px-4 pb-2"
                     style={{ scrollbarWidth: 'none' }}>
                  {newSermons.map((r: any, i: number) => (
                    <SermonTile key={r.id} resource={r} index={i}
                      bookmarked={bookmarked.has(r.id)}
                      onBookmark={toggleBookmark}
                      onPlay={setSelectedMedia} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <QuickActions onNavigate={handleNavigate} />

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="mb-5">
                <SectionHead title="Upcoming Events" onSeeAll={() => handleNavigate('events')} />
                {upcomingEvents.map((e: any, i: number) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && newSermons.length === 0 && upcomingEvents.length === 0 && (
              <div className="text-center py-12 px-8">
                <Sparkles size={28} style={{ color: B.gray }} className="mx-auto mb-3" />
                <p className="font-black text-[14px]" style={{ color: B.text }}>
                  Your spiritual home is ready
                </p>
                <p className="text-[12px] mt-1" style={{ color: B.textMuted }}>
                  Sermons and events will appear here as they're added.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GIVE TAB ── */}
      {activeTab === 'give' && (
        <div className="pb-24 lg:pb-8">
          <GiveTab store={store} />
        </div>
      )}

      {/* ── MORE TAB ── */}
      {activeTab === 'more' && (
        <div className="pb-24 lg:pb-8">
          <MoreTabPage
            store={store}
            onNavigate={handleNavigate}
            onFaithDigest={() => setShowFaithDigest(true)}
            onProfile={() => setShowProfile(true)}
          />
        </div>
      )}

      {/* Mobile bottom nav (hidden on lg+ where MemberLayout sidebar takes over) */}
      <MobileBottomNav active={activeTab} onSelect={handleTabSelect} />

      {/* ── Global Modals ── */}
      <AnimatePresence>
        {selectedMedia && (
          <MediaModal resource={selectedMedia} store={store} onClose={() => setSelectedMedia(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProfile && (
          <ProfileModal store={store} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberDashboard;
