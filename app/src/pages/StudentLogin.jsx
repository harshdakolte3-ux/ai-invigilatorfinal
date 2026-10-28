import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import MoltenMetal from '../components/MoltenMetal';

const StudentLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registeredMessage = location.state?.registered
    ? 'Registration successful! Please sign in with your new account.'
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await studentLogin({ email: email.trim(), password });
      navigate('/student-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const particleContainerRef = useRef(null);

  return (
    <div className="bg-background min-h-screen flex flex-col font-body-md text-on-background relative">
      {/* Embedded Custom CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
            background: rgba(11, 17, 32, 0.78);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(59, 130, 246, 0.22);
            box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .primary-gradient {
            background: linear-gradient(135deg, #004ac6 0%, #712ae2 100%);
        }
        .floating-label-input:focus-within label {
            transform: translateY(-20px) scale(0.85);
            color: #004ac6;
        }
        .input-glow:focus {
            box-shadow: 0 0 0 4px rgba(0, 74, 198, 0.1);
        }
        `
      }} />

      {/* Background Molten Metal */}
      <MoltenMetal
        color1="#020617"
        color2="#1e3a8a"
        color3="#3b82f6"
        speed={0.35}
        scale={4}
        detail={1}
        glow={1.0}
        coreSize={0.03}
        swirl={0.2}
        fold={0}
        blackPoint={0.05}
        brightness={1.3}
        colorMode="molten"
        grain={true}
        grainIntensity={0.05}
        mouseInteraction={true}
        mouseStrength={0.3}
        opacity={1.0}
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      />
      <div ref={particleContainerRef} className="hidden"></div>

      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/75 backdrop-blur-xl border-b border-blue-500/20 shadow-md">
        <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={() => navigate('/')} className="font-headline-md text-headline-md font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 cursor-pointer hover:opacity-80 active:scale-95 transition-all">
              AI-Invigilator
            </button>
            <span className="text-xs uppercase tracking-wider font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
              Student Examination Portal
            </span>
          </div>
          <div className="flex items-center gap-md">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-xs text-slate-300 hover:text-white hover:bg-white/10 px-md py-sm rounded-xl transition-all cursor-pointer active:scale-95 text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center pt-16 relative overflow-hidden z-10">
        {/* Ambient Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
        </div>

        {/* Centered Glassmorphism Card */}
        <div className="relative z-10 w-full max-w-[480px] p-md">
          <div className="glass-card rounded-[32px] p-xl shadow-2xl border border-blue-500/30">
            
            {/* Branding & Identity */}
            <div className="text-center mb-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-md shadow-lg shadow-blue-500/25">
                <span className="material-symbols-outlined !text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-white mb-xs font-bold">Student Sign In</h1>
              <p className="font-body-md text-body-md text-slate-300">Access your scheduled examination sessions</p>
            </div>

            {/* Success Message: Registration */}
            {registeredMessage && (
              <div className="mb-lg p-md bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex gap-md items-start text-emerald-300">
                <span className="material-symbols-outlined text-emerald-400 !text-[20px]">check_circle</span>
                <p className="font-body-md text-body-md">{registeredMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-lg p-md bg-rose-500/15 border border-rose-500/30 rounded-xl flex gap-md items-start text-rose-300">
                <span className="material-symbols-outlined text-rose-400 !text-[20px]">error</span>
                <p className="font-body-md text-body-md">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-lg" onSubmit={handleSubmit}>
              
              {/* Email Field */}
              <div className="relative">
                <label className="block font-label-md text-label-md text-slate-300 mb-xs ml-1" htmlFor="email">Email Address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-400 !text-[20px]">mail</span>
                  <input 
                    className="w-full h-12 pl-12 pr-4 bg-slate-950/70 border border-slate-700/80 rounded-xl font-body-md text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" 
                    id="email" 
                    placeholder="student@university.edu" 
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="flex justify-between items-center mb-xs">
                  <label className="font-label-md text-label-md text-slate-300 ml-1" htmlFor="password">Password</label>
                  <Link className="font-label-md text-label-md text-blue-400 hover:text-blue-300 hover:underline" to="/forgot-password">Forgot Password?</Link>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-400 !text-[20px]">lock</span>
                  <input 
                    className="w-full h-12 pl-12 pr-12 bg-slate-950/70 border border-slate-700/80 rounded-xl font-body-md text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none flex items-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined !text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Primary Login Button */}
              <button 
                className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-title-lg text-title-lg rounded-xl shadow-lg shadow-blue-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-60 cursor-pointer border border-blue-400/30" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In…' : 'Access Exam Portal'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            {/* Registration Anchor */}
            <div className="mt-xl text-center">
              <p className="font-body-md text-body-md text-slate-400">
                First time candidate?{' '}
                <Link className="text-blue-400 font-semibold hover:text-blue-300 hover:underline" to="/register">Register Baseline Account</Link>
              </p>
            </div>
          </div>

          {/* Integrity Badges */}
          <div className="mt-lg flex justify-center gap-lg opacity-40 grayscale">
            <div className="flex items-center gap-xs font-label-md text-[10px] tracking-widest uppercase text-white">
              <span className="material-symbols-outlined !text-[14px]">shield</span>
              AES-256 SECURED
            </div>
            <div className="flex items-center gap-xs font-label-md text-[10px] tracking-widest uppercase text-white">
              <span className="material-symbols-outlined !text-[14px]">auto_awesome</span>
              AI-POWERED
            </div>
          </div>
        </div>
      </main>

      {/* Footer Identity */}
      <footer className="relative w-full py-xl mt-auto border-t border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-dim z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-gutter gap-lg max-w-container-max mx-auto">
          <button type="button" onClick={() => navigate('/')} className="font-title-lg text-title-lg font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity">AI-Invigilator</button>
          <div className="flex flex-wrap justify-center gap-lg">
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#privacy">Privacy Policy</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#terms">Terms of Service</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#security">Security Whitepaper</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#support">Support</a>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">© 2026 AI-Invigilator. Secure. Objective. Sophisticated.</p>
        </div>
      </footer>
    </div>
  );
};

export default StudentLogin;