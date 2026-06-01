import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import { Lock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import toast from 'react-hot-toast';
import { fmtNum } from '../../utils/api';

export default function VaultModal({ isOpen, onClose, token }) {
  const { createVault, balances, prices, vaults } = useWallet();
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState(3);
  const [note, setNote] = useState('');
  
  const sym = token?.symbol?.toUpperCase();
  const isNative = token?.address === 'native' || token?.isNative;
  const balKey = isNative ? 'native' : token?.address?.toLowerCase();
  
  const bal = parseFloat(balances[balKey] || '0');
  const priceInfo = prices[sym] || {};
  
  // Calculate how much is already locked
  const locked = vaults
    .filter(v => v.status === 'locked' && (isNative ? v.tokenAddress === 'native' : v.tokenAddress?.toLowerCase() === token?.address?.toLowerCase()))
    .reduce((s, v) => s + parseFloat(v.amount || 0), 0);
    
  const available = Math.max(0, bal - locked);
  const unlockDate = addMonths(new Date(), months);
  const PRESETS = [1, 3, 6, 12]; // Updated to allow 1 month minimum

  const handleCreate = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Invalid amount');
    if (amt > available) return toast.error(`Max available: ${available.toFixed(6)} ${sym}`);
    
    try { 
      await createVault({ 
        tokenAddress: token.address, 
        tokenSymbol: sym, 
        amount: amt, 
        lockMonths: months, 
        note 
      }); 
      setAmount('');
      setNote('');
      setMonths(3);
      onClose(); 
    } catch(e) { 
      // Errors are handled and toasted in Context, but we catch here to prevent modal close on fail
      console.error(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vault · ${sym}`}>
      <div className="flex flex-col w-full space-y-5 px-1">
        
        {/* On-Chain Smart Contract Warning */}
        {isNative ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5"/>
            <p className="text-red-700 dark:text-red-400 text-[13px] leading-relaxed font-medium">
              Native {sym} cannot be locked directly in this version of the smart contract. Please select a standard BEP20/ERC20 token.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
            <ShieldAlert size={18} className="text-brand-500 flex-shrink-0 mt-0.5"/>
            <p className="text-brand-700 dark:text-brand-300 text-[13px] leading-relaxed">
              Tokens are deposited into the decentralized Smart Contract. A <strong>10% penalty fee</strong> applies if you break the vault before the timer expires.
            </p>
          </div>
        )}

        <div className={isNative ? 'opacity-50 pointer-events-none grayscale' : ''}>
          {/* Amount Input */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-secondary">Deposit Amount</label>
              <button onClick={() => setAmount(available.toFixed(6))} className="text-brand-500 dark:text-brand-400 text-xs font-bold uppercase tracking-wide hover:opacity-80">
                Max: {available.toFixed(4)}
              </button>
            </div>
            <div className="relative">
              <input 
                className="w-full bg-slate-100 dark:bg-navy-900 border border-transparent focus:border-brand-500 rounded-2xl px-4 py-4 text-lg font-bold text-primary placeholder-slate-400 focus:outline-none transition-all" 
                type="number" 
                placeholder="0.00" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary font-bold">{sym}</span>
            </div>
            {amount && priceInfo.price > 0 && (
              <p className="text-secondary text-xs mt-2 font-medium">≈ {fmtNum(parseFloat(amount) * priceInfo.price)} USD</p>
            )}
          </div>

          {/* Time Slider */}
          <div className="mb-5">
            <label className="text-[13px] font-semibold text-secondary mb-3 block">Lock Duration</label>
            <div className="grid grid-cols-4 gap-2 mb-4 w-full">
              {PRESETS.map(m => (
                <button key={m} onClick={() => setMonths(m)}
                  className={`py-2.5 rounded-xl text-[13px] font-bold transition-all w-full ${months === m ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' : 'bg-slate-100 dark:bg-navy-900 text-secondary hover:text-primary'}`}>
                  {m} Month{m > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <input 
              type="range" 
              min={1} 
              max={60} 
              value={months} 
              onChange={e => setMonths(+e.target.value)} 
              className="w-full h-2 bg-slate-200 dark:bg-navy-800 rounded-lg appearance-none cursor-pointer accent-brand-500 mb-3"
            />
            <div className="flex justify-between items-center bg-slate-50 dark:bg-navy-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
              <span className="text-brand-500 font-bold text-sm">{months} Months</span>
              <span className="text-primary font-semibold text-sm">{format(unlockDate, 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="text-[13px] font-semibold text-secondary mb-2 block">Vault Note (Local)</label>
            <input 
              className="w-full bg-slate-100 dark:bg-navy-900 border border-transparent focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-primary placeholder-slate-400 focus:outline-none transition-all" 
              placeholder="e.g. Diamond Hands 💎" 
              value={note} 
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Receipt Card */}
          {amount && parseFloat(amount) > 0 && months >= 1 && (
            <div className="bg-slate-50 dark:bg-navy-900/80 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-white/5 space-y-2.5 w-full">
              <div className="flex justify-between items-center"><span className="text-secondary text-sm font-medium">Locking</span><span className="text-primary font-bold">{amount} {sym}</span></div>
              <div className="flex justify-between items-center"><span className="text-secondary text-sm font-medium">Unlocks On</span><span className="text-primary font-bold">{format(unlockDate, 'MMMM d, yyyy')}</span></div>
              <div className="flex justify-between items-center"><span className="text-secondary text-sm font-medium">Smart Contract Fee</span><span className="text-emerald-500 font-bold">0% (Free)</span></div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/10"><span className="text-secondary text-sm font-medium">Early Break Penalty</span><span className="text-red-500 font-bold">10%</span></div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            onClick={handleCreate} 
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > available || isNative} 
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-navy-800 disabled:text-slate-500 text-white font-bold text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-brand-500/25 disabled:shadow-none"
          >
            <Lock size={18} strokeWidth={2.5}/> 
            Confirm & Lock On-Chain
          </button>
        </div>
      </div>
    </Modal>
  );
}
