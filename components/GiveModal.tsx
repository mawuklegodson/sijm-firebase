import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Smartphone, CheckCircle, ShieldCheck, Loader2, Heart, Star, Globe, Zap } from 'lucide-react';
import { Donation } from '../types.ts';

declare var PaystackPop: any;

interface GiveModalProps {
  initialCategory?: string;
  userEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
  store: any;
}

const CATEGORIES = [
  { id: 'offering', name: 'Tithes & Offerings', icon: Star, color: 'amber' },
  { id: 'missions', name: 'Missions & Outreach', icon: Globe, color: 'indigo' },
  { id: 'building', name: 'Building Project', icon: Zap, color: 'emerald' },
];

const PRESETS = [50, 100, 200, 500, 1000];

const GiveModal: React.FC<GiveModalProps> = ({ initialCategory, userEmail, onClose, onSuccess, store }) => {
  const [amount, setAmount] = useState<string>('100');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || CATEGORIES[0].name);
  const [method, setMethod] = useState<'stripe' | 'paystack'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState(userEmail || '');
  const [donorName, setDonorName] = useState(store.currentUser?.fullName || '');

  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_06876a2cd7004fc4caa34867fb904ffd87cbcc13';

  const handlePaystack = () => {
    if (!email) {
      alert('Please enter your email address to continue.');
      return;
    }
    setIsProcessing(true);
    const tempRef = `DON_${Math.floor(Math.random() * 1000000000 + 1)}`;
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: Math.round(parseFloat(amount) * 100), // Pesewas
      currency: 'GHS',
      ref: tempRef,
      metadata: {
        type: 'donation',
        category: selectedCategory,
        donorName: donorName || 'Anonymous',
        custom_fields: [
          {
            display_name: "Category",
            variable_name: "category",
            value: selectedCategory
          }
        ]
      },
      callback: async (response: any) => {
        setIsProcessing(false);
        // Do NOT call saveDonationData here. Webhook handles it.
        onSuccess();
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
    handler.openIframe();
  };

  const handleStripe = async () => {
    if (!email) {
      alert('Please enter your email address to continue.');
      return;
    }
    setIsProcessing(true);
    try {
      // Simulate Stripe Success
      setTimeout(async () => {
        const donation: Partial<Donation> = {
          donorName: donorName || 'Anonymous',
          donorEmail: email,
          amount: parseFloat(amount),
          category: selectedCategory,
          paymentMethod: method,
          userId: store.currentUser?.id
        };
        await store.addDonation(donation);
        setIsProcessing(false);
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Stripe Error:', error);
      setIsProcessing(false);
      alert('Local Dev Mode: Simulation Failed.');
    }
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (method === 'paystack') {
      handlePaystack();
    } else {
      handleStripe();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xl" onClick={!isProcessing ? onClose : undefined} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Heart size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter leading-tight">Partner Globally</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                Secure Giving Interface
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-indigo-950 hover:bg-slate-100 transition-all shadow-sm">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Your Name</p>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Full Name"
                />
             </div>
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Information</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="your@email.com"
                />
             </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Purpose</p>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-slate-50 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isSelected ? 'text-indigo-900' : 'text-slate-400'}`}>
                      {cat.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Donation Amount (GHS)</p>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-950">₵</div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-3xl font-black text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p.toString())}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    amount === p.toString()
                      ? 'bg-indigo-950 text-white shadow-lg'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-200'
                  }`}
                >
                  ₵{p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Payment Method</p>
            <div className="space-y-3">
              <button
                onClick={() => setMethod('paystack')}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                  method === 'paystack' 
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10' 
                    : 'border-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'paystack' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Smartphone size={24} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm uppercase tracking-wider ${method === 'paystack' ? 'text-emerald-700' : 'text-slate-600'}`}>Mobile Money</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Paystack • GHS Transaction</p>
                  </div>
                </div>
                {method === 'paystack' && <CheckCircle className="text-emerald-500" />}
              </button>

              <button
                onClick={() => setMethod('stripe')}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                  method === 'stripe' 
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-600/10' 
                    : 'border-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'stripe' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <CreditCard size={24} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm uppercase tracking-wider ${method === 'stripe' ? 'text-indigo-900' : 'text-slate-600'}`}>Credit Card</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Stripe • Global Support</p>
                  </div>
                </div>
                {method === 'stripe' && <CheckCircle className="text-indigo-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-8 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={handleProceed}
            disabled={isProcessing}
            className="w-full py-5 bg-indigo-950 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-950/20 hover:bg-amber-400 hover:text-indigo-950 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <><Loader2 className="animate-spin" size={20} /> Processing Giving...</>
            ) : (
              `Partner with ₵${amount} Now`
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default GiveModal;
