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
  const isNative = token?.address === 'native';
  const balKey = isNative ? 'native' : token?.address?.toLowerCase();
  const bal = parseFloat(balances[balKey] || '0');
  const price = prices[sym]?.price || 0;

  const alreadyLocked = vaults.filter(v => v.status === 'locked' && (isNative ? v.tokenAddress === 'native' : v.tokenAddress?.toLowerCase() === token?.address?.toLowerCase()))
    .reduce((s,v) => s + parseFloat(v.amount||0), 0);
  const available = Math.max(0, bal - alreadyLocked);
  const unlockDate = addMonths(new Date(), months);
  const earlyFee = 0.02; // 2% early unlock fee

  const PRESETS = [2,3,6,12];

  const handle = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > available) return toast.error(`Insufficient available balance (${available.toFixed(4)} ${sym})`);
    if (months < 2) return toast.error('Minimum lock period is 2 months');
    try {
      createVault({ tokenAddress: token.address, tokenSymbol: sym, amount: amt, lockMonths: months, note });
      setAmount(''); setNote(''); setMonths(3); onClose();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create Vault · ${sym}`} size="sm">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
          <Info size={14} className="text-cyan-400 flex-shrink-0 mt-0.5"/>
          <div className="text-xs text-cyan-300/80">
            Locked tokens remain in your wallet but are marked as saved. Breaking the vault early incurs a <strong className="text-cyan-300">{earlyFee*100}% fee</strong>.
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="label mb-0">Amount to Lock</label>
            <button onClick={() => setAmount(available.toFixed(6))} className="text-[11px] text-gold-400 hover:text-gold-300">
              Available: {available.toFixed(4)} {sym}
            </button>
          </div>
          <input className="input font-mono" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} />
          {amount && price > 0 && <p className="text-[11px] text-gray-600 mt-1">≈ {fmtNum(parseFloat(amount)*price)}</p>}
        </div>

        {/* Lock period */}
        <div>
          <label className="label">Lock Period (minimum 2 months)</label>
          <div className="flex gap-2 mb-2">
            {PRESETS.map(m => (
              <button key={m} onClick={() => setMonths(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all ${months===m?'gold-gradient text-navy-900':'glass-sm text-gray-500 hover:text-gray-300 border border-gold-500/8'}`}>
                {m}m
              </button>
            ))}
          </div>
          <input type="range" min={2} max={60} value={months} onChange={e=>setMonths(+e.target.value)}
            className="w-full accent-gold-500" />
          <div className="flex justify-between text-[11px] text-gray-600 mt-0.5">
            <span>2 months min</span>
            <span className="text-gold-400 font-mono">{months} month{months!==1?'s':''} → {format(unlockDate,'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="label">Vault Note (optional)</label>
          <input className="input text-sm" placeholder="e.g. Emergency fund, Holiday savings..." value={note} onChange={e=>setNote(e.target.value)} />
        </div>

        {/* Summary */}
        {amount && months >= 2 && (
          <div className="p-3 rounded-xl bg-navy-800/60 border border-gold-500/8 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Locking</span><span className="text-white font-mono">{amount} {sym}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Unlock date</span><span className="text-white">{format(unlockDate,'MMM d, yyyy')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Early break fee</span><span className="text-amber-400">{earlyFee*100}%</span></div>
          </div>
        )}

        <button onClick={handle} disabled={!amount || parseFloat(amount)<=0 || parseFloat(amount)>available}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <Lock size={14}/> Lock Tokens
        </button>
      </div>
    </Modal>
  );
}
