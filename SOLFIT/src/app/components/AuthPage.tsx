import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Zap, Trophy, TrendingUp, Shield, ArrowRight, Cpu, Users, Star } from 'lucide-react';
import LoadingScreen from './LoadingScreen';

const FEATURES = [
  { icon: Trophy, title: 'Compete for SOL', desc: 'Winner-takes-all prize pools funded by entry fees.' },
  { icon: Cpu, title: 'AI Rep Tracking', desc: 'Every rep verified and recorded in real-time.' },
  { icon: TrendingUp, title: 'Live Leaderboard', desc: 'Watch rankings shift as the clock counts down.' },
  { icon: Users, title: 'Squad System', desc: 'Create or join squads with a 6-digit invite code.' },
  { icon: Shield, title: 'Secured by Auth0', desc: 'Enterprise-grade auth with brute-force protection.' },
];

const STATS = [
  { value: '10K+', label: 'Active Players' },
  { value: '◎ 48K', label: 'SOL Distributed' },
  { value: '99.9%', label: 'Uptime' },
];

export default function AuthPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return <LoadingScreen message="Checking session..." />;

  const handleLogin = () => loginWithRedirect({ authorizationParams: { screen_hint: 'login' } });
  const handleSignup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] flex overflow-hidden">

      {/* ── Left panel: Branding (desktop only) ─────────── */}
      <div className="hidden md:flex flex-col flex-1 relative p-12 xl:p-16 overflow-hidden">

        {/* Background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#b794f6]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#8b5cf6]/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Grid overlay texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#b794f6 1px, transparent 1px), linear-gradient(90deg, #b794f6 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-auto relative z-10"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b794f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_8px_30px_rgba(183,148,246,0.4)]">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-black italic text-white uppercase tracking-tighter">SOLFIT</span>
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 my-12"
        >
          <p className="text-[11px] font-black text-[#b794f6] uppercase tracking-[0.4em] mb-4">
            Compete · Sweat · Earn
          </p>
          <h1 className="text-5xl xl:text-6xl font-black italic text-white tracking-tighter uppercase leading-[0.9] mb-6">
            Turn Your<br />
            Reps Into<br />
            <span className="text-[#b794f6]">Rewards</span>
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-[400px]">
            Join squads, set challenges, and compete for real Solana prizes —
            all tracked live with AI precision.
          </p>
        </motion.div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 relative z-10 mb-12"
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-[#b794f6]/10 border border-[#b794f6]/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#b794f6]" />
              </div>
              <div>
                <span className="text-[11px] font-black text-white uppercase tracking-tight">{title}</span>
                <span className="text-[10px] text-white/30 ml-2">{desc}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Social proof stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-8 relative z-10"
        >
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-xl font-black text-white italic">{value}</div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right panel: Auth actions ────────────────────── */}
      <div className="w-full md:w-[420px] lg:w-[480px] xl:w-[520px] shrink-0 flex flex-col justify-center relative border-l border-white/5 overflow-y-auto">

        {/* Subtle right-side glow */}
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-[#b794f6]/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="px-8 md:px-12 xl:px-16 py-12 relative z-10">

          {/* Mobile-only wordmark */}
          <div className="flex flex-col items-center mb-10 md:hidden">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[#b794f6]/30 rounded-3xl blur-2xl scale-110" />
              <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-[#b794f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_20px_50px_rgba(183,148,246,0.4)]">
                <Zap className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase">SOLFIT</h1>
            <p className="text-[10px] font-black text-[#b794f6] uppercase tracking-[0.4em] mt-1">Compete · Sweat · Earn</p>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter uppercase leading-tight mb-2">
              Enter the Arena
            </h2>
            <p className="text-white/40 text-sm">
              Create an account or sign in to start competing.
            </p>
          </motion.div>

          {/* Auth buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 mb-8"
          >
            <button
              onClick={handleSignup}
              className="w-full group relative bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 px-6 font-black text-lg text-white uppercase italic tracking-tighter shadow-[0_10px_40px_rgba(183,148,246,0.4)] active:scale-[0.98] transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              <div className="relative flex items-center justify-center gap-3">
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={handleLogin}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 font-black text-lg text-white/70 uppercase italic tracking-tighter hover:bg-white/10 hover:border-[#b794f6]/30 hover:text-white active:scale-[0.98] transition-all"
            >
              Log In
            </button>
          </motion.div>

          {/* Divider with stars */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <Star key={i} className="w-2.5 h-2.5 text-white/10 fill-white/10" />
              ))}
            </div>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Mobile-only features (condensed) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-2.5 mb-8 md:hidden"
          >
            {FEATURES.slice(0, 3).map(({ icon: Icon, title }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#b794f6]/10 border border-[#b794f6]/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#b794f6]" />
                </div>
                <span className="text-[11px] font-black text-white/50 uppercase tracking-tight">{title}</span>
              </div>
            ))}
          </motion.div>

          {/* Footer trust line */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-white/20" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                Secured by Auth0 · SOC 2 Compliant
              </span>
            </div>
            <p className="text-[9px] text-white/10 leading-relaxed">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
