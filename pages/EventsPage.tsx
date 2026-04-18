
import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Zap, ArrowRight } from 'lucide-react';
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

const EventsPage: React.FC<{ onNavigate: (page: string) => void, store: any }> = ({ onNavigate, store }) => {
  const events = [
    {
      title: "Manifestation of Power",
      day: "Sunday",
      time: "9:00 AM",
      location: "Main Sanctuary (Sege)",
      description: "Join us every Sunday for a life-transforming encounter with God through deep worship and the prophetic word.",
      type: "Weekly Service",
      icon: Calendar,
      color: "amber"
    },
    {
      title: "Spiritual Warfare",
      day: "Weekdays",
      time: "6:30 PM",
      location: "Kasseh School Park",
      description: "Mondays, Wednesdays & Fridays. A dedicated time for teachings, deep prayer, and spiritual empowerment.",
      type: "Mid-Week Encounter",
      icon: Zap,
      color: "indigo"
    },
    {
      title: "Prophetic Night",
      day: "Last Friday",
      time: "10:00 PM",
      location: "Main Sanctuary",
      description: "An all-night vigil dedicated to prophetic utterances, deliverance, and intense spiritual breakthrough.",
      type: "Monthly Vigil",
      icon: Zap,
      color: "emerald"
    }
  ];

  return (
    <WebsiteLayout onNavigate={onNavigate} store={store} currentPage="events">
      <section className="py-20 md:py-40 px-6 bg-white relative overflow-hidden">
        <Noise />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-6 py-2.5 bg-amber-50 rounded-full border border-amber-100 shadow-sm"
            >
              <Calendar size={14} className="text-amber-600" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em]">Ministry Calendar</span>
            </motion.div>
            <h1 className="text-5xl md:text-8xl font-black text-indigo-950 uppercase tracking-tighter leading-[0.8] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              Upcoming <br />
              <span className="text-amber-500 not-italic font-sans tracking-[-0.06em] block mt-4">Encounters.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto">
              Join us for our weekly services and special ministry events as we experience the manifest presence of God.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
            {events.map((event, idx) => (
              <motion.div 
                key={event.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -20 }}
                className="p-12 md:p-16 bg-slate-50 rounded-[4rem] border border-slate-100 text-left space-y-10 hover:bg-indigo-950 group transition-all duration-700 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-64 h-64 bg-${event.color}-400/5 rounded-full blur-[60px] -mr-32 -mt-32 group-hover:bg-${event.color}-400/10 transition-colors`} />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className={`w-20 h-20 rounded-[2rem] bg-${event.color === 'amber' ? 'amber-400' : event.color === 'indigo' ? 'indigo-600' : 'emerald-500'} flex items-center justify-center text-${event.color === 'amber' ? 'indigo-950' : 'white'} shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                    <event.icon size={32} />
                  </div>
                  <div className="text-right">
                    <p className={`text-${event.color === 'amber' ? 'amber-500' : event.color === 'indigo' ? 'indigo-500' : 'emerald-500'} font-black uppercase tracking-[0.4em] text-[9px] group-hover:text-amber-400`}>{event.type}</p>
                    <p className="text-indigo-950 font-black text-3xl group-hover:text-white tracking-tighter mt-1">{event.day}</p>
                  </div>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <h3 className="text-3xl md:text-4xl font-black text-indigo-900 uppercase tracking-tighter group-hover:text-white transition-colors leading-none">{event.title}</h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed group-hover:text-white/60 transition-colors">{event.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-10 pt-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-white/40 border-t border-slate-200 group-hover:border-white/10 relative z-10">
                  <span className="flex items-center gap-3"><Clock size={18} className="text-indigo-500 group-hover:text-amber-400" /> {event.time}</span>
                  <span className="flex items-center gap-3"><MapPin size={18} className="text-amber-500" /> {event.location}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-32 p-12 md:p-20 bg-indigo-950 rounded-[4rem] text-center relative overflow-hidden group">
            <Noise />
            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Can't make it in person?</h2>
              <p className="text-white/60 text-xl font-medium max-w-2xl mx-auto">
                Join our global family online through our live streams on YouTube and Facebook every Sunday.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <button className="px-10 py-5 bg-amber-400 text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-amber-400/20">
                  Watch Live
                </button>
                <button className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
                  Past Services
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default EventsPage;
