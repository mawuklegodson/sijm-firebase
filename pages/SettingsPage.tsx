import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Globe, Bell, Shield, Palette, Database,
  Type, Sparkles, BrainCircuit, RefreshCw, Save, CheckCircle2,
  Trash2, Plus, Layout, ImageIcon, Link as LinkIcon, Info,
  AlertTriangle, Heart, BookOpen, Mail, ChevronRight
} from 'lucide-react';
import { formatImageUrl, DEFAULT_SETTINGS } from '../store.ts';

interface Props {
  store: any;
  navigate?: (page: string) => void;
}

const SettingsPage: React.FC<Props> = ({ store, navigate }) => {
  // Defensive extraction to prevent crashes if store is incomplete
  const settings = store?.settings || DEFAULT_SETTINGS;
  const updateSettings = store?.updateSettings || (() => Promise.resolve());

  const [activeSection, setActiveSection] = useState('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdatePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    const success = await store.updateMyPassword(newPassword);
    if (success) {
      alert("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError("Update failed. You may need to re-login to perform this action.");
    }
  };

  // Local state initialized with fallback defaults to ensure every field exists
  const [general, setGeneral] = useState({ ...DEFAULT_SETTINGS.general, ...(settings?.general || {}) });
  const [branding, setBranding] = useState({ ...DEFAULT_SETTINGS.branding, ...(settings?.branding || {}) });
  const [ai, setAi] = useState({ ...DEFAULT_SETTINGS.ai, ...(settings?.ai || {}) });
  const [uiText, setUiText] = useState({ ...DEFAULT_SETTINGS.uiText, ...(settings?.uiText || {}) });
  const [spiritual, setSpiritual] = useState({ ...DEFAULT_SETTINGS.spiritual, ...(settings?.spiritual || {}) });

  const handleSave = async (section: string, data: any) => {
    setIsSaving(true);
    try {
      await updateSettings(section, data);
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl z-[200] flex items-center gap-2 animate-in slide-in-from-bottom-4';
      toast.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Divine Config Synchronized`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (e) {
      console.error("Failed to save settings:", e);
      alert("Encountered an error while synchronizing divine configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'branding', label: 'Identity & Theme', icon: Palette },
    { id: 'general', label: 'Church Profile', icon: Globe },
    { id: 'spiritual', label: 'Spiritual & Care', icon: Heart },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'ai', label: 'Divine AI Intel', icon: BrainCircuit },
    { id: 'uiText', label: 'Global Dictionary', icon: Type },
    { id: 'categories', label: 'Taxonomy', icon: Database },
  ];

  const renderSection = () => {
    try {
      switch (activeSection) {
        case 'branding':
          return (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} /> Logo Asset</h4>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 ml-1">Logo URL (Google Drive / Web)</label>
                      <input 
                        type="text"
                        value={branding.logoUrl || ''}
                        onChange={e => setBranding({...branding, logoUrl: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        placeholder="https://drive.google.com/..."
                      />
                      <div className="p-6 bg-white rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[160px] shadow-sm">
                        {branding.logoUrl && branding.logoUrl.length > 5 ? (
                          <div className="flex flex-col items-center gap-4">
                            <img 
                              src={formatImageUrl(branding.logoUrl)} 
                              alt="Logo Preview" 
                              className="h-20 object-contain rounded-xl shadow-sm"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/logo.png";
                              }}
                            />
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Link Detected</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <ImageIcon size={32} className="text-gray-200 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Logo Active</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><LinkIcon size={14} /> Portal Favicon</h4>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 ml-1">Favicon URL</label>
                      <input 
                        type="text"
                        value={branding.faviconUrl || ''}
                        onChange={e => setBranding({...branding, faviconUrl: e.target.value})}
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                      <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                          <img src={formatImageUrl(branding.faviconUrl)} alt="F" className="w-6 h-6 object-contain" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 leading-relaxed italic">
                          This icon appears in the browser tab. <br/> Use a small square image.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50">
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-6">Ministry Color Palette</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { k: 'primaryColor', l: 'Primary' },
                      { k: 'secondaryColor', l: 'Secondary' },
                      { k: 'sidebarBg', l: 'Sidebar BG' },
                      { k: 'headerBg', l: 'Header BG' },
                    ].map(color => (
                      <div key={color.k} className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 ml-1">{color.l}</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={String(branding[color.k as keyof typeof branding] || '#ffffff')} 
                            onChange={e => setBranding({...branding, [color.k]: e.target.value})}
                            className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                          />
                          <input 
                            type="text" 
                            value={String(branding[color.k as keyof typeof branding] || '')} 
                            onChange={e => setBranding({...branding, [color.k]: e.target.value})}
                            className="flex-1 text-[9px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-2 rounded-lg"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-8">
                  <button 
                    onClick={() => handleSave('branding', branding)}
                    disabled={isSaving}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save size={18} /> Apply Visual Identity
                  </button>
                </div>
              </div>
            </div>
          );

        case 'general':
          return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Church Name</label>
                  <input type="text" value={general.churchName || ''} onChange={e => setGeneral({...general, churchName: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Tagline</label>
                  <input type="text" value={general.tagline || ''} onChange={e => setGeneral({...general, tagline: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Email</label>
                  <input type="email" value={general.email || ''} onChange={e => setGeneral({...general, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                </div>
              </div>
              <button onClick={() => handleSave('general', general)} disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50">Synchronize Profile</button>
            </div>
          );

        case 'spiritual':
          return (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Mail size={14} /> Counseling & Care</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 ml-1">Counseling Email</label>
                    <input 
                      type="email"
                      value={spiritual.counselingEmail || ''}
                      onChange={e => setSpiritual({...spiritual, counselingEmail: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="counseling@ministry.org"
                    />
                    <p className="text-[10px] text-gray-400 ml-1">This email will be used for counseling requests from members.</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><BookOpen size={14} /> Daily Scriptures</h4>
                  <div className="space-y-4">
                    {spiritual.scriptures?.map((scripture: any, idx: number) => (
                      <div key={idx} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 relative group">
                        <button 
                          onClick={() => {
                            const newScriptures = [...spiritual.scriptures];
                            newScriptures.splice(idx, 1);
                            setSpiritual({...spiritual, scriptures: newScriptures});
                          }}
                          className="absolute top-4 right-4 p-2 text-gray-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference</label>
                            <input 
                              type="text"
                              value={scripture.reference}
                              onChange={e => {
                                const newScriptures = [...spiritual.scriptures];
                                newScriptures[idx].reference = e.target.value;
                                setSpiritual({...spiritual, scriptures: newScriptures});
                              }}
                              className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                              placeholder="Psalm 23:1"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Version</label>
                            <input 
                              type="text"
                              value={scripture.version}
                              onChange={e => {
                                const newScriptures = [...spiritual.scriptures];
                                newScriptures[idx].version = e.target.value;
                                setSpiritual({...spiritual, scriptures: newScriptures});
                              }}
                              className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                              placeholder="KJV"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Text</label>
                          <textarea 
                            value={scripture.text}
                            onChange={e => {
                              const newScriptures = [...spiritual.scriptures];
                              newScriptures[idx].text = e.target.value;
                              setSpiritual({...spiritual, scriptures: newScriptures});
                            }}
                            className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium outline-none h-20"
                            placeholder="The Lord is my shepherd..."
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newScriptures = [...(spiritual.scriptures || []), { reference: '', text: '', version: 'KJV' }];
                        setSpiritual({...spiritual, scriptures: newScriptures});
                      }}
                      className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
                    >
                      <Plus size={18} /> Add Scripture Section
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-8">
                  <button 
                    onClick={() => handleSave('spiritual', spiritual)}
                    disabled={isSaving}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save size={18} /> Save Spiritual Settings
                  </button>
                </div>
              </div>
            </div>
          );

        case 'security':
          return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 animate-in fade-in duration-500">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Shield size={14} /> Update Password</h4>
                <p className="text-xs text-gray-500 font-medium">Change your account password. For security, you may be asked to re-authenticate if your session is old.</p>
                
                {passwordError && (
                  <div className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                    {passwordError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" 
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdatePassword} 
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
                >
                  Update My Password
                </button>
              </div>

              <div className="pt-8 border-t border-gray-50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={14} /> Connected Accounts</h4>
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <Globe size={24} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Google Authentication</p>
                      <p className="text-[10px] font-medium text-gray-500">You can also sign in using your Google account at any time.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Available</span>
                </div>
              </div>
            </div>
          );

        case 'ai':
          return (
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-6 p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-indigo-900 font-poppins">Divine Intel Engine</h4>
                  <p className="text-indigo-600 text-sm font-medium">Empower administration with Gemini 3 Pro insights</p>
                </div>
                <div className="ml-auto">
                  <button 
                    onClick={() => setAi({...ai, divineIntelligenceEnabled: !ai.divineIntelligenceEnabled})}
                    className={`w-14 h-8 rounded-full relative transition-all ${ai.divineIntelligenceEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${ai.divineIntelligenceEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AI Personality Prompt</label>
                  <textarea 
                    value={ai.customAiSystemPrompt || ''} 
                    onChange={e => setAi({...ai, customAiSystemPrompt: e.target.value})}
                    className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] h-32 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe how the AI should analyze your data..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Custom AI Avatar URL</label>
                  <input 
                    type="text" 
                    value={ai.aiLogoUrl || ''} 
                    onChange={e => setAi({...ai, aiLogoUrl: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
                  />
                </div>
              </div>

              <button onClick={() => handleSave('ai', ai)} disabled={isSaving} className="w-full py-5 bg-indigo-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl disabled:opacity-50">Awaken Divine Intelligence</button>
            </div>
          );

        case 'categories':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={14} /> Member Ranks</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(settings?.memberCategories || DEFAULT_SETTINGS.memberCategories).map((cat: string) => (
                    <div key={cat} className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 flex items-center gap-2 group">
                      {cat}
                      <button onClick={() => store.deleteMemberCategory(cat)} className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input id="newMemberCat" type="text" placeholder="Add Rank..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('newMemberCat') as HTMLInputElement;
                      if (input.value) { store.addMemberCategory(input.value); input.value = ''; }
                    }}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={14} /> Asset Classification</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(settings?.assetCategories || DEFAULT_SETTINGS.assetCategories).map((cat: string) => (
                    <div key={cat} className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 flex items-center gap-2 group">
                      {cat}
                      <button onClick={() => store.deleteAssetCategory(cat)} className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input id="newAssetCat" type="text" placeholder="Add Category..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none" />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('newAssetCat') as HTMLInputElement;
                      if (input.value) { store.addAssetCategory(input.value); input.value = ''; }
                    }}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Sparkles size={14} /> Service Tiers</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(settings?.serviceTypes || DEFAULT_SETTINGS.serviceTypes).map((type: string) => (
                    <div key={type} className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 flex items-center gap-2 group">
                      {type}
                      <button onClick={() => store.deleteServiceType(type)} className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input id="newServiceType" type="text" placeholder="Add Service..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none" />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('newServiceType') as HTMLInputElement;
                      if (input.value) { store.addServiceType(input.value); input.value = ''; }
                    }}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Globe size={14} /> Ministry Branches</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(settings?.branches || DEFAULT_SETTINGS.branches).map((branch: string) => (
                    <div key={branch} className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 flex items-center gap-2 group">
                      {branch}
                      <button onClick={() => store.deleteBranch(branch)} className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input id="newBranch" type="text" placeholder="Add Branch..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none" />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('newBranch') as HTMLInputElement;
                      if (input.value) { store.addBranch(input.value); input.value = ''; }
                    }}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Layout size={14} /> Counting Segments</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(settings?.attendanceSegments || DEFAULT_SETTINGS.attendanceSegments).map((seg: string) => (
                    <div key={seg} className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 flex items-center gap-2 group">
                      {seg}
                      <button onClick={() => store.deleteAttendanceSegment(seg)} className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input id="newSegment" type="text" placeholder="Add Segment..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none" />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('newSegment') as HTMLInputElement;
                      if (input.value) { store.addAttendanceSegment(input.value); input.value = ''; }
                    }}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          );

        case 'uiText':
          return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in fade-in duration-500">
              <div className="flex items-center gap-4 mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <Info size={20} className="text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-wider">
                  Divine Dictionary: Modify any text across the portal to match your specific ministry language and terminology.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.keys(uiText || {}).map(key => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{key.replace(/_/g, ' ')}</label>
                    <input 
                      type="text" 
                      value={String(uiText[key as keyof typeof uiText] || '')} 
                      onChange={e => setUiText({...uiText, [key]: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-gray-50">
                <button onClick={() => handleSave('uiText', uiText)} disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50">Apply Dictionary Update</button>
              </div>
            </div>
          );

        default:
          return null;
      }
    } catch (err) {
      console.error("Rendering error in Settings section:", err);
      return (
        <div className="p-10 bg-rose-50 border border-rose-200 rounded-[2rem] text-rose-800 text-center">
           {/* Fix: Added missing AlertTriangle import from lucide-react */}
           <AlertTriangle size={48} className="mx-auto mb-4" />
           <h3 className="text-xl font-bold">Rendering Failure</h3>
           <p className="mt-2 text-sm">A configuration value is causing a conflict. Please perform a hard refresh.</p>
           <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-full font-bold flex items-center gap-2 mx-auto"><RefreshCw size={16}/> Repair UI</button>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
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
          <div>
            <h2 className="text-3xl font-bold text-gray-900 font-poppins tracking-tight">System Settings</h2>
            <p className="text-gray-500 text-sm mt-1">Global ministry configuration and branding control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => window.location.reload()}
             className="p-3 bg-white border border-gray-100 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
           >
              <RefreshCw size={18} /> Hard Refresh
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 space-y-2 shrink-0 no-print">
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                activeSection === sec.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <sec.icon size={20} className={activeSection === sec.id ? 'stroke-[2.5]' : ''} />
              <span className="font-bold text-xs uppercase tracking-widest">{sec.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full">
           {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;