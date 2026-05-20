import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';
import { login as loginApi, sendOtp, verifyOtp } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME_ROUTES } from '../../utils/constants';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ── Constants ──────────────────────────────────────────────────────────────────
const PHONE_REGEX   = /^[6-9]\d{9}$/;
const RESEND_DELAY  = 30; // seconds before "Resend OTP" becomes active

// ── Animation Variants ─────────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.3, ease: 'easeIn' } }
};

// ── Component ──────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();

  // 'phone' | 'otp' | 'password'
  const [step, setStep]             = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp]               = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);

  // Resend countdown
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);
  
  const startResendTimer = () => {
    setResendTimer(RESEND_DELAY);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const { isAuthenticated, role, login } = useAuth();
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(ROLE_HOME_ROUTES[role] || '/home', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber) { toast.error('Enter your phone number'); return; }
    if (!PHONE_REGEX.test(phoneNumber)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp({ phoneNumber });
      toast.success('OTP sent! Check your SMS.');
      setStep('otp');
      startResendTimer();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res  = await verifyOtp({ phoneNumber, otp });
      const data = res.data;
      const role = login(data);
      toast.success('Login successful!');
      setTimeout(() => {
        navigate(ROLE_HOME_ROUTES[role] || '/home');
      }, 100);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await sendOtp({ phoneNumber });
      toast.success('New OTP sent!');
      setOtp('');
      startResendTimer();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !password) { toast.error('Please fill all fields'); return; }
    if (!PHONE_REGEX.test(phoneNumber)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      const res  = await loginApi({ phoneNumber, password });
      const data = res.data;
      const role = login(data);
      toast.success('Welcome back!');
      navigate(ROLE_HOME_ROUTES[role] || '/home');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center lg:items-end lg:justify-end lg:pr-24 lg:pb-16 p-4 sm:p-8 bg-gray-950 overflow-hidden">
      
      {/* ─── Full Screen Background ─── */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-[url('/grocery_bg.png')] bg-cover bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
      </motion.div>

      {/* ─── Floating Header / Logo (Top Left Corner) ─── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-8 left-8 sm:top-12 sm:left-12 z-20 flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-[1.25rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
          <Package className="w-9 h-9 text-white animate-pulse" />
        </div>
        <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
          Order<span className="text-[#10B981]">Easy</span>
        </span>
      </motion.div>

      {/* ─── Right Side Floating Dark Glass Card ─── */}
      <div className="w-full max-w-md z-10 relative mt-16 lg:mt-0">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.4 }}
          className="bg-slate-950/45 backdrop-blur-2xl border border-white/10 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Subtle reflection border highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent" />
          
          <AnimatePresence mode="wait">
            {/* ─── STEP: phone ───────────────────────────────────────────────────────────── */}
            {step === 'phone' && (
              <motion.div key="step-phone" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <div className="mb-8 text-center sm:text-left">
                  <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome back</h2>
                  <p className="text-slate-300 font-medium text-sm">Enter your mobile number to sign in.</p>
                </div>

                <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
                  <div className="group">
                    <label htmlFor="phoneNumber" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 group-focus-within:text-[#10B981] transition-colors">Phone number</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="absolute left-11 text-slate-400 font-bold">+91 |</span>
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9876543210"
                        className="w-full bg-slate-900/40 border border-white/10 text-white placeholder-slate-500 rounded-2xl pl-20 pr-4 py-4 text-lg font-bold transition-all duration-300 focus:bg-slate-900/60 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/25 outline-none"
                        maxLength={10}
                        autoComplete="tel"
                        autoFocus
                      />
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-[#10B981] text-white rounded-2xl py-4 font-bold text-lg shadow-lg shadow-[#10B981]/20 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    {loading ? (
                      <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="relative z-10">Send OTP</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setStep('password')}
                    className="text-sm font-bold text-center text-slate-400 hover:text-white transition-colors py-2"
                  >
                    Use password instead
                  </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/10">
                  <p className="text-slate-400 font-medium">
                    New to OrderEasy?{' '}
                    <Link to="/register" className="font-bold text-[#10B981] hover:text-[#34D399] transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#34D399] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">
                      Create an account
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── STEP: otp ─────────────────────────────────────────────────────────────── */}
            {step === 'otp' && (
              <motion.div key="step-otp" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <div className="flex flex-col items-center text-center mb-8">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center mb-6 shadow-xl shadow-[#10B981]/25"
                  >
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Verify it's you</h2>
                  <p className="text-slate-300 font-medium">
                    We've sent a 6-digit code to
                    <br/>
                    <span className="text-white font-bold mt-1 inline-block">+91 {phoneNumber}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
                  <div className="group">
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="w-full bg-slate-900/40 border border-white/10 text-white rounded-2xl px-4 py-4 text-center text-4xl tracking-[0.5em] font-extrabold transition-all duration-300 focus:bg-slate-900/60 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/25 outline-none placeholder:text-slate-600"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={loading || otp.length !== 6} 
                    className="w-full bg-[#10B981] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-white rounded-2xl py-4 font-bold text-lg shadow-lg shadow-[#10B981]/20 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    {loading ? (
                      <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="relative z-10">Confirm OTP</span>
                        <ShieldCheck className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-center justify-between pt-6 mt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setOtp(''); }}
                      className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      ← Change Number
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                      className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${
                        resendTimer > 0
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-[#10B981] hover:text-[#34D399]'
                      }`}
                    >
                      <RotateCcw className={`w-4 h-4 ${resendTimer === 0 && !loading ? 'hover:-rotate-180 transition-transform duration-500' : ''}`} />
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─── STEP: password ─────────────────────────────────────────────── */}
            {step === 'password' && (
              <motion.div key="step-password" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <div className="mb-8 text-center sm:text-left">
                  <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome back</h2>
                  <p className="text-slate-300 font-medium text-sm">Enter your credentials to access your account.</p>
                </div>

                <form onSubmit={handlePasswordLogin} className="flex flex-col gap-5">
                  <div className="group">
                    <label htmlFor="pw-phone" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 group-focus-within:text-[#10B981] transition-colors">Phone number</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        id="pw-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9876543210"
                        className="w-full bg-slate-900/40 border border-white/10 text-white placeholder-slate-500 rounded-2xl pl-12 pr-4 py-4 text-lg font-bold transition-all duration-300 focus:bg-slate-900/60 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/25 outline-none"
                        maxLength={10}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider group-focus-within:text-[#10B981] transition-colors">Password</label>
                      <a href="#" className="text-sm font-bold text-[#10B981] hover:text-[#34D399] transition-colors">Forgot?</a>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-400 group-focus-within:text-[#10B981] transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900/40 border border-white/10 text-white placeholder-slate-500 rounded-2xl pl-12 pr-12 py-4 text-lg font-bold transition-all duration-300 focus:bg-slate-900/60 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/25 outline-none"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={loading} 
                    className="w-full mt-2 bg-[#10B981] text-white rounded-2xl py-4 font-bold text-lg shadow-lg shadow-[#10B981]/20 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    {loading ? (
                      <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="relative z-10">Sign In</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setPassword(''); }}
                    className="text-sm font-bold text-center text-slate-400 hover:text-white transition-colors py-2 mt-4 flex items-center justify-center gap-1"
                  >
                    ← Login via OTP instead
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Global CSS for custom animations like shimmer */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </div>
  );
};

export default LoginPage;
