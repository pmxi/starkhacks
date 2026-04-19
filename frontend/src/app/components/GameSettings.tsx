import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Settings, Coins, Zap, Info, CircleDashed } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export default function GameSettings() {
  const navigate = useNavigate();
  const { room, isHost, emitSettings, emitStartGame } = useGame();

  const initial = room?.settings ?? { reps: 30, timeLimit: 60, entryFee: 0.1 };
  const [entryFee, setEntryFee] = useState(initial.entryFee);

  useEffect(() => {
    if (room?.settings) setEntryFee(room.settings.entryFee);
  }, [room?.settings]);

  useEffect(() => { if (!room) navigate('/'); }, [room, navigate]);

  const playerCount = room?.players.length ?? 1;
  const totalPot = (entryFee * playerCount * 0.95).toFixed(3);
  const winnerShare = (entryFee * playerCount * 0.95 * 0.9).toFixed(3);

  const changeEntryFee = (value: number) => {
    setEntryFee(value);
    emitSettings({ ...initial, entryFee: value });
  };

  const handleConfirm = () => {
    emitStartGame({ ...initial, entryFee });
    navigate('/gameplay');
  };

  if (!room) return null;

  return (
    <div className="min-h-full bg-[#0a0a0f] overflow-y-auto">
      <div className="w-full max-w-[390px] md:max-w-3xl mx-auto flex flex-col p-6 md:p-10 min-h-full">

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
        <div className="flex items-center gap-2 mb-10 px-1">
          <div className={`w-2 h-2 rounded-full ${isHost ? 'bg-[#b794f6]' : 'bg-white/20'}`} />
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
            {isHost ? 'You are configuring — changes sync live to all players' : 'Host is configuring settings...'}
          </span>
        </div>

        {/* ── Desktop: 2-col (entry fee control | summary) ── */}
        <div className="md:grid md:grid-cols-[1fr_280px] md:gap-8 space-y-8 md:space-y-0 flex-1">

          {/* Left: Entry fee control */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#b794f6]" />
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">SOL Entry Fee</label>
                </div>
                <span className="text-3xl font-black text-[#b794f6] italic">◎ {entryFee.toFixed(2)}</span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0.05" max="2.0" step="0.05"
                value={entryFee}
                disabled={!isHost}
                onChange={e => changeEntryFee(parseFloat(e.target.value))}
                className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#b794f6] disabled:opacity-50"
              />
              <div className="flex justify-between text-[10px] font-bold text-white/20 px-1">
                <span>◎ 0.05</span>
                <span>◎ 1.00</span>
                <span>◎ 2.00</span>
              </div>

              {/* Quick-pick buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.1, 0.25, 0.5, 1.0].map(amount => (
                  <button
                    key={amount}
                    onClick={() => isHost && changeEntryFee(amount)}
                    disabled={!isHost}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all disabled:cursor-default ${
                      entryFee === amount
                        ? 'bg-[#b794f6] text-white shadow-lg shadow-[#b794f6]/20'
                        : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    ◎ {amount}
                  </button>
                ))}
              </div>

              {/* +/- fine controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => isHost && changeEntryFee(parseFloat(Math.max(0.05, entryFee - 0.05).toFixed(2)))}
                  disabled={!isHost}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-50 text-xl"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">adjust by ◎ 0.05</span>
                </div>
                <button
                  onClick={() => isHost && changeEntryFee(parseFloat(Math.min(2.0, entryFee + 0.05).toFixed(2)))}
                  disabled={!isHost}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-50 text-xl"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Right: Summary + action */}
          <div className="flex flex-col gap-4">
            {/* Prize breakdown card */}
            <div className="bg-gradient-to-br from-[#b794f6]/10 to-transparent border border-[#b794f6]/20 rounded-[28px] p-6 relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-16 h-16 text-[#b794f6]" />
              </div>
              <div className="relative z-10 space-y-5">
                <div>
                  <span className="text-[9px] font-black text-[#b794f6] uppercase tracking-[0.2em] block mb-1">
                    Total Prize Pool
                  </span>
                  <div className="text-3xl font-black text-white italic tracking-tighter">◎ {totalPot}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Info className="w-3 h-3 text-white/20" />
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">5% network fee deducted</span>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="space-y-2.5">
                  {[
                    ['Protocol', room.gameType],
                    ['Players', `${playerCount} / 6`],
                    ['Entry per player', `◎ ${entryFee.toFixed(2)}`],
                    ['Total pot', `◎ ${totalPot}`],
                    ['🥇 Winner gets', `◎ ${winnerShare}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-white/30">{label}</span>
                      <span className={`font-bold ${label === '🥇 Winner gets' ? 'text-[#b794f6]' : 'text-white'}`}>
                        {value}
                      </span>
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
