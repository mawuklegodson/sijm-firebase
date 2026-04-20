import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Search, ShoppingCart, Download, Eye, X,
  Star, ChevronRight, Tag, Filter, BookMarked, Package,
  ChevronLeft, Heart, Share2, Check, Loader2,
  Plus, Save, Trash2, Edit3, Settings, CheckCircle2, ImageIcon
} from 'lucide-react';
import WebsiteLayout from '../components/WebsiteLayout.tsx';
import CheckoutModal from '../components/CheckoutModal.tsx';
import ReviewSystem from '../components/ReviewSystem.tsx';
import BookstoreEditor from '../components/BookstoreEditor.tsx';
import { WorkerPermission, Review } from '../types.ts';

/* ──────────── types ──────────── */
interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  type: 'ebook-free' | 'ebook-paid' | 'physical' | 'both';
  price?: number;
  pages: number;
  rating: number;
  reviews: number;
  description: string;
  excerpt?: string;
  fileUrl?: string;
  tags: string[];
  featured?: boolean;
  new?: boolean;
  soldOut?: boolean;
  isComingSoon?: boolean;
  comingSoonDate?: string;
}

/* ──────────── default books ──────────── */
const DEFAULT_BOOKS: Book[] = [
  {
    id: '1', title: 'Restoration: The Divine Blueprint',
    author: 'Apostle S.K. Mensah', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
    category: 'Prophetic', type: 'both', price: 45, pages: 214, rating: 5, reviews: 128,
    description: 'A prophetic masterwork that unveils God\'s original design for humanity—before the fall, before failure, before fear. This book will recalibrate your spirit.',
    excerpt: 'The day Adam opened his eyes, he saw glory—not guilt. Before shame entered the garden, there was a blueprint...',
    tags: ['Prophecy', 'Identity', 'Restoration'], featured: true, fileUrl: '#'
  },
  {
    id: '2', title: 'The Warfare Manual',
    author: 'Apostle S.K. Mensah', cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
    category: 'Spiritual Warfare', type: 'ebook-free', pages: 158, rating: 5, reviews: 94,
    description: 'Equip yourself for the battles of the spirit realm. This manual gives you the strategies, prayers, and decrees to walk in consistent victory.',
    tags: ['Prayer', 'Warfare', 'Victory'], new: true, fileUrl: '#'
  },
  {
    id: '3', title: 'Look Unto Jesus',
    author: 'SIJM Editorial Team', cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    category: 'Devotional', type: 'ebook-free', pages: 90, rating: 4, reviews: 67,
    description: 'A 30-day devotional rooted in the ministry\'s core message. Each day brings fresh revelation from the Name above all names.',
    tags: ['Devotional', 'Daily Walk'], fileUrl: '#'
  },
  {
    id: '4', title: 'Kingdom Economics',
    author: 'Apostle S.K. Mensah', cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80',
    category: 'Finance & Faith', type: 'both', price: 35, pages: 176, rating: 5, reviews: 82,
    description: 'God has a financial system that outperforms the world\'s. Discover biblical wealth principles that unlock supernatural provision.',
    tags: ['Finance', 'Prosperity', 'Kingdom'], fileUrl: '#'
  },
  {
    id: '5', title: 'The Prophetic Office',
    author: 'Apostle S.K. Mensah', cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80',
    category: 'Ministry', type: 'physical', price: 60, pages: 298, rating: 5, reviews: 51,
    description: 'For those called to the prophetic. This definitive text on the prophetic office covers protocol, pitfalls, and the power of accurate prophecy.',
    tags: ['Prophecy', 'Ministry', 'Leadership'], featured: true
  },
  {
    id: '6', title: 'Healing the Broken Heart',
    author: 'SIJM Counseling Team', cover: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400&q=80',
    category: 'Inner Healing', type: 'ebook-free', pages: 112, rating: 4, reviews: 203,
    description: 'A gentle but powerful guide for those walking through pain, trauma, and grief. Discover the path from brokenness to wholeness through Christ.',
    tags: ['Healing', 'Emotional Health'], fileUrl: '#'
  },
];

