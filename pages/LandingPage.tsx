import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { getDriveDirectLink, getEmbedUrl, isDriveLink, resourceSupportsInlineAudio, resourceSupportsInlineVideo, formatImageUrl } from '../store.ts';
import { 
  ArrowRight, Play, CheckCircle2, Users, Calendar, Shield, Globe, Download, 
  Music, Pause, FileText, BookOpen, Heart, Star, Zap, ExternalLink,
  ChevronRight, Share2, MessageCircle, Clock, MapPin, X, Loader2, Sparkles, Menu,
  Home, Info, LogOut, User
} from 'lucide-react';
import { SermonAccessLevel, Resource, WorkerPermission } from '../types.ts';
const logoImg = '/assets/logo.png';

import WebsiteLayout from '../components/WebsiteLayout.tsx';

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

const FloatingOrb = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <motion.div
    animate={{
      y: [0, -20, 0],
      x: [0, 10, 0],
      scale: [1, 1.1, 1],
      opacity: [0.1, 0.2, 0.1]
    }}
    transition={{
      duration: 10 + Math.random() * 5,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
    className={`absolute rounded-full blur-[100px] pointer-events-none ${className}`}
  />
);

const LandingPage: React.FC<{ onNavigate: (page: string) => void, store: any }> = ({ onNavigate, store }) => {
  const { landingPageConfig, currentUser, resources } = store;
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  // Fallback config
  const config = landingPageConfig || {
    branding: {
      logo: logoImg,
      primaryColor: '#002366',
      secondaryColor: '#D4AF37',
    },
    hero: {
      title: 'Experience the Power of Faith',
      subtitle: 'Join our community in spreading the light of Christ across the globe.',
      backgroundType: 'image' as const,
      backgroundUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=2000',
      parallax: true,
      typography: {
        h1Size: 'text-6xl md:text-8xl',
        h2Size: 'text-xl md:text-2xl',
        fontFamily: 'Inter',
      },
    },
    sections: [],
    updatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    if (config.seo) {
      document.title = config.seo.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', config.seo.description);
      }
    }

    if (config.advanced?.customCss || config.branding) {
      let styleTag = document.getElementById('sijm-custom-css');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'sijm-custom-css';
        document.head.appendChild(styleTag);
      }
      
      const brandingStyles = `
        :root {
          --primary-color: ${config.branding.primaryColor};
          --secondary-color: ${config.branding.secondaryColor};
        }
        .bg-primary { background-color: var(--primary-color) !important; }
        .text-primary { color: var(--primary-color) !important; }
        .border-primary { border-color: var(--primary-color) !important; }
        .bg-secondary { background-color: var(--secondary-color) !important; }
        .text-secondary { color: var(--secondary-color) !important; }
        .border-secondary { border-color: var(--secondary-color) !important; }
      `;
      
      styleTag.innerHTML = brandingStyles + (config.advanced?.customCss || '');
    }

    if (config.advanced?.customJs) {
      try {
        // Use a safe way to execute custom JS
        const scriptId = 'sijm-custom-js';
        let scriptTag = document.getElementById(scriptId);
        if (scriptTag) scriptTag.remove();
        
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.innerHTML = config.advanced.customJs;
        document.body.appendChild(scriptTag);
      } catch (e) {
        console.error('Custom JS execution failed', e);
      }
    }
  }, [config]);

  const userRole = currentUser?.identityRole;
  const isLeadership = ['Pastor', 'Apostle', 'Prophet', 'Teacher', 'Evangelist', 'Leader'].includes(userRole || '');
  const isMember = userRole === 'Member' || isLeadership;

  const visibleResources = resources.filter((r: Resource) => {
    // Robust access level check
    const level = (r.accessLevel || '').toLowerCase();
    const isPublic = level.includes('public') || level === 'general public' || level === 'all' || level === '' || level === 'any';
    const isMemberOnly = level.includes('member');
    const isLeadershipOnly = level.includes('leadership');

    if (isPublic) return true;
    if (currentUser && isMemberOnly) return true;
    if (isLeadership && isLeadershipOnly) return true;
    return false;
  }).sort((a: Resource, b: Resource) => {
    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  console.log(`[LandingPage] Total resources: ${resources.length}, Visible: ${visibleResources.length}, User: ${currentUser?.email || 'Anonymous'}`);

  const handleDownload = async (res: Resource) => {
    store.incrementDownloadCount(res.id);
    const directLink = getDriveDirectLink(res.fileUrl, 'download');
    
    if (isDriveLink(res.fileUrl)) {
      // Use anchor tag for better reliability with Google Drive
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
    
    // Stop all other audio
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

  const loadMoreResources = () => {
    setVisibleCount(prev => prev + 6);
  };

  const SmartButton = () => {
    const permissions = currentUser?.workerPermissions || [];
    const isWorker = permissions.includes(WorkerPermission.ADMIN) || 
                     permissions.includes(WorkerPermission.SUPER_ADMIN) || 
                     permissions.includes(WorkerPermission.USHER) || 
                     permissions.includes(WorkerPermission.MEDIA_TEAM);
    
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (!currentUser) onNavigate('login');
          else onNavigate('dashboard');
        }}
        className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-amber-400 transition-all duration-500"
      >
        {!currentUser ? 'Member Login' : isWorker ? 'Go to Workspace' : `Welcome, ${currentUser.fullName.split(' ')[0]}`}
        <ArrowRight size={16} className="text-indigo-600" />
      </motion.button>
    );
  };

  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="landing">
      <div ref={containerRef} className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-amber-400 selection:text-indigo-950">
        {/* Hero Section — Cinematic Redesign */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Shimmer particles CSS */}
        <style>{`
          @keyframes shimmer-float {
            0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) translateX(20px) scale(0.5); opacity: 0; }
          }
          @keyframes gradient-border {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes counter-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .shimmer-particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #fbbf24;
            border-radius: 50%;
            box-shadow: 0 0 6px 2px rgba(251,191,36,0.4);
            animation: shimmer-float linear infinite;
          }
          .gradient-border-frame {
            background: linear-gradient(90deg, #fbbf24, #6366f1, #fbbf24, #6366f1);
            background-size: 300% 300%;
            animation: gradient-border 6s ease infinite;
          }
        `}</style>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="absolute inset-0 z-0">
          {config.hero.backgroundType === 'video' ? (
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover scale-105">
              <source src={config.hero.backgroundUrl} type="video/mp4" />
            </video>
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${config.hero.backgroundUrl})` }}
            />
          )}
          {/* Enhanced multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/95 via-indigo-950/50 to-indigo-950/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-transparent to-indigo-950/40" />
        </motion.div>
        
        {/* Animated Orbs - more dramatic */}
        <FloatingOrb className="top-1/4 left-1/4 w-[40vw] h-[40vw] bg-indigo-600" delay={0} />
        <FloatingOrb className="bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-amber-400" delay={2} />
        <FloatingOrb className="top-1/2 right-1/3 w-[20vw] h-[20vw] bg-indigo-400" delay={5} />
        <FloatingOrb className="bottom-1/3 left-1/3 w-[15vw] h-[15vw] bg-rose-500/50" delay={7} />

        {/* Shimmer particles */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="shimmer-particle"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `-5%`,
                animationDuration: `${6 + Math.random() * 8}s`,
                animationDelay: `${Math.random() * 10}s`,
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
              }}
            />
          ))}
        </div>

        {/* Cinematic gradient border frame */}
        <div className="absolute inset-4 md:inset-8 z-[2] pointer-events-none">
          <div className="gradient-border-frame w-full h-full rounded-[3rem] p-[1px] opacity-20">
            <div className="w-full h-full bg-indigo-950/80 rounded-[3rem]" />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 60 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          >
            <div className="flex flex-col items-center gap-8 mb-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="inline-flex items-center gap-4 px-6 py-2.5 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]"
              >
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.6em] flex items-center gap-3">
                  <Sparkles size={12} />
                  Global Prophetic Mandate
                </span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex items-center gap-4 px-5 py-2 bg-indigo-500/10 backdrop-blur-xl rounded-2xl border border-white/5"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-950 overflow-hidden bg-indigo-800">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-white font-black text-[10px] tracking-tighter">10,000+</span>
                  <span className="text-white/40 text-[7px] uppercase font-black tracking-widest">Restored Souls</span>
                </div>
              </motion.div>
            </div>
            
            {/* Staggered title reveal */}
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white leading-tight md:leading-[0.85] tracking-tighter mb-12 uppercase italic font-serif relative" style={{ fontFamily: "'Playfair Display', serif" }}>
              {config.hero.title.split(' ').slice(0, -1).join(' ').split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, rotateX: -40 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: 0.6 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 inline-block mr-[0.3em]"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-white to-amber-400 bg-[length:200%_auto] animate-gradient-x relative z-10 block mt-4"
              >
                {config.hero.title.split(' ').slice(-1)}
              </motion.span>
              <span className="absolute inset-0 -z-10 opacity-5 blur-sm select-none translate-y-4">{config.hero.title}</span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="text-lg md:text-3xl text-white/70 font-medium max-w-4xl mx-auto mb-16 leading-relaxed tracking-tight"
            >
              {config.hero.subtitle}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-12"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-amber-400/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <SmartButton />
              </div>
              <button 
                onClick={() => onNavigate('sermons')}
                className="flex items-center gap-6 text-white/50 font-black uppercase tracking-[0.4em] text-[10px] group hover:text-white transition-all"
              >
                <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-amber-400 group-hover:scale-110 transition-all duration-500 shadow-2xl relative">
                  <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping opacity-0 group-hover:opacity-100" />
                  <Play size={24} className="text-amber-400 fill-amber-400 relative z-10" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-amber-400">Watch Latest</span>
                  <span className="text-[8px] opacity-50">Prophetic Word</span>
                </div>
              </button>
            </motion.div>

            {/* Animated Counter Strip */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 1 }}
              className="mt-24 flex flex-wrap items-center justify-center gap-8 md:gap-16"
            >
              {[
                { value: '10K+', label: 'Members Worldwide', delay: 2.1 },
                { value: '500+', label: 'Sermons & Messages', delay: 2.2 },
                { value: '15+', label: 'Years of Ministry', delay: 2.3 },
                { value: '12', label: 'Nations Reached', delay: 2.4 },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stat.delay, duration: 0.6 }}
                  className="text-center group"
                >
                  <p className="text-3xl md:text-4xl font-black text-amber-400 tracking-tighter group-hover:scale-110 transition-transform">{stat.value}</p>
                  <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.4em] mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Vertical Rail Text (Desktop) */}
        <div className="hidden lg:block absolute left-12 bottom-24 z-10">
          <div className="flex items-center gap-8 rotate-[-90deg] origin-left">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.6em] whitespace-nowrap">Restoration • Prophetic • Power</span>
            <div className="w-32 h-px bg-gradient-to-r from-white/20 to-transparent" />
          </div>
        </div>

        {/* Right rail — Live indicator */}
        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-6">
          <motion.button
            onClick={() => onNavigate('live')}
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center gap-3 text-white/30 hover:text-red-400 transition-colors cursor-pointer group"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.4em] writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-lr' }}>Live Service</span>
          </motion.button>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/20 flex flex-col items-center gap-4 cursor-pointer group"
          onClick={() => onNavigate('about')}
        >
          <span className="text-[8px] font-black uppercase tracking-[0.6em] group-hover:text-amber-400 transition-colors">Explore</span>
          <div className="w-px h-16 bg-gradient-to-b from-white/30 via-white/10 to-transparent group-hover:from-amber-400 transition-all" />
        </motion.div>
      </section>

      {/* Dedicated About Section */}
      <section id="about" className="py-40 md:py-60 px-6 bg-white relative overflow-hidden">
        <Noise />
        <FloatingOrb className="top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-600/5" delay={1} />
        <FloatingOrb className="bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-amber-400/5" delay={4} />
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 md:gap-32 items-start">
            <div className="space-y-20">
              <div className="space-y-10">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-4 px-6 py-2.5 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm"
                >
                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">The SIJM Mandate</span>
                </motion.div>
                <h2 className="text-3xl md:text-6xl lg:text-8xl font-black text-indigo-950 uppercase tracking-tighter leading-tight md:leading-[0.8] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Divine <br />
                  <span className="text-indigo-600 not-italic font-sans tracking-[-0.06em] block mt-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900">Restoration.</span>
                </h2>
              </div>
              
              <div className="space-y-12">
                <p className="text-lg md:text-2xl text-slate-600 font-medium leading-tight tracking-tight max-w-2xl">
                  We are a global prophetic movement commissioned to restore the dignity of humanity through the <span className="text-indigo-950 font-black italic">power of the Holy Spirit.</span>
                </p>
                
                <div className="flex flex-wrap gap-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center text-indigo-950 shadow-xl shadow-amber-400/20">
                      <Star size={28} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-indigo-950">Prophetic</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guidance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <Zap size={28} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-indigo-950">Manifestation</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Of Power</p>
                    </div>
                  </div>
                </div>

                <div className="pt-10">
                  <button 
                    onClick={() => onNavigate('about')}
                    className="group flex items-center gap-6 text-indigo-600 font-black uppercase tracking-[0.4em] text-[10px] hover:text-indigo-950 transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-indigo-100">
                      <ArrowRight size={20} />
                    </div>
                    Read Our Full Story
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-16 lg:pt-20 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-[4/5] rounded-[4rem] overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,0.2)] group"
              >
                <img 
                  src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1200" 
                  alt="Ministry" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-950/20 to-transparent opacity-60" />
                
                <div className="absolute bottom-12 left-12 right-12 space-y-8">
                  <div className="p-8 md:p-10 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 text-white shadow-2xl">
                    <p className="text-xl md:text-2xl font-serif italic leading-tight mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                      "Restoration is not a process, it's an encounter with the Divine."
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-px bg-amber-400" />
                      <div className="flex flex-col">
                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.4em]"></p>
                        <p className="text-white/40 text-[7px] font-black uppercase tracking-[0.2em] mt-1"></p>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-12 right-12 w-24 h-24 rounded-3xl bg-amber-400 flex items-center justify-center text-indigo-950 shadow-2xl shadow-amber-400/40"
                >
                  <MessageCircle size={40} />
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="group p-8 md:p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-700 shadow-2xl shadow-slate-200/30"
                >
                  <h4 className="text-4xl md:text-6xl font-black text-indigo-950 mb-4 group-hover:text-amber-400 transition-colors tracking-tighter">15+</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] group-hover:text-white/40 transition-colors leading-relaxed">Years of Uncompromising <br />Faith & Ministry</p>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="group p-8 md:p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-700 shadow-2xl shadow-slate-200/30"
                >
                  <h4 className="text-4xl md:text-6xl font-black text-indigo-950 mb-4 group-hover:text-amber-400 transition-colors tracking-tighter">10k+</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] group-hover:text-white/40 transition-colors leading-relaxed">Lives Touched by the <br />Prophetic Word</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      <div>
        {config.sections.filter((s: any) => s.active).sort((a: any, b: any) => a.order - b.order).map((section: any) => (
          <section key={section.id} className="py-24 px-6 bg-white border-b border-slate-50">
            <div className="max-w-7xl mx-auto">
              {section.type === 'features' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="space-y-8 p-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-700 group"
                  >
                    <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-600 group-hover:bg-amber-400 group-hover:text-indigo-950 transition-all duration-500 shadow-xl shadow-indigo-100/20">
                      <Users size={36} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter group-hover:text-white transition-colors">Community</h3>
                      <p className="text-slate-500 leading-relaxed font-medium group-hover:text-white/60 transition-colors">
                        Join a vibrant community of believers dedicated to spiritual growth and mutual support.
                      </p>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="space-y-8 p-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-700 group"
                  >
                    <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center text-amber-600 group-hover:bg-amber-400 group-hover:text-indigo-950 transition-all duration-500 shadow-xl shadow-amber-100/20">
                      <Calendar size={36} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter group-hover:text-white transition-colors">Events</h3>
                      <p className="text-slate-500 leading-relaxed font-medium group-hover:text-white/60 transition-colors">
                        Stay connected through our weekly services, prayer meetings, and special ministry events.
                      </p>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="space-y-8 p-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-700 group"
                  >
                    <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 group-hover:bg-amber-400 group-hover:text-indigo-950 transition-all duration-500 shadow-xl shadow-emerald-100/20">
                      <Shield size={36} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter group-hover:text-white transition-colors">Leadership</h3>
                      <p className="text-slate-500 leading-relaxed font-medium group-hover:text-white/60 transition-colors">
                        Guided by anointed leadership committed to the biblical truth and prophetic vision.
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
              {section.type === 'text' && (
                <div className="max-w-3xl mx-auto text-center space-y-8">
                  <h2 className="text-5xl font-black text-indigo-900 uppercase tracking-tighter">{section.title}</h2>
                  <p className="text-xl text-gray-500 leading-relaxed font-medium">{section.content}</p>
                </div>
              )}
              {section.type === 'image' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <h2 className="text-5xl font-black text-indigo-900 uppercase tracking-tighter">{section.title}</h2>
                    <p className="text-xl text-gray-500 leading-relaxed font-medium">{section.content}</p>
                    <button className="px-8 py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:opacity-90 transition-all">
                      Learn More
                    </button>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl overflow-hidden shadow-2xl">
                    <img src={section.imageUrl} alt={section.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </motion.div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Sermons Section */}
      <section id="sermons" className="py-40 md:py-60 px-6 bg-slate-50 relative overflow-hidden">
        <Noise />
        <FloatingOrb className="top-[10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/10" delay={2} />
        <FloatingOrb className="bottom-[10%] right-[-5%] w-[30rem] h-[30rem] bg-amber-400/5" delay={5} />

        <div className="absolute top-0 right-0 text-[35vw] font-black text-slate-200/20 leading-none select-none pointer-events-none -mr-40 -mt-20 uppercase hidden lg:block font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
          Archive
        </div>
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-32 gap-16">
            <div className="space-y-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-4 px-6 py-2.5 bg-indigo-100 rounded-full border border-indigo-200 shadow-sm"
              >
                <Music size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Spiritual Library</span>
              </motion.div>
              <h2 className="text-3xl md:text-6xl lg:text-7xl font-black text-indigo-950 uppercase tracking-tighter leading-tight md:leading-[0.8] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Sermon <br />
                <span className="text-indigo-600 not-italic font-sans tracking-[-0.06em] block mt-4">Archive.</span>
              </h2>
              <p className="text-lg md:text-2xl text-slate-500 font-medium max-w-2xl leading-relaxed tracking-tight">
                {currentUser ? `Welcome back, ${currentUser.fullName.split(' ')[0]}. Accessing your divine library.` : 'Spiritual nourishment for your soul, available anytime, anywhere.'}
              </p>
            </div>
            {!currentUser && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => onNavigate('login')}
                className="group flex flex-col items-start gap-6"
              >
                <span className="text-indigo-600 font-black uppercase tracking-[0.4em] text-[10px] group-hover:text-indigo-950 transition-all">Sign in for member access</span>
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center group-hover:bg-amber-400 group-hover:text-indigo-950 transition-all duration-500 shadow-2xl shadow-indigo-600/20">
                  <ArrowRight size={24} />
                </div>
              </motion.button>
            )}
          </div>
          
          {/* Featured Sermon (Hero Style) */}
          {!store.isLoading && visibleResources.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-32 relative group"
            >
              <div className="absolute -inset-8 bg-indigo-600/5 rounded-[5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative bg-indigo-950 rounded-[4rem] overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,0.2)] grid grid-cols-1 lg:grid-cols-2 items-center">
                <div className="h-[400px] lg:h-[600px] relative overflow-hidden">
                  <img 
                    src={visibleResources[0].thumbnailUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1200'} 
                    alt={visibleResources[0].title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-transparent to-transparent hidden lg:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-transparent to-transparent lg:hidden" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => resourceSupportsInlineVideo(visibleResources[0]) ? handleToggleVideo(visibleResources[0]) : handleToggleAudio(visibleResources[0])}
                      className="w-24 h-24 rounded-full bg-amber-400 text-indigo-950 flex items-center justify-center shadow-2xl shadow-amber-400/40"
                    >
                      <Play size={32} className="fill-current ml-1" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="p-12 md:p-20 space-y-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="px-5 py-2 bg-amber-400 text-indigo-950 text-[9px] font-black uppercase tracking-[0.4em] rounded-full">Latest Release</span>
                      <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">{visibleResources[0].category}</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {visibleResources[0].title}
                    </h3>
                    <p className="text-white/60 text-lg md:text-xl font-medium leading-relaxed line-clamp-3">
                      {visibleResources[0].description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-8 pt-10 border-t border-white/10">
                    <button 
                      onClick={() => handleDownload(visibleResources[0])}
                      className="px-10 py-5 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all duration-500 shadow-2xl flex items-center gap-4"
                    >
                      <Download size={18} />
                      Download Message
                    </button>
                    <div className="flex flex-col">
                      <span className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mb-1">Released On</span>
                      <span className="text-white font-black text-xs uppercase tracking-widest">
                        {new Date(visibleResources[0].date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-20">
            {store.isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-40 gap-10">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-amber-400 rounded-full animate-ping" />
                  </div>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.6em] text-[10px] animate-pulse">Curating Spiritual Content...</p>
              </div>
            ) : visibleResources.length > 0 ? (
              <>
                <AnimatePresence mode="popLayout">
                  {visibleResources.slice(0, 3).map((res: Resource, index: number) => {
                    const canPlayAudio = resourceSupportsInlineAudio(res);
                    const canPlayVideo = resourceSupportsInlineVideo(res);
                    const embedUrl = getEmbedUrl(res.fileUrl);
                    
                    return (
                      <motion.div
                        key={res.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
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
                            {index === 0 && (
                              <span className="px-5 py-2 bg-amber-400 text-indigo-950 text-[8px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl flex items-center gap-2">
                                <Sparkles size={10} />
                                Latest Release
                              </span>
                            )}
                            <span className="px-5 py-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[8px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl">
                              {res.category}
                            </span>
                            {res.accessLevel !== SermonAccessLevel.PUBLIC && (
                              <span className="px-5 py-2 bg-amber-400 text-indigo-950 text-[8px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl flex items-center gap-2">
                                <Shield size={10} />
                                {res.accessLevel}
                              </span>
                            )}
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
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.fileSize || 'HD Quality'}</span>
                              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{res.downloadCount} Downloads</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                <div className="col-span-full text-center mt-32">
                  <button
                    onClick={() => onNavigate('sermons')}
                    className="px-16 py-8 bg-indigo-950 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-indigo-900/30 hover:bg-amber-400 hover:text-indigo-950 transition-all duration-700 flex items-center gap-6 mx-auto group"
                  >
                    Explore Full Archive
                    <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </>
            ) : (
            <div className="col-span-full text-center py-60 bg-white rounded-[5rem] border-2 border-dashed border-slate-100">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
                <Music size={56} className="text-slate-200" />
              </div>
              <h3 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter mb-6">No Sermons Found</h3>
              <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px]">Check back soon for spiritual nourishment.</p>
            </div>
          )}
        </div>
      </div>
    </section>

      {/* Events Section */}
      <section id="events" className="py-40 md:py-60 px-6 bg-white relative overflow-hidden">
        <Noise />
        <FloatingOrb className="top-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-amber-400/10" delay={0} />
        <FloatingOrb className="bottom-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-indigo-600/5" delay={3} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32 space-y-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-4 px-6 py-2.5 bg-amber-50 rounded-full border border-amber-100 shadow-sm"
            >
              <Calendar size={14} className="text-amber-600" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em]">Join Our Gatherings</span>
            </motion.div>
              <h2 className="text-3xl md:text-6xl lg:text-7xl font-black text-indigo-950 uppercase tracking-tighter leading-tight md:leading-[0.8] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                Upcoming <br />
                <span className="text-amber-500 not-italic font-sans tracking-[-0.06em] block mt-4">Encounters.</span>
              </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            <motion.div 
              whileHover={{ y: -20 }}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-16 md:p-20 bg-slate-50 rounded-[5rem] border border-slate-100 text-left space-y-12 hover:bg-indigo-950 group transition-all duration-700 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[60px] -mr-32 -mt-32 group-hover:bg-amber-400/10 transition-colors" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="w-24 h-24 rounded-[2.5rem] bg-amber-400 flex items-center justify-center text-indigo-950 shadow-2xl shadow-amber-400/20 group-hover:scale-110 transition-transform duration-500">
                  <Calendar size={40} />
                </div>
                <div className="text-right">
                  <p className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] group-hover:text-amber-400">Weekly Service</p>
                  <p className="text-indigo-950 font-black text-4xl group-hover:text-white tracking-tighter mt-1">Sunday</p>
                </div>
              </div>
              <div className="space-y-6 relative z-10">
                <h3 className="text-2xl md:text-5xl font-black text-indigo-900 uppercase tracking-tighter group-hover:text-white transition-colors leading-none">Manifestation of Power</h3>
                <p className="text-slate-500 font-medium text-xl leading-relaxed group-hover:text-white/60 transition-colors">Join us every Sunday for a life-transforming encounter with God through deep worship and the prophetic word.</p>
              </div>
              <div className="flex flex-wrap items-center gap-12 pt-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-white/40 border-t border-slate-200 group-hover:border-white/10 relative z-10">
                <span className="flex items-center gap-4"><Clock size={20} className="text-amber-500" /> 9:00 AM</span>
                <span className="flex items-center gap-4"><MapPin size={20} className="text-indigo-500 group-hover:text-amber-400" /> Main Sanctuary (Sege)</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -20 }}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-16 md:p-20 bg-slate-50 rounded-[5rem] border border-slate-100 text-left space-y-12 hover:bg-indigo-950 group transition-all duration-700 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[60px] -mr-32 -mt-32 group-hover:bg-indigo-600/10 transition-colors" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-500">
                  <Zap size={40} />
                </div>
                <div className="text-right">
                  <p className="text-indigo-500 font-black uppercase tracking-[0.4em] text-[10px] group-hover:text-indigo-400">Mid-Week Encounter</p>
                  <p className="text-indigo-950 font-black text-4xl group-hover:text-white tracking-tighter mt-1">Weekdays</p>
                </div>
              </div>
              <div className="space-y-6 relative z-10">
                <h3 className="text-3xl md:text-5xl font-black text-indigo-900 uppercase tracking-tighter group-hover:text-white transition-colors leading-none">Spiritual Warfare</h3>
                <p className="text-slate-500 font-medium text-xl leading-relaxed group-hover:text-white/60 transition-colors">Mondays, Wednesdays & Fridays. A dedicated time for teachings, deep prayer, and spiritual empowerment.</p>
              </div>
              <div className="flex flex-wrap items-center gap-12 pt-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-white/40 border-t border-slate-200 group-hover:border-white/10 relative z-10">
                <span className="flex items-center gap-4"><Clock size={20} className="text-indigo-500 group-hover:text-amber-400" /> 6:30 PM</span>
                <span className="flex items-center gap-4"><MapPin size={20} className="text-amber-500" /> Kasseh School Park</span>
              </div>
            </motion.div>
          </div>

          <div className="mt-32 text-center">
            <button
              onClick={() => onNavigate('events')}
              className="px-16 py-8 bg-indigo-950 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-indigo-900/30 hover:bg-amber-400 hover:text-indigo-950 transition-all duration-700 flex items-center gap-6 mx-auto group"
            >
              View Full Calendar
              <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </section>
      </div>
    </WebsiteLayout>
  );
};

export default LandingPage;