import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  MessageSquare, 
  ThumbsUp, 
  MessageCircle, 
  Check, 
  Trash2, 
  Clock,
  ExternalLink,
  BellOff
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { Notification, User } from '../types.ts';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  currentUser: User;
  onNavigate: (link: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser, onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(nData);
    }, (err) => {
      if (err.code !== 'permission-denied') {
        console.error('Notifications listener error:', err);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      // Update URL without reloading
      window.history.pushState({}, '', notification.link);
      // Dispatch popstate event so components can react to URL changes
      window.dispatchEvent(new PopStateEvent('popstate'));
      onNavigate(notification.link);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageSquare className="text-indigo-500" size={18} />;
      case 'answer': return <MessageCircle className="text-emerald-500" size={18} />;
      case 'like': return <ThumbsUp className="text-rose-500" size={18} />;
      default: return <Bell className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all ${
          isOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl shadow-indigo-200/50 border border-slate-100 z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-indigo-950 uppercase tracking-tighter text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-950 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-5 flex gap-4 cursor-pointer transition-all hover:bg-slate-50 group relative ${
                        !n.isRead ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        !n.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'
                      }`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-bold truncate ${!n.isRead ? 'text-indigo-950' : 'text-slate-600'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest whitespace-nowrap pt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${!n.isRead ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                          {n.message}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                          )}
                          {n.link && (
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600">
                              <ExternalLink size={10} />
                              View Question
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteNotification(n.id, e)}
                        className="absolute right-4 bottom-4 p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 px-10 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <BellOff size={32} />
                  </div>
                  <h4 className="text-indigo-950 font-bold mb-1">All caught up!</h4>
                  <p className="text-slate-400 text-sm">No new notifications at the moment.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Close Panel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
