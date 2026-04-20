import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, Bell, Info } from 'lucide-react';
import { Broadcast } from '../types.ts';

interface GlobalAnnounceBarProps {
  broadcasts: Broadcast[];
}

const GlobalAnnounceBar: React.FC<GlobalAnnounceBarProps> = ({ broadcasts }) => {
  const [closedIds, setClosedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('sijm_closed_broadcasts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBroadcasts = useMemo(() => {
    const now = new Date();
    return broadcasts.filter(b => {
      if (!b.active) return false;
      if (closedIds.includes(b.id)) return false;
      
      const start = b.startDate ? new Date(b.startDate) : null;
      const end = b.endDate ? new Date(b.endDate) : null;
      
      if (start && now < start) return false;
      if (end && now > end) return false;
      
      return true;
    });
  }, [broadcasts, closedIds]);

  useEffect(() => {
    if (activeBroadcasts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBroadcasts.length);
    }, 6000); // 6 seconds per message
    
    return () => clearInterval(interval);
  }, [activeBroadcasts]);

  const handleClose = (id: string) => {
    const newClosed = [...closedIds, id];
    setClosedIds(newClosed);
    localStorage.setItem('sijm_closed_broadcasts', JSON.stringify(newClosed));
  };

  if (activeBroadcasts.length === 0) return null;

  const current = activeBroadcasts[currentIndex];

  const getIcon = (type: Broadcast['type']) => {
    switch (type) {
      case 'urgent': return <Bell size={14} className="text-red-400" />;
      case 'promo': return <Megaphone size={14} className="text-amber-400" />;
      default: return <Info size={14} className="text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className={`relative z-[100] w-full overflow-hidden ${
        current.type === 'urgent' ? 'bg-red-950 text-red-100' : 
        current.type === 'promo' ? 'bg-amber-950 text-amber-100' : 
        'bg-indigo-950 text-indigo-100'
      } border-b border-white/5`}
    >
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0">
            {getIcon(current.type)}
          </div>
          
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4 whitespace-nowrap"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {current.type === 'urgent' ? 'Important Alert' : current.type === 'promo' ? 'Ministry Update' : 'Announcement'}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <p className="text-[11px] font-medium tracking-tight truncate">
                  {current.message}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {current.isClosable && (
          <button 
            onClick={() => handleClose(current.id)}
            className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default GlobalAnnounceBar;
