import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Timer, 
  Flame, 
  Trophy, 
  ChevronRight,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LivePlayer {
  id: string;
  name: string;
  count: number;
  avatar: string;
  isYou: boolean;
}

export default function Gameplay() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [players, setPlayers] = useState<LivePlayer[]>([
    { id: '1', name: 'Alex (You)', count: 0, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop', isYou: true },
    { id: '2', name: 'Sarah', count: 0, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', isYou: false },
    { id: '3', name: 'Mike', count: 0, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', isYou: false },
    { id: '4', name: 'Jessica', count: 0, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', isYou: false },
  ]);

  const targetReps = 50;

  useEffect(() => {
    if (timeLeft <= 0) {
      const sortedPlayers = [...players].sort((a, b) => b.count - a.count);
      navigate('/results', { state: { results: sortedPlayers } });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      
      // Randomly update other players
      setPlayers(prev => prev.map(p => {
        if (!p.isYou && Math.random() > 0.7) {
          return { ...p, count: p.count + 1 };
        }
        return p;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate, players]);

  const handlePushup = () => {
    setPlayers(prev => prev.map(p => p.isYou ? { ...p, count: p.count + 1 } : p));
  };

  const sortedPlayers = [...players].sort((a, b) => b.count - a.count);
  const leadingPlayer = sortedPlayers[0];

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <div className="w-full max-w-[390px] h-full flex flex-col p-6 relative">
        
        {/* Top Stats Bar */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
            <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-[#b794f6] animate-pulse' : 'text-[#b794f6]'}`} />
            <span className={`text-2xl font-black italic tracking-tighter ${timeLeft < 10 ? 'text-[#b794f6]' : 'text-white'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="bg-[#b794f6]/10 border border-[#b794f6]/20 rounded-2xl px-4 py-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#b794f6]" />
            <span className="text-[10px] font-black text-[#b794f6] uppercase tracking-widest">◎ 0.40 POT</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-1">
          <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-1 mb-4 flex items-center gap-2 sticky top-0 bg-[#0a0a0f] z-20 py-1">
            <TrendingUp className="w-3 h-3" /> Live Competition Standings
          </h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedPlayers.map((player, index) => {
                const isLeading = player.id === leadingPlayer.id && player.count > 0;
                const progress = Math.min((player.count / targetReps) * 100, 100);

                return (
                  <motion.div
                    layout
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`relative p-4 rounded-[24px] border transition-all duration-500 overflow-hidden ${
                      isLeading 
                        ? 'bg-gradient-to-r from-[#b794f6]/20 to-[#b794f6]/5 border-[#b794f6]/40 shadow-[0_0_20px_rgba(183,148,246,0.1)]' 
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    {isLeading && (
                      <div className="absolute top-0 right-0 p-2 opacity-20">
                        <Trophy className="w-12 h-12 text-[#b794f6] -rotate-12" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={player.avatar} 
                            className={`w-10 h-10 rounded-xl object-cover border-2 ${isLeading ? 'border-[#b794f6]' : 'border-white/10'}`} 
                            alt="" 
                          />
                          <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            index === 0 ? 'bg-[#b794f6] text-black' : 'bg-white/10 text-white/40'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold tracking-tight ${player.isYou ? 'text-[#b794f6]' : 'text-white'}`}>
                              {player.name}
                            </span>
                            {isLeading && <Award className="w-3 h-3 text-[#b794f6]" />}
                          </div>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">
                            {progress.toFixed(0)}% TO TARGET
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-black italic tracking-tighter leading-none ${isLeading ? 'text-[#b794f6]' : 'text-white'}`}>
                          {player.count}
                        </div>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">REPS</span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full rounded-full ${isLeading ? 'bg-gradient-to-r from-[#b794f6] to-[#b794f6]/50' : 'bg-white/20'}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Simulation */}
        <div className="pb-8 pt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#b794f6] animate-ping" />
            <span className="text-[10px] font-black text-[#b794f6] uppercase tracking-[0.3em]">Protocol Active</span>
          </div>
          <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest text-center">AI Tracking enabled. Performance being recorded.</span>
        </div>

      </div>
    </div>
  );
}
