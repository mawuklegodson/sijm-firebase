import React, { useState } from 'react';
import { useCMSStore } from '../store';
import { Group, IdentityRole, WorkerPermission } from '../types';
import { 
  Users2, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  User as UserIcon, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupsPageProps {
  navigate?: (page: string) => void;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ navigate }) => {
  const { 
    groups, 
    currentUser, 
    users,
    addGroup, 
    updateGroup, 
    deleteGroup, 
    joinGroup, 
    leaveGroup 
  } = useCMSStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  const isAdmin = currentUser?.workerPermissions?.some(p => 
    [WorkerPermission.ADMIN, WorkerPermission.SUPER_ADMIN].includes(p as WorkerPermission)
  );

  const filteredGroups = groups.filter(group => {
    const matchesSearch = (group.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (group.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || group.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Cell', 'Department', 'Fellowship', 'Other'];

  const handleJoinLeave = async (group: Group) => {
    if (!currentUser) return;
    if (group.memberIds.includes(currentUser.id)) {
      await leaveGroup(group.id);
    } else {
      await joinGroup(group.id);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Community Groups</h1>
            <p className="text-gray-500 mt-1 text-lg">Find your place in our church family</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Create New Group
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={group.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col"
          >
            {/* Group Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
              {group.imageUrl ? (
                <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users2 className="w-16 h-16 text-white/20" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                  {group.category}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {group.name}
                </h3>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingGroup(group)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteGroup(group.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-600 line-clamp-2 mb-6 flex-1">
                {group.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <UserIcon className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-gray-700">Head: {group.headName}</span>
                </div>
                {group.meetingTime && (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>{group.meetingTime}</span>
                  </div>
                )}
                {group.meetingLocation && (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span>{group.meetingLocation}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Users2 className="w-4 h-4 text-indigo-500" />
                  <span>{group.memberIds.length} Members</span>
                </div>
              </div>

              <button
                onClick={() => handleJoinLeave(group)}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  group.memberIds.includes(currentUser?.id || '')
                    ? 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                }`}
              >
                {group.memberIds.includes(currentUser?.id || '') ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Joined
                  </>
                ) : (
                  <>
                    Join Group
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Users2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No groups found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or category filter</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || editingGroup) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                <h2 className="text-xl font-bold">
                  {editingGroup ? 'Edit Group' : 'Create New Group'}
                </h2>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingGroup(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const headId = formData.get('headId') as string;
                  const headUser = users.find(u => u.id === headId);
                  
                  const groupData = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    category: formData.get('category') as any,
                    headId: headId,
                    headName: headUser?.fullName || 'Unknown',
                    meetingTime: formData.get('meetingTime') as string,
                    meetingLocation: formData.get('meetingLocation') as string,
                  };

                  if (editingGroup) {
                    await updateGroup(editingGroup.id, groupData);
                  } else {
                    await addGroup(groupData);
                  }
                  
                  setIsAddModalOpen(false);
                  setEditingGroup(null);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Group Name</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingGroup?.name}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    defaultValue={editingGroup?.category || 'Cell'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Cell">Cell</option>
                    <option value="Department">Department</option>
                    <option value="Fellowship">Fellowship</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Assign Head</label>
                  <select
                    name="headId"
                    required
                    defaultValue={editingGroup?.headId}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select a leader...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.identityRole})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingGroup?.description}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Time</label>
                    <input
                      name="meetingTime"
                      placeholder="e.g. Sundays 4pm"
                      defaultValue={editingGroup?.meetingTime}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                    <input
                      name="meetingLocation"
                      placeholder="e.g. Room 201"
                      defaultValue={editingGroup?.meetingLocation}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingGroup(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors"
                  >
                    {editingGroup ? 'Save Changes' : 'Create Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupsPage;
