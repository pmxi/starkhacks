import { useState } from 'react';
import { Wallet, Link2Off } from 'lucide-react';
import { useGame } from '../../context/GameContext';

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function WalletButton() {
  const { wallet, connectWallet, disconnectWallet } = useGame();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      if (wallet) await disconnectWallet();
      else await connectWallet();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  const address = wallet ? wallet.publicKey.toBase58() : null;

  return (
    <div className="relative z-10">
      <button
        onClick={handleClick}
        disabled={busy}
        title={address ?? 'Connect Phantom'}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
          wallet
            ? 'bg-[#b794f6]/10 text-[#b794f6] border border-[#b794f6]/20 hover:bg-[#b794f6]/15'
            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
        } disabled:opacity-50`}
      >
        {wallet ? <Link2Off className="w-4 h-4 shrink-0" /> : <Wallet className="w-4 h-4 shrink-0" />}
        <span className="truncate">
          {busy ? '…' : address ? shortAddr(address) : 'Connect Phantom'}
        </span>
      </button>
      {err && (
        <p className="text-[10px] text-red-400 font-bold mt-1 uppercase tracking-wider">
          {err.length > 40 ? err.slice(0, 40) + '…' : err}
        </p>
      )}
    </div>
  );
}
