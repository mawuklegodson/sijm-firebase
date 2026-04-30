
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Download, Music, X, Sparkles, Shield, Search, Filter, AlertCircle } from 'lucide-react';
import { Resource, SermonAccessLevel } from '../types.ts';
import { getDriveDirectLink, getEmbedUrl, isDriveLink, formatImageUrl, resourceSupportsInlineAudio, resourceSupportsInlineVideo } from '../store.ts';
import WebsiteLayout from '../components/WebsiteLayout.tsx';
import SermonQandA from '../components/SermonQandA.tsx';
import { filterResources, getUserClearance, getAccessBadge, SUSPENSION_MESSAGE } from '../utils/accessControl.ts';

const Noise = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] mix-blend-overlay">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

const SermonsPage: React.FC<{ onNavigate: (page: string) => void, store: any }> = ({ onNavigate, store }) => {
  const { resources, currentUser } = store;
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const clearance = getUserClearance(currentUser);
  const isSuspended = clearance === 'none';

  const visibleResources = filterResources(resources, currentUser)
    .sort((a: Resource, b: Resource) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

  const filteredResources = visibleResources.filter((r: Resource) => {
    const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(visibleResources.map((r: Resource) => r.category)))];

  const handleDownload = async (res: Resource) => {
    store.incrementDownloadCount(res.id);
    const directLink = getDriveDirectLink(res.fileUrl, 'download');
    
    if (isDriveLink(res.fileUrl)) {
      const a = document.createElement('a');
      a.href = directLink;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const link = document.createElement('a');
      link.href = directLink;
      link.setAttribute('download', `${res.title}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleToggleAudio = (res: Resource) => {
    const isSame = activeAudioId === res.id;
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== res.id && audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    if (isSame) {
      setActiveAudioId(null);
    } else {
      setActiveAudioId(res.id);
      setActiveVideoId(null);
    }
  };

  const handleToggleVideo = (res: Resource) => {
    const isSame = activeVideoId === res.id;
    if (isSame) {
      setActiveVideoId(null);
    } else {
      setActiveVideoId(res.id);
      setActiveAudioId(null);
    }
  };

  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="sermons">
      <section className="py-20 md:py-40 px-6 bg-slate-50 relative overflow-hidden">
        <Noise />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-6 py-2.5 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm"
            >
              <div className="w-2 h-2 bg-indigo-600 rounded-full" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Prophetic Archive</span>
            </motion.div>
            <h1 className="text-5xl md:text-8xl font-black text-indigo-950 uppercase tracking-tighter leading-[0.8] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sermon <br />
              <span className="text-indigo-600 not-italic font-sans tracking-[-0.06em] block mt-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900">Archive.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto">
              Access the complete library of teachings, prophetic words, and spiritual guidance.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-6 mb-20">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search for sermons, topics, or scriptures..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-3xl py-6 pl-16 pr-8 text-indigo-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600/50 focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-xl shadow-slate-200/20"
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
              {(categories as string[]).map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-8 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-xl shadow-slate-200/20 ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Sermon (Latest) */}
          {filteredResources.length > 0 && searchQuery === '' && selectedCategory === 'All' && (
            <div className="mb-32">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative bg-indigo-950 rounded-[4rem] overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,0.3)]"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative h-[400px] lg:h-auto overflow-hidden">
                    <img 
                      src={filteredResources[0].thumbnailUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=2000"} 
                      alt={filteredResources[0].title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] opacity-60"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-transparent to-transparent hidden lg:block" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const res = filteredResources[0];
                          if (resourceSupportsInlineVideo(res)) handleToggleVideo(res);
                          else if (resourceSupportsInlineAudio(res)) handleToggleAudio(res);
                        }}
                        className="w-24 h-24 rounded-full bg-amber-400 flex items-center justify-center text-indigo-950 shadow-2xl shadow-amber-400/40"
                      >
                        <Play size={32} fill="currentColor" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="p-12 md:p-20 flex flex-col justify-center space-y-10 relative z-10">
                    <div className="flex items-center gap-4">
                      <span className="px-5 py-2 bg-amber-400 text-indigo-950 text-[9px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl flex items-center gap-2">
                        <Sparkles size={12} />
                        Latest Release
                      </span>
                      <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
                        {new Date(filteredResources[0].date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                      {filteredResources[0].title}
                    </h2>
                    <p className="text-white/60 text-xl font-medium leading-relaxed line-clamp-3">
                      {filteredResources[0].description}
                    </p>
                    <div className="flex flex-wrap gap-6">
                      <button 
                        onClick={() => handleDownload(filteredResources[0])}
                        className="px-10 py-5 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-amber-400 transition-all shadow-2xl"
                      >
                        <Download size={20} />
                        Download Message
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Sermon Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
            {filteredResources.slice(searchQuery === '' && selectedCategory === 'All' ? 1 : 0).map((res: Resource, index: number) => {
              const canPlayVideo = resourceSupportsInlineVideo(res);
              const canPlayAudio = resourceSupportsInlineAudio(res);
              const embedUrl = getEmbedUrl(res.fileUrl);

              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -20 }}
                  className="bg-white rounded-[3.5rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.05)] border border-slate-100 group flex flex-col h-full hover:shadow-[0_80px_160px_rgba(0,0,0,0.12)] transition-all duration-700"
                >
                  <div className="h-72 md:h-80 bg-indigo-950 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {(activeAudioId === res.id || activeVideoId === res.id) ? (
                        <motion.div 
                          key="player"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full relative"
                        >
                          <iframe
                            src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                            className="w-full h-full border-0"
                            title={res.title}
                            allow="autoplay"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAudioId(null);
                              setActiveVideoId(null);
                            }}
                            className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-2xl hover:bg-rose-600 transition-all border border-white/20 shadow-2xl"
                          >
                            <X size={24} />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="thumbnail"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full cursor-pointer"
                          onClick={() => canPlayVideo ? handleToggleVideo(res) : canPlayAudio ? handleToggleAudio(res) : null}
                        >
                          {res.thumbnailUrl ? (
                            <img src={res.thumbnailUrl} alt={res.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] opacity-90 group-hover:opacity-100" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10">
                              <Music size={100} />
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-950/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700" />
                          
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center scale-90 group-hover:scale-100 group-hover:bg-amber-400 group-hover:border-amber-400 transition-all duration-700 shadow-2xl">
                              <Play size={28} className="text-white group-hover:text-indigo-950 transition-colors fill-current ml-1" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="absolute top-8 left-8 flex flex-wrap gap-2">
                      <span className="px-5 py-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[8px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl">
                        {res.category}
                      </span>
                      {res.accessLevel !== SermonAccessLevel.PUBLIC && (() => {
                        const badge = getAccessBadge(res.accessLevel);
                        return (
                          <span className="px-5 py-2 text-[8px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl flex items-center gap-2"
                                style={{ background: badge.bg, color: badge.color }}>
                            <Shield size={10} />
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-10 md:p-12 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
                        {new Date(res.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-black text-indigo-950 uppercase tracking-tighter mb-6 line-clamp-2 leading-[1.1] group-hover:text-indigo-600 transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-slate-400 text-base font-medium line-clamp-3 mb-10 leading-relaxed tracking-tight">
                      {res.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-10 border-t border-slate-50">
                      <button
                        onClick={() => handleDownload(res)}
                        className="flex items-center gap-6 text-indigo-600 font-black uppercase tracking-[0.5em] text-[10px] hover:text-indigo-950 transition-all group/btn"
                      >
                        <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all duration-700 shadow-xl shadow-indigo-100">
                          <Download size={20} />
                        </div>
                        Download
                      </button>
                    </div>

                    {/* Q&A Section */}
                    {(activeAudioId === res.id || activeVideoId === res.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-12 pt-12 border-t border-slate-100"
                      >
                        <SermonQandA sermonId={res.id} sermonTitle={res.title} currentUser={currentUser} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-40">
              {isSuspended ? (
                <>
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <AlertCircle size={40} className="text-red-400" />
                  </div>
                  <h3 className="text-3xl font-black text-red-700 uppercase tracking-tighter mb-4">Access Suspended</h3>
                  <p className="text-red-500 font-medium max-w-md mx-auto">{SUSPENSION_MESSAGE}</p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                    <Search size={40} />
                  </div>
                  <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter mb-4">No Sermons Found</h3>
                  <p className="text-slate-500 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default SermonsPage;
