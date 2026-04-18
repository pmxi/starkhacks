import { Zap } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#b794f6]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#b794f6]/10 border border-[#b794f6]/20 flex items-center justify-center">
            <Zap className="w-8 h-8 text-[#b794f6]" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-[#b794f6]/30 animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#b794f6]"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{message}</span>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
