import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Zap, ArrowRight } from 'lucide-react';
import LoadingScreen from './LoadingScreen';
import Antigravity from './Antigravity';

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
    <div className="min-h-screen w-full bg-[#0a0a0f] flex flex-col items-center justify-between relative overflow-hidden px-6 py-12">

      {/* Antigravity particle canvas — full screen background */}
      <div className="absolute inset-0 z-0">
        <Antigravity
          count={300}
          magnetRadius={5}
          ringRadius={7}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color="#9a75d7"
          autoAnimate={true}
          particleVariance={1}
          particleShape="tetrahedron"
        />
      </div>

      {/* Top spacer */}
      <div />

      {/* Centre: wordmark + subheading + buttons */}
      <div className="flex flex-col items-center gap-10 relative z-10 w-full">

        {/* Icon + wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#b794f6]/40 rounded-[32px] blur-3xl scale-125" />
            <div className="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#b794f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_20px_60px_rgba(183,148,246,0.5)]">
              <Zap className="w-10 h-10 text-white fill-white" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-7xl md:text-9xl font-black italic text-white uppercase tracking-tighter leading-none">
              SOLFIT
            </h1>
            <p className="text-base md:text-lg font-black text-[#b794f6] uppercase tracking-[0.3em] mt-3">
              No Pain, No Gain.
            </p>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
        >
          <button
            onClick={handleSignup}
            className="flex-1 group relative bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 px-6 font-black text-lg text-white uppercase italic tracking-tighter shadow-[0_10px_40px_rgba(183,148,246,0.4)] active:scale-[0.98] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
            <div className="relative flex items-center justify-center gap-2">
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={handleLogin}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-5 px-6 font-black text-lg text-white/70 uppercase italic tracking-tighter hover:bg-white/10 hover:border-[#b794f6]/30 hover:text-white active:scale-[0.98] transition-all backdrop-blur-sm"
          >
            Log In
          </button>
        </motion.div>
      </div>

      {/* Bottom: hero copy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative z-10 text-center w-full max-w-2xl"
      >
        <h2 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter uppercase leading-none mb-3">
          Turn Your Reps Into <span className="text-[#b794f6]">Rewards</span>
        </h2>
        <p className="text-white/40 text-sm md:text-base leading-relaxed">
          Join squads, set challenges, and compete for real Solana prizes.
        </p>
      </motion.div>

    </div>
  );
}
