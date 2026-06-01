import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import { Lock, Info } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import toast from 'react-hot-toast';
import { fmtNum } from '../../utils/api';

export default function VaultModal({ isOpen, onClose, token }) {
  const { createVault, balances, prices, vaults } = useWallet();
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState(3);
  const [note, setNote] = useState('');
  const sym = token?.symbol?.toUpperCase();
  const isNative = token?.address==='native'||token?.isNative;
  const balKey = isNative ? 'native' : token?.address?.toLowerCase();
  const bal = parseFloat(balances[balKey]||'0');
  const priceInfo = prices[sym]||{};
  const locked = vaults.filter(v=>v.status==='locked'&&(isNative?v.tokenAddress==='native':v.tokenAddress?.toLowerCase()===token?.address?.toLowerCase()))
    .reduce((s,v)=>s+parseFloat(v.amount||0),0);
  const available = Math.max(0, bal-locked);
  const unlockDate = addMonths(new Date(), months);
  const PRESETS = [2,3,6,12];

  const handle = () => {
    const amt = parseFloat(amount);
    if (!amt||amt<=0) return toast.error('Invalid amount');
    if (amt > available) return toast.error(`Max available: ${available.toFixed(6)} ${sym}`);
    try { createVault({ tokenAddress: isNative?'native':token.address, tokenSymbol:sym, amount:amt, lockMonths:months, note }); setAmount('');setNote('');setMonths(3);onClose(); }
    catch(e) { toast.error(e.message); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vault · ${sym}`}>
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-500/20">
          <Info size={14} className="text-brand-500 flex-shrink-0 mt-0.5"/>
          <p className="text-brand-700 dark:text-brand-300 text-xs">Tokens stay in your wallet but are tracked as locked. A <strong>2% fee</strong> applies for breaking early.</p>
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="label mb-0">Amount</label>
            <button onClick={()=>setAmount(available.toFixed(6))} className="text-brand-500 text-xs font-medium">Available: {available.toFixed(4)} {sym}</button>
          </div>
          <input className="input font-mono" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/>
          {amount && priceInfo.price > 0 && <p className="text-secondary text-xs mt-1">≈ {fmtNum(parseFloat(amount)*priceInfo.price)}</p>}
        </div>
        <div>
          <label className="label">Lock Period (min 2 months)</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESETS.map(m => (
              <button key={m} onClick={()=>setMonths(m)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${months===m?'bg-brand-500 text-white shadow-brand':'bg-slate-100 dark:bg-navy-900 text-secondary hover:text-primary'}`}>
                {m}m
              </button>
            ))}
          </div>
          <input type="range" min={2} max={60} value={months} onChange={e=>setMonths(+e.target.value)} className="w-full accent-brand-500 mb-2"/>
          <div className="flex justify-between text-xs">
            <span className="text-secondary">2 months min</span>
            <span className="text-brand-500 font-semibold font-mono">{months}mo → {format(unlockDate,'MMM d, yyyy')}</span>
          </div>
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="input text-sm" placeholder="e.g. Emergency fund..." value={note} onChange={e=>setNote(e.target.value)}/>
        </div>
        {amount && months >= 2 && (
          <div className="card-inner p-3.5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-secondary">Locking</span><span className="text-primary font-semibold">{amount} {sym}</span></div>
            <div className="flex justify-between"><span className="text-secondary">Until</span><span className="text-primary">{format(unlockDate,'MMM d, yyyy')}</span></div>
            <div className="flex justify-between"><span className="text-secondary">Early fee</span><span className="text-amber-500 font-medium">2%</span></div>
          </div>
        )}
        <button onClick={handle} disabled={!amount||parseFloat(amount)<=0||parseFloat(amount)>available} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
          <Lock size={16}/> Lock Tokens
        </button>
      </div>
    </Modal>
  );
}
