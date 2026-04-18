
import React, { useState } from 'react';
import { ShieldAlert, MessageCircle, Sparkles, Database, Wifi, User as UserIcon, ShieldCheck, ArrowLeft, Mail, Chrome, Apple } from 'lucide-react';
import { isMockMode } from '../lib/firebase.ts';
import { formatImageUrl, DEFAULT_SETTINGS } from '../store.ts';
import { IdentityRole } from '../types.ts';
const logoImg = '/assets/logo.png';

interface Props {
  onLogin: (username: string, password?: string) => Promise<boolean>;
  store: any;
  onBack?: () => void;
}

const LoginPage: React.FC<Props> = ({ onLogin, store, onBack }) => {
  const settings = store.settings || DEFAULT_SETTINGS;
  const ui = settings.uiText;
  const branding = settings.branding;
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (showReset) {
        const success = await store.sendPasswordReset(resetEmail);
        if (success) {
          setResetSent(true);
        } else {
          setError('Failed to send reset email. Please check the address.');
        }
      } else if (isSignUp) {
        const success = await store.signUp(username, password, fullName);
        if (!success) {
          setError('Sign up failed. Email might already be in use.');
        }
      } else {
        const success = await onLogin(username, password);
        if (!success) {
          setError('Invalid credentials. Please check and try again.');
        }
      }
    } catch (err) {
      setError('An unexpected authentication error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const success = await store.signInWithGoogle();
      if (!success) {
        setError('Google Sign-In failed.');
      }
    } catch (err) {
      setError('Google Sign-In error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logoSrc = formatImageUrl(branding.logoUrl);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 transition-all duration-1000"
      style={{ 
        background: `radial-gradient(circle at top left, ${branding.primaryColor || '#002366'}, #020617)`,
      }}
    >
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row">
          
          {/* Left Side - Visual */}
          <div className="hidden md:flex md:w-2/5 bg-slate-900 p-10 flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <button 
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-12 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </button>
              {branding.logoUrl ? (
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden">
                  <img 
                    src={logoSrc} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== logoImg) {
                        target.src = logoImg;
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl border border-white/10"
                  style={{ 
                    background: `linear-gradient(135deg, ${branding.secondaryColor || '#D4AF37'}, #B8860B)`,
                  }}
                >
                  {(settings.general.churchName || 'S').charAt(0)}
                </div>
              )}
              <h2 className="text-white text-2xl font-bold mt-8 font-poppins leading-tight">
                {settings.general.churchName || 'Salvation In Jesus Ministry'}
              </h2>
              <p className="text-slate-400 text-sm mt-2 font-medium italic">
                {settings.general.tagline || 'Spreading the Light'}
              </p>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <ShieldCheck size={16} className="text-emerald-500" />
                Secure Portal
              </div>
            </div>

            {/* Abstract Background for Left Side */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mb-32 -mr-32" />
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 p-8 lg:p-12 relative">
            {onBack && (
              <button 
                onClick={onBack}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="text-center md:text-left mb-8">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-poppins">
                {showReset ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                {showReset ? 'We will send you a link to reset your password' : isSignUp ? 'Join the ministry community' : 'Access your dashboard and ministry materials'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-xs font-bold rounded-xl animate-in shake">
                  {error}
                </div>
              )}

              {resetSent && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-700 text-xs font-bold rounded-xl">
                  Password reset link sent to your email.
                </div>
              )}
              
              {showReset ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="e.g. user@ministry.org"
                    required
                  />
                </div>
              ) : (
                <>
                  {isSignUp && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                      placeholder="e.g. admin@ministry.org"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <button 
                        type="button"
                        onClick={() => setShowReset(true)}
                        className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-base hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {showReset ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
                    <Sparkles size={18} className="text-amber-400" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              {showReset ? (
                <button 
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Back to Sign In
                </button>
              ) : (
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              )}
            </div>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/95 px-4">Or continue with</div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Chrome size={16} className="text-rose-500" /> Google
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                {isMockMode ? (
                  <>
                    <Database size={10} className="text-amber-500" />
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Demo Sandbox</span>
                  </>
                ) : (
                  <>
                    <Wifi size={10} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Ministry Cloud</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Portal v4.2</p>
          <p className="text-white/30 text-[10px] font-medium">
            {ui.login_footer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
