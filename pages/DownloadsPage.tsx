import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Download,
  Search,
  FileText,
  Music,
  BookOpen,
  Calendar,
  User,
  Trash2,
  Plus,
  Edit3,
  Play,
  Pause,
  Link as LinkIcon,
  FileAudio,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Video,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Resource, IdentityRole, SermonAccessLevel, WorkerPermission } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import SermonQandA from '../components/SermonQandA.tsx';
import { Lock, Globe, UserCheck, AlertCircle } from 'lucide-react';
import { canAccessResource, getUserClearance, getAccessBadge, SUSPENSION_MESSAGE } from '../utils/accessControl.ts';
import {
  getDriveDirectLink,
  getPlayableMediaUrl,
  getEmbedUrl,
  forceBrowserDownload,
  resolveDownloadInfo,
  resourceSupportsInlineAudio,
  resourceSupportsInlineVideo,
  getGoogleResourceKind,
  isDriveLink,
  checkDriveAccessibility,
  getPreviewUrl,
  getFileExtension,
} from '../store.ts';

interface DownloadsPageProps {
  store: any;
  isAdmin?: boolean;
  navigate?: (page: string) => void;
}

const DownloadsPage: React.FC<DownloadsPageProps> = ({ store, isAdmin = false, navigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [accessibilityStatus, setAccessibilityStatus] = useState<Record<string, {
    accessible: boolean;
    message: string;
  }>>({});
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false, message: '', type: 'info'
  });

  const [liveFileUrl, setLiveFileUrl] = useState('');
  const [liveThumbUrl, setLiveThumbUrl] = useState('');
  const [liveVideoUrl, setLiveVideoUrl] = useState('');
  
  const categories = ['All', 'Sermon', 'Bulletin', 'Music', 'Document', 'Video', 'Other'];

  useEffect(() => {
    const checkAccessibility = async () => {
      const status: Record<string, { accessible: boolean; message: string }> = {};
      for (const res of store.resources || []) {
        if (res.fileUrl && isDriveLink(res.fileUrl)) {
          const result = await checkDriveAccessibility(res.fileUrl);
          status[res.id] = result;
        }
      }
      setAccessibilityStatus(status);
    };
    if (store.resources?.length > 0) {
      checkAccessibility();
    }
  }, [store.resources]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const filteredResources = useMemo(() => {
    if (!store.resources) return [];
    const currentUser = store.currentUser;

    return store.resources.filter((res: Resource) => {
      // Use the shared utility — fixes the isAdmin bug and handles all roles correctly
      if (!canAccessResource(res, currentUser) && !isAdmin) return false;

      const title       = (res.title       || '').toLowerCase();
      const description = (res.description || '').toLowerCase();
      const term        = searchTerm.toLowerCase();
      const matchesSearch   = title.includes(term) || description.includes(term);
      const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [store.resources, store.currentUser, searchTerm, selectedCategory, isAdmin]);

  const handleToggleAudio = (res: Resource) => {
    const isSame = activeAudioId === res.id;
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

  const handleDownload = async (res: Resource) => {
    try {
      setDownloadingId(res.id);
      setDownloadProgress(prev => ({ ...prev, [res.id]: 0 }));
      
      const { url, filename } = resolveDownloadInfo(res.fileUrl, res.title);
      
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const current = prev[res.id] || 0;
          if (current < 90) {
            return { ...prev, [res.id]: current + 10 };
          }
          return prev;
        });
      }, 200);
      
      await forceBrowserDownload(url, filename);
      
      clearInterval(progressInterval);
      setDownloadProgress(prev => ({ ...prev, [res.id]: 100 }));
      
      if (typeof store.incrementDownloadCount === 'function') {
        await store.incrementDownloadCount(res.id);
      }
      
      showNotification('✅ Download started! Check your downloads folder.', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showNotification('⚠️ Download failed. Ensure file is shared as "Anyone with the link".', 'error');
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[res.id];
          return newProgress;
        });
      }, 1000);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      await store.deleteResource(id);
      showNotification('Resource deleted', 'success');
    }
  };

  const openAddModal = () => {
    setEditingResource(null);
    setLiveFileUrl('');
    setLiveThumbUrl('');
    setLiveVideoUrl('');
    setShowAddModal(true);
  };

  const openEditModal = (res: Resource) => {
    setEditingResource(res);
    setLiveFileUrl(res.fileUrl || '');
    setLiveThumbUrl(res.thumbnailUrl || '');
    setLiveVideoUrl(res.videoUrl || '');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingResource(null);
    setLiveFileUrl('');
    setLiveThumbUrl('');
    setLiveVideoUrl('');
  };

  const previewInputFileUrl = liveFileUrl || editingResource?.fileUrl || '';
  const previewConvertedDownloadUrl = previewInputFileUrl
    ? getDriveDirectLink(previewInputFileUrl, 'download')
    : '';
  const previewEmbedUrl = previewInputFileUrl
    ? getEmbedUrl(previewInputFileUrl)
    : '';
  const previewGoogleType = previewInputFileUrl && isDriveLink(previewInputFileUrl)
    ? getGoogleResourceKind(previewInputFileUrl)
    : 'external';
  const previewIsDriveLink = previewInputFileUrl && isDriveLink(previewInputFileUrl);
  const previewFileExt = previewInputFileUrl ? getFileExtension(previewInputFileUrl) : '';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' :
              toast.type === 'error' ? 'bg-rose-500 text-white' :
              'bg-slate-800 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.message}
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'info' })}
              className="ml-2 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          {navigate && (
            <button 
              onClick={() => navigate('dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              title="Back to Dashboard"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sermon Archive</h1>
            <p className="text-slate-500 mt-1">
              Access and download spiritual nourishment for your soul
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add Sermon
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search sermons..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {store.isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">Loading spiritual nourishment...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredResources.map((res: Resource) => {
            const canPlayAudio = resourceSupportsInlineAudio(res);
            const canPlayVideo = resourceSupportsInlineVideo(res);
            const embedUrl = getEmbedUrl(res.fileUrl);
            const accessibility = accessibilityStatus[res.id];
            const isDrive = isDriveLink(res.fileUrl);
            const hasAccessIssue = isDrive && accessibility && !accessibility.accessible;
            const fileExt = res.fileUrl ? getFileExtension(res.fileUrl) : '';

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={res.id}
                className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="h-40 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                  {res.thumbnailUrl ? (
                    <img
                      src={res.thumbnailUrl}
                      alt={res.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-slate-200 group-hover:text-indigo-200 transition-colors">
                      {res.category === 'Sermon' && <Music size={64} />}
                      {res.category === 'Bulletin' && <FileText size={64} />}
                      {res.category === 'Music' && <Music size={64} />}
                      {res.category === 'Document' && <BookOpen size={64} />}
                      {res.category === 'Video' && <Video size={64} />}
                      {res.category === 'Other' && <FileText size={64} />}
                    </div>
                  )}
                  
                  {hasAccessIssue && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs py-1 px-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      File access may be restricted
                    </div>
                  )}
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-bold rounded-full shadow-sm">
                      {res.category}
                    </span>
                    {(() => {
                      const badge = getAccessBadge(res.accessLevel);
                      return (
                        <span className="px-3 py-1 backdrop-blur-sm text-xs font-bold rounded-full shadow-sm flex items-center gap-1"
                              style={{ background: badge.bg + 'ee', color: badge.color }}>
                          {res.accessLevel === SermonAccessLevel.LEADERSHIP ? <Lock size={10} /> :
                           res.accessLevel === SermonAccessLevel.MEMBER ? <UserCheck size={10} /> :
                           <Globe size={10} />}
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {res.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-2 flex-1">
                    {res.description}
                  </p>

                  {/* Audio Player - Using iframe */}
                  {canPlayAudio && activeAudioId === res.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <iframe
                        src={embedUrl}
                        className="w-full h-32 rounded-xl border-0"
                        title={res.title}
                        allow="autoplay"
                      />
                      <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Google Drive preview - Download for offline listening
                      </p>
                    </motion.div>
                  )}

                  {/* Video Player - Using iframe */}
                  {canPlayVideo && activeVideoId === res.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <iframe
                        src={embedUrl}
                        className="w-full h-64 rounded-xl border-0"
                        title={res.title}
                        allow="autoplay"
                      />
                      <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Google Drive preview - Download for offline viewing
                      </p>
                    </motion.div>
                  )}

                  {/* Download Progress */}
                  {downloadingId === res.id && downloadProgress[res.id] !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 size={14} className="animate-spin text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-700">
                          Downloading... {downloadProgress[res.id]}%
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress[res.id]}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {res.date ? new Date(res.date).toLocaleDateString() : 'No date'}
                    </div>
                    {res.author && (
                      <div className="flex items-center gap-1.5">
                        <User size={14} />
                        {res.author}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Download size={14} />
                      {res.downloadCount || 0} downloads
                    </div>
                    {res.fileSize && <div className="ml-auto text-slate-300">{res.fileSize}</div>}
                    {fileExt && <div className="text-slate-300 uppercase">.{fileExt}</div>}
                  </div>

                  <div className="mt-6 flex gap-2">
                    {canPlayAudio && (
                      <button
                        onClick={() => handleToggleAudio(res)}
                        className={`p-2.5 rounded-xl transition-all ${
                          activeAudioId === res.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                        title={activeAudioId === res.id ? 'Stop Playing' : 'Play Audio'}
                      >
                        {activeAudioId === res.id ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                    )}
                    {canPlayVideo && (
                      <button
                        onClick={() => handleToggleVideo(res)}
                        className={`p-2.5 rounded-xl transition-all ${
                          activeVideoId === res.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                        title={activeVideoId === res.id ? 'Stop Playing' : 'Play Video'}
                      >
                        {activeVideoId === res.id ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(res)}
                      disabled={downloadingId === res.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {downloadingId === res.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                      {downloadingId === res.id ? 'Downloading...' : 'Download'}
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(res)}
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(res.id)}
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Q&A Section */}
                  {(activeAudioId === res.id || activeVideoId === res.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-8 pt-8 border-t border-slate-100"
                    >
                      <SermonQandA 
                        sermonId={res.id} 
                        sermonTitle={res.title} 
                        currentUser={store.currentUser} 
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
      </div>

      {!store.isLoading && filteredResources.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No resources found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Modal code remains the same as before */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                {editingResource ? 'Edit Sermon' : 'Add New Sermon'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <form
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const rawFileUrl = String(formData.get('fileUrl') || '').trim();
                const rawThumbUrl = String(formData.get('thumbnailUrl') || '').trim();
                const rawVideoUrl = String(formData.get('videoUrl') || '').trim();
                
                const data = {
                  title: String(formData.get('title') || '').trim(),
                  description: String(formData.get('description') || '').trim(),
                  category: String(formData.get('category') || '').trim(),
                  fileUrl: rawFileUrl,
                  thumbnailUrl: rawThumbUrl,
                  videoUrl: rawVideoUrl,
                  date: String(formData.get('date') || '').trim(),
                  author: String(formData.get('author') || '').trim(),
                  fileSize: String(formData.get('fileSize') || '').trim(),
                  accessLevel: String(formData.get('accessLevel') || SermonAccessLevel.PUBLIC),
                  isFeatured: formData.get('isFeatured') === 'on',
                  notifyUsers: formData.get('notifyUsers') === 'on',
                };
                
                if (editingResource) {
                  await store.updateResource(editingResource.id, data);
                  showNotification('Resource updated successfully', 'success');
                } else {
                  await store.addResource(data);
                  showNotification('Resource added successfully', 'success');
                }
                closeModal();
              }}
            >
              {/* Keep your existing form fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                  <input
                    name="title"
                    defaultValue={editingResource?.title}
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingResource?.description}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingResource?.category || 'Sermon'}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingResource?.date || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Access Level</label>
                  <select
                    name="accessLevel"
                    defaultValue={editingResource?.accessLevel || SermonAccessLevel.PUBLIC}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={SermonAccessLevel.PUBLIC}>General Public</option>
                    <option value={SermonAccessLevel.MEMBER}>Member-Only</option>
                    <option value={SermonAccessLevel.LEADERSHIP}>Leadership-Only</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">File URL</label>
                  <input
                    name="fileUrl"
                    defaultValue={editingResource?.fileUrl}
                    required
                    onChange={(e) => setLiveFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  {previewIsDriveLink && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-800 font-medium flex items-center gap-1">
                        <AlertCircle size={12} />
                        Google Drive Sharing Required
                      </p>
                      <p className="text-[10px] text-amber-700 mt-1">
                        Make sure your file is shared as <strong>"Anyone with the link"</strong>
                      </p>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Thumbnail URL (Optional)</label>
                  <input
                    name="thumbnailUrl"
                    defaultValue={editingResource?.thumbnailUrl}
                    onChange={(e) => setLiveThumbUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Author</label>
                  <input
                    name="author"
                    defaultValue={editingResource?.author}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">File Size</label>
                  <input
                    name="fileSize"
                    defaultValue={editingResource?.fileSize}
                    placeholder="e.g. 15MB"
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <input 
                    type="checkbox" 
                    name="isFeatured" 
                    id="isFeatured"
                    defaultChecked={editingResource?.isFeatured}
                    className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    Mark as Featured Sermon
                  </label>
                </div>
                <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <input 
                    type="checkbox" 
                    name="notifyUsers" 
                    id="notifyUsers"
                    defaultChecked={editingResource?.notifyUsers}
                    className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="notifyUsers" className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <AlertCircle size={16} className="text-emerald-600" />
                    Send Push Notification to Users
                  </label>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                  {editingResource ? 'Update Sermon' : 'Save Sermon'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
