import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Eye, EyeOff, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LockScreen() {
  const { unlockWallet, activeWallet } = useWallet();
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const unlock = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    if (!unlockWallet(pwd)) { toast.error('Wrong password'); setPwd(''); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <div className="header-bg flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-8">
        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 animate-bounce-in">
          <Fingerprint size={38} className="text-white"/>
        </div>
        <h1 className="text-white font-bold text-2xl mb-1">Welcome Back</h1>
        <p className="text-white/50 text-sm">{activeWallet?.name}</p>
      </div>
      <div className="bg-white dark:bg-navy-800 rounded-t-3xl px-5 pt-7 pb-10">
        <div className="relative mb-4">
          <input className="input text-center text-base pr-11" type={show?'text':'password'}
            placeholder="Enter password" value={pwd} onChange={e=>setPwd(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&unlock()} autoFocus/>
          <button onClick={()=>setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
            {show?<EyeOff size={16}/>:<Eye size={16}/>}
          </button>
        </div>
        <button onClick={unlock} disabled={loading||!pwd} className="btn-primary w-full py-4">
          {loading?'Unlocking...':'Unlock Wallet'}
        </button>
      </div>
    </div>
  );
}
