import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddTokenModal({ isOpen, onClose }) {
  const { addToken, network } = useWallet();
  const [addr, setAddr] = useState('');
  const [loading, setLoading] = useState(false);
  const [net, setNet] = useState(network);

  const handle = async () => {
    if (!addr.trim()) return;
    setLoading(true);
    try {
      await addToken(addr.trim(), net);
      setAddr(''); onClose();
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Token" size="sm">
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-navy-800/60 rounded-xl border border-gold-500/8 text-xs">
          {['ethereum','bsc'].map(n => (
            <button key={n} onClick={() => setNet(n)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${net===n?'gold-gradient text-navy-900':'text-gray-500 hover:text-gray-300'}`}>
              {n==='ethereum'?'Ethereum':'BNB Chain'}
            </button>
          ))}
        </div>
        <div>
          <label className="label">Contract Address</label>
          <div className="relative">
            <input className="input pr-10 font-mono text-xs" placeholder="0x..." value={addr} onChange={e=>setAddr(e.target.value)} />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"/>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">Token logo fetched via CryptoCompare</p>
        </div>
        <button onClick={handle} disabled={loading || !addr.trim()} className="btn-primary w-full">
          {loading ? 'Fetching token info...' : 'Add Token'}
        </button>
      </div>
    </Modal>
  );
}
