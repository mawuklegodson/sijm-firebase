
import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { Home, Info, Music, Calendar, Heart, LogOut, User, Menu, X, BookOpen, Radio } from 'lucide-react';
import { formatImageUrl } from '../store.ts';

const logoImg = '/assets/logo.png';

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

interface NavbarProps {
  onNavigate: (page: string) => void;
  store: any;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, store, currentPage }) => {
  const { landingPageConfig, currentUser } = store;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const config = landingPageConfig || {
    branding: {
      logo: logoImg,
      ministryName: 'SIJM',
      tagline: 'Global Portal'
    }
  };

  const navItems = [
    { label: 'HOME', id: 'landing', icon: Home },
    { label: 'ABOUT', id: 'about', icon: Info },
    { label: 'SERMONS', id: 'sermons', icon: Music },
    { label: 'BOOKS', id: 'books', icon: BookOpen },
    { label: 'EVENTS', id: 'events', icon: Calendar },
    { label: 'GIVING', id: 'giving', icon: Heart }
  ];

  return (
    <nav className="sticky top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-indigo-950/80 backdrop-blur-2xl border-b border-white/5 transition-all duration-500">
      <motion.div 
        className="absolute top-0 left-0 h-[2px] bg-amber-400 origin-left z-50"
        style={{ scaleX: scrollYProgress, width: '100%' }}
      />
      
      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate('landing')}>
        <div className="w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src={formatImageUrl(config.branding.logo)} 
            alt="Logo" 
            className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== logoImg) {
                target.src = logoImg;
              }
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-black uppercase tracking-tighter text-2xl leading-none group-hover:text-amber-400 transition-colors">SIJM</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400 text-[7px] font-black uppercase tracking-[0.4em]">Global Portal</span>
          </div>
        </div>
      </div>

      {/* Desktop Nav */}
      <div className="hidden lg:flex items-center gap-8 text-white/60 font-black text-[9px] uppercase tracking-[0.3em]">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`px-6 py-2.5 rounded-full transition-all relative group border border-transparent hover:border-white/10 backdrop-blur-md ${currentPage === item.id ? 'text-white bg-white/10 border-white/10' : 'hover:text-white hover:bg-white/5'}`}
          >
            {item.label}
            <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 bg-amber-400 rounded-full transition-all duration-500 ${currentPage === item.id ? 'w-4' : 'w-0 group-hover:w-4'}`} />
          </button>
        ))}
        {/* Pulsing LIVE button */}
        <button
          onClick={() => onNavigate('live')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all relative group ${
            currentPage === 'live'
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          LIVE
        </button>
        <div className="h-4 w-[1px] bg-white/10 mx-2" />
        {currentUser ? (
          <div className="flex items-center gap-6 bg-white/5 pl-6 pr-2 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex flex-col items-end">
              <span className="text-amber-400 font-black text-[8px] tracking-widest">{currentUser.identityRole}</span>
              <span className="text-white/40 text-[7px] lowercase font-medium">{currentUser.fullName.split(' ')[0]}</span>
            </div>
            <button
              onClick={() => store.logout()}
              className="w-8 h-8 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
              title="Logout"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('login')}
            className="px-8 py-3 bg-white text-indigo-950 rounded-xl hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all duration-500 font-black text-[9px] uppercase tracking-widest"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMenuOpen(true)}
        className="lg:hidden w-12 h-12 flex items-center justify-center text-white bg-white/5 rounded-2xl border border-white/10 transition-all active:scale-90 hover:bg-white/10"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Side Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-indigo-950/40 backdrop-blur-sm lg:hidden"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 h-screen w-[80vw] max-w-[320px] z-[70] bg-indigo-950 flex flex-col lg:hidden shadow-[20px_0_80px_rgba(0,0,0,0.5)] border-r border-white/10"
            >
              <Noise />
              
              <div className="p-6 pb-2 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shadow-2xl">
                      <img 
                        src={formatImageUrl(config.branding.logo)} 
                        alt="Logo" 
                        className="h-full w-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-black uppercase tracking-tighter text-lg leading-none">SIJM Global</span>
                      <span className="text-amber-400 text-[6px] font-black uppercase tracking-[0.3em] mt-1">Spreading the Light</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
              </div>

              <div className="flex-1 flex flex-col p-6 pt-2 relative z-10 overflow-y-auto">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item, idx) => (
                    <motion.button 
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-5 px-4 py-3 rounded-2xl transition-all group ${currentPage === item.id ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                      <item.icon size={20} className={`${currentPage === item.id ? 'text-amber-400' : 'group-hover:text-amber-400'} transition-colors`} />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">{item.label}</span>
                    </motion.button>
                  ))}
                  {/* Mobile LIVE button */}
                  <motion.button 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + navItems.length * 0.05 }}
                    onClick={() => {
                      onNavigate('live');
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-5 px-4 py-3 rounded-2xl transition-all group ${currentPage === 'live' ? 'text-white bg-red-500/20' : 'text-red-400 hover:text-white hover:bg-red-500/10'}`}
                  >
                    <span className="relative flex h-4 w-4 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                      <Radio size={20} className="relative text-red-400" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">LIVE</span>
                  </motion.button>
                </nav>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                  <span className="px-4 text-white/20 text-[9px] font-black uppercase tracking-[0.4em] block">Account</span>
                  
                  {currentUser ? (
                    <div className="space-y-1">
                      <div className="px-4 py-2 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-indigo-950 font-black text-lg">
                          {currentUser.fullName[0]}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-white font-black text-sm uppercase tracking-tight line-clamp-1">{currentUser.fullName}</p>
                          <p className="text-amber-400 text-[8px] font-black uppercase tracking-[0.3em]">{currentUser.identityRole}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          store.logout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-5 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <LogOut size={20} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onNavigate('login');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-5 px-4 py-3 rounded-2xl text-white hover:bg-white/5 transition-all"
                    >
                      <User size={20} className="text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Member Login</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 mt-auto relative z-10">
                <div className="flex items-center gap-4 text-white/10">
                  <div className="w-8 h-px bg-current" />
                  <span className="text-[7px] font-black uppercase tracking-[0.5em]">SIJM Global Portal</span>
                </div>
              </div>

              <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[100%] h-[100%] bg-gradient-to-br from-indigo-600/20 via-transparent to-amber-400/10" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
