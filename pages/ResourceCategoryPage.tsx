import React from 'react';
import { useCMSStore } from '../store';
import { 
  Book, 
  Coffee, 
  Heart, 
  Moon, 
  Search, 
  Download, 
  Play, 
  ChevronLeft,
  Clock,
  Calendar,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ResourceCategoryPageProps {
  category: 'Bible Studies' | 'Morning Devotion' | 'Prayer Guides' | 'Evening Reflection' | 'Explore Devotionals';
  onBack: () => void;
}

const ResourceCategoryPage: React.FC<ResourceCategoryPageProps> = ({ category, onBack }) => {
  const { resources, incrementDownloadCount } = useCMSStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredResources = resources.filter(res => {
    const matchesCategory = res.category === category || (res.tags && res.tags.includes(category));
    const matchesSearch = (res.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (res.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = () => {
    switch (category) {
      case 'Bible Studies': return Book;
      case 'Morning Devotion': return Coffee;
      case 'Prayer Guides': return Heart;
      case 'Evening Reflection': return Moon;
      default: return Book;
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'Bible Studies': return 'indigo';
      case 'Morning Devotion': return 'amber';
      case 'Prayer Guides': return 'rose';
      case 'Evening Reflection': return 'purple';
      default: return 'indigo';
    }
  };

  const Icon = getCategoryIcon();
  const color = getCategoryColor();

  const getDriveDirectLink = (url: string, type: 'view' | 'download' = 'view') => {
    if (!url) return '';
    const idMatch = url.match(/[-\w]{25,}/);
    if (!idMatch) return url;
    const id = idMatch[0];
    return type === 'view' 
      ? `https://drive.google.com/file/d/${id}/view`
      : `https://drive.google.com/uc?export=download&id=${id}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 bg-${color}-50 text-${color}-600 rounded-lg`}>
                  <Icon size={16} />
                </div>
                <span className={`text-${color}-600 text-[10px] font-black uppercase tracking-widest`}>Spiritual Growth</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{category}</h1>
            </div>
          </div>

          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={res.id}
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className={`px-4 py-1.5 bg-${color}-50 text-${color}-600 rounded-full text-[10px] font-black uppercase tracking-wider`}>
                    {res.category}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                    <Clock size={12} />
                    {new Date(res.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {res.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                  {res.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {res.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold border border-slate-100">
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      incrementDownloadCount?.(res.id);
                      window.open(getDriveDirectLink(res.fileUrl, 'download'), '_blank');
                    }}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                  >
                    <Download size={18} />
                    Download
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(getDriveDirectLink(res.fileUrl, 'view'), '_blank')}
                    className="px-4 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all"
                  >
                    <Play size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon size={40} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No resources found</h3>
            <p className="text-slate-400 mt-2 max-w-sm mx-auto">
              We haven't uploaded any content for this category yet. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCategoryPage;
