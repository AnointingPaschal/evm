import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowLeft } from 'lucide-react';
import CopyButton from '../components/ui/CopyButton';

export default function Receive() {
  const { activeWallet } = useWallet();
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const addr = activeWallet?.address || '';

  useEffect(() => {
    if (!addr || !qrRef.current) return;
    const t = setTimeout(() => {
      if (!qrRef.current) return;
      qrRef.current.innerHTML = '';
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${addr}&bgcolor=ffffff&color=1E3A5F&margin=2&format=png`;
      img.className = 'w-full h-full rounded-2xl';
      img.alt = 'QR Code';
      qrRef.current.appendChild(img);
    }, 50);
    return () => clearTimeout(t);
  }, [addr]);

  return (
    <div className="flex flex-col min-h-screen bg-app">
      <div className="header-bg px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-white font-bold text-lg">Receive</h1>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-3 px-5 pt-8 pb-28 flex flex-col items-center">
        <p className="text-secondary text-sm text-center mb-6">Scan QR or copy address to receive tokens</p>

        <div ref={qrRef} className="w-52 h-52 bg-white rounded-3xl shadow-card-md flex items-center justify-center mb-6 p-3 border border-slate-100">
          <div className="w-full h-full bg-slate-100 rounded-2xl animate-pulse" />
        </div>

        <p className="text-secondary text-xs mb-3">Your wallet address</p>
        <div className="w-full bg-slate-50 dark:bg-navy-900 rounded-2xl px-4 py-4 border border-slate-100 dark:border-white/5 flex items-start gap-3 mb-4">
          <p className="flex-1 font-mono text-xs text-primary break-all leading-relaxed">{addr}</p>
          <CopyButton text={addr} size={16} className="flex-shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 w-full">
          <p className="text-amber-700 dark:text-amber-300 text-xs">Only send ETH/BNB and ERC-20/BEP-20 tokens to this address on the correct network.</p>
        </div>
      </div>
    </div>
  );
}
