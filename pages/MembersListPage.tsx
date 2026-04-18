import React, { useState, useMemo } from 'react';
import { User, Member, IdentityRole, WorkerPermission } from '../types.ts';
import { 
  Users, Search, Download, Filter, ChevronRight, 
  MapPin, Phone, Mail, Globe, Shield, UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface MembersListPageProps {
  store: any;
  navigate: (page: string) => void;
}

const MembersListPage: React.FC<MembersListPageProps> = ({ store, navigate }) => {
  const { currentUser, members, isLoading } = store;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const isSuperAdmin = currentUser.workerPermissions?.includes(WorkerPermission.SUPER_ADMIN);
  const userRole = currentUser.identityRole;
  const userBranch = currentUser.branch;
  const userDominion = currentUser.dominion;

  const filteredMembers = useMemo(() => {
    let list = [...members];

    // Role-based filtering
    if (!isSuperAdmin) {
      if (userRole === IdentityRole.GENERAL_HEAD) {
        // General Head sees everything
      } else if ([IdentityRole.GROUP_HEAD, IdentityRole.BRANCH_HEAD].includes(userRole)) {
        list = list.filter(m => m.branch === userBranch);
      } else if ([IdentityRole.REGIONAL_HEAD, IdentityRole.NATIONAL_HEAD].includes(userRole)) {
        // For regional/national heads, we filter by dominion
        list = list.filter(m => m.dominion === userDominion);
      } else {
        // Other roles shouldn't even see this page, but as a fallback:
        return [];
      }
    }

    // Search filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        (m.fullName || '').toLowerCase().includes(q) || 
        m.email?.toLowerCase().includes(q) || 
        m.phone?.includes(q) ||
        m.branch?.toLowerCase().includes(q)
      );
    }

    // Category filtering
    if (activeFilter !== 'All') {
      list = list.filter(m => m.category === activeFilter);
    }

    return list;
  }, [members, searchQuery, activeFilter, currentUser, isSuperAdmin, userRole, userBranch, userDominion]);

  const handleExport = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Branch', 'Dominion', 'Category', 'Membership Date'];
    const rows = filteredMembers.map(m => [
      m.fullName,
      m.phone || 'N/A',
      m.email || 'N/A',
      m.branch || 'N/A',
      m.dominion || 'N/A',
      m.category,
      m.membershipDate
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `members_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = ['All', 'Member', 'Officer', 'Elder', 'Youth', 'Teen', 'Child'];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {navigate && (
            <button 
              onClick={() => navigate('dashboard')}
              className="p-2 hover:bg-slate-100 rounded-xl sm:rounded-full transition-colors text-slate-500 flex items-center gap-1"
              title="Back to Dashboard"
            >
              <ChevronRight className="rotate-180" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Back</span>
            </button>
          )}
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-600 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0">
            <Users className="text-white" size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">My Members</h1>
            <p className="text-slate-400 text-[8px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 sm:mt-1 truncate">
              {isSuperAdmin ? 'Full Access' : `${userRole} - ${userBranch || userDominion || 'Global'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-indigo-600 transition-all"
          >
            <Download size={18} /> Export CSV
          </motion.button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search by name, email, phone or branch..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeFilter === cat 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] h-48 animate-pulse border border-slate-100" />
          ))
        ) : filteredMembers.length > 0 ? (
          filteredMembers.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    <UserCheck size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{member.fullName}</h3>
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest mt-1 inline-block">
                      {member.category}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                  <Shield size={14} />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Phone size={14} className="text-slate-300" />
                  <span className="font-bold">{member.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Mail size={14} className="text-slate-300" />
                  <span className="truncate">{member.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Globe size={14} className="text-slate-300" />
                  <span>{member.branch || 'No branch'}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-slate-300" />
                  <span className="text-[10px] font-bold text-slate-400">{member.location || 'N/A'}</span>
                </div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  Since {new Date(member.membershipDate).getFullYear()}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Users size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No members found</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">We couldn't find any members matching your criteria or within your jurisdiction.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersListPage;
