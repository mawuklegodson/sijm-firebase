import { 
  DollarSign, TrendingUp, ShoppingBag, Truck, CheckCircle2, 
  Clock, Filter, Search, ChevronRight, FileText, ArrowUpRight,
  Target, Users, Calendar, Download, RefreshCcw, Heart 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Order, Donation, BookstoreConfig } from '../types.ts';

interface FinancialDashboardProps {
  store: any;
  currentUser: any;
  onLogout: () => void;
  navigate: (page: string) => void;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ store, currentUser, onLogout, navigate }) => {
  const { orders = [], donations = [], updateOrderStatus } = store;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'donations'>('overview');

  // Stats Calculations
  const totalGiving = useMemo(() => (donations || []).reduce((sum, d) => sum + (d?.amount || 0), 0), [donations]);
  const totalSales = useMemo(() => (orders || []).reduce((sum, o) => sum + (o?.total || 0), 0), [orders]);
  const pendingOrders = useMemo(() => (orders || []).filter(o => o?.status === 'pending'), [orders]);
  
  // Charts Data (Mocking last 7 days for trend)
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      giving: Math.floor(Math.random() * 5000) + 1000,
      sales: Math.floor(Math.random() * 2000) + 500
    }));
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (o.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }: { status: Order['status'] }) => {
    const config = {
      pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
      processing: { color: 'bg-indigo-100 text-indigo-700', icon: RefreshCcw },
      shipped: { color: 'bg-emerald-100 text-emerald-700', icon: Truck },
      delivered: { color: 'bg-emerald-600 text-white', icon: CheckCircle2 }
    };
    const { color, icon: Icon } = config[status];
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${color}`}>
        <Icon size={12} /> {status}
      </span>
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter flex items-center gap-3">
                <Target className="text-indigo-600" /> Financial Intelligence
              </h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Real-time tracking of Ministry Giving & Bookstore Logistics
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                <Download size={16} /> Export CSV
              </button>
              <div className="h-8 w-[1px] bg-gray-200 mx-2" />
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-indigo-950 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-indigo-950 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Bookstore Orders
              </button>
              <button 
                onClick={() => setActiveTab('donations')}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'donations' ? 'bg-indigo-950 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                General Giving
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Giving', val: `₵${totalGiving.toLocaleString()}`, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+12%' },
                    { label: 'Bookstore Sales', val: `₵${totalSales.toLocaleString()}`, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+8%' },
                    { label: 'Pending Shipments', val: pendingOrders.length, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'High Priority' },
                    { label: 'Lifetime Donors', val: '1.2k', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Growing' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-100/10 flex flex-col justify-between group hover:-translate-y-1 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                          <stat.icon size={24} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {stat.trend} <ArrowUpRight size={10} className="inline ml-1" />
                        </span>
                      </div>
                      <div className="mt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-indigo-950 tracking-tighter">{stat.val}</h3>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-indigo-100/10 space-y-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tighter">Revenue Trajectory</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Comparison: Ministry Giving vs. Bookstore Sales</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-600" />
                          <span className="text-[9px] font-black uppercase text-gray-500">Giving</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-400" />
                          <span className="text-[9px] font-black uppercase text-gray-500">Sales</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorGiving" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="giving" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorGiving)" />
                          <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-indigo-100/10 space-y-8">
                    <div>
                      <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tighter">Inventory Health</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status of current bookstore orders</p>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={[
                               { name: 'Pending', value: pendingOrders.length },
                               { name: 'Processing', value: orders.filter(o => o.status === 'processing').length },
                               { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
                               { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length }
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={80}
                             outerRadius={110}
                             paddingAngle={8}
                             dataKey="value"
                           >
                             {COLORS.map((color, index) => (
                               <Cell key={`cell-${index}`} fill={color} />
                             ))}
                           </Pie>
                           <Tooltip />
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                       {[
                         { name: 'Pending', val: pendingOrders.length, color: 'bg-indigo-600' },
                         { name: 'Shipped', val: orders.filter(o => o.status === 'shipped').length, color: 'bg-emerald-400' },
                         { name: 'In Transit', val: orders.filter(o => o.status === 'processing').length, color: 'bg-amber-400' }
                       ].map(item => (
                         <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${item.color}`} />
                              <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">{item.name}</span>
                            </div>
                            <span className="text-xs font-black text-indigo-950">{item.val}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search by customer name, email or order ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['all', 'pending', 'processing', 'shipped', 'delivered'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setFilterStatus(s as any)}
                        className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-indigo-100/10 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-24 text-center">
                            <div className="space-y-4">
                              <ShoppingBag size={48} className="mx-auto text-gray-200" />
                              <p className="text-sm font-bold text-gray-400 italic">No orders found matching your criteria</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                                  #{order.id.slice(-4).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-indigo-950 uppercase tracking-tight">{order.items[0]?.title || 'Multi-Item Order'}</p>
                                  <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-xs font-black text-indigo-950 uppercase tracking-widest">{order.customerName}</p>
                              <p className="text-[10px] font-medium text-gray-400 mt-1">{order.customerEmail}</p>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                                {order.paymentMethod}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-black text-indigo-950">₵{order.total.toLocaleString()}</p>
                            </td>
                            <td className="px-8 py-6">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <select 
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                  className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-600 transition-all cursor-pointer"
                                >
                                  <option value="pending">Mark Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Set Shipped</option>
                                  <option value="delivered">Delivered</option>
                                </select>
                                <button className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                  <FileText size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'donations' && (
              <motion.div 
                key="donations"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {/* Donation specific view */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-6">
                    <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white space-y-6">
                       <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Revenue Target</p>
                       <div className="space-y-2">
                         <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-black">₵{(totalGiving + totalSales / 1000).toFixed(1)}k</h3>
                            <span className="text-sm font-bold opacity-60">of 100k goal</span>
                         </div>
                         <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-400 rounded-full" style={{ width: '45%' }} />
                         </div>
                       </div>
                       <p className="text-xs font-medium opacity-60 leading-relaxed italic">"Honor the Lord with your wealth, with the firstfruits of all your crops." — Proverbs 3:9</p>
                    </div>
                    
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Giving by Category</h4>
                       <div className="space-y-4">
                         {['Tithe', 'Mission Seed', 'Building Fund', 'General'].map(cat => (
                           <div key={cat} className="space-y-2">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                               <span className="text-gray-400">{cat}</span>
                               <span className="text-indigo-950">₵{Math.floor(Math.random() * 20000).toLocaleString()}</span>
                             </div>
                             <div className="h-1.5 w-full bg-gray-50 rounded-full">
                               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-white rounded-[3.5rem] border border-gray-100 shadow-xl shadow-indigo-100/10 overflow-hidden">
                     <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tighter">Recent Contributions</h3>
                        <Calendar className="text-indigo-600" size={20} />
                     </div>
                     <div className="p-4">
                        {donations.length === 0 ? (
                          <div className="py-24 text-center">
                             <DollarSign size={48} className="mx-auto text-gray-100" />
                             <p className="text-sm font-bold text-gray-400 mt-4 italic">No donations recorded yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                             {donations.map(d => (
                               <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-3xl transition-all group">
                                  <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-emerald-500 font-black shadow-sm group-hover:scale-110 transition-all">
                                    <ArrowUpRight size={20} />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-black text-indigo-950 uppercase tracking-widest">{d.donorName}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1">{d.category} · {new Date(d.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-base font-black text-emerald-600">₵{d.amount.toLocaleString()}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{d.paymentMethod}</p>
                                  </div>
                                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-indigo-600 hover:text-white">
                                    <ChevronRight size={16} />
                                  </div>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  );
};

export default FinancialDashboard;
