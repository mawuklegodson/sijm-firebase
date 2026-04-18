
import React, { useState, useMemo } from 'react';
import { 
  Package, 
  MapPin, 
  DollarSign, 
  Activity, 
  AlertCircle, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  ChevronRight, 
  Filter, 
  Save, 
  Info,
  Layers,
  Archive,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { Asset } from '../types.ts';

interface Props {
  store: any;
  navigate?: (page: string) => void;
}

const AssetsPage: React.FC<Props> = ({ store, navigate }) => {
  const ui = store.settings.uiText;
  const { assets, addAsset, updateAsset, deleteAsset, settings, addAssetCategory } = store;
  const categories = settings.assetCategories;
  
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: categories[0] || 'Furniture',
    goodCondition: 0,
    manageable: 0,
    discarded: 0,
    location: '',
    value: 0
  });

  const totalValue = assets.reduce((acc: number, curr: any) => acc + (Number(curr.value) || 0), 0);
  const itemsNeedingAttention = assets.filter((a: any) => a.discarded > 0 || a.manageable > (a.totalQuantity * 0.2)).length;

  const filteredAssets = useMemo(() => {
    return assets.filter((asset: Asset) => {
      const matchesSearch = (asset.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (asset.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' ? true : asset.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [assets, searchQuery, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setIsAddingNewCategory(false);
    setFormData({
      name: '', category: categories[0] || 'Furniture', goodCondition: 0, manageable: 0, discarded: 0, location: '', value: 0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAddingNewCategory(false);
    setFormData({
      name: asset.name, 
      category: asset.category, 
      goodCondition: asset.goodCondition, 
      manageable: asset.manageable, 
      discarded: asset.discarded, 
      location: asset.location, 
      value: asset.value
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this asset from the registry?")) {
      deleteAsset(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalCategory = formData.category;
    
    if (isAddingNewCategory && newCategoryName.trim()) {
      await addAssetCategory(newCategoryName.trim());
      finalCategory = newCategoryName.trim();
    }

    const totalQuantity = Number(formData.goodCondition) + Number(formData.manageable) + Number(formData.discarded);
    const assetPayload = {
      ...formData, 
      category: finalCategory, 
      goodCondition: Number(formData.goodCondition), 
      manageable: Number(formData.manageable), 
      discarded: Number(formData.discarded), 
      totalQuantity, 
      value: Number(formData.value)
    };

    if (editingAsset) { 
      await updateAsset(editingAsset.id, assetPayload); 
    } else { 
      await addAsset(assetPayload); 
    }
    
    setShowModal(false);
    setNewCategoryName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
            <h2 className="text-2xl font-bold text-gray-900 font-poppins">{ui.assets_page_title}</h2>
            <p className="text-gray-500 text-sm">{ui.assets_page_desc}</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          New Asset Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 text-indigo-600 mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
               <DollarSign size={20} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Portfolio Value</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
             <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
               <Package size={20} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Items</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{assets.length}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 text-rose-600 mb-4">
             <div className="p-3 bg-rose-50 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all">
               <AlertCircle size={20} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Critical Maintenance</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{itemsNeedingAttention}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search assets by name or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-sm font-medium bg-transparent"
          />
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
          {['All', ...categories].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                categoryFilter === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <th className="px-8 py-5">Asset Identification</th>
                <th className="px-8 py-5">Condition Health</th>
                <th className="px-8 py-5">Storage Location</th>
                <th className="px-8 py-5">Financial Value</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssets.map((asset: Asset) => (
                <tr key={asset.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{asset.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-1">{asset.category}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-32">
                       <div className="flex items-center justify-between text-[10px] font-black mb-1">
                          <span className="text-emerald-600">{asset.goodCondition} Good</span>
                          <span className="text-gray-400">/ {asset.totalQuantity}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: `${(asset.goodCondition / asset.totalQuantity) * 100}%` }} />
                          <div className="bg-amber-400 h-full" style={{ width: `${(asset.manageable / asset.totalQuantity) * 100}%` }} />
                          <div className="bg-rose-500 h-full" style={{ width: `${(asset.discarded / asset.totalQuantity) * 100}%` }} />
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                       <MapPin size={12} className="text-indigo-300" />
                       {asset.location}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-sm font-black text-gray-900">${(Number(asset.value) || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(asset)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-300">
                       <Package size={48} className="mb-4" />
                       <p className="text-sm font-bold uppercase tracking-widest">No assets matching criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-indigo-900 p-10 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20">
                     <Package size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold font-poppins">{editingAsset ? 'Edit Asset Data' : 'Log New Asset'}</h3>
                     <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mt-1">Resource Stewardship Registry</p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Nomenclature</label>
                     <input 
                       type="text" 
                       required
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                       className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-800"
                       placeholder="e.g. Yamaha PSR-SX900"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location / Room</label>
                     <input 
                       type="text" 
                       required
                       value={formData.location}
                       onChange={e => setFormData({...formData, location: e.target.value})}
                       className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-800"
                       placeholder="e.g. Choir Loft"
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Classification</label>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                      className="text-[10px] font-black uppercase text-indigo-600 hover:underline"
                    >
                      {isAddingNewCategory ? 'Select Existing' : '+ Add New Category'}
                    </button>
                  </div>
                  
                  {isAddingNewCategory ? (
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Enter new category name..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="w-full px-5 py-4 bg-indigo-50 border border-indigo-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900"
                    />
                  ) : (
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-800 appearance-none"
                    >
                      {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
               </div>

               <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-4 text-center">Quantity & Health Distribution</h4>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-2 text-center">
                        <label className="text-[9px] font-black text-emerald-600 uppercase">Good</label>
                        <input 
                          type="number"
                          value={formData.goodCondition}
                          onChange={e => setFormData({...formData, goodCondition: Number(e.target.value)})}
                          className="w-full text-center py-3 bg-white border border-gray-100 rounded-xl font-black text-lg text-gray-800"
                        />
                     </div>
                     <div className="space-y-2 text-center">
                        <label className="text-[9px] font-black text-amber-600 uppercase">Manageable</label>
                        <input 
                          type="number"
                          value={formData.manageable}
                          onChange={e => setFormData({...formData, manageable: Number(e.target.value)})}
                          className="w-full text-center py-3 bg-white border border-gray-100 rounded-xl font-black text-lg text-gray-800"
                        />
                     </div>
                     <div className="space-y-2 text-center">
                        <label className="text-[9px] font-black text-rose-600 uppercase">Discarded</label>
                        <input 
                          type="number"
                          value={formData.discarded}
                          onChange={e => setFormData({...formData, discarded: Number(e.target.value)})}
                          className="w-full text-center py-3 bg-white border border-gray-100 rounded-xl font-black text-lg text-gray-800"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estimated Financial Value ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                    <input 
                      type="number"
                      required
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                      className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-gray-800"
                    />
                  </div>
               </div>

               <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-sm font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all uppercase tracking-widest">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Save size={20} />
                    {editingAsset ? 'Update Registry' : 'Confirm Registration'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