const CATEGORIES = ['All', 'Prophetic', 'Spiritual Warfare', 'Devotional', 'Finance & Faith', 'Ministry', 'Inner Healing'];
const FILTERS = ['All Types', 'Free eBooks', 'Paid Books', 'Physical Books'];
const BOOK_TYPES: Book['type'][] = ['ebook-free', 'ebook-paid', 'physical', 'both'];

/* ──────────── star rating ──────────── */
const Stars = ({ rating, reviews = [] }: { rating: number, reviews?: Review[] }) => {
  const avg = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : rating;
  
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= Math.round(avg) ? '#f59e0b' : 'none'} stroke={i <= Math.round(avg) ? '#f59e0b' : '#cbd5e1'} />)}
      </div>
      <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-1">{reviews.length} Verified Reviews</span>
    </div>
  );
};

/* ──────────── type badge ──────────── */
const TypeBadge = ({ type }: { type: Book['type'] }) => {
  const map = {
    'ebook-free': { label: 'Free eBook', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    'ebook-paid': { label: 'eBook', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    'physical':   { label: 'Physical', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    'both':       { label: 'eBook + Print', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  };
  const { label, cls } = map[type];
  return <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${cls}`}>{label}</span>;
};

/* ════════════════════════════════════════════════════════════════
   ADMIN: Book Editor Modal
   ════════════════════════════════════════════════════════════════ */
const BookEditorModal: React.FC<{
  book: Book | null;
  onSave: (book: Book) => void;
  onClose: () => void;
  categoriesList: string[];
}> = ({ book, onSave, onClose, categoriesList }) => {
  const isNew = !book;
  const [form, setForm] = useState<Book>(book || {
    id: Date.now().toString(),
    title: '', author: '', cover: '', category: 'Prophetic',
    type: 'ebook-free', price: 0, pages: 0, rating: 5, reviews: 0,
    description: '', excerpt: '', fileUrl: '', tags: [],
    featured: false, new: true, soldOut: false,
  });
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-indigo-950 px-8 py-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center">
              {isNew ? <Plus size={24} className="text-amber-400" /> : <Edit3 size={24} className="text-amber-400" />}
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest">{isNew ? 'Add New Book' : 'Edit Book'}</h3>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mt-0.5">Ministry Bookstore Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Book Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Restoration: The Divine Blueprint" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Author</label>
              <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Apostle S.K. Mensah" />
            </div>
          </div>

          {/* Cover & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cover Image URL</label>
              <input type="text" value={form.cover} onChange={e => setForm({ ...form, cover: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
              {form.cover && (
                <div className="mt-2 w-20 h-28 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                  <img src={form.cover} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none">
                  {categoriesList.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Book['type'] })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none">
                  {BOOK_TYPES.map(t => <option key={t} value={t}>{t === 'ebook-free' ? 'Free eBook' : t === 'ebook-paid' ? 'Paid eBook' : t === 'physical' ? 'Physical Only' : 'eBook + Print'}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Price, Pages */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₵)</label>
              <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" placeholder="0 = Free" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pages</label>
              <input type="number" value={form.pages || ''} onChange={e => setForm({ ...form, pages: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">File URL (PDF)</label>
              <input type="text" value={form.fileUrl || ''} onChange={e => setForm({ ...form, fileUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none" placeholder="Google Drive / URL" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none resize-none" />
          </div>

          {/* Excerpt */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Excerpt (for reader preview)</label>
            <textarea value={form.excerpt || ''} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none resize-none italic" />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  {tag}
                  <button onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })} className="text-indigo-300 hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none" placeholder="Add tag..." />
              <button onClick={addTag} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Add</button>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'featured' as const, label: 'Featured' },
                { key: 'new' as const, label: 'New Badge' },
                { key: 'soldOut' as const, label: 'Sold Out' },
                { key: 'isComingSoon' as const, label: 'Coming Soon' },
              ].map(flag => (
                <button key={flag.key}
                  onClick={() => setForm({ ...form, [flag.key]: !form[flag.key as keyof Book] })}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    form[flag.key as keyof Book] ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                  {flag.label}: {form[flag.key as keyof Book] ? 'ON' : 'OFF'}
                </button>
              ))}
            </div>
            
            {form.isComingSoon && (
              <div className="space-y-1 p-5 rounded-2xl border border-rose-100 bg-rose-50">
                <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">Launch Date & Time (Countdown)</label>
                <input 
                  type="datetime-local" 
                  value={form.comingSoonDate || ''} 
                  onChange={e => setForm({ ...form, comingSoonDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-rose-100 rounded-xl text-sm font-bold outline-none text-rose-900" 
                />
                <p className="text-[10px] text-rose-400 font-medium px-1 mt-2">Setting a date will activate the cinematic countdown timer for this book.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
          <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={() => onSave(form)}
            className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2">
            <Save size={16} /> {isNew ? 'Add Book' : 'Update Book'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ──────────── in-app reader modal ──────────── */
const ReaderModal = ({ book, onClose }: { book: Book; onClose: () => void }) => {
  const [page, setPage] = useState(1);
  const pages = [
    book.excerpt || 'The introduction begins here...',
    'Chapter 1: In the beginning, before time had a name, there was a blueprint. God did not create man in reaction to chaos—He created man in response to glory...',
    'Chapter 2: The moment you understand that you were made for restoration, not rehabilitation, everything changes. Rehabilitation assumes you were broken from the start...',
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-amber-50 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" style={{ fontFamily: "'Georgia', serif" }}>
        <div className="bg-indigo-950 px-8 py-5 flex items-center justify-between text-white shrink-0">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Now Reading</p>
            <p className="font-bold text-sm mt-0.5">{book.title}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/30">Page {page} / {pages.length}</span>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-10">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="text-indigo-950/80 leading-[2] text-lg space-y-6">
              <p>{pages[page - 1]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between px-8 py-5 bg-white/50 border-t border-indigo-950/10 shrink-0">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-900 disabled:opacity-30 hover:text-indigo-600 transition-colors">
            <ChevronLeft size={16} /> Previous
          </button>
          <div className="flex gap-2">
            {pages.map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-2 h-2 rounded-full transition-all ${page === i + 1 ? 'bg-indigo-900 w-4' : 'bg-indigo-200'}`} />
            ))}
          </div>
          <button onClick={() => setPage(p => Math.min(pages.length, p + 1))} disabled={page === pages.length}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-900 disabled:opacity-30 hover:text-indigo-600 transition-colors">
            Next <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ──────────── countdown timer ──────────── */
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft: any = {};
    if (difference > 0) {
      timeLeft = {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };
  const [timeLeft, setTimeLeft] = useState<any>(calculateTimeLeft());
  useEffect(() => {
    const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearTimeout(timer);
  });

  if (Object.keys(timeLeft).length === 0) return <span className="font-bold text-amber-500 uppercase tracking-widest text-xs">Available Now!</span>;

  return (
    <div className="flex items-center gap-3">
      {['d', 'h', 'm', 's'].map((key, idx) => {
        const labels = ['Days', 'Hrs', 'Mins', 'Secs'];
        return (
          <div key={key} className="flex flex-col items-center group">
            <div className="w-12 h-14 bg-indigo-950 text-white rounded-xl flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-950/20 border border-indigo-900 group-hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
              {String(timeLeft[key] || 0).padStart(2, '0')}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-2">{labels[idx]}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ──────────── book detail modal ──────────── */
const BookDetail = ({ book, onClose, onRead, onPurchase, reviews = [] }: { 
  book: Book; 
  onClose: () => void; 
  onRead: () => void; 
  onPurchase: () => void;
  reviews?: Review[];
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
        <div className="md:w-2/5 relative">
          <img src={book.cover} alt={book.title} className="w-full h-64 md:h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 to-transparent" />
          <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <X size={18} className="text-indigo-950" />
          </button>
          {book.featured && (
            <div className="absolute bottom-4 left-4 bg-amber-400 text-indigo-950 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
              ★ Featured
            </div>
          )}
        </div>
        <div className="flex-1 p-8 md:p-10 space-y-6 overflow-y-auto">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <TypeBadge type={book.type} />
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">{book.category}</span>
            </div>
            <h2 className="text-2xl font-black text-indigo-950 tracking-tight leading-tight">{book.title}</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">by {book.author}</p>
          </div>
          <div className="flex items-center gap-4">
            <Stars rating={book.rating} reviews={reviews} />
            <span className="text-slate-400 text-xs">{reviews.length || book.reviews} reviews</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 text-xs">{book.pages} pages</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm">{book.description}</p>
          {book.excerpt && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5" style={{ fontFamily: "'Georgia', serif" }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-2">Excerpt</p>
              <p className="text-slate-700 text-sm leading-relaxed italic">"{book.excerpt}"</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {book.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-wider">{tag}</span>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-2">
            {book.isComingSoon ? (
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col items-center">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 flex items-center gap-2"><Star size={14} /> Releasing Soon</p>
                {book.comingSoonDate ? <CountdownTimer targetDate={book.comingSoonDate} /> : <p className="text-xl font-black text-indigo-900 italic font-serif">Stay Tuned!</p>}
              </div>
            ) : (
              <>
                {(book.type === 'ebook-free' || book.type === 'both') && (
                  <button onClick={onRead}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100">
                    <BookOpen size={18} /> Read Now (Free Preview)
                  </button>
                )}
                {(book.type === 'ebook-free' || book.type === 'both') && (
                  <button className="w-full py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                    <Download size={18} /> Download PDF (Free)
                  </button>
                )}
                {(book.type === 'physical' || book.type === 'both' || book.type === 'ebook-paid') && book.price ? (
                  <button onClick={onPurchase}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200`}>
                    <ShoppingCart size={18} /> Purchase — ₵{book.price}
                  </button>
                ) : null}
              </>
            )}
          </div>

          <div className="pt-8 border-t border-gray-100">
            <ReviewSystem 
              bookId={book.id} 
              reviews={store.reviews || []} 
              currentUser={store.currentUser} 
              addReview={store.addReview} 
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN BOOKS PAGE
   ════════════════════════════════════════════════════════════════ */
const BooksPage: React.FC<{ onNavigate: (p: string) => void; store: any }> = ({ onNavigate, store }) => {
  const books = store.books?.length ? store.books : DEFAULT_BOOKS;
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('All');
  const [filter, setFilter]             = useState('All Types');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [readingBook, setReadingBook]   = useState<Book | null>(null);
  const [checkoutBook, setCheckoutBook] = useState<Book | null>(null);
  const [showAdmin, setShowAdmin]       = useState(false);
  const [editingBook, setEditingBook]   = useState<Book | null | undefined>(undefined); // undefined = closed, null = new, Book = edit

  /* Dynamic Categories */
  const categoriesList = ['All', ...(store.bookstoreConfig?.categories?.length ? store.bookstoreConfig.categories : CATEGORIES.filter(c => c !== 'All'))];

  /* Admin access check */
  const permissions = store?.currentUser?.workerPermissions || [];
  const isAdmin = permissions.includes(WorkerPermission.SUPER_ADMIN) || permissions.includes(WorkerPermission.ADMIN);

  const filtered = books.filter(b => {
    const matchCat    = category === 'All' || b.category === category;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                        b.author.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All Types' ||
      (filter === 'Free eBooks'    && (b.type === 'ebook-free')) ||
      (filter === 'Paid Books'     && (b.type === 'ebook-paid' || b.type === 'both')) ||
      (filter === 'Physical Books' && (b.type === 'physical' || b.type === 'both'));
    return matchCat && matchSearch && matchFilter;
  });

  const featured = books.filter(b => b.featured);

  const handleSaveBook = async (book: Book) => {
    try {
      const exists = books.find(b => b.id === book.id);
      if (exists) {
        await store.updateBook(book.id, book);
      } else {
        await store.addBook(book);
      }
      setEditingBook(undefined);
    } catch (e) {
      alert('Failed to save book');
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await store.deleteBook(id);
      } catch (e) {
        alert('Failed to delete book');
      }
    }
  };

  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="books">
      {store.bookstoreConfig?.isComingSoon && !isAdmin ? (
        <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-6 text-center z-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 blur-3xl bg-[url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1200&q=80')] bg-cover bg-center" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 space-y-10 max-w-2xl">
            <div className="w-24 h-24 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto border border-amber-400/20 shadow-[0_0_80px_rgba(251,191,36,0.2)]">
              <BookMarked size={40} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none italic font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
                Preparing <br /><span className="text-amber-400">The Library.</span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl font-medium mt-6 leading-relaxed">
                The SIJM Bookstore is undergoing a divine upgrade. Powerful new prophetic resources and tools are being uploaded.
              </p>
            </div>
            
            <div className="pt-10 flex flex-col items-center gap-6 border-t border-white/10">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-white/30">Connect in the meantime</span>
              <button onClick={() => onNavigate('sermons')} className="px-10 py-5 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-amber-400 transition-colors">
                Explore Sermons
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
      <>
      {/* Admin Editor Modal */}
      <AnimatePresence>
        {editingBook !== undefined && (
          <BookEditorModal
            book={editingBook}
            onSave={handleSaveBook}
            onClose={() => setEditingBook(undefined)}
            categoriesList={categoriesList}
          />
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="bg-indigo-950 text-white py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=40)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-indigo-950/90 to-indigo-950" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-5 py-2 bg-amber-400/10 border border-amber-400/20 rounded-full">
                <BookMarked size={14} className="text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">Ministry Bookstore</span>
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                Books &<br /><span className="text-amber-400 italic">Resources</span>
              </h1>
              
              {isAdmin && (
                <button 
                  onClick={() => setShowAdmin(!showAdmin)}
                  className={`mt-4 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${showAdmin ? 'bg-amber-400 text-indigo-950 shadow-xl shadow-amber-400/20' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                >
                  <Settings size={16} /> {showAdmin ? 'Hide Store Settings' : 'Manage Store (Global)'}
                </button>
              )}
              <p className="text-white/50 text-lg font-medium max-w-md leading-relaxed">
                Prophetic literature, devotionals, and theological works authored from the heart of SIJM's ministry.
              </p>

              {/* Admin button */}
              {isAdmin && (
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => setShowAdmin(!showAdmin)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest">
                    <Settings size={14} /> {showAdmin ? 'Hide Admin' : 'Manage Books'}
                  </button>
                  {showAdmin && (
                    <button onClick={() => setEditingBook(null)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 rounded-xl text-white hover:bg-emerald-500 transition-all text-[9px] font-black uppercase tracking-widest">
                      <Plus size={14} /> Add Book
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* cart - hidden for pure direct checkout flow */}
            <div className="hidden md:flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-6 py-4">
              <ShoppingCart size={20} className="text-amber-400 opacity-50" />
              <span className="text-white/50 font-black text-sm uppercase tracking-widest">Store Live</span>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Book List (Table view) */}
      {isAdmin && showAdmin && (
        <section className="bg-indigo-900/50 py-12 px-6 border-b border-indigo-800 space-y-12">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-2xl">
              <BookstoreEditor store={store} />
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">📚 Book Inventory ({books.length} books)</h3>
            <div className="space-y-2">
              {books.map(book => (
                <div key={book.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
                  <img src={book.cover} alt={book.title} className="w-12 h-16 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{book.title}</p>
                    <p className="text-white/40 text-[10px] font-medium">{book.author} · {book.category}</p>
                  </div>
                  <TypeBadge type={book.type} />
                  {book.price ? <span className="text-amber-400 text-xs font-black">₵{book.price}</span> : <span className="text-emerald-400 text-[9px] font-black uppercase">Free</span>}
                  <div className="flex gap-2">
                    <button onClick={() => setEditingBook(book)} className="p-2 bg-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-all">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteBook(book.id)} className="p-2 bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="bg-slate-50 py-16 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-1 bg-amber-400 rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Featured Books</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featured.map((book, idx) => (
              <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedBook(book)}
                className="group flex gap-6 bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-pointer">
                <img src={book.cover} alt={book.title} className="w-24 h-32 object-cover rounded-2xl shadow-lg shrink-0 group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                <div className="flex flex-col justify-between min-w-0">
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap"><TypeBadge type={book.type} /></div>
                    <h3 className="font-black text-indigo-950 text-xl tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{book.title}</h3>
                    <p className="text-slate-400 text-xs font-medium">{book.author}</p>
                    <Stars rating={book.rating} reviews={store.reviews?.filter((r: Review) => r.bookId === book.id)} />
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    {book.price && !book.isComingSoon && <span className="text-indigo-950 font-black text-lg">₵{book.price}</span>}
                    <span className="flex items-center gap-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                      View Book <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Books */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* controls */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900" />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* category pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categoriesList.map((c: string) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${category === c ? 'bg-indigo-950 text-white border-indigo-950' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((book, idx) => (
              <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/8 transition-all duration-500 overflow-hidden cursor-pointer"
                onClick={() => setSelectedBook(book)}>
                <div className="relative overflow-hidden h-52">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/70 to-transparent" />
                  {book.new && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest">New</div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <TypeBadge type={book.type} />
                    <Stars rating={book.rating} />
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="font-black text-indigo-950 text-lg tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{book.title}</h3>
                    <p className="text-slate-400 text-xs font-medium mt-1">{book.author}</p>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{book.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    {book.price && !book.isComingSoon ? (
                      <span className="text-indigo-950 font-black text-base">₵{book.price}</span>
                    ) : book.isComingSoon ? (
                      <span className="text-amber-600 font-black text-[9px] uppercase tracking-widest">Coming Soon</span>
                    ) : (
                      <span className="text-emerald-600 font-black text-xs uppercase tracking-widest">Free</span>
                    )}
                    <div className="flex gap-2">
                      {(book.type === 'ebook-free' || book.type === 'both') && (
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                          <BookOpen size={14} />
                        </div>
                      )}
                      {(book.type === 'physical' || book.type === 'both') && book.price && (
                        <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-indigo-600 transition-all">
                          <ShoppingCart size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
              <BookMarked size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No books found</p>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {selectedBook && !readingBook && !checkoutBook && (
          <BookDetail 
            key="detail" 
            book={selectedBook} 
            reviews={store.reviews?.filter((r: Review) => r.bookId === selectedBook.id)}
            onClose={() => setSelectedBook(null)}
            onRead={() => { setReadingBook(selectedBook); setSelectedBook(null); }}
            onPurchase={() => { 
              if (!store.currentUser) {
                alert('Please sign in to purchase books.');
                onNavigate('login');
              } else {
                setCheckoutBook(selectedBook); 
                setSelectedBook(null); 
              }
            }} 
          />
        )}
        {readingBook && (
          <ReaderModal key="reader" book={readingBook} onClose={() => setReadingBook(null)} />
        )}
        {checkoutBook && (
          <CheckoutModal 
            key="checkout" 
            book={checkoutBook} 
            userEmail={store.currentUser?.email || 'guest@sijm.org'} 
            onClose={() => setCheckoutBook(null)} 
            store={store}
            onSuccess={() => { 
               setCheckoutBook(null); 
               alert('Payment successful! Your book is now available in your digital library.'); 
            }} 
          />
        )}
      </AnimatePresence>
      </>
      )}
    </WebsiteLayout>
  );
};

export default BooksPage;
