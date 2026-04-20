import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';
import { login as loginApi, sendOtp, verifyOtp } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME_ROUTES } from '../../utils/constants';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

// ── Constants ──────────────────────────────────────────────────────────────────
const PHONE_REGEX   = /^[6-9]\d{9}$/;
const RESEND_DELAY  = 30; // seconds before "Resend OTP" becomes active

// ── Component ──────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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

  // Start countdown after OTP is sent
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

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────────
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

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res  = await verifyOtp({ phoneNumber, otp });
      const data = res.data;               // { token, role }
      const role = login(data);
      toast.success('Login successful!');
      navigate(ROLE_HOME_ROUTES[role] || '/home');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ──────────────────────────────────────────────────────────────
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

  // ─── Password Login (fallback) ───────────────────────────────────────────────
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

  // ─── Shared left panel ───────────────────────────────────────────────────────
  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-green-gradient-dark relative overflow-hidden flex-col justify-center items-center p-12 text-white">
      <div className="absolute inset-0 opacity-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white"
            style={{
              width:  `${150 + i * 80}px`,
              height: `${150 + i * 80}px`,
              top:    `${-20 + i * 30}px`,
              left:   `${-40 + i * 20}px`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 mx-auto">
          <Package className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4">OrderEasy</h1>
        <p className="text-white/80 text-lg leading-relaxed max-w-xs">
          Lightning-fast grocery delivery right to your doorstep.
        </p>
        <div className="mt-10 flex flex-col gap-4">
          {['Fresh products daily', '10-minute delivery', '1000+ products'].map((f) => (
            <div key={f} className="flex items-center gap-3 text-white/90">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── STEP: phone ─────────────────────────────────────────────────────────────
  if (step === 'phone') return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-gradient flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Order<span className="text-brand-green">Easy</span>
            </span>
          </div>

          <div className="card p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-8">Enter your phone number to receive an OTP</p>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    className="form-input pl-10"
                    maxLength={10}
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">10-digit Indian mobile number</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Send OTP <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('password')}
                className="text-sm text-center text-gray-500 hover:text-brand-green transition-colors"
              >
                Use password instead
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-green hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── STEP: otp ───────────────────────────────────────────────────────────────
  if (step === 'otp') return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-gradient flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Order<span className="text-brand-green">Easy</span>
            </span>
          </div>

          <div className="card p-8 animate-slide-up">
            {/* OTP icon */}
            <div className="w-14 h-14 rounded-2xl bg-green-gradient flex items-center justify-center mb-5">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Enter OTP</h2>
            <p className="text-gray-500 text-sm mb-1">
              A 6-digit code was sent to
            </p>
            <p className="text-brand-green font-semibold text-sm mb-8">+91 {phoneNumber}</p>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="form-group">
                <label htmlFor="otp" className="form-label">One-time password</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="form-input text-center text-2xl tracking-[0.5em] font-bold"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify OTP <ShieldCheck className="w-4 h-4" /></>
                )}
              </button>

              {/* Resend OTP */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Change number
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className={`flex items-center gap-1 font-medium transition-colors ${
                    resendTimer > 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-brand-green hover:underline'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── STEP: password (fallback) ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-gradient flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Order<span className="text-brand-green">Easy</span>
            </span>
          </div>

          <div className="card p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in with password</h2>
            <p className="text-gray-500 text-sm mb-8">Enter your phone number and password</p>

            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-5">
              {/* Phone */}
              <div className="form-group">
                <label htmlFor="pw-phone" className="form-label">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="pw-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9876543210"
                    className="form-input pl-10"
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setPassword(''); }}
                className="text-sm text-center text-gray-500 hover:text-brand-green transition-colors"
              >
                ← Use OTP instead
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-green hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
