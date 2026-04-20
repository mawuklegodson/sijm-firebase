import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPageConfig, LandingPageSection } from '../types.ts';
import { DEFAULT_LANDING_PAGE_CONFIG } from '../store.ts';
import { 
  Save, Plus, Trash2, MoveUp, MoveDown, Layout, Type, Image as ImageIcon, 
  Video, MousePointer2, Settings, Palette, Eye, Code, Layers, 
  Monitor, Smartphone, Tablet, Undo, Redo, Copy, Link, ChevronRight
} from 'lucide-react';

interface LandingPageEditorProps {
  store: any;
  navigate?: (page: string) => void;
}

const LandingPageEditor: React.FC<LandingPageEditorProps> = ({ store, navigate }) => {
  const { landingPageConfig, updateLandingPageConfig } = store;
  const [config, setConfig] = useState<LandingPageConfig>(landingPageConfig || DEFAULT_LANDING_PAGE_CONFIG);
  const [activeTab, setActiveTab] = useState<'branding' | 'hero' | 'stats' | 'about' | 'footer' | 'sections' | 'advanced'>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<LandingPageConfig[]>(landingPageConfig ? [landingPageConfig] : [DEFAULT_LANDING_PAGE_CONFIG]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (landingPageConfig) {
      setConfig(landingPageConfig);
      setHistory([landingPageConfig]);
      setHistoryIndex(0);
    }
  }, [landingPageConfig]);

  const addToHistory = (newConfig: LandingPageConfig) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newConfig);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setConfig(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setConfig(history[historyIndex + 1]);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await updateLandingPageConfig({ ...config, updatedAt: new Date().toISOString() });
      alert('Landing page updated successfully!');
      addToHistory({ ...config, updatedAt: new Date().toISOString() });
    } catch (e) {
      alert('Failed to update landing page.');
    } finally {
      setIsSaving(false);
    }
  };

  const addSection = () => {
    if (!config) return;
    const newSection: LandingPageSection = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      title: 'New Section',
      content: 'Enter your content here...',
      order: config.sections.length,
      active: true
    };
    const newConfig = { ...config, sections: [...config.sections, newSection] };
    setConfig(newConfig);
    addToHistory(newConfig);
  };

  const removeSection = (id: string) => {
    if (!config) return;
    const newConfig = { ...config, sections: config.sections.filter(s => s.id !== id) };
    setConfig(newConfig);
    addToHistory(newConfig);
  };

  const updateSection = (id: string, data: Partial<LandingPageSection>) => {
    if (!config) return;
    const newConfig = {
      ...config,
      sections: config.sections.map(s => s.id === id ? { ...s, ...data } : s)
    };
    setConfig(newConfig);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!config) return;
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    const newConfig = { ...config, sections: newSections.map((s, i) => ({ ...s, order: i })) };
    setConfig(newConfig);
    addToHistory(newConfig);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          {navigate && (
            <button 
              onClick={() => navigate('dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              title="Back to Dashboard"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
          )}
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-3">
              <Layout className="text-indigo-600" /> Landing Page CMS
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Live Visual Editor & Content Management System
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
              title="Undo"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
              title="Redo"
            >
              <Redo size={16} />
            </button>
          </div>

          {/* Preview Mode */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white text-indigo-600' : 'text-gray-400'}`}
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-lg transition-all ${previewMode === 'tablet' ? 'bg-white text-indigo-600' : 'text-gray-400'}`}
            >
              <Tablet size={16} />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white text-indigo-600' : 'text-gray-400'}`}
            >
              <Smartphone size={16} />
            </button>
          </div>

          <button className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all">
            <Eye size={16} /> Preview
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : <><Save size={16} /> Publish Changes</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'branding' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Palette size={14} /> Branding
        </button>
        <button
          onClick={() => setActiveTab('hero')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'hero' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Layout size={14} /> Hero Section
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Plus size={14} /> Numbers
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'about' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Type size={14} /> About Text
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'footer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings size={14} /> Footer
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'sections' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Layers size={14} /> Sections
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'advanced' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Code size={14} /> Advanced
        </button>
      </div>

      {/* Editor Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'branding' && (
              <motion.div 
                key="branding"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo URL (SVG/PNG)</label>
                    <input
                      type="text"
                      value={config.branding.logo}
                      onChange={(e) => {
                        const newConfig = { ...config, branding: { ...config.branding, logo: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Favicon URL</label>
                    <input
                      type="text"
                      value={config.branding.favicon || ''}
                      onChange={(e) => {
                        const newConfig = { ...config, branding: { ...config.branding, favicon: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Color</label>
                    <div className="flex gap-4">
                      <input
                        type="color"
                        value={config.branding.primaryColor}
                        onChange={(e) => {
                          const newConfig = { ...config, branding: { ...config.branding, primaryColor: e.target.value } };
                          setConfig(newConfig);
                          addToHistory(newConfig);
                        }}
                        className="h-14 w-14 rounded-2xl cursor-pointer border-none"
                      />
                      <input
                        type="text"
                        value={config.branding.primaryColor}
                        onChange={(e) => {
                          const newConfig = { ...config, branding: { ...config.branding, primaryColor: e.target.value } };
                          setConfig(newConfig);
                        }}
                        className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secondary Color</label>
                    <div className="flex gap-4">
                      <input
                        type="color"
                        value={config.branding.secondaryColor}
                        onChange={(e) => {
                          const newConfig = { ...config, branding: { ...config.branding, secondaryColor: e.target.value } };
                          setConfig(newConfig);
                          addToHistory(newConfig);
                        }}
                        className="h-14 w-14 rounded-2xl cursor-pointer border-none"
                      />
                      <input
                        type="text"
                        value={config.branding.secondaryColor}
                        onChange={(e) => {
                          const newConfig = { ...config, branding: { ...config.branding, secondaryColor: e.target.value } };
                          setConfig(newConfig);
                        }}
                        className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'hero' && (
              <motion.div 
                key="hero"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero H1 Title</label>
                    <input
                      type="text"
                      value={config.hero.title}
                      onChange={(e) => {
                        const newConfig = { ...config, hero: { ...config.hero, title: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xl font-black uppercase tracking-tighter focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero H2 Subtitle</label>
                    <textarea
                      value={config.hero.subtitle}
                      onChange={(e) => {
                        const newConfig = { ...config, hero: { ...config.hero, subtitle: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all h-32"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Background Type</label>
                      <select
                        value={config.hero.backgroundType}
                        onChange={(e) => {
                          const newConfig = { ...config, hero: { ...config.hero, backgroundType: e.target.value as 'image' | 'video' } };
                          setConfig(newConfig);
                          addToHistory(newConfig);
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
                      >
                        <option value="image">Static Image</option>
                        <option value="video">High-Bitrate Video</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Background URL</label>
                      <input
                        type="text"
                        value={config.hero.backgroundUrl}
                        onChange={(e) => {
                          const newConfig = { ...config, hero: { ...config.hero, backgroundUrl: e.target.value } };
                          setConfig(newConfig);
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-indigo-50 rounded-3xl">
                    <input
                      type="checkbox"
                      checked={config.hero.parallax}
                      onChange={(e) => {
                        const newConfig = { ...config, hero: { ...config.hero, parallax: e.target.checked } };
                        setConfig(newConfig);
                        addToHistory(newConfig);
                      }}
                      className="w-6 h-6 rounded-lg text-indigo-600"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-indigo-900 uppercase tracking-tighter">Enable Parallax Effect</p>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Adds depth and motion to the hero section</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tighter">Achievement Counters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statistic {num}</label>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder={"Value (e.g. 10K+)"}
                            value={(config.statsCounter as any)?.[`stat${num}Value`] || ''}
                            onChange={(e) => {
                              const newStats = { ...(config.statsCounter || {}), [`stat${num}Value`]: e.target.value };
                              const newConfig = { ...config, statsCounter: newStats as any };
                              setConfig(newConfig);
                            }}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold focus:border-indigo-600 transition-all"
                          />
                          <input
                            type="text"
                            placeholder={"Label (e.g. Members)"}
                            value={(config.statsCounter as any)?.[`stat${num}Label`] || ''}
                            onChange={(e) => {
                              const newStats = { ...(config.statsCounter || {}), [`stat${num}Label`]: e.target.value };
                              const newConfig = { ...config, statsCounter: newStats as any };
                              setConfig(newConfig);
                            }}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold focus:border-indigo-600 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tighter">About Section Content</h3>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Heading</label>
                    <input
                      type="text"
                      placeholder="e.g. The SIJM Mandate"
                      value={config.aboutSection?.heading || ''}
                      onChange={(e) => {
                        const newConfig = { ...config, aboutSection: { ...(config.aboutSection || {} as any), heading: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-md font-bold focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subheading</label>
                    <input
                      type="text"
                      placeholder="e.g. Divine Restoration."
                      value={config.aboutSection?.subheading || ''}
                      onChange={(e) => {
                        const newConfig = { ...config, aboutSection: { ...(config.aboutSection || {} as any), subheading: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xl font-black focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Paragraph</label>
                    <textarea
                      placeholder="We are a global prophetic movement..."
                      value={config.aboutSection?.paragraph1 || ''}
                      onChange={(e) => {
                        const newConfig = { ...config, aboutSection: { ...(config.aboutSection || {} as any), paragraph1: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:border-indigo-600 transition-all h-32"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blockquote Text</label>
                    <textarea
                      placeholder="Restoration is not a process..."
                      value={config.aboutSection?.paragraph2 || ''}
                      onChange={(e) => {
                        const newConfig = { ...config, aboutSection: { ...(config.aboutSection || {} as any), paragraph2: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium italic focus:border-indigo-600 transition-all h-24"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'footer' && (
              <motion.div 
                key="footer"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tighter">Footer Data</h3>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ministry About Text</label>
                    <textarea
                      placeholder="Restoring the dignity of humanity..."
                      value={config.footer?.aboutText || ''}
                      onChange={(e) => {
                        const newConfig = { ...config, footer: { ...(config.footer || {} as any), aboutText: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:border-indigo-600 transition-all h-24"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Email</label>
                      <input
                        type="email"
                        placeholder="info@sijm.org"
                        value={config.footer?.contactEmail || ''}
                        onChange={(e) => {
                          const newConfig = { ...config, footer: { ...(config.footer || {} as any), contactEmail: e.target.value } };
                          setConfig(newConfig);
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-indigo-600 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Phone (Currently hidden in UI)</label>
                      <input
                        type="text"
                        placeholder="+233..."
                        value={config.footer?.contactPhone || ''}
                        onChange={(e) => {
                          const newConfig = { ...config, footer: { ...(config.footer || {} as any), contactPhone: e.target.value } };
                          setConfig(newConfig);
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headquarters Address</label>
                    <textarea
                      placeholder="Main Sanctuary..."
                      value={config.footer?.address || ''}
                      onChange={(e) => {
                        const newConfig = { ...config, footer: { ...(config.footer || {} as any), address: e.target.value } };
                        setConfig(newConfig);
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:border-indigo-600 transition-all h-24"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'sections' && (
              <motion.div 
                key="sections"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {config.sections.map((section, index) => (
                  <div key={section.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 relative group">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                          {index + 1}
                        </div>
                        <select
                          value={section.type}
                          onChange={(e) => {
                            updateSection(section.id, { type: e.target.value as any });
                            addToHistory({ ...config, sections: config.sections.map(s => s.id === section.id ? { ...s, type: e.target.value as any } : s) });
                          }}
                          className="bg-transparent text-sm font-black uppercase tracking-widest text-indigo-600 focus:outline-none"
                        >
                          <option value="text">Text Block</option>
                          <option value="image">Image + Text</option>
                          <option value="video">Video Embed</option>
                          <option value="cta">Call to Action</option>
                          <option value="features">Features Grid</option>
                        </select>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => moveSection(index, 'up')} className="p-2 text-gray-400 hover:text-indigo-600"><MoveUp size={18} /></button>
                        <button onClick={() => moveSection(index, 'down')} className="p-2 text-gray-400 hover:text-indigo-600"><MoveDown size={18} /></button>
                        <button onClick={() => removeSection(section.id)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Section Title"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-lg font-black uppercase tracking-tighter focus:outline-none focus:border-indigo-600 transition-all"
                      />
                      <textarea
                        placeholder="Section Content"
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all h-24"
                      />
                      {(section.type === 'image' || section.type === 'video') && (
                        <input
                          type="text"
                          placeholder={section.type === 'image' ? "Image URL" : "Video URL"}
                          value={section.imageUrl || section.videoUrl || ''}
                          onChange={(e) => updateSection(section.id, section.type === 'image' ? { imageUrl: e.target.value } : { videoUrl: e.target.value })}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
                        />
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={addSection}
                  className="w-full py-6 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                >
                  <Plus size={20} /> Add Modular Section
                </button>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div 
                key="advanced"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">SEO & Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page Title</label>
                      <input
                        type="text"
                        value={config.seo?.title || ''}
                        onChange={(e) => setConfig({ ...config, seo: { ...config.seo!, title: e.target.value } })}
                        placeholder="SIJM - Salvation In Jesus Ministry"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta Description</label>
                      <input
                        type="text"
                        value={config.seo?.description || ''}
                        onChange={(e) => setConfig({ ...config, seo: { ...config.seo!, description: e.target.value } })}
                        placeholder="Join our global ministry community..."
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6 pt-8 border-t border-gray-100">
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">Custom Code</h3>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom CSS</label>
                    <textarea
                      value={config.advanced?.customCss || ''}
                      onChange={(e) => setConfig({ ...config, advanced: { ...config.advanced!, customCss: e.target.value } })}
                      placeholder="/* Add your custom styles here */"
                      className="w-full px-6 py-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-2xl text-xs font-mono focus:outline-none focus:border-indigo-600 transition-all h-48"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom JavaScript</label>
                    <textarea
                      value={config.advanced?.customJs || ''}
                      onChange={(e) => setConfig({ ...config, advanced: { ...config.advanced!, customJs: e.target.value } })}
                      placeholder="// Add your custom scripts here"
                      className="w-full px-6 py-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-2xl text-xs font-mono focus:outline-none focus:border-indigo-600 transition-all h-48"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-3xl p-8 text-white space-y-6 sticky top-6">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <MousePointer2 className="text-amber-400" /> Live Preview
            </h3>
            <div className={`aspect-video bg-indigo-800 rounded-2xl overflow-hidden relative group cursor-pointer transition-all ${
              previewMode === 'mobile' ? 'max-w-xs mx-auto' : previewMode === 'tablet' ? 'max-w-md mx-auto' : ''
            }`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40">
                <p className="text-[10px] font-black uppercase tracking-widest">Click to View Full Preview</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-2 w-1/2 bg-white/20 rounded-full" />
                <div className="h-2 w-3/4 bg-white/20 rounded-full" />
                <div className="h-8 w-full bg-amber-400/20 rounded-lg mt-4" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <span>Last Updated</span>
                <span>{new Date(config.updatedAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <span>Active Sections</span>
                <span>{config.sections.filter(s => s.active).length}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <span>History States</span>
                <span>{history.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-3">
              <Type className="text-indigo-600" /> Typography
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">H1 Font Size</label>
                <input
                  type="text"
                  value={config.hero.typography.h1Size}
                  onChange={(e) => {
                    const newConfig = { ...config, hero: { ...config.hero, typography: { ...config.hero.typography, h1Size: e.target.value } } };
                    setConfig(newConfig);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">H2 Font Size</label>
                <input
                  type="text"
                  value={config.hero.typography.h2Size}
                  onChange={(e) => {
                    const newConfig = { ...config, hero: { ...config.hero, typography: { ...config.hero.typography, h2Size: e.target.value } } };
                    setConfig(newConfig);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-3">
              <Link className="text-indigo-600" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 transition-all flex items-center justify-center gap-2">
                <Copy size={14} /> Duplicate Page
              </button>
              <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 transition-all flex items-center justify-center gap-2">
                <Code size={14} /> Export JSON
              </button>
              <button className="w-full py-3 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold uppercase tracking-widest text-rose-600 transition-all flex items-center justify-center gap-2">
                <Trash2 size={14} /> Reset to Default
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageEditor;