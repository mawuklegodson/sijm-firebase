import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Smartphone, CheckCircle, ShieldCheck, Loader2, Truck, ChevronRight } from 'lucide-react';
import { Book, Order } from '../types.ts';

declare var PaystackPop: any;

interface CheckoutModalProps {
  book: Book;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
  store: any;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ book, userEmail, onClose, onSuccess, store }) => {
  const [step, setStep] = useState<1 | 2>(book.type === 'physical' || book.type === 'both' ? 1 : 2);
  const [method, setMethod] = useState<'stripe' | 'paystack'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [shipping, setShipping] = useState({
    fullName: store.currentUser?.fullName || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Ghana'
  });

  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_06876a2cd7004fc4caa34867fb904ffd87cbcc13';

  const saveOrderData = async () => {
    const order: Partial<Order> = {
      items: [{ id: book.id, title: book.title, price: book.price || 0, quantity: 1 }],
      total: book.price || 0,
      customerName: shipping.fullName || store.currentUser?.fullName || 'Anonymous',
      customerEmail: userEmail,
      shippingAddress: book.type === 'physical' || book.type === 'both' ? shipping : undefined,
      paymentMethod: method,
      status: 'pending'
    };
    await store.addOrder(order);
  };

  const handlePaystack = () => {
    setIsProcessing(true);
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: userEmail,
      amount: Math.round((book.price || 0) * 100), // Pesewas
      currency: 'GHS',
      ref: `SIJM_${Math.floor(Math.random() * 1000000000 + 1)}`,
      callback: async (response: any) => {
        if (response.status === 'success' || response.message === 'Approved') {
          await saveOrderData();
          setIsProcessing(false);
          onSuccess();
        } else {
          setIsProcessing(false);
          alert('Payment was not completed successfully.');
        }
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
    handler.openIframe();
  };

  const handleStripe = async () => {
    setIsProcessing(true);
    try {
      // Simulate Stripe Success for this demo/environment
      setTimeout(async () => {
        await saveOrderData();
        setIsProcessing(false);
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      setIsProcessing(false);
      alert('Local Dev Mode: Simulation Failed.');
    }
  };

  const handleCheckout = () => {
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
        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step === 1 ? 'bg-indigo-600' : 'bg-emerald-500'} text-white shadow-lg`}>
              {step === 1 ? <Truck size={24} /> : <CheckCircle size={24} />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">
                {step === 1 ? 'Shipping Detail' : 'Checkout'}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                Step {step} of 2 Secure
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-indigo-950 hover:bg-slate-100 transition-all shadow-sm">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto max-h-[60vh] no-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="shipping"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" value={shipping.fullName} onChange={e => setShipping({...shipping, fullName: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        type="tel" value={shipping.phone} onChange={e => setShipping({...shipping, phone: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Address</label>
                    <input 
                      type="text" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})}
                      placeholder="Street name, landmark..."
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                      <input 
                        type="text" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">State / Region</label>
                      <input 
                        type="text" value={shipping.state} onChange={e => setShipping({...shipping, state: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex-wrap sm:flex-nowrap">
                  <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 shadow-xl shadow-indigo-200">
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-indigo-950 text-base truncate">{book.title}</p>
                    <p className="text-[10px] font-black text-indigo-600 bg-white/50 w-fit px-2 py-0.5 rounded-full mt-1 uppercase tracking-widest">
                      {book.type === 'physical' ? 'Physical Copy' : 'eBook + Print'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-2xl text-indigo-900 leading-none">₵{book.price?.toFixed(2)}</p>
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">Total Due</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Payment System</p>
                  
                  <button onClick={() => setMethod('paystack')}
                    className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${method === 'paystack' ? 'border-emerald-500 bg-emerald-50 shadow-xl shadow-emerald-500/5' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method === 'paystack' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Smartphone size={24} />
                      </div>
                      <div className="text-left">
                        <p className={`font-black text-sm uppercase tracking-widest ${method === 'paystack' ? 'text-emerald-900' : 'text-slate-600'}`}>Mobile Money</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Paystack • GHS Curreny</p>
                      </div>
                    </div>
                    {method === 'paystack' && <CheckCircle className="text-emerald-500" />}
                  </button>

                  <button onClick={() => setMethod('stripe')}
                    className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${method === 'stripe' ? 'border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-600/5' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method === 'stripe' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <CreditCard size={24} />
                      </div>
                      <div className="text-left">
                        <p className={`font-black text-sm uppercase tracking-widest ${method === 'stripe' ? 'text-indigo-900' : 'text-slate-600'}`}>Card Payment</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Stripe • USD / Multi</p>
                      </div>
                    </div>
                    {method === 'stripe' && <CheckCircle className="text-indigo-600" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white">
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!shipping.address || !shipping.phone || !shipping.fullName}
              className="w-full py-5 bg-indigo-950 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(30,27,75,0.2)] hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              Continue to Payment <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full py-5 bg-indigo-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(30,27,75,0.2)] hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin" size={20} /> Securing Fund...</>
              ) : (
                `Complete GHS ${book.price?.toFixed(2)} Purchase`
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
