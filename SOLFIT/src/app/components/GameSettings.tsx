import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ChevronLeft, 
  Settings, 
  Timer, 
  Dumbbell, 
  Coins, 
  Zap,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GameSettings() {
  const navigate = useNavigate();
  const [reps, setReps] = useState(30);
  const [timeLimit, setTimeLimit] = useState(60);
  const [entryFee, setEntryFee] = useState(0.1);
  const playerCount = 4; // Mock

  const totalPot = (entryFee * playerCount * 0.95).toFixed(3); // 5% fee simulation

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <div className="w-full max-w-[390px] h-full flex flex-col p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
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

        <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-6">
          
          {/* Reps Config */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#b794f6]" />
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Target Reps</label>
              </div>
              <span className="text-xl font-black text-white italic">{reps}</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={reps}
              onChange={(e) => setReps(parseInt(e.target.value))}
              className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#b794f6]"
            />
            <div className="flex justify-between text-[10px] font-bold text-white/10 px-1">
              <span>10 REPS</span>
              <span>50 REPS</span>
              <span>100 REPS</span>
            </div>
          </div>

          {/* Time Config */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#b794f6]" />
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Time Limit (SEC)</label>
              </div>
              <span className="text-xl font-black text-white italic">{timeLimit}s</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeLimit(t)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
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

          {/* Entry Fee Config */}
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
                onClick={() => setEntryFee(Math.max(0.05, entryFee - 0.05))}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black flex items-center justify-center hover:bg-white/10 transition-all"
              >
                -
              </button>
              <input 
                type="range" 
                min="0.05" 
                max="2.0" 
                step="0.05"
                value={entryFee}
                onChange={(e) => setEntryFee(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#b794f6]"
              />
              <button 
                onClick={() => setEntryFee(Math.min(2.0, entryFee + 0.05))}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black flex items-center justify-center hover:bg-white/10 transition-all"
              >
                +
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-[#b794f6]/10 to-transparent border border-[#b794f6]/20 rounded-[28px] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-16 h-16 text-[#b794f6]" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-[#b794f6] uppercase tracking-[0.2em] block mb-1">Estimated Total Pot</span>
                <div className="text-3xl font-black text-white italic tracking-tighter">
                  ◎ {totalPot}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Info className="w-3 h-3 text-white/20" />
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Network fees included</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">Squad</span>
                <div className="text-xl font-black text-white italic">4/6</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pb-4">
          <button
            onClick={() => navigate('/gameplay')}
            className="w-full bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 font-black text-lg text-white uppercase italic tracking-tighter shadow-[0_10px_40px_rgba(183,148,246,0.4)] active:scale-95 transition-all"
          >
            Confirm & Start Protocol
          </button>
        </div>

      </div>
    </div>
  );
}
