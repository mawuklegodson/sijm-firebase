import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  UserPlus, Search, Filter, Phone, Mail, MapPin, Cake,
  Calendar, CheckCircle2, ChevronRight, X, User, Heart,
  Link2, Baby, Users, Trash2, Edit3, ShieldCheck, AlertCircle,
  Tag, Info, UserCircle, AlertTriangle, FileUp, Download, Loader2,
  FileText, HelpCircle
} from 'lucide-react';
import { Member, Gender, AgeGroup, WorkerPermission, IdentityRole } from '../types';

interface Props {
  store: any;
  navigate?: (page: string) => void;
}

const MembersPage: React.FC<Props> = ({ store, navigate }) => {
  const { members, settings, addMember, updateMember, deleteMember, firstTimers, promoteToMember, attendance, importMembers, currentUser } = store;
  const ui = settings.uiText;
  const [view, setView] = useState<'list' | 'add' | 'visitors' | 'import'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [importDrafts, setImportDrafts] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Member>>({
    fullName: '',
    gender: Gender.MALE,
    birthday: '',
    phone: '',
    email: '',
    location: '',
    branch: '',
    category: settings.memberCategories[0] || 'Member',
    customTags: [],
    parentIds: [],
    childrenIds: [],
    followUpNeeded: false,
    followUpReason: '',
    notes: '',
    sermonAccessSuspended: false
  });

  const categories = settings.memberCategories;
  const customTags = settings.customTags;

  const isSuperAdmin = currentUser?.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN);
  const userRole = currentUser?.identityRole;
  const userBranch = currentUser?.branch;
  const userDominion = currentUser?.dominion;

  useEffect(() => {
    if ((view === 'add' || view === 'visitors') && formData.parentIds?.length) {
      const parentId = formData.parentIds[0];
      const parent = members.find((m: Member) => m.id === parentId);
      if (parent && parent.location && !formData.location) {
        setFormData(prev => ({ ...prev, location: parent.location }));
      }
    }
  }, [formData.parentIds, members, view]);

  const filteredMembers = useMemo(() => {
    let list = [...members];

    // Role-based filtering
    if (!isSuperAdmin) {
      if (userRole === IdentityRole.GENERAL_HEAD) {
        // General Head sees everything
      } else if ([IdentityRole.GROUP_HEAD, IdentityRole.BRANCH_HEAD].includes(userRole)) {
        list = list.filter(m => m.branch === userBranch);
      } else if ([IdentityRole.REGIONAL_HEAD, IdentityRole.NATIONAL_HEAD].includes(userRole)) {
        list = list.filter(m => m.dominion === userDominion);
      }
    }

    return list.filter((m: Member) => {
      const matchesSearch = (m.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone && m.phone.includes(searchQuery)) ||
        (m.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      let matchesFilter: boolean = true;
      if (activeFilter === 'Male') matchesFilter = m.gender === Gender.MALE;
      else if (activeFilter === 'Female') matchesFilter = m.gender === Gender.FEMALE;
      else if (activeFilter === 'Children') matchesFilter = m.category === 'Child';
      else if (activeFilter === 'Officers') matchesFilter = m.category === 'Officer';
      else if (activeFilter !== 'All') {
        matchesFilter = m.category === activeFilter || !!(m.customTags && m.customTags.includes(activeFilter));
      }
      return matchesSearch && matchesFilter;
    });
  }, [members, searchQuery, activeFilter, isSuperAdmin, userRole, userBranch, userDominion]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [syncError, setSyncError] = useState('');

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveStatus('idle');
    setSyncError('');
    let success = false;
    try {
      if (selectedMember) {
        success = await updateMember(selectedMember.id, formData);
      } else {
        success = await addMember({ ...formData, membershipDate: new Date().toISOString().split('T')[0] } as Member);
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Database write failed. Check your connection and Firestore permissions.');
      success = false;
    }
    setIsSubmitting(false);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setView('list');
        setSelectedMember(null);
        setFormData({
          fullName: '',
          gender: Gender.MALE,
          birthday: '',
          phone: '',
          email: '',
          location: '',
          branch: '',
          category: categories[0] || 'Member',
          customTags: [],
          parentIds: [],
          childrenIds: [],
          followUpNeeded: false,
          followUpReason: '',
          notes: '',
          sermonAccessSuspended: false
        });
      }, 1500);
    } else {
      setSaveStatus('error');
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/);
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || lines[i].split(',').map(v => v.trim());
        const member: any = {};
        headers.forEach((h, idx) => {
          const val = row[idx] || '';
          if (h.includes('name')) member.fullName = val;
          else if (h.includes('gender')) member.gender = val.toLowerCase().startsWith('m') ? Gender.MALE : Gender.FEMALE;
          else if (h.includes('phone')) member.phone = val;
          else if (h.includes('email')) member.email = val;
          else if (h.includes('location')) member.location = val;
          else if (h.includes('birthday') || h.includes('dob')) member.birthday = val;
          else if (h.includes('category')) member.category = val;
          else if (h.includes('date')) member.membershipDate = val;
        });
        if (member.fullName) parsedData.push(member);
      }
      setImportDrafts(parsedData);
      setView('import');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    await importMembers(importDrafts);
    setIsImporting(false);
    setView('list');
    setImportDrafts([]);
  };

  const downloadCSVTemplate = () => {
    const headers = "Full Name,Gender,Birthday (YYYY-MM-DD),Phone,Email,Location,Category,Membership Date";
    const example = "\nJohn Doe,Male,1990-05-15,+1234567890,john@example.com,Lagos,Member,2023-10-01";
    const example2 = "\nJane Smith,Female,1995-12-25,+1122334455,jane@example.com,Abuja,Elder,2022-01-15";
    const blob = new Blob([headers + example + example2], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SIJM_Members_Template.csv';
    a.click();
  };

  const toggleRelationship = (type: 'parent' | 'child', id: string) => {
    const listKey = type === 'parent' ? 'parentIds' : 'childrenIds';
    const current = formData[listKey] || [];
    if (current.includes(id)) {
      setFormData({ ...formData, [listKey]: current.filter(x => x !== id) });
    } else {
      setFormData({ ...formData, [listKey]: [...current, id] });
    }
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {navigate && (
              <button 
                onClick={() => navigate('dashboard')}
                className="p-2 hover:bg-gray-100 rounded-xl sm:rounded-full transition-colors text-gray-500 flex items-center gap-1"
                title="Back to Dashboard"
              >
                <ChevronRight className="rotate-180" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Back</span>
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900 font-poppins truncate">{ui.members_page_title}</h2>
              <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5 sm:mt-1 truncate">{ui.members_page_desc}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleCSVUpload} accept=".csv" className="hidden" />
            <button onClick={downloadCSVTemplate} className="px-4 py-2.5 bg-white border border-gray-100 text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-indigo-50 flex items-center gap-2">
              <Download size={16} /> Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-white border border-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-gray-50 flex items-center gap-2">
              <FileUp size={16} /> Import CSV
            </button>
            <button onClick={() => setView('visitors')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${view === 'visitors' ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' : 'bg-white border-gray-100 text-gray-600 shadow-sm'}`}>
              Promote Visitors ({firstTimers.length})
            </button>
            <button onClick={() => {
              setFormData({
                fullName: '',
                gender: Gender.MALE,
                birthday: '',
                phone: '',
                email: '',
                location: '',
                branch: '',
                category: categories[0] || 'Member',
                customTags: [],
                parentIds: [],
                childrenIds: [],
                followUpNeeded: false,
                followUpReason: '',
                notes: '',
                sermonAccessSuspended: false
              });
              setSelectedMember(null);
              setView('add');
            }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <UserPlus size={18} />Enlist Soul
            </button>
          </div>
        </div>

        {view === 'add' ? (
          <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 mb-20">
            <div className="bg-indigo-900 p-8 text-white flex items-center justify-between">
              <div><h3 className="text-xl font-bold font-poppins">{selectedMember ? 'Update Profile' : 'Enlist New Member'}</h3><p className="text-indigo-200 text-xs">Linking relationships and capturing spiritual data</p></div>
              <ShieldCheck size={48} className="opacity-20" />
            </div>
            <form onSubmit={handleSaveMember} className="p-8 space-y-8">
              {saveStatus === 'success' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
                  <CheckCircle2 size={20} />
                  <span className="font-bold text-sm">Member record synchronized successfully!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Save failed</p>
                    <p className="text-xs mt-1 opacity-80">{syncError || 'Check your internet connection and try again. If the problem persists, contact your system administrator.'}</p>
                    <button onClick={() => setSaveStatus('idle')} className="mt-2 text-xs font-black underline">Dismiss & retry</button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label><input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Enter full name" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label><input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. +233 800 000 000" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Member Category</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none">{categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label><select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"><option value={Gender.MALE}>Male</option><option value={Gender.FEMALE}>Female</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Birthday</label><input type="date" required value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Residential Area</label><input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. Kasseh, Opposite Market" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch / Assembly</label><input value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. Sege Sanctuary" /></div>
              </div>
              <div className="pt-6 border-t border-gray-100 space-y-6">
                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Link2 size={16} /> Family Linkage (Live Mapping)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Map Parents</label>
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 max-h-48 overflow-y-auto no-scrollbar space-y-2">
                      {members.filter((m: Member) => m.id !== selectedMember?.id).map((m: Member) => (
                        <button key={m.id} type="button" onClick={() => toggleRelationship('parent', m.id)} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${formData.parentIds?.includes(m.id) ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-indigo-50'}`}>
                          {m.fullName}
                          {formData.parentIds?.includes(m.id) && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Map Children</label>
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 max-h-48 overflow-y-auto no-scrollbar space-y-2">
                      {members.filter((m: Member) => m.id !== selectedMember?.id).map((m: Member) => (
                        <button key={m.id} type="button" onClick={() => toggleRelationship('child', m.id)} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${formData.childrenIds?.includes(m.id) ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-indigo-50'}`}>
                          {m.fullName}
                          {formData.childrenIds?.includes(m.id) && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 pb-10">
                <button type="button" onClick={() => setView('list')} className="flex-1 py-4 text-sm font-black uppercase text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-[2] py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-100'
                    }`}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {isSubmitting ? 'Synchronizing...' : (selectedMember ? 'Update Profile' : 'Confirm Enrollment')}
                </button>
              </div>
            </form>
          </div>
        ) : view === 'visitors' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 shrink-0">
                <Heart size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-amber-900 font-poppins">Visitor Promotion Queue</h3>
                <p className="text-amber-700 text-sm mt-1">These souls have expressed interest in joining the ministry. Enlist them to formalize their membership.</p>
              </div>
              <button onClick={() => setView('list')} className="px-6 py-3 bg-white border border-amber-200 text-amber-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-100 transition-all">Back to Registry</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {firstTimers.filter((ft: any) => ft.followUpStatus !== 'Member').map((ft: any) => (
                <div key={ft.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner shrink-0 ${ft.gender === Gender.MALE ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'}`}>{ft.fullName.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{ft.fullName}</h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{ft.ageGroup} • {ft.source}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} className="text-indigo-300" /> {ft.phone}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={12} className="text-gray-300" /> {ft.location || 'No Location'}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const confirm = window.confirm(`Promote ${ft.fullName} to full membership?`);
                      if (confirm) {
                        promoteToMember(ft.id, {
                          fullName: ft.fullName,
                          gender: ft.gender,
                          birthday: '',
                          phone: ft.phone,
                          email: ft.email || '',
                          location: ft.location || '',
                          category: 'Member',
                          membershipDate: new Date().toISOString().split('T')[0]
                        });
                      }
                    }}
                    className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} /> Enlist as Member
                  </button>
                </div>
              ))}
              {firstTimers.filter((ft: any) => ft.followUpStatus !== 'Member').length === 0 && (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-bold">No pending visitors for promotion.</p>
                </div>
              )}
            </div>
          </div>
        ) : view === 'import' ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 mb-20">
            <div className="bg-indigo-900 p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <FileUp size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-poppins">Import Draft Review</h3>
                  <p className="text-indigo-200 text-xs">Verify the data integrity before pushing to the ministry cloud</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowImportGuide(!showImportGuide)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                  <HelpCircle size={14} /> {showImportGuide ? 'Hide Guide' : 'CSV Guide'}
                </button>
                <button onClick={downloadCSVTemplate} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                  <Download size={14} /> Download Template
                </button>
                <button onClick={() => setView('list')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>
            </div>
            {showImportGuide && (
              <div className="bg-indigo-50 p-8 border-b border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
                <div>
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14} /> Required Columns</h4>
                  <ul className="text-xs text-indigo-700 space-y-1 font-medium">
                    <li>• Full Name</li>
                    <li>• Gender (Male/Female)</li>
                    <li>• Category (Member/Elder etc)</li>
                    <li>• Branch (Optional)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={14} /> Date Formats</h4>
                  <p className="text-xs text-indigo-700 font-medium">Use <strong>YYYY-MM-DD</strong> for Birthday and Membership Date for accurate ingestion.</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={14} /> Location Info</h4>
                  <p className="text-xs text-indigo-700 font-medium">General area names (e.g., Ikeja, Lekki) are sufficient for growth mapping.</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={14} /> Column Headers</h4>
                  <p className="text-xs text-indigo-700 font-medium">The importer uses smart matching. Names like "Full Name", "Gender", "Phone" work best.</p>
                </div>
              </div>
            )}
            <div className="p-0 overflow-x-auto max-h-[500px] no-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 sticky top-0 z-10">
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-4">Draft Full Name</th>
                    <th className="px-8 py-4">Gender</th>
                    <th className="px-8 py-4">Phone</th>
                    <th className="px-8 py-4">Location</th>
                    <th className="px-8 py-4">Birthday</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {importDrafts.map((row, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-8 py-4 text-sm font-bold text-gray-900">{row.fullName}</td>
                      <td className="px-8 py-4 text-[10px] font-black uppercase">{row.gender}</td>
                      <td className="px-8 py-4 text-xs font-medium text-gray-500">{row.phone || 'N/A'}</td>
                      <td className="px-8 py-4 text-xs font-medium text-gray-500">{row.location || 'N/A'}</td>
                      <td className="px-8 py-4 text-xs font-medium text-gray-500">{row.birthday || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ready to process {importDrafts.length} total records</p>
              <div className="flex gap-4">
                <button onClick={() => setView('list')} className="px-8 py-4 text-sm font-black uppercase text-gray-400 hover:bg-white rounded-2xl transition-all">Discard Draft</button>
                <button onClick={handleConfirmImport} disabled={isImporting} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3">{isImporting ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}Confirm Data Push</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <Search className="text-gray-400" size={20} />
                <input type="text" placeholder="Search flock by name, phone or location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 outline-none text-sm font-medium bg-transparent" />
              </div>
              <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                {['All', 'Male', 'Female', 'Officers', ...categories.slice(0, 3)].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((m: Member) => (
                <div key={m.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="flex items-start gap-5 cursor-pointer" onClick={() => setSelectedMember(m)}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner shrink-0 ${m.gender === Gender.MALE ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'}`}>{m.fullName.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{m.fullName}</h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{m.category}</p>
                      <div className="mt-4 space-y-2">
                        {m.phone && (<a href={`tel:${m.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-600 transition-colors"><Phone size={12} className="text-indigo-300" /> {m.phone}</a>)}
                        <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={12} className="text-gray-300" /> <span className="truncate">{m.location || 'No Location'}</span></div>
                        {(m.parentIds?.length || 0) + (m.childrenIds?.length || 0) > 0 && (
                          <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold"><Users size={12} /> Family Linked</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setFormData(m); setSelectedMember(m); setView('add'); }} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMember && view === 'list' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-md" onClick={() => setSelectedMember(null)} />
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-br from-indigo-800 to-indigo-950 p-10 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                  <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/10 ${selectedMember.gender === Gender.MALE ? 'bg-indigo-600' : 'bg-pink-600'}`}>{selectedMember.fullName.charAt(0)}</div>
                  <div><h3 className="text-3xl font-bold font-poppins">{selectedMember.fullName}</h3><p className="text-indigo-200 text-sm mt-1 uppercase font-black tracking-widest">{selectedMember.category} • Ministry Member</p></div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
              </div>
              <div className="p-10 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Birthday</p><p className="text-sm font-bold text-gray-800">{selectedMember.birthday || 'N/A'}</p></div>
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Branch</p><p className="text-sm font-bold text-gray-800">{selectedMember.branch || 'N/A'}</p></div>
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Parents</p><p className="text-sm font-bold text-gray-800">{selectedMember.parentIds?.length || 0}</p></div>
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 text-center"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Children</p><p className="text-sm font-bold text-gray-800">{selectedMember.childrenIds?.length || 0}</p></div>
                </div>

                {/* Sermon Access Control */}
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(selectedMember as any).sermonAccessSuspended ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Sermon Access Control</p>
                      <p className="text-[10px] text-gray-500 font-medium">{(selectedMember as any).sermonAccessSuspended ? 'Access currently suspended' : 'Full access granted'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const newState = !(selectedMember as any).sermonAccessSuspended;
                      const success = await updateMember(selectedMember.id, { ...selectedMember, sermonAccessSuspended: newState });
                      if (success) {
                        setSelectedMember({ ...selectedMember, sermonAccessSuspended: newState } as any);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${(selectedMember as any).sermonAccessSuspended 
                      ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' 
                      : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
                  >
                    {(selectedMember as any).sermonAccessSuspended ? 'Restore Access' : 'Suspend Access'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Link2 size={14} /> Family Map</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Parents</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.parentIds?.map((pid: string) => {
                          const p = members.find((m: Member) => m.id === pid);
                          return p ? <div key={pid} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-indigo-100">{p.fullName}</div> : null;
                        })}
                        {!selectedMember.parentIds?.length && <p className="text-xs text-gray-300 italic">No parents linked</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Children</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.childrenIds?.map((cid: string) => {
                          const c = members.find((m: Member) => m.id === cid);
                          return c ? <div key={cid} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-emerald-100">{c.fullName}</div> : null;
                        })}
                        {!selectedMember.childrenIds?.length && <p className="text-xs text-gray-300 italic">No children linked</p>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4">
                  <button onClick={() => { setFormData(selectedMember); setView('add'); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"><Edit3 size={18} /> Modify Record</button>
                  <button
                    onClick={() => {
                      store.requestProfileUpdate(selectedMember.id, !selectedMember.profileUpdateRequested);
                      setSelectedMember({ ...selectedMember, profileUpdateRequested: !selectedMember.profileUpdateRequested });
                    }}
                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border ${selectedMember.profileUpdateRequested
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
                      }`}
                  >
                    <AlertCircle size={18} />
                    {selectedMember.profileUpdateRequested ? 'Update Requested' : 'Request Profile Update'}
                  </button>
                  {/* ✅ FIXED: Admin-only delete permission */}
                  {(store.currentUser?.workerPermissions.includes(WorkerPermission.ADMIN) || store.currentUser?.workerPermissions.includes(WorkerPermission.SUPER_ADMIN)) && (
                    <button onClick={() => { if (window.confirm('Permanently delete this member record? This action cannot be undone.')) { deleteMember(selectedMember.id); setSelectedMember(null); } }} className="px-4 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-600 hover:text-white transition-all border border-rose-100"><Trash2 size={20} /></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;