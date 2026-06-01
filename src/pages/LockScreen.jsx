import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LockScreen() {
  const { unlockWallet, activeWallet } = useWallet();
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const unlock = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const ok = unlockWallet(pwd);
    if (!ok) { toast.error('Wrong password'); }
    setLoading(false);
    setPwd('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xs animate-slide-up text-center">
        <div className="w-16 h-16 gold-gradient rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-gold-500/25 animate-glow-pulse">
          <Lock size={28} className="text-navy-900" />
        </div>
        <h2 className="font-display font-bold text-2xl gold-text mb-1">Wallet Locked</h2>
        <p className="text-gray-600 text-sm mb-6">{activeWallet?.name}</p>
        <div className="card">
          <div className="relative mb-4">
            <input className="input pr-10 text-center" type={show?'text':'password'}
              placeholder="Enter password" value={pwd} onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key==='Enter' && unlock()} autoFocus />
            <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
              {show ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
          <button onClick={unlock} disabled={loading || !pwd} className="btn-primary w-full py-3">
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
