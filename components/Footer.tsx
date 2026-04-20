
import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Globe, ArrowRight } from 'lucide-react';
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

interface FooterProps {
  onNavigate: (page: string) => void;
  store: any;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, store }) => {
  const { landingPageConfig } = store;
  const config = landingPageConfig || {
    branding: {
      logo: logoImg,
      ministryName: 'SIJM',
      tagline: 'Global Portal'
    }
  };

  return (
    <footer className="bg-indigo-950 py-40 px-6 text-white relative overflow-hidden">
      <Noise />
      <FloatingOrb className="top-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-indigo-600/20" delay={0} />
      <FloatingOrb className="bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-amber-400/10" delay={4} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24 md:gap-32">
          <div className="space-y-12">
            <div className="flex items-center gap-6 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl p-3 group-hover:scale-110 transition-transform duration-500">
                <img 
                  src={formatImageUrl(config.branding.logo)} 
                  alt="Logo" 
                  className="h-full w-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">{config.branding.ministryName}</h4>
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.4em] mt-2">{config.branding.tagline}</p>
              </div>
            </div>
            <p className="text-white/40 text-lg font-medium leading-relaxed max-w-xs whitespace-pre-wrap">
              {config.footer?.aboutText || 'Restoring the dignity of humanity through the prophetic word and the power of the Holy Spirit.'}
            </p>
            <div className="flex items-center gap-8">
              {['Facebook', 'Twitter', 'Instagram', 'YouTube'].map((social) => (
                <motion.a 
                  key={social}
                  href="#" 
                  whileHover={{ y: -5, color: '#fbbf24' }}
                  className="text-white/40 text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  {social}
                </motion.a>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            <h5 className="text-amber-400 text-[11px] font-black uppercase tracking-[0.5em]">Navigation</h5>
            <ul className="space-y-6">
              {[
                { label: 'Home', id: 'landing' },
                { label: 'Sermons', id: 'sermons' },
                { label: 'Books', id: 'books' },
                { label: 'Live Service', id: 'live' },
                { label: 'Events', id: 'events' },
                { label: 'About', id: 'about' },
                { label: 'Giving', id: 'giving' }
              ].map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => onNavigate(item.id)}
                    className="text-2xl font-black text-white/60 hover:text-white transition-colors tracking-tighter uppercase"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-12">
            <h5 className="text-amber-400 text-[11px] font-black uppercase tracking-[0.5em]">Contact Us</h5>
            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <MapPin size={24} className="text-amber-400 shrink-0 mt-1" />
                <p className="text-xl font-medium text-white/60 leading-relaxed whitespace-pre-wrap">
                  {config.footer?.address || 'Main Sanctuary, Sege-Ada\nGreater Accra, Ghana'}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <Globe size={24} className="text-amber-400 shrink-0" />
                <p className="text-xl font-medium text-white/60">{config.footer?.contactEmail || 'info@sijm.org'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <h5 className="text-amber-400 text-[11px] font-black uppercase tracking-[0.5em]">Newsletter</h5>
            <p className="text-white/40 text-lg font-medium leading-relaxed">
              Receive spiritual insights and ministry updates directly.
            </p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all group-hover:bg-white/10"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-indigo-950 hover:scale-110 transition-transform shadow-xl shadow-amber-400/20">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-40 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
            © 2026 {config.branding.ministryName}. All Rights Reserved.
          </p>
          <div className="flex items-center gap-12">
            <a href="#" className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
