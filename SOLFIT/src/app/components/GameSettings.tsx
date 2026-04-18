import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Settings, Timer, Dumbbell, Coins, Zap, Info, CircleDashed } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export default function GameSettings() {
  const navigate = useNavigate();
  const { room, isHost, emitSettings, emitStartGame } = useGame();

  const initial = room?.settings ?? { reps: 30, timeLimit: 60, entryFee: 0.1 };
  const [reps, setReps] = useState(initial.reps);
  const [timeLimit, setTimeLimit] = useState(initial.timeLimit);
  const [entryFee, setEntryFee] = useState(initial.entryFee);

  useEffect(() => {
    if (room?.settings) {
      setReps(room.settings.reps);
      setTimeLimit(room.settings.timeLimit);
      setEntryFee(room.settings.entryFee);
    }
  }, [room?.settings]);

  useEffect(() => { if (!room) navigate('/'); }, [room, navigate]);

  const playerCount = room?.players.length ?? 1;
  const totalPot = (entryFee * playerCount * 0.95).toFixed(3);

  const change = (key: string, value: number) => {
    const next = { reps, timeLimit, entryFee, [key]: value };
    if (key === 'reps') setReps(value);
    if (key === 'timeLimit') setTimeLimit(value);
    if (key === 'entryFee') setEntryFee(value);
    emitSettings(next);
  };

  const handleConfirm = () => {
    emitStartGame({ reps, timeLimit, entryFee });
    navigate('/gameplay');
  };

  if (!room) return null;

  return (
    <div className="min-h-full bg-[#0a0a0f] overflow-y-auto">
      <div className="w-full max-w-[390px] md:max-w-4xl mx-auto flex flex-col p-6 md:p-10 min-h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <button
            onClick={() => navigate('/lobby')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black italic text-white tracking-tighter uppercase">Protocol Config</h1>
          <div className="w-10 h-10 rounded-xl bg-[#b794f6]/10 flex items-center justify-center border border-[#b794f6]/20">
            <Settings className="w-5 h-5 text-[#b794f6]" />
          </div>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2 mb-8 px-1">
          <div className={`w-2 h-2 rounded-full ${isHost ? 'bg-[#b794f6]' : 'bg-white/20'}`} />
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
            {isHost ? 'You are configuring — changes sync live to all players' : 'Host is configuring settings...'}
          </span>
        </div>

        {/* ── Desktop: 2-col (controls | summary) ── */}
        <div className="md:grid md:grid-cols-[1fr_280px] md:gap-8 space-y-8 md:space-y-0 flex-1">

          {/* Left: Controls */}
          <div className="space-y-8">

            {/* Reps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#b794f6]" />
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Target Reps</label>
                </div>
                <span className="text-xl font-black text-white italic">{reps}</span>
              </div>
              <input
                type="range" min="10" max="100" step="5" value={reps}
                disabled={!isHost}
                onChange={e => change('reps', parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#b794f6] disabled:opacity-50"
              />
              <div className="flex justify-between text-[10px] font-bold text-white/10 px-1">
                <span>10</span><span>50</span><span>100</span>
              </div>
            </div>

            {/* Time */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#b794f6]" />
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Time Limit</label>
                </div>
                <span className="text-xl font-black text-white italic">{timeLimit}s</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map(t => (
                  <button
                    key={t}
                    onClick={() => isHost && change('timeLimit', t)}
                    disabled={!isHost}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all disabled:cursor-default ${
                      timeLimit === t
                        ? 'bg-[#b794f6] text-white shadow-lg shadow-[#b794f6]/20'
                        : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Fee */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#b794f6]" />
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">SOL Entry Fee</label>
                </div>
                <span className="text-xl font-black text-[#b794f6] italic">◎ {entryFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => isHost && change('entryFee', parseFloat(Math.max(0.05, entryFee - 0.05).toFixed(2)))}
                  disabled={!isHost}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-50"
                >-</button>
                <input
                  type="range" min="0.05" max="2.0" step="0.05" value={entryFee}
                  disabled={!isHost}
                  onChange={e => change('entryFee', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#b794f6] disabled:opacity-50"
                />
                <button
                  onClick={() => isHost && change('entryFee', parseFloat(Math.min(2.0, entryFee + 0.05).toFixed(2)))}
                  disabled={!isHost}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-50"
                >+</button>
              </div>
            </div>
          </div>

          {/* Right: Summary + action */}
          <div className="flex flex-col gap-4">
            {/* Summary card */}
            <div className="bg-gradient-to-br from-[#b794f6]/10 to-transparent border border-[#b794f6]/20 rounded-[28px] p-6 relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-16 h-16 text-[#b794f6]" />
              </div>
              <div className="relative z-10 space-y-4">
                <div>
                  <span className="text-[9px] font-black text-[#b794f6] uppercase tracking-[0.2em] block mb-1">Estimated Total Pot</span>
                  <div className="text-3xl font-black text-white italic tracking-tighter">◎ {totalPot}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Info className="w-3 h-3 text-white/20" />
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">5% network fee deducted</span>
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <div className="space-y-2">
                  {[
                    ['Protocol', room.gameType],
                    ['Target', `${reps} reps`],
                    ['Duration', `${timeLimit}s`],
                    ['Entry', `◎ ${entryFee.toFixed(2)}`],
                    ['Squad', `${playerCount} / 6`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-white/30">{label}</span>
                      <span className="text-white font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            {isHost ? (
              <button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 font-black text-lg text-white uppercase italic tracking-tighter shadow-[0_10px_40px_rgba(183,148,246,0.4)] active:scale-95 transition-all"
              >
                Confirm & Start
              </button>
            ) : (
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 flex items-center justify-center gap-3">
                <CircleDashed className="w-4 h-4 text-white/20 animate-spin" />
                <span className="text-white/40 font-bold uppercase italic tracking-tighter text-sm">Waiting for host...</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
