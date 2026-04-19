import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Timer, Flame, Trophy, TrendingUp, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from './PlayerAvatar';
import WorkoutCamera from './WorkoutCamera';

interface LivePlayer {
  id: string;
  name: string;
  count: number;
  isYou: boolean;
}

export default function Gameplay() {
  const navigate = useNavigate();
  const { room, socket, playerId, emitRepUpdate, emitGameEnd } = useGame();

  const settings = room?.settings ?? { reps: 30, timeLimit: 60, entryFee: 0.1 };
  const gameType = room?.gameType ?? 'Pushup';

  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [players, setPlayers] = useState<LivePlayer[]>(() =>
    (room?.players ?? []).map(p => ({ id: p.id, name: p.name, count: 0, isYou: p.id === playerId }))
  );
  const [gameEnded, setGameEnded] = useState(false);

  const gameEndedRef = useRef(false);
  const playersRef = useRef(players);
  playersRef.current = players;

  useEffect(() => { if (!room) navigate('/'); }, [room, navigate]);

  // Real rep updates from other players via socket
  useEffect(() => {
    if (!socket) return;
    const handler = ({ playerId: pid, count }: { playerId: string; count: number }) => {
      setPlayers(prev => prev.map(p =>
        p.id === pid && !p.isYou ? { ...p, count: Math.max(p.count, count) } : p
      ));
    };
    socket.on('rep-update', handler);
    return () => { socket.off('rep-update', handler); };
  }, [socket]);

  // Simulated AI progress for non-self players
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameEndedRef.current) return;
      setPlayers(prev => prev.map(p =>
        (!p.isYou && Math.random() > 0.65) ? { ...p, count: p.count + 1 } : p
      ));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Countdown
  useEffect(() => {
    if (gameEnded) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameEnded]);

  // End game
  useEffect(() => {
    if (timeLeft === 0 && !gameEnded) {
      setGameEnded(true);
      gameEndedRef.current = true;
      const sorted = [...playersRef.current].sort((a, b) => b.count - a.count);
      emitGameEnd(sorted);
      navigate('/results', { state: { results: sorted, gameType, entryFee: settings.entryFee, playerCount: sorted.length } });
    }
  }, [timeLeft, gameEnded, emitGameEnd, navigate, gameType, settings.entryFee]);

  const handleRep = useCallback(() => {
    if (gameEnded) return;
    setPlayers(prev => prev.map(p => {
      if (!p.isYou) return p;
      const newCount = p.count + 1;
      emitRepUpdate(newCount);
      return { ...p, count: newCount };
    }));
  }, [gameEnded, emitRepUpdate]);

  const sortedPlayers = [...players].sort((a, b) => b.count - a.count);
  const leaderId = sortedPlayers[0]?.count > 0 ? sortedPlayers[0]?.id : null;
  const myPlayer = players.find(p => p.isYou);
  const myCount = myPlayer?.count ?? 0;
  const progress = Math.min((myCount / settings.reps) * 100, 100);
  const totalPot = (settings.entryFee * players.length * 0.95).toFixed(3);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    : `${seconds}s`;

  return (
    <div className="min-h-full bg-[#0a0a0f] overflow-y-auto">
      <div className="w-full max-w-[390px] md:max-w-5xl mx-auto flex flex-col p-6 md:p-10 min-h-full">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className={`bg-white/5 border rounded-2xl px-4 py-2 flex items-center gap-3 transition-colors ${
            timeLeft < 10 ? 'border-[#b794f6]/50' : 'border-white/10'
          }`}>
            <Timer className={`w-5 h-5 text-[#b794f6] ${timeLeft < 10 ? 'animate-pulse' : ''}`} />
            <span className={`text-2xl font-black italic tracking-tighter ${timeLeft < 10 ? 'text-[#b794f6]' : 'text-white'}`}>
              {timeDisplay}
            </span>
          </div>
          <div className="bg-[#b794f6]/10 border border-[#b794f6]/20 rounded-2xl px-4 py-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#b794f6]" />
            <span className="text-[10px] font-black text-[#b794f6] uppercase tracking-widest">◎ {totalPot} POT</span>
          </div>
        </div>

        {/* ── Desktop: 2-col (leaderboard | progress + camera) ── */}
        <div className="md:grid md:grid-cols-[1fr_320px] md:gap-8 space-y-6 md:space-y-0 flex-1">

          {/* Left: Leaderboard */}
          <div>
            <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Live Standings
            </h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sortedPlayers.map((player, index) => {
                  const isLeading = player.id === leaderId;
                  const prog = Math.min((player.count / settings.reps) * 100, 100);
                  return (
                    <motion.div
                      layout key={player.id}
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
                            <PlayerAvatar name={player.name} size={40} className="rounded-xl"
                              borderColor={isLeading ? '#b794f6' : undefined}
                            />
                            <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              index === 0 ? 'bg-[#b794f6] text-black' : 'bg-white/10 text-white/40'
                            }`}>{index + 1}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${player.isYou ? 'text-[#b794f6]' : 'text-white'}`}>
                                {player.name}{player.isYou ? ' (You)' : ''}
                              </span>
                              {isLeading && <Award className="w-3 h-3 text-[#b794f6]" />}
                            </div>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                              {prog.toFixed(0)}% to target
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-black italic tracking-tighter leading-none ${isLeading ? 'text-[#b794f6]' : 'text-white'}`}>
                            {player.count}
                          </div>
                          <span className="text-[8px] font-bold text-white/20 uppercase">REPS</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${prog}%` }}
                          className={`h-full rounded-full ${isLeading ? 'bg-gradient-to-r from-[#b794f6] to-[#b794f6]/50' : 'bg-white/20'}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Your progress + camera */}
          <div className="flex flex-col gap-4 md:sticky md:top-6 md:self-start">

            {/* Your progress */}
            <div className="bg-white/5 border border-white/5 rounded-[24px] p-6">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Your Progress</p>
              <div className="flex items-end justify-between mb-3">
                <span className="text-4xl font-black text-white italic">{myCount}</span>
                <span className="text-sm font-black text-white/30 uppercase mb-1">/ {settings.reps} reps</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                  className="h-full bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-full"
                />
              </div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2">{progress.toFixed(0)}% complete</p>
            </div>

            {/* Live camera — centred in the column */}
            <div className="flex justify-center">
              <div className="w-full max-w-[280px]">
                <WorkoutCamera
                  onRep={handleRep}
                  gameEnded={gameEnded}
                  gameType={gameType}
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
