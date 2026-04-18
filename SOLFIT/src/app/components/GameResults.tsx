import { useNavigate, useLocation } from 'react-router';
import { 
  Trophy, 
  Crown, 
  Star, 
  Home, 
  RotateCcw,
  Award,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ResultPlayer {
  id: string;
  name: string;
  count: number;
  avatar: string;
  isYou: boolean;
  prize?: string;
}

export default function GameResults() {
  const navigate = useNavigate();
  const location = useLocation();

  const results: ResultPlayer[] = location.state?.results || [
    { id: '1', name: 'Alex (You)', count: 48, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop', isYou: true, prize: '0.36 SOL' },
    { id: '2', name: 'Sarah', count: 42, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', isYou: false, prize: '0.04 SOL' },
    { id: '3', name: 'Mike', count: 38, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', isYou: false },
    { id: '4', name: 'Jessica', count: 35, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', isYou: false },
  ];

  const winner = results[0];

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#b794f6', '#ffd700', '#ffffff']
    });
  }, []);

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <div className="w-full max-w-[390px] h-full flex flex-col p-6 relative">
        
        {/* Ambient Celebration Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#b794f6]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex-1 flex flex-col items-center pt-8 overflow-y-auto no-scrollbar">
          {/* Winner Section */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#b794f6] to-[#8b5cf6] rounded-full blur-2xl opacity-30 animate-pulse" />
              <div className="relative w-28 h-28 rounded-full border-4 border-[#b794f6] bg-black flex items-center justify-center shadow-[0_0_50px_rgba(183,148,246,0.3)]">
                <Crown className="w-14 h-14 text-[#b794f6]" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#b794f6] text-black text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                Champion
              </div>
            </div>
            
            <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase text-center mb-2">
              {winner.name}
            </h1>
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-[#b794f6] fill-[#b794f6]" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">New Arena Record: {winner.count} Reps</span>
              <Star className="w-3 h-3 text-[#b794f6] fill-[#b794f6]" />
            </div>
          </motion.div>

          {/* Prize Banner */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-gradient-to-br from-[#b794f6]/20 via-white/5 to-[#b794f6]/10 border border-[#b794f6]/30 rounded-[32px] p-6 mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-16 h-16 text-[#b794f6]" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <span className="text-[9px] font-black text-[#b794f6] uppercase tracking-[0.2em] block mb-1">Total Solana Won</span>
                <div className="text-4xl font-black text-white italic tracking-tighter leading-none">
                  ◎ {winner.prize || '0.360'}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[#b794f6]/10 border border-[#b794f6]/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-[#b794f6]" />
              </div>
            </div>
          </motion.div>

          {/* Final Standings List */}
          <div className="w-full space-y-3 mb-8">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 mb-2">Competition Rankings</h3>
            {results.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + (index * 0.1) }}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  index === 0 
                    ? 'bg-[#b794f6]/5 border-[#b794f6]/20' 
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 font-black italic ${index === 0 ? 'text-[#b794f6]' : 'text-white/20'}`}>
                    {index + 1}
                  </div>
                  <img src={player.avatar} className="w-9 h-9 rounded-xl object-cover border border-white/10" alt="" />
                  <span className={`text-sm font-bold ${index === 0 ? 'text-white' : 'text-white/60'}`}>
                    {player.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black italic leading-none ${index === 0 ? 'text-[#b794f6]' : 'text-white/40'}`}>
                    {player.count}
                  </div>
                  <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">Reps</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Buttons Section - Exactly as requested */}
        <div className="flex flex-col gap-3 pb-6 bg-[#0a0a0f] pt-4">
          <button
            onClick={() => navigate('/lobby')}
            className="w-full bg-[#b794f6] text-white rounded-2xl py-5 font-black text-lg uppercase italic tracking-tighter flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(183,148,246,0.3)] active:scale-95 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
            Play Again
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl py-5 font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-white/10 transition-all active:scale-95"
          >
            <Home className="w-5 h-5" />
            Back to Home Page
          </button>
        </div>

      </div>
    </div>
  );
}
