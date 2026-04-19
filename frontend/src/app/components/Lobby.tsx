import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Crown, CheckCircle2, CircleDashed, LogOut, Play, UserPlus, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from './PlayerAvatar';

export default function Lobby() {
  const navigate = useNavigate();
  const { room, socket, isHost, playerId, leaveRoom } = useGame();

  useEffect(() => {
    if (!room) navigate('/');
  }, [room, navigate]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => navigate('/gameplay');
    socket.on('game-start', handler);
    return () => { socket.off('game-start', handler); };
  }, [socket, navigate]);

  if (!room) return null;

  const allReady = room.players.every(p => p.isReady);

  const handleLeave = () => { leaveRoom(); navigate('/'); };
  const copyCode = () => navigator.clipboard.writeText(room.code);

  return (
    <div className="min-h-full bg-[#0a0a0f] overflow-y-auto">
      <div className="w-full max-w-[390px] md:max-w-4xl mx-auto flex flex-col p-6 md:p-10 min-h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <button
            onClick={handleLeave}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
          >
            <LogOut className="w-5 h-5 text-white/60" />
          </button>

          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">{room.teamName}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b794f6] animate-pulse" />
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {room.gameType} Challenge
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate('/friends')}
            className="w-10 h-10 rounded-full bg-[#b794f6]/10 flex items-center justify-center border border-[#b794f6]/20 cursor-pointer hover:bg-[#b794f6]/20 transition-all active:scale-95 group"
          >
            <UserPlus className="w-5 h-5 text-[#b794f6] group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Invite code chip */}
        <button
          onClick={copyCode}
          className="flex items-center gap-2 mx-auto mb-8 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 transition-all active:scale-95"
        >
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Code:</span>
          <span className="text-sm font-black text-[#b794f6] tracking-[0.1em]">{room.code}</span>
          <Copy className="w-3 h-3 text-white/30" />
        </button>

        {/* ── Desktop: 2-col (players grid | status panel) ── */}
        <div className="md:grid md:grid-cols-[1fr_280px] md:gap-8 flex-1">

          {/* Players */}
          <div>
            <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4 ml-1">
              Squad Members ({room.players.length}/6)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {room.players.map(player => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      player.isReady
                        ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/10'
                        : 'bg-white/5 border-dashed border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <PlayerAvatar
                          name={player.name}
                          size={48}
                          className="rounded-xl"
                          borderColor={player.id === playerId ? '#b794f6' : undefined}
                        />
                        {player.isHost && (
                          <div className="absolute -top-1.5 -left-1.5 bg-[#b794f6] rounded-lg p-1 shadow-[0_0_10px_rgba(183,148,246,0.4)] border border-white/20">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold tracking-tight text-sm ${player.id === playerId ? 'text-[#b794f6]' : 'text-white'}`}>
                            {player.name}{player.id === playerId ? ' (You)' : ''}
                          </span>
                          {player.isHost && (
                            <span className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-white/5">
                              Host
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {player.isReady ? (
                        <div className="bg-[#b794f6]/20 px-2 py-1 rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-[#b794f6]" />
                          <span className="text-[10px] text-[#b794f6] font-black uppercase">Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <CircleDashed className="w-3 h-3 text-white/20 animate-spin" />
                          <span className="text-[10px] text-white/20 font-black uppercase">Waiting</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right panel: status + action */}
          <div className="mt-8 md:mt-0 flex flex-col gap-4">
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#b794f6] animate-ping" />
                <span className="text-[11px] font-bold text-[#b794f6] uppercase tracking-widest">
                  {allReady ? 'All players ready!' : 'Waiting for squad...'}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Protocol</span>
                  <span className="text-white font-bold">{room.gameType}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Players</span>
                  <span className="text-white font-bold">{room.players.length} / 6</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Ready</span>
                  <span className="text-[#b794f6] font-bold">
                    {room.players.filter(p => p.isReady).length} / {room.players.length}
                  </span>
                </div>
              </div>
            </div>

            {isHost ? (
              <button
                onClick={() => navigate('/game-settings')}
                className="w-full bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 px-6 font-black text-lg text-white uppercase italic tracking-tighter transition-all active:scale-[0.98] shadow-[0_10px_40px_rgba(183,148,246,0.4)] flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-white" />
                Configure & Start
              </button>
            ) : (
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 flex items-center justify-center gap-3">
                <CircleDashed className="w-5 h-5 text-white/20 animate-spin" />
                <span className="text-white/40 font-bold uppercase italic tracking-tighter text-sm">
                  Waiting for host...
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
