import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Zap, Trophy, TrendingUp, Shield, ArrowRight, Cpu } from 'lucide-react';
import LoadingScreen from './LoadingScreen';

const FEATURES = [
  {
    icon: Trophy,
    title: 'Compete for SOL',
    desc: 'Winner-takes-all prize pools funded by entry fees.',
  },
  {
    icon: Cpu,
    title: 'AI Rep Tracking',
    desc: 'Every rep verified and recorded in real-time.',
  },
  {
    icon: TrendingUp,
    title: 'Live Leaderboard',
    desc: 'Watch rankings shift as the clock counts down.',
  },
  {
    icon: Shield,
    title: 'Secured by Auth0',
    desc: 'Enterprise-grade auth with brute-force protection.',
  },
];

export default function AuthPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  // If already authenticated, skip to home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return <LoadingScreen message="Checking session..." />;

  const handleLogin = () =>
    loginWithRedirect({
      authorizationParams: { screen_hint: 'login' },
    });

  const handleSignup = () =>
    loginWithRedirect({
      authorizationParams: { screen_hint: 'signup' },
    });

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-[#b794f6]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#8b5cf6]/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[390px] h-full flex flex-col px-6 py-10 relative overflow-y-auto no-scrollbar">

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-12 pt-6"
        >
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-[#b794f6]/30 rounded-3xl blur-2xl scale-110" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#b794f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_20px_50px_rgba(183,148,246,0.4)]">
              <Zap className="w-10 h-10 text-white fill-white" />
            </div>
          </div>

          <h1 className="text-5xl font-black italic text-white tracking-tighter uppercase leading-none mb-2">
            SOLFIT
          </h1>
          <p className="text-[11px] font-black text-[#b794f6] uppercase tracking-[0.4em]">
            Compete · Sweat · Earn
          </p>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight mb-3">
            Turn Your Reps<br />Into Rewards
          </h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[260px] mx-auto">
            Join squads, set challenges, and compete for real Solana prizes — all tracked by AI.
          </p>
        </motion.div>

        {/* Auth Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-10"
        >
          {/* Sign Up — primary CTA */}
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

          {/* Login — secondary CTA */}
          <button
            onClick={handleLogin}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 font-black text-lg text-white/70 uppercase italic tracking-tighter hover:bg-white/10 hover:border-[#b794f6]/30 hover:text-white active:scale-[0.98] transition-all"
          >
            Log In
          </button>
        </motion.div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-3 mb-10"
        >
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center mb-4">
            Why SOLFIT
          </p>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-4 bg-white/3 border border-white/5 rounded-2xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#b794f6]/10 border border-[#b794f6]/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#b794f6]" />
              </div>
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-tight leading-none mb-0.5">
                  {title}
                </div>
                <div className="text-[10px] text-white/30 font-medium">{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
              Secured by Auth0 · SOC 2 Compliant
            </span>
          </div>
          <p className="text-[9px] text-white/10 text-center leading-relaxed max-w-[220px]">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

      </div>
    </div>
  );
}
