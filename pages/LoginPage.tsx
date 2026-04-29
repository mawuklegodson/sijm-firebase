import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, User as UserIcon, Eye, EyeOff,
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { isMockMode } from '../lib/firebase.ts';
import { formatImageUrl, DEFAULT_SETTINGS } from '../store.ts';

const LOGO = '/assets/logo.png';

const B = {
  navy:   '#0a1a6b',
  royal:  '#1a3acc',
  purple: '#7c3aed',
  white:  '#ffffff',
  gray:   '#94a3b8',
};

interface Props {
  onLogin: (u: string, p?: string) => Promise<boolean>;
  store: any;
  onBack?: () => void;
}

// ─── Onboarding slides ────────────────────────────────────────
const SLIDES = [
  {
    title: 'Welcome to SIJM',
    body: 'Connecting believers in faith, prayer, and community — wherever you are.',
    bg: `linear-gradient(160deg, ${B.navy} 0%, ${B.royal} 60%, ${B.purple} 100%)`,
  },
  {
    title: 'Ignite Your Spirit Daily',
    body: 'Daily devotionals, sermons, and Faith Digest to spark your walk with God.',
    bg: `linear-gradient(160deg, ${B.purple} 0%, ${B.royal} 100%)`,
  },
  {
    title: 'Worship Without Walls',
    body: 'Check in to services, give, watch live — all in one place.',
    bg: `linear-gradient(160deg, ${B.navy} 0%, #0e7490 100%)`,
  },
];

