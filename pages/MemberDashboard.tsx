import React, { useState, useEffect, useCallback } from 'react';
import { IdentityRole, WorkerPermission, Gender } from '../types';
import { 
  Download, BookOpen, Music, Calendar, ChevronRight, Star, Heart, Shield, 
  ShieldCheck, Globe, AlertCircle, User as UserIcon, MapPin, Phone, Cake, Save, X,
  Loader2, Bell, Clock, Users, FileText, MessageCircle, TrendingUp, 
  Award, Zap, CheckCircle, ArrowUpRight, Play, CalendarDays, Mail,
  Coffee, Book, Users2, HandHeart, Sparkles, Megaphone, RefreshCw,
  ArrowRight, Eye, Share2, Bookmark, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDriveDirectLink, getEmbedUrl, isDriveLink, resourceSupportsInlineAudio, resourceSupportsInlineVideo } from '../store';

interface MemberDashboardProps {
  store: any;
  navigate: (page: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Skeleton Loader Component
// ─────────────────────────────────────────────────────────────
const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 animate-pulse ${className}`}>
    <div className="flex items-start justify-between mb-6">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-2xl" />
      <div className="w-16 h-5 sm:w-20 sm:h-6 bg-slate-100 rounded-full" />
    </div>
    <div className="h-5 sm:h-6 bg-slate-100 rounded-lg w-3/4 mb-3" />
    <div className="h-3 sm:h-4 bg-slate-100 rounded w-full mb-2" />
    <div className="h-3 sm:h-4 bg-slate-100 rounded w-2/3 mb-6 sm:mb-8" />
    <div className="h-10 sm:h-12 bg-slate-100 rounded-2xl w-full" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────
const MemberDashboard: React.FC<MemberDashboardProps> = ({ store, navigate }) => {
  const { 
    currentUser, updateProfile, members, users, attendance, firstTimers, 
    isLoading, resources, announcements, events, settings 
  } = store;
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    branch: currentUser?.branch || '',
    birthday: currentUser?.birthday || '',
    location: currentUser?.location || '',
    gender: currentUser?.gender || Gender.MALE
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [activeResourceFilter, setActiveResourceFilter] = useState('all');
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  // Sync form with user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || '',
        branch: currentUser.branch || '',
        birthday: currentUser.birthday || '',
        location: currentUser.location || '',
        gender: currentUser.gender || Gender.MALE
      });
    }
  }, [currentUser]);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bookmarkedResources');
    if (saved) {
      setBookmarkedResources(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save bookmarks to localStorage
  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedResources(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('bookmarkedResources', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(currentUser.id, formData);
      setSaveSuccess(true);
      setShowNotification(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowUpdateForm(false);
        setShowNotification(false);
      }, 2500);
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    navigate(page);
  }, [navigate]);

  // Filter resources by category
  const featuredResources = resources.filter((r: any) => r.isFeatured);
  const regularResources = resources.filter((r: any) => !r.isFeatured);
  
  const filteredResources = regularResources.filter((res: any) => {
    if (activeResourceFilter === 'all') return true;
    return res.category?.toLowerCase() === activeResourceFilter;
  }).slice(0, 4);

  const scriptures = settings?.spiritual?.scriptures || [
    {
      reference: "Psalm 23:1",
      text: "The Lord is my shepherd; I shall not want.",
      version: "KJV"
    }
  ];

  const counselingEmail = settings?.spiritual?.counselingEmail || 'enochapafloe@gmail.com';

  const quickActions = [
    { 
      icon: BookOpen, 
      label: 'Sermons', 
      colorClasses: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        hover: 'group-hover:bg-indigo-600'
      },
      action: () => handleNavigate('downloads'), 
      desc: 'Spiritual nourishment', 
      gradient: 'from-indigo-500 to-purple-600' 
    },
    { 
      icon: CalendarDays, 
      label: 'Events', 
      colorClasses: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        hover: 'group-hover:bg-emerald-600'
      },
      action: () => handleNavigate('events'), 
      desc: 'Church activities', 
      gradient: 'from-emerald-500 to-teal-600' 
    },
    { 
      icon: Heart, 
      label: 'Prayer', 
      colorClasses: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        hover: 'group-hover:bg-rose-600'
      },
      action: () => handleNavigate('prayer'), 
      desc: 'Submit requests', 
      gradient: 'from-rose-500 to-pink-600' 
    },
    { 
      icon: Users2, 
      label: 'Groups', 
      colorClasses: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        hover: 'group-hover:bg-amber-600'
      },
      action: () => handleNavigate('groups'), 
      desc: 'Find your family', 
      gradient: 'from-amber-500 to-orange-600' 
    },
  ];

  const resourceCategories = ['all', 'sermon', 'music', 'study', 'event'];

  // Loading State
  if (isLoading && !currentUser) {
    return (
      <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-center max-w-md"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
              />
              <Sparkles className="absolute inset-0 m-auto text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-slate-700 font-bold text-base sm:text-lg">Preparing your sanctuary</p>
              <p className="text-slate-400 text-sm mt-1">Loading spiritual resources...</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0 bg-gradient-to-b from-slate-50 to-white min-h-full">
      {/* Scrollable Content */}
      <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-16 py-4 sm:py-6 md:py-10 lg:py-16">
          <div className="max-w-[1800px] mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
            
            {/* Toast Notification */}
            <AnimatePresence>
              {showNotification && (
                <motion.div 
                  initial={{ opacity: 0, y: -30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[200] bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 border border-white/10 backdrop-blur-xl max-w-[calc(100vw-2rem)] sm:max-w-md"
                  role="alert"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0"
                  >
                    <CheckCircle size={16} className="sm:size-20" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm">Profile Updated</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">Your changes have been saved</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Update Request Banner */}
            <AnimatePresence>
              {currentUser?.profileUpdateRequested && !showUpdateForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-2xl shadow-orange-500/20 border border-white/20"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <motion.div 
                      animate={{ rotate: [0, 8, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0"
                    >
                      <AlertCircle size={24} className="sm:size-32" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white text-base sm:text-lg md:text-xl">Profile Update Required</h3>
                      <p className="text-white/85 text-xs sm:text-sm mt-1 max-w-md">Complete your membership details to access all ministry features and stay connected with your spiritual family.</p>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUpdateForm(true)}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-orange-600 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl hover:shadow-white/30 transition-all whitespace-nowrap flex items-center gap-2 sm:gap-3 group w-full sm:w-auto justify-center"
                  >
                    <UserIcon size={16} className="sm:size-18 group-hover:scale-110 transition-transform" />
                    Complete Profile
                    <ArrowRight size={14} className="sm:size-16 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hero Section - Premium Redesign */}
            <section className="relative">
              {/* Animated Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-900/20 rounded-3xl sm:rounded-[3rem] blur-2xl sm:blur-3xl opacity-50" />
              
              <div className="relative overflow-hidden bg-slate-900 rounded-3xl sm:rounded-[4rem] p-6 sm:p-10 md:p-16 lg:p-20 text-white shadow-2xl border border-white/5">
                {/* Decorative Elements - Hidden on mobile to prevent overlap */}
                <div className="hidden sm:block absolute top-0 right-0 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-indigo-500/10 rounded-full blur-[100px] sm:blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="hidden sm:block absolute bottom-0 left-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-purple-500/10 rounded-full blur-[80px] sm:blur-[100px] translate-y-1/2 -translate-x-1/4" />
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                  {/* Text Content */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-6 sm:space-y-8 text-center lg:text-left"
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mx-auto lg:mx-0"
                    >
                      <Sparkles size={14} className="sm:size-16 text-amber-400" />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Your Spiritual Home</span>
                    </motion.div>
                    
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] font-poppins"
                    >
                      <span className="font-playfair italic font-medium">Peace & Blessings,</span><br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-200 font-playfair italic">
                        {currentUser?.fullName?.split(' ')[0] || 'Beloved'}
                      </span>
                    </motion.h1>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0"
                    >
                      Your spiritual journey continues here. Access the latest teachings, stay updated with ministry news, and grow in faith with your community.
                    </motion.p>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4"
                    >
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleNavigate('downloads')}
                        className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-900 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-white/10 hover:shadow-white/20 transition-all flex items-center gap-2 sm:gap-3 group"
                      >
                        <Play size={16} className="sm:size-18 fill-current group-hover:scale-110 transition-transform" />
                        Latest Sermons
                        <ArrowRight size={14} className="sm:size-16 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowUpdateForm(true)}
                        className="px-6 sm:px-8 py-3 sm:py-4 bg-white/5 backdrop-blur-md text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 sm:gap-3"
                      >
                        <UserIcon size={16} className="sm:size-18" />
                        My Profile
                      </motion.button>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center justify-center lg:justify-start gap-6 sm:gap-8 pt-4 sm:pt-6 border-t border-white/10"
                    >
                      {[
                        { label: 'Resources', value: resources?.length || 0, icon: Book },
                        { label: 'Events', value: events?.length || 0, icon: Calendar },
                        { label: 'Community', value: `${users?.length || 0}+`, icon: Users },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-amber-400 mb-1">
                            <stat.icon size={14} className="sm:size-16" />
                            <span className="text-lg sm:text-2xl font-bold font-mono tracking-tighter">{stat.value}</span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">{stat.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* Visual Element - Scripture Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, rotate: 3 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, delay: 0.3, type: "spring" }}
                    className="hidden lg:block"
                  >
                    <div className="relative space-y-6 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                      {scriptures.slice(0, 2).map((scripture: any, idx: number) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + (idx * 0.1) }}
                          className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl p-6 sm:p-8 group"
                        >
                          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-indigo-500/10 rounded-full blur-2xl sm:blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all duration-700" />
                          <div className="flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
                            <motion.div 
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-indigo-500/30"
                            >
                              <Heart size={24} className="sm:size-32 text-indigo-400" />
                            </motion.div>
                            <div>
                              <p className="text-base sm:text-xl font-bold text-white">{scripture.reference}</p>
                              <p className="text-slate-400 mt-2 italic leading-relaxed text-xs sm:text-sm line-clamp-3">
                                "{scripture.text}"
                              </p>
                              <p className="text-indigo-400 text-[9px] sm:text-[10px] mt-2 font-black uppercase tracking-widest">{scripture.version}</p>
                            </div>
                          </div>
                        </motion.div>
                       ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
              
              {/* Left Column - Quick Actions & Status (4 cols) */}
              <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8">
                
                {/* Quick Actions */}
                <div className="flex items-center justify-between px-1 sm:px-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-playfair italic">Quick Access</h2>
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Zap size={18} className="text-amber-500" />
                  </div>
                </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:gap-5">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 12, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className="group relative flex items-center gap-5 sm:gap-6 p-5 sm:p-6 lg:p-7 bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left overflow-hidden"
                      >
                        {/* Hover gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                        
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl ${action.colorClasses.bg} ${action.colorClasses.text} flex items-center justify-center shrink-0 ${action.colorClasses.hover} group-hover:text-white transition-all duration-500 shadow-inner`}>
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <action.icon size={24} className="sm:size-28" />
                          </motion.div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-base sm:text-lg">{action.label}</h3>
                          <p className="text-slate-400 text-xs mt-1 truncate font-medium">{action.desc}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                          <ChevronRight size={20} />
                        </div>
                      </motion.button>
                    ))}
                </div>

                {/* Profile Status Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.15)" }}
                  className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-500/5 space-y-6 sm:space-y-8 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 transition-colors duration-500" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <h3 className="font-black text-slate-900 text-lg sm:text-xl font-playfair italic">Portal Status</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      <motion.div 
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                      />
                      Verified
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Profile Completion</span>
                      <span className="font-black text-indigo-600">85%</span>
                    </div>
                    <div className="h-3 sm:h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full shadow-lg" 
                      />
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUpdateForm(true)}
                    className="w-full py-4 sm:py-5 bg-slate-50 text-slate-600 hover:text-indigo-600 rounded-2xl sm:rounded-3xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-transparent hover:border-indigo-100 relative z-10"
                  >
                    <RefreshCw size={14} className="sm:size-16" />
                    Refine Profile
                  </motion.button>
                </motion.div>

                {/* Upcoming Events Mini */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ y: -8 }}
                  className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 lg:p-10 rounded-[2.5rem] sm:rounded-[3rem] text-white shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full blur-2xl sm:blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-amber-500/10 rounded-full blur-xl sm:blur-2xl translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                          <CalendarDays size={20} className="text-amber-300" />
                        </div>
                        <h3 className="font-black text-lg sm:text-xl font-playfair italic">This Week</h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 bg-white/5 px-3 py-1 rounded-full border border-white/10">Calendar</span>
                    </div>
                    
                    <div className="space-y-4 sm:space-y-5">
                      {events && events.length > 0 ? (
                        events.slice(0, 3).map((event: any, idx: number) => (
                          <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + (idx * 0.1) }}
                            className="flex items-center justify-between py-3 sm:py-4 border-b border-white/5 last:border-0 group/item"
                          >
                            <div className="min-w-0 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-col items-center justify-center shrink-0 group-hover/item:bg-white/20 transition-colors">
                                <span className="text-[8px] font-black uppercase text-indigo-300">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-sm font-black leading-none">{new Date(event.date).getDate()}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm sm:text-base truncate group-hover/item:text-amber-300 transition-colors">{event.title}</p>
                                <p className="text-[10px] sm:text-xs text-indigo-200 flex items-center gap-1.5 mt-0.5">
                                  <Clock size={10} /> {event.time || 'All Day'}
                                </p>
                              </div>
                            </div>
                            <ArrowUpRight size={16} className="text-white/20 group-hover/item:text-white group-hover/item:translate-x-1 group-hover/item:-translate-y-1 transition-all" />
                          </motion.div>
                        ))
                      ) : (
                        <div className="py-8 sm:py-10 text-center text-indigo-200/50 text-sm italic flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <Calendar size={20} />
                          </div>
                          No upcoming events
                        </div>
                      )}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigate('events')}
                      className="mt-8 sm:mt-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                      View All Events <ArrowRight size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Main Feed (8 cols) */}
              <div className="lg:col-span-8 space-y-6 sm:space-y-8 lg:space-y-10">
                
                {/* Latest Resources Section */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 px-1 sm:px-2">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <BookOpen size={20} className="sm:size-24" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-playfair italic">Recent Teachings</h2>
                        <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5">Spiritual Nourishment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Category Filter Pills */}
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {resourceCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActiveResourceFilter(cat)}
                            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                              activeResourceFilter === cat 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                                : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                          >
                            {cat === 'all' ? 'All' : cat}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => handleNavigate('downloads')} 
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0"
                        title="View All Resources"
                      >
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Resources Grid */}
                  <div className="space-y-6 sm:space-y-8">
                    {/* Featured Teachings */}
                    {featuredResources.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {featuredResources.map((res: any, index: number) => (
                          <motion.div
                            key={res.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-slate-900 rounded-2xl sm:rounded-[3rem] overflow-hidden aspect-[16/9] sm:aspect-auto sm:h-[250px] lg:h-[300px] shadow-2xl"
                          >
                            <img 
                              src={res.thumbnailUrl || `https://picsum.photos/seed/${res.id}/800/600`}
                              alt={res.title}
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                            
                            <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
                              <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1 sm:gap-2">
                                <Sparkles size={10} className="sm:size-12" /> Featured Teaching
                              </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 space-y-2 sm:space-y-3">
                              <div className="flex items-center gap-3 sm:gap-4 text-indigo-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-1 sm:gap-1.5">
                                  <Calendar size={10} className="sm:size-12" /> {res.date || 'Recently'}
                                </span>
                                <span className="flex items-center gap-1 sm:gap-1.5">
                                  <Download size={10} className="sm:size-12" /> {res.downloadCount || 0}
                                </span>
                              </div>
                              <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
                                {res.title}
                              </h3>
                              <div className="flex items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    if (resourceSupportsInlineAudio(res.fileUrl) || resourceSupportsInlineVideo(res.fileUrl)) {
                                      setSelectedMedia(res);
                                    } else {
                                      store.incrementDownloadCount?.(res.id);
                                      window.open(getDriveDirectLink(res.fileUrl, 'download'), '_blank');
                                    }
                                  }}
                                  className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-slate-900 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 shadow-xl"
                                >
                                  <Play size={14} className="sm:size-16 fill-current" /> Play Now
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleBookmark(res.id)}
                                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-md border transition-all ${
                                    bookmarkedResources.has(res.id)
                                      ? 'bg-amber-500 border-amber-400 text-white'
                                      : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                  }`}
                                >
                                  <Bookmark size={16} className="sm:size-18" fill={bookmarkedResources.has(res.id) ? 'currentColor' : 'none'} />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {isLoading ? (
                        <>
                          <SkeletonCard />
                          <SkeletonCard />
                        </>
                      ) : filteredResources.length > 0 ? (
                        filteredResources.map((res: any, index: number) => (
                          <motion.div
                            key={res.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="group bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden"
                          >
                            <div className="p-6 sm:p-8 lg:p-10">
                              <div className="flex items-start justify-between mb-6 sm:mb-8">
                                <motion.div 
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                                    res.category === 'Sermon' 
                                      ? 'bg-indigo-600 text-white shadow-indigo-500/20' 
                                      : 'bg-emerald-600 text-white shadow-emerald-500/20'
                                  }`}
                                >
                                  {res.category === 'Sermon' ? <Music size={24} className="sm:size-32" /> : <BookOpen size={24} className="sm:size-32" />}
                                </motion.div>
                                <div className="flex flex-col items-end gap-2 sm:gap-3">
                                  <span className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                    {res.category}
                                  </span>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); toggleBookmark(res.id); }}
                                    className={`p-2.5 rounded-xl transition-all border ${
                                      bookmarkedResources.has(res.id) 
                                        ? 'text-amber-500 bg-amber-50 border-amber-100 shadow-md' 
                                        : 'text-slate-300 bg-white border-slate-100 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-100'
                                    }`}
                                    aria-label={bookmarkedResources.has(res.id) ? 'Remove bookmark' : 'Save for later'}
                                  >
                                    <Bookmark size={16} className="sm:size-20" fill={bookmarkedResources.has(res.id) ? 'currentColor' : 'none'} />
                                  </motion.button>
                                </div>
                              </div>
                              
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 mb-2 sm:mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1 font-poppins">{res.title}</h3>
                              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-6 sm:mb-8 font-medium">{res.description}</p>
                              
                              {/* Meta info */}
                              <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-slate-400 mb-6 sm:mb-8 font-black uppercase tracking-widest">
                                <span className="flex items-center gap-2">
                                  <Calendar size={14} className="text-indigo-400" />
                                  {res.date || 'Recently'}
                                </span>
                                {res.downloadCount > 0 && (
                                  <span className="flex items-center gap-2">
                                    <Download size={14} className="text-emerald-400" />
                                    {res.downloadCount}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 sm:gap-4">
                                <motion.button 
                                  whileHover={{ scale: 1.02, backgroundColor: '#4f46e5' }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    store.incrementDownloadCount?.(res.id);
                                    window.open(getDriveDirectLink(res.fileUrl, 'download'), '_blank');
                                  }}
                                  className="flex-1 py-4 sm:py-5 bg-slate-900 text-white rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                  <Download size={16} className="sm:size-20" />
                                  Download
                                </motion.button>
                                {(resourceSupportsInlineVideo(res.fileUrl) || resourceSupportsInlineAudio(res.fileUrl)) && (
                                  <motion.button 
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedMedia(res)}
                                    className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                                    aria-label="Play media"
                                  >
                                    <Play size={20} className="sm:size-24 fill-current" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-1 sm:col-span-2 py-12 sm:py-16 bg-white rounded-2xl sm:rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 sm:p-8">
                          <motion.div 
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 sm:mb-6"
                          >
                            <Book size={24} className="sm:size-32 text-slate-300" />
                          </motion.div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">No resources found</h3>
                          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xs">Try selecting a different category or check back soon for new content.</p>
                          <button 
                            onClick={() => setActiveResourceFilter('all')}
                            className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-100 transition-colors"
                          >
                            Show All
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Two Column: Announcements + Community */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  
                  {/* Announcements */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
                      <Megaphone size={16} className="sm:size-20 text-rose-500" />
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-playfair italic">Announcements</h2>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {isLoading ? (
                        <div className="space-y-3 sm:space-y-4">
                          {[1, 2].map(i => (
                            <div key={i} className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-100 animate-pulse">
                              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <div className="w-12 h-5 sm:w-16 sm:h-6 bg-slate-100 rounded-full" />
                                <div className="w-16 h-4 sm:w-20 sm:h-4 bg-slate-100 rounded" />
                              </div>
                              <div className="h-4 sm:h-5 bg-slate-100 rounded w-3/4 mb-2" />
                              <div className="h-3 sm:h-4 bg-slate-100 rounded w-full" />
                            </div>
                          ))}
                        </div>
                      ) : announcements?.filter((a: any) => a.status === 'Approved').slice(0, 3).length > 0 ? 
                        announcements.filter((a: any) => a.status === 'Approved').slice(0, 3).map((ann: any, index: number) => (
                          <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ x: 4 }}
                            className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                ann.urgency === 'Urgent' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                {ann.urgency}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Clock size={10} className="sm:size-12" />
                                {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-1.5 sm:mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm sm:text-base">{ann.title}</h4>
                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{ann.description}</p>
                          </motion.div>
                        )) : (
                          <div className="py-10 sm:py-12 bg-white rounded-xl sm:rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                            <Bell size={24} className="sm:size-32 text-slate-200 mb-3 sm:mb-4" />
                            <p className="text-slate-400 text-xs sm:text-sm font-bold">All caught up!</p>
                            <p className="text-slate-300 text-[10px] sm:text-xs mt-1">No new announcements</p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Community Support Card */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
                      <HandHeart size={16} className="sm:size-20 text-emerald-500" />
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-playfair italic">Care & Support</h2>
                    </div>
                    <motion.div 
                      whileHover={{ y: -4 }}
                      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group"
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-indigo-500/20 rounded-full blur-2xl sm:blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-purple-500/20 rounded-full blur-xl sm:blur-2xl group-hover:scale-125 transition-transform duration-700" style={{ transitionDelay: '100ms' }} />
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Pastoral Care</h3>
                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">Need prayer or counseling? Our pastoral team is here to support you in every season of life.</p>
                        <div className="space-y-2 sm:space-y-3">
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigate('prayer')}
                            className="w-full py-3 sm:py-4 bg-white text-slate-900 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                          >
                            <MessageCircle size={14} className="sm:size-16" />
                            Request Prayer
                          </motion.button>
                          <motion.a 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            href={`mailto:${counselingEmail}`}
                            className="w-full py-3 sm:py-4 bg-white/5 border border-white/10 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                          >
                            <Mail size={14} className="sm:size-16" />
                            Email Counseling
                          </motion.a>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Feature Section - Spiritual Growth - ENHANCED */}
            <section className="pt-4 sm:pt-8 lg:pt-12">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-slate-900 rounded-[3rem] sm:rounded-[5rem] p-8 sm:p-12 lg:p-24 border border-white/5 shadow-2xl relative overflow-hidden"
              >
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-indigo-600/10 rounded-full blur-[100px] sm:blur-[150px] translate-x-1/4 -translate-y-1/4 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-600/10 rounded-full blur-[80px] sm:blur-[120px] -translate-x-1/4 translate-y-1/4 animate-pulse" style={{ animationDelay: '1s' }} />
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-24 items-center">
                  {/* Left Content - Text */}
                  <div className="space-y-8 sm:space-y-12">
                    <div className="space-y-6">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10"
                      >
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Spiritual Growth Center</span>
                      </motion.div>
                      
                      <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] font-poppins">
                        <span className="font-playfair italic font-medium">Nurture Your Soul with</span>{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-200 font-playfair italic">
                          Daily Devotionals
                        </span>
                      </h2>
                      <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-xl">
                        Growth happens in the secret place. Access our curated collection of daily readings, meditation guides, and spiritual exercises.
                      </p>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {[
                        { icon: Book, title: 'Bible Studies', desc: 'Deep dive into the Word', color: 'indigo', route: 'bible_studies', gradient: 'from-indigo-500/20 to-indigo-500/5' },
                        { icon: Coffee, title: 'Morning Devotion', desc: 'Start your day with God', color: 'amber', route: 'morning_devotion', gradient: 'from-amber-500/20 to-amber-500/5' },
                        { icon: Heart, title: 'Prayer Guides', desc: 'Structured prayer times', color: 'rose', route: 'prayer_guides', gradient: 'from-rose-500/20 to-rose-500/5' },
                        { icon: Moon, title: 'Evening Reflection', desc: 'End your day peacefully', color: 'purple', route: 'evening_reflection', gradient: 'from-purple-500/20 to-purple-500/5' },
                      ].map((item, idx) => (
                        <motion.div 
                          key={item.title}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          viewport={{ once: true }}
                          whileHover={{ y: -8, scale: 1.02 }}
                          onClick={() => handleNavigate(item.route)}
                          className={`group relative p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br ${item.gradient} border border-white/5 hover:border-white/20 transition-all duration-500 cursor-pointer overflow-hidden`}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-slate-900 transition-all duration-500 shadow-xl`}>
                            <item.icon size={24} className="sm:size-28" />
                          </div>
                          <h4 className="font-black text-white text-base sm:text-lg mb-1">{item.title}</h4>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed group-hover:text-slate-200 transition-colors">{item.desc}</p>
                        </motion.div>
                      ))}
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.05, x: 10 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNavigate('explore_devotionals')}
                      className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-2xl shadow-white/10 hover:shadow-white/30 transition-all flex items-center justify-center gap-3 group"
                    >
                      <BookOpen size={20} className="group-hover:rotate-12 transition-transform" />
                      Explore All Devotionals
                      <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </motion.button>
                  </div>
                  
                  {/* Right Content - Featured Card */}
                  <div className="relative group">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, type: "spring" }}
                      className="relative aspect-[4/5] sm:aspect-square rounded-[3rem] sm:rounded-[5rem] overflow-hidden shadow-2xl border border-white/10"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=1200" 
                        alt="Spiritual Growth" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-20 h-20 sm:w-28 sm:h-28 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-white/50 transition-all"
                        >
                          <Play size={32} className="sm:size-40 fill-current ml-1" />
                        </motion.button>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 space-y-4">
                        <div className="flex items-center gap-2 text-amber-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
                          <CalendarDays size={14} />
                          Today's Featured
                        </div>
                        <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight font-poppins">
                          The Power of Persistent Prayer
                        </h3>
                        <div className="flex items-center gap-6 pt-2">
                          <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                            <Clock size={14} /> 15 min read
                          </div>
                          <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                            <Book size={14} /> James 5:16
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Floating Stats */}
                    <motion.div 
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-6 -left-6 sm:-bottom-10 sm:-left-10 bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-slate-100 hidden sm:block"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-black text-slate-900">10k+</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Readers</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </section>
          </div>
        </main>

        {/* Profile Update Modal - Enhanced */}
      <AnimatePresence>
        {showUpdateForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" 
              onClick={() => setShowUpdateForm(false)}
              role="presentation"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-100"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-modal-title"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/20 rounded-full blur-2xl sm:blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 id="profile-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight">Member Profile</h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-2">Keep your information up to date for better ministry connection</p>
                  </div>
                  <motion.button 
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowUpdateForm(false)} 
                    className="p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={20} className="sm:size-24" />
                  </motion.button>
                </div>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Success Message */}
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3"
                    >
                      <CheckCircle size={16} className="sm:size-20 text-emerald-500 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm">Profile updated successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { icon: UserIcon, label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'Enter your full name' },
                    { icon: Phone, label: 'Phone', key: 'phone', type: 'tel', placeholder: '+233 800 000 000' },
                    { icon: Globe, label: 'Branch', key: 'branch', type: 'text', placeholder: 'e.g. Main Sanctuary' },
                    { icon: Cake, label: 'Birthday', key: 'birthday', type: 'date', placeholder: '' },
                    { icon: MapPin, label: 'Location', key: 'location', type: 'text', placeholder: 'Your residential area' },
                  ].map((field, idx) => (
                    <motion.div 
                      key={field.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="space-y-1.5 sm:space-y-2"
                    >
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {field.label}
                        {field.key !== 'location' && <span className="text-rose-500 ml-0.5">*</span>}
                      </label>
                      <div className="relative">
                        <field.icon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 sm:size-[18px]" />
                        {field.type === 'date' ? (
                          <input 
                            type={field.type}
                            required={field.key !== 'location'}
                            value={(formData as any)[field.key]} 
                            onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-900 text-sm" 
                          />
                        ) : (
                          <input 
                            type={field.type}
                            required={field.key !== 'location'}
                            value={(formData as any)[field.key]} 
                            onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-900 placeholder:text-slate-300 text-sm" 
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-1.5 sm:space-y-2"
                  >
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <select 
                      value={formData.gender} 
                      onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-900 appearance-none cursor-pointer text-sm"
                    >
                      <option value={Gender.MALE}>Male</option>
                      <option value={Gender.FEMALE}>Female</option>
                    </select>
                  </motion.div>
                </div>
                
                <div className="pt-3 sm:pt-4 flex gap-3 sm:gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={() => setShowUpdateForm(false)}
                    className="flex-1 py-3 sm:py-5 text-[10px] sm:text-sm font-black uppercase text-slate-400 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all"
                  >
                    Later
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={isSaving}
                    className={`flex-[2] py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                      isSaving 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-indigo-200'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin size-4 sm:size-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="sm:size-20" />
                        Update Profile
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Player Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" 
              onClick={() => setSelectedMedia(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-slate-900 rounded-2xl sm:rounded-[3rem] shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden border border-white/10"
            >
              <div className="aspect-video bg-black relative group">
                {resourceSupportsInlineVideo(selectedMedia.fileUrl) ? (
                  <iframe 
                    src={getEmbedUrl(selectedMedia.fileUrl)}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : resourceSupportsInlineAudio(selectedMedia.fileUrl) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 sm:p-12 space-y-6 sm:space-y-8">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                      <Music className="text-white size-9 sm:size-12" />
                    </div>
                    <div className="text-center space-y-1.5 sm:space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black text-white">{selectedMedia.title}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">{selectedMedia.category}</p>
                    </div>
                    <audio 
                      src={getDriveDirectLink(selectedMedia.fileUrl)} 
                      controls 
                      autoPlay 
                      className="w-full max-w-md"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <AlertCircle size={48} className="sm:size-64" />
                  </div>
                )}
                
                <button 
                  onClick={() => setSelectedMedia(null)}
                  className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 sm:p-3 bg-black/40 hover:bg-rose-600 text-white rounded-full backdrop-blur-xl transition-all border border-white/10"
                >
                  <X size={18} className="sm:size-24" />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 bg-slate-900/50">
                <div className="space-y-1.5 sm:space-y-2 text-center md:text-left">
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">{selectedMedia.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium line-clamp-1">{selectedMedia.description}</p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      store.incrementDownloadCount?.(selectedMedia.id);
                      window.open(getDriveDirectLink(selectedMedia.fileUrl, 'download'), '_blank');
                    }}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 sm:gap-3 shadow-xl shadow-indigo-500/20"
                  >
                    <Download size={16} className="sm:size-18" /> Download Sermon
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberDashboard;