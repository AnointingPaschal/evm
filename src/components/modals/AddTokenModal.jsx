import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddTokenModal({ isOpen, onClose }) {
  const { addToken, network } = useWallet();
  const [addr, setAddr] = useState('');
  const [net, setNet] = useState(network);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try { await addToken(addr.trim(), net); setAddr(''); onClose(); }
    catch(e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Token">
      <div className="space-y-4">
        <div className="flex p-1 bg-slate-100 dark:bg-navy-900 rounded-2xl text-sm">
          {['ethereum','bsc'].map(n => (
            <button key={n} onClick={()=>setNet(n)}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${net===n?'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm':'text-secondary'}`}>
              {n==='ethereum'?'Ethereum':'BNB Chain'}
            </button>
          ))}
        </div>
        <div>
          <label className="label">Contract Address</label>
          <div className="relative">
            <input className="input pr-10 font-mono text-xs" placeholder="0x..." value={addr} onChange={e=>setAddr(e.target.value)}/>
            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary"/>
          </div>
          <p className="text-secondary text-[11px] mt-1.5">Logo fetched via CryptoCompare</p>
        </div>
        <button onClick={handle} disabled={loading||!addr.trim()} className="btn-primary w-full py-4">
          {loading?'Fetching...':'Add Token'}
        </button>
      </div>
    </Modal>
  );
}
