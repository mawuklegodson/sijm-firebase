import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, Plus, Trash2, Save, ShoppingBag, 
  Settings, Layers, AlertTriangle 
} from 'lucide-react';
import { BookstoreConfig } from '../types.ts';

interface BookstoreEditorProps {
  store: any;
}

const BookstoreEditor: React.FC<BookstoreEditorProps> = ({ store }) => {
  const { bookstoreConfig, updateBookstoreConfig } = store;
  const [config, setConfig] = useState<BookstoreConfig>(bookstoreConfig || {
    id: 'main',
    isComingSoon: false,
    categories: ['All', 'Prophetic', 'Spiritual Warfare', 'Devotional'],
    updatedAt: new Date().toISOString()
  });
  const [newCat, setNewCat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBookstoreConfig({ ...config, updatedAt: new Date().toISOString() });
      alert('Bookstore settings saved successfully!');
    } catch (e) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCat.trim()) return;
    if (config.categories.includes(newCat.trim())) return;
    setConfig({ ...config, categories: [...config.categories, newCat.trim()] });
    setNewCat('');
  };

  const removeCategory = (cat: string) => {
    if (cat === 'All') return; // Protect default
    setConfig({ ...config, categories: config.categories.filter(c => c !== cat) });
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-2">
              <ShoppingBag className="text-indigo-600" size={20} /> Store Availability
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Control visibility and access to the bookstore</p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/20 space-y-6">
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.isComingSoon ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Settings size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Global Coming Soon Mode</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Disables store access with a countdown</p>
                </div>
              </div>
              
              <button 
                onClick={() => setConfig({ ...config, isComingSoon: !config.isComingSoon })}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${config.isComingSoon ? 'bg-amber-400' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 ${config.isComingSoon ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {config.isComingSoon && (
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold tracking-tight">
                  The entire bookstore is currently hidden with a "Coming Soon" splash. Customers cannot view or purchase books until this is disabled.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter flex items-center gap-2">
              <Layers className="text-indigo-600" size={20} /> Taxonomy & Categories
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Organize your publications for better browsing</p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/20 space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                placeholder="New Category Name..."
                className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium transition-all"
              />
              <button 
                onClick={addCategory}
                className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {config.categories.map((cat) => (
                <div 
                  key={cat}
                  className="group flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl transition-all"
                >
                  <span className="text-[11px] font-black text-indigo-950 uppercase tracking-widest">{cat}</span>
                  {cat !== 'All' && (
                    <button 
                      onClick={() => removeCategory(cat)}
                      className="text-indigo-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-12 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-12 py-5 bg-indigo-950 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-black transition-all shadow-[0_20px_50px_rgba(30,27,75,0.3)] disabled:opacity-50"
        >
          {isSaving ? 'Processing...' : <><Save size={20} /> Deploy Configuration</>}
        </button>
      </div>
    </div>
  );
};

export default BookstoreEditor;