// ─── Email/Password form ──────────────────────────────────────
const EmailForm: React.FC<{
  store: any;
  onLogin: (u: string, p?: string) => Promise<boolean>;
  onBack: () => void;
}> = ({ store, onLogin, onBack }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [resetSent,setResetSent]= useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'reset') {
        const ok = await store.sendPasswordReset?.(email);
        if (ok) setResetSent(true); else setError('Could not send reset email. Check the address.');
      } else if (mode === 'signup') {
        const ok = await store.signUp?.(email, password, name);
        if (!ok) setError('Sign up failed. Email may already be in use.');
      } else {
        const ok = await onLogin(email, password);
        if (!ok) setError('Invalid credentials. Please try again.');
      }
    } catch { setError('An unexpected error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  if (resetSent) return (
    <div className="p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
           style={{ background: '#dcfce7' }}>
        <CheckCircle2 size={28} style={{ color: '#15803d' }} />
      </div>
      <h3 className="font-black text-[18px]" style={{ color: '#0f172a' }}>Check your email</h3>
      <p className="text-[13px] text-slate-500">We sent a password reset link to <b>{email}</b></p>
      <button onClick={onBack}
        className="w-full py-3.5 rounded-2xl font-black text-[13px] text-white"
        style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
        Back to Sign In
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} className="p-6 pt-4 space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: '#f1f5f9' }}>
          <ArrowLeft size={15} style={{ color: '#64748b' }} />
        </button>
        <div>
          <h3 className="font-black text-[16px]" style={{ color: '#0f172a' }}>
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h3>
          <p className="text-[10px]" style={{ color: '#94a3b8' }}>
            {mode === 'login' ? 'Enter your credentials' : mode === 'signup' ? 'Fill in your details' : 'We\'ll email you a link'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl"
             style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <p className="text-[11px] text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Full Name</label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
               style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
            <UserIcon size={14} style={{ color: B.gray }} />
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name" required
              className="flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:text-slate-300"
              style={{ color: '#0f172a' }} />
          </div>
        </div>
      )}

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Email Address</label>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
             style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
          <Mail size={14} style={{ color: B.gray }} />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required
            className="flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:text-slate-300"
            style={{ color: '#0f172a' }} />
        </div>
      </div>

      {mode !== 'reset' && (
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Password</label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
               style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
            <input type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password" required
              className="flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:text-slate-300"
              style={{ color: '#0f172a' }} />
            <button type="button" onClick={() => setShowPw(p => !p)}>
              {showPw ? <EyeOff size={14} style={{ color: B.gray }} /> : <Eye size={14} style={{ color: B.gray }} />}
            </button>
          </div>
          {mode === 'login' && (
            <button type="button" onClick={() => setMode('reset')}
              className="text-[10px] font-bold mt-1 float-right"
              style={{ color: B.royal }}>
              Forgot password?
            </button>
          )}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-black text-[14px] flex items-center justify-center gap-2 mt-2"
        style={{ background: loading ? '#94a3b8' : `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
        {loading ? <><Loader2 size={16} className="animate-spin" /> Working…</> :
          mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
      </button>

      <p className="text-center text-[11px]" style={{ color: '#94a3b8' }}>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="font-black" style={{ color: B.royal }}>
          {mode === 'login' ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </form>
  );
};

// ─── Phone form ───────────────────────────────────────────────
const PhoneForm: React.FC<{ store: any; onBack: () => void }> = ({ store, onBack }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="p-6 pt-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: '#f1f5f9' }}>
          <ArrowLeft size={15} style={{ color: '#64748b' }} />
        </button>
        <div>
          <h3 className="font-black text-[16px]" style={{ color: '#0f172a' }}>Phone Sign In</h3>
          <p className="text-[10px]" style={{ color: '#94a3b8' }}>
            {step === 'phone' ? 'Enter your phone number' : 'Enter the OTP sent to your phone'}
          </p>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <p className="text-[11px] text-red-600 font-semibold">{error}</p>
        </div>
      )}
      {step === 'phone' ? (
        <>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
               style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
            <Phone size={14} style={{ color: B.gray }} />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+233 800 000 000"
              className="flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:text-slate-300"
              style={{ color: '#0f172a' }} />
          </div>
          <button onClick={() => setStep('otp')} disabled={!phone}
            className="w-full py-4 rounded-2xl text-white font-black text-[14px]"
            style={{ background: `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
            Send OTP
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
               style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP" maxLength={6}
              className="flex-1 bg-transparent outline-none text-[20px] font-black tracking-widest text-center placeholder:text-slate-300"
              style={{ color: '#0f172a' }} />
          </div>
          <button disabled={!otp || loading}
            className="w-full py-4 rounded-2xl text-white font-black text-[14px] flex items-center justify-center gap-2"
            style={{ background: loading ? '#94a3b8' : `linear-gradient(135deg, ${B.royal}, ${B.purple})` }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : 'Verify OTP'}
          </button>
          <button onClick={() => setStep('phone')} className="w-full text-center text-[11px] font-bold"
            style={{ color: B.royal }}>
            ← Change number
          </button>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN LOGIN PAGE
// ═══════════════════════════════════════════════════════════════
const LoginPage: React.FC<Props> = ({ onLogin, store, onBack }) => {
  const branding = store?.settings?.branding || DEFAULT_SETTINGS.branding;
  const general  = store?.settings?.general  || DEFAULT_SETTINGS.general;

  const [slide,  setSlide]  = useState(0);
  const [method, setMethod] = useState<'none' | 'email' | 'phone'>('none');
  const [started, setStarted] = useState(false);

  // Auto-advance slides
  React.useEffect(() => {
    if (method !== 'none') return;
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [method]);

  const currentSlide = SLIDES[slide];
  const logoSrc = branding?.logoUrl ? formatImageUrl(branding.logoUrl) : null;
  const churchName = general?.churchName || 'Salvation In Jesus Ministry';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: currentSlide.bg, transition: 'background 0.8s ease' }}>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10 bg-white" />
      </div>

      {/* Hero area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative z-10">
        {/* Logo */}
        <motion.div key="logo" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center mb-6 overflow-hidden">
          {logoSrc
            ? <img src={logoSrc} alt="Logo" className="w-14 h-14 object-contain" onError={e => { (e.target as HTMLImageElement).src = LOGO; }} />
            : <span style={{ color: B.royal, fontSize: 28, fontWeight: 900 }}>✝</span>
          }
        </motion.div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div key={slide}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}
            className="text-center">
            <h1 className="text-white font-black text-[26px] mb-3 leading-tight">{currentSlide.title}</h1>
            <p className="text-white/70 text-[13px] leading-relaxed max-w-[280px] mx-auto">{currentSlide.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex gap-2 mt-6">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className="transition-all rounded-full"
              style={{
                width: i === slide ? 20 : 8, height: 8,
                background: i === slide ? 'white' : 'rgba(255,255,255,0.35)',
              }} />
          ))}
        </div>
      </div>

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 25 }}
        className="relative z-10 bg-white rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>

        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mt-3 mb-1" />

        <AnimatePresence mode="wait">
          {method === 'none' && (
            <motion.div key="options"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-6 pb-8 pt-3 space-y-3">
              <h2 className="text-[15px] font-black text-center mb-4" style={{ color: '#0f172a' }}>
                Join the Community
              </h2>

              {/* Email sign in */}
              <button onClick={() => setMethod('email')}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all active:scale-[0.98]"
                style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: '#dbeafe' }}>
                  <Mail size={18} style={{ color: B.royal }} />
                </div>
                <div className="text-left">
                  <p className="font-black text-[13px]" style={{ color: '#0f172a' }}>Sign in with Email</p>
                  <p className="text-[10px]" style={{ color: '#94a3b8' }}>Use your email & password</p>
                </div>
              </button>

              {/* Phone sign in */}
              <button onClick={() => setMethod('phone')}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all active:scale-[0.98]"
                style={{ background: '#f8faff', borderColor: '#e2e8f0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: '#dcfce7' }}>
                  <Phone size={18} style={{ color: '#15803d' }} />
                </div>
                <div className="text-left">
                  <p className="font-black text-[13px]" style={{ color: '#0f172a' }}>Sign in with Phone</p>
                  <p className="text-[10px]" style={{ color: '#94a3b8' }}>Get an OTP on your number</p>
                </div>
              </button>

              {/* Visitor */}
              <button onClick={() => onBack?.()}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all active:scale-[0.98]"
                style={{ background: '#f8faff', borderColor: '#ede9fe' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: '#ede9fe' }}>
                  <UserIcon size={18} style={{ color: B.purple }} />
                </div>
                <div className="text-left">
                  <p className="font-black text-[13px]" style={{ color: '#0f172a' }}>Browse as Visitor</p>
                  <p className="text-[10px]" style={{ color: '#94a3b8' }}>Explore without an account</p>
                </div>
              </button>

              <p className="text-center text-[9px] text-slate-300 mt-2">
                By signing in you agree to our Terms of Service & Privacy Policy
              </p>
            </motion.div>
          )}

          {method === 'email' && (
            <motion.div key="email"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}>
              <EmailForm store={store} onLogin={onLogin} onBack={() => setMethod('none')} />
            </motion.div>
          )}

          {method === 'phone' && (
            <motion.div key="phone"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}>
              <PhoneForm store={store} onBack={() => setMethod('none')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;
