
import React from 'react';
import { motion } from 'motion/react';
import { Star, Zap, MessageCircle, Users, Calendar, Shield } from 'lucide-react';
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

const AboutPage: React.FC<{ onNavigate: (page: string) => void, store: any }> = ({ onNavigate, store }) => {
  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="about">
      <section className="py-20 md:py-40 px-6 bg-white relative overflow-hidden">
        <Noise />
        <FloatingOrb className="top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-600/5" delay={1} />
        <FloatingOrb className="bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-amber-400/5" delay={4} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-6 py-2.5 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm"
            >
              <div className="w-2 h-2 bg-indigo-600 rounded-full" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Our Ministry</span>
            </motion.div>
            <h1 className="text-5xl md:text-8xl font-black text-indigo-950 uppercase tracking-tighter leading-[0.8] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              Divine <br />
              <span className="text-indigo-600 not-italic font-sans tracking-[-0.06em] block mt-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900">Restoration.</span>
            </h1>
            <p className="text-xl md:text-3xl text-slate-500 font-medium max-w-3xl mx-auto leading-tight tracking-tight">
              We are a global prophetic movement commissioned to restore the dignity of humanity through the power of the Holy Spirit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 md:gap-32 items-start">
            <div className="space-y-20">
              <div className="space-y-12">
                <h2 className="text-3xl md:text-5xl font-black text-indigo-950 uppercase tracking-tighter leading-tight">Our Vision & Mission</h2>
                <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
                  Founded on biblical principles and guided by the prophetic word, SIJM exists to bring hope, healing, and restoration to a broken world. Our mission is to equip believers for the work of the ministry and to manifest the kingdom of God in every sphere of influence.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center text-indigo-950 shadow-xl shadow-amber-400/20">
                      <Star size={28} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-indigo-950">Prophetic</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guidance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <Zap size={28} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-indigo-950">Manifestation</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Of Power</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <h2 className="text-3xl md:text-5xl font-black text-indigo-950 uppercase tracking-tighter leading-tight">Our Core Values</h2>
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { title: 'Community', desc: 'Building a vibrant family of believers.', icon: Users, color: 'indigo' },
                    { title: 'Excellence', desc: 'Doing everything to the glory of God.', icon: Shield, color: 'amber' },
                    { title: 'Impact', desc: 'Transforming lives through service.', icon: Zap, color: 'emerald' }
                  ].map((value) => (
                    <div key={value.title} className="flex items-center gap-8 p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-indigo-200 transition-all group">
                      <div className={`w-16 h-16 rounded-2xl bg-${value.color}-100 flex items-center justify-center text-${value.color}-600 group-hover:bg-${value.color}-600 group-hover:text-white transition-all`}>
                        <value.icon size={28} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-indigo-950">{value.title}</h4>
                        <p className="text-slate-500 font-medium">{value.desc}</p>
                      </div>
                    </div>
                  ))}
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
                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.4em]">Apostle S.K. Mensah</p>
                        <p className="text-white/40 text-[7px] font-black uppercase tracking-[0.2em] mt-1">General Overseer</p>
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
                <div className="group p-8 md:p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-700 shadow-2xl shadow-slate-200/30">
                  <h4 className="text-4xl md:text-6xl font-black text-indigo-950 mb-4 group-hover:text-amber-400 transition-colors tracking-tighter">15+</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] group-hover:text-white/40 transition-colors leading-relaxed">Years of Uncompromising <br />Faith & Ministry</p>
                </div>
                <div className="group p-8 md:p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-700 shadow-2xl shadow-slate-200/30">
                  <h4 className="text-4xl md:text-6xl font-black text-indigo-950 mb-4 group-hover:text-amber-400 transition-colors tracking-tighter">10k+</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] group-hover:text-white/40 transition-colors leading-relaxed">Lives Touched by the <br />Prophetic Word</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default AboutPage;
