import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import { Unlock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fmtNum } from '../../utils/api';

export default function UnlockVaultModal({ vault, onClose }) {
  const { unlockVault, prices } = useWallet();
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Smart Contract Logic
  const isEarly = Date.now() < new Date(vault.unlockAt).getTime();
  const penaltyPercent = 0.10; // 10% Smart Contract Fee
  const fee = isEarly ? parseFloat(vault.amount) * penaltyPercent : 0;
  const sym = vault.tokenSymbol;
  const price = prices[sym?.toUpperCase()]?.price || 0;
  const net = parseFloat(vault.amount) - fee;

  const handleUnlock = async () => {
    setIsSubmitting(true);
    try {
      // The context uses the presence of a fee to trigger the 'breakVault' contract function
      await unlockVault(vault.id, fee); 
      onClose();
    } catch (error) {
      console.error("Unlock failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEarly ? 'Break Vault Early' : 'Unlock Vault'}>
      <div className="flex flex-col w-full space-y-5 px-1">
        
        {/* Status Banner */}
        {isEarly ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5"/>
            <div className="text-red-700 dark:text-red-400 text-[13px] leading-relaxed">
              <p className="font-bold mb-1">Time Lock Active</p>
              <p className="font-medium">Breaking this vault before <span className="font-bold">{format(new Date(vault.unlockAt), 'MMM d, yyyy')}</span> incurs a permanent <strong>10% smart contract penalty</strong>.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5"/>
            <div className="text-emerald-700 dark:text-emerald-400 text-[13px] leading-relaxed">
              <p className="font-bold mb-1">Vault Unlocked</p>
              <p className="font-medium">The time lock has expired. You can withdraw your tokens with zero penalty fees.</p>
            </div>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="bg-slate-50 dark:bg-navy-900/80 rounded-2xl p-2 border border-slate-100 dark:border-white/5 w-full">
          {[
            { l: 'Total Locked', v: `${parseFloat(vault.amount).toFixed(4)} ${sym}`, color: 'text-primary' },
            { l: 'Smart Contract Fee', v: isEarly ? `-${fee.toFixed(4)} ${sym} (10%)` : 'None (0%)', color: isEarly ? 'text-red-500' : 'text-emerald-500' },
            { l: 'You Receive', v: `${net.toFixed(4)} ${sym}`, color: 'text-primary font-bold' },
            { l: 'Est. USD Value', v: fmtNum(net * price), color: 'text-secondary' }
          ].map(({ l, v, color }, i) => (
            <div key={l} className={`flex justify-between items-center py-3 px-3 ${i !== 0 ? 'border-t border-slate-200 dark:border-white/5' : ''}`}>
              <span className="text-secondary text-[13px] font-medium">{l}</span>
              <span className={`text-[13px] ${color}`}>{v}</span>
            </div>
          ))}
        </div>

        {/* Confirmation Checkbox (Only if breaking early) */}
        {isEarly && (
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors">
            <input 
              type="checkbox" 
              checked={confirmed} 
              onChange={e => setConfirmed(e.target.checked)} 
              className="mt-0.5 w-4 h-4 rounded text-brand-500 accent-brand-500 flex-shrink-0 cursor-pointer"
            />
            <span className="text-[13px] font-medium text-primary">
              I understand that {fee.toFixed(4)} {sym} will be permanently deducted from my deposit.
            </span>
          </label>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-[14px] py-3.5 rounded-xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUnlock} 
            disabled={isSubmitting || (isEarly && !confirmed)} 
            className={`font-bold text-[14px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:shadow-none active:scale-[0.98] ${
              isEarly 
                ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white shadow-red-500/25' 
                : 'bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white shadow-brand-500/25'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : isEarly ? (
              'Break Vault'
            ) : (
              <><Unlock size={16} /> Withdraw Tokens</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
