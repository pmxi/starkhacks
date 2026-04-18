import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Clipboard, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';

export default function JoinTeam() {
  const navigate = useNavigate();
  const { joinRoom, playerName } = useGame();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Code must be exactly 6 characters');
      return;
    }
    if (!playerName) {
      setError('Set your player name on the home screen first');
      return;
    }

    setIsJoining(true);
    setError('');
    try {
      await joinRoom(trimmed);
      navigate('/lobby');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('in progress')) {
        setError('Game already in progress');
      } else if (message.includes('not found') || message.includes('404')) {
        setError('Invalid code — no room found');
      } else {
        setError('Could not connect. Is the server running?');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text.substring(0, 6).toUpperCase());
      setError('');
    } catch {
      // clipboard permission denied
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <div className="w-full max-w-[390px] h-full flex flex-col p-6 relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-16 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black italic text-white tracking-tighter uppercase">Join Team</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto no-scrollbar py-4">
          <div className="w-20 h-20 rounded-[28px] bg-[#b794f6]/10 border border-[#b794f6]/20 flex items-center justify-center mb-10 relative shrink-0">
            <div className="absolute inset-0 bg-[#b794f6]/5 blur-xl rounded-full" />
            <Zap className="w-10 h-10 text-[#b794f6] relative z-10" />
          </div>

          <div className="w-full space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                Enter Squad Code
              </h2>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                Request the 6-digit code from your host
              </p>
            </div>

            {/* Joining as */}
            {playerName && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#b794f6]" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  Joining as <span className="text-[#b794f6]">{playerName}</span>
                </span>
              </div>
            )}

            <div className="relative group">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="XXXXXX"
                className={`w-full bg-white/5 border-2 rounded-[24px] py-6 px-4 text-center text-4xl font-black text-white placeholder:text-white/10 tracking-[0.3em] focus:outline-none transition-all ${
                  error
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/10 focus:border-[#b794f6]/50 focus:bg-white/10'
                }`}
              />
              <button
                onClick={handlePaste}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <Clipboard className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2 text-red-400"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Button */}
        <div className="pb-4">
          <button
            onClick={handleJoin}
            disabled={!code || isJoining}
            className="w-full relative group bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 px-6 font-black text-lg text-white uppercase italic tracking-tighter transition-all duration-300 active:scale-[0.98] shadow-[0_10px_40px_rgba(183,148,246,0.4)] disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-3">
              {isJoining ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Game</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
