
import React from 'react';
import { motion } from 'motion/react';
import { Heart, Globe, Shield, ArrowRight, Zap, Star } from 'lucide-react';
import WebsiteLayout from '../components/WebsiteLayout.tsx';
import GiveModal from '../components/GiveModal.tsx';
import { AnimatePresence } from 'motion/react';

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

const GivingPage: React.FC<{ onNavigate: (page: string) => void, store: any }> = ({ onNavigate, store }) => {
  const [isGiveModalOpen, setIsGiveModalOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined);

  const givingOptions = [
    {
      title: "Tithes & Offerings",
      desc: "Support the ongoing work of the ministry and the spread of the gospel.",
      icon: Star,
      color: "amber"
    },
    {
      title: "Missions & Outreach",
      desc: "Help us reach the unreached and provide aid to those in need globally.",
      icon: Globe,
      color: "indigo"
    },
    {
      title: "Building Project",
      desc: "Contribute to the expansion of our physical sanctuary and facilities.",
      icon: Zap,
      color: "emerald"
    }
  ];

  const handleGiveNow = (category?: string) => {
    setSelectedCategory(category);
    setIsGiveModalOpen(true);
  };

  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="giving">
      <section className="py-20 md:py-40 px-6 bg-white relative overflow-hidden">
        <Noise />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-6 py-2.5 bg-rose-50 rounded-full border border-rose-100 shadow-sm"
            >
              <Heart size={14} className="text-rose-600" />
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.4em]">Partner with Us</span>
            </motion.div>
            <h1 className="text-5xl md:text-8xl font-black text-indigo-950 uppercase tracking-tighter leading-[0.8] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              Generous <br />
              <span className="text-rose-600 not-italic font-sans tracking-[-0.06em] block mt-4">Giving.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto">
              Your generosity enables us to restore dignity to humanity and spread the prophetic word across the globe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-32">
            {givingOptions.map((option, idx) => (
              <motion.div 
                key={option.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -20 }}
                className="p-12 bg-slate-50 rounded-[4rem] border border-slate-100 space-y-10 hover:bg-indigo-950 group transition-all duration-700 shadow-2xl shadow-slate-200/50"
              >
                <div className={`w-20 h-20 rounded-[2rem] bg-${option.color === 'amber' ? 'amber-400' : option.color === 'indigo' ? 'indigo-600' : 'emerald-500'} flex items-center justify-center text-${option.color === 'amber' ? 'indigo-950' : 'white'} shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                  <option.icon size={32} />
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-indigo-900 uppercase tracking-tighter group-hover:text-white transition-colors">{option.title}</h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed group-hover:text-white/60 transition-colors">{option.desc}</p>
                </div>
                <button 
                  onClick={() => handleGiveNow(option.title)}
                  className="flex items-center gap-4 text-indigo-600 font-black uppercase tracking-widest text-[10px] group-hover:text-amber-400 transition-colors"
                >
                  Give Now <ArrowRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="p-12 md:p-24 bg-indigo-950 rounded-[5rem] relative overflow-hidden group">
            <Noise />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Safe & Secure</h2>
                  <p className="text-white/60 text-xl font-medium leading-relaxed">
                    We use industry-standard encryption to ensure your financial information is always protected.
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-4">
                    <Shield className="text-amber-400" size={24} />
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Globe className="text-amber-400" size={24} />
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Global Support</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 space-y-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-widest text-center">Payment Methods</h3>
                <div className="grid grid-cols-2 gap-6">
                  {['Mobile Money', 'Bank Transfer', 'Credit Card', 'PayPal'].map((method) => (
                    <div key={method} className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center hover:bg-white/10 transition-all cursor-pointer">
                      <span className="text-white/60 text-xs font-black uppercase tracking-widest">{method}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleGiveNow()}
                  className="w-full py-6 bg-amber-400 text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-amber-400/20"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isGiveModalOpen && (
          <GiveModal 
            initialCategory={selectedCategory}
            userEmail={store.currentUser?.email}
            onClose={() => setIsGiveModalOpen(false)}
            store={store}
            onSuccess={() => {
              setIsGiveModalOpen(false);
              alert('Thank you for your generous partnership! Your contribution will make a significant impact.');
            }}
          />
        )}
      </AnimatePresence>
    </WebsiteLayout>
  );
};

export default GivingPage;
