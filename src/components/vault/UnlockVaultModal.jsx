import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import { Unlock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fmtNum } from '../../utils/api';

export default function UnlockVaultModal({ vault, onClose, token }) {
  const { unlockVault, prices } = useWallet();
  const [confirmed, setConfirmed] = useState(false);
  const isEarly = new Date() < new Date(vault.unlockAt);
  const fee = isEarly ? parseFloat(vault.amount) * 0.02 : 0;
  const sym = vault.tokenSymbol;
  const price = prices[sym?.toUpperCase()]?.price || 0;
  const netAmt = parseFloat(vault.amount) - fee;

  const handle = () => {
    unlockVault(vault.id, fee);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEarly ? '⚠️ Break Vault Early' : '🔓 Unlock Vault'} size="sm">
      <div className="space-y-4">
        {isEarly && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-red-300">Breaking early incurs a 2% penalty fee. Your vault unlocks on {format(new Date(vault.unlockAt),'MMM d, yyyy')}.</p>
          </div>
        )}
        <div className="p-4 rounded-xl bg-navy-800/60 border border-gold-500/8 space-y-2.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Locked Amount</span><span className="text-white font-mono">{vault.amount} {sym}</span></div>
          {isEarly && <><div className="flex justify-between"><span className="text-gray-500">Early Break Fee (2%)</span><span className="text-red-400 font-mono">-{fee.toFixed(6)} {sym}</span></div>
          <div className="border-t border-gold-500/8 pt-2 flex justify-between font-semibold"><span className="text-gray-400">You Receive</span><span className="text-white font-mono">{netAmt.toFixed(6)} {sym}</span></div></>}
          {!isEarly && <div className="flex justify-between font-semibold"><span className="text-gray-400">You Receive</span><span className="text-emerald-400 font-mono">{vault.amount} {sym}</span></div>}
          {price > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">USD Value</span><span className="text-gray-500">{fmtNum(netAmt * price)}</span></div>}
        </div>
        {isEarly && (
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-0.5 accent-gold-500"/>
            <span className="text-xs text-gray-400">I understand I will lose 2% as early unlock fee</span>
          </label>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handle} disabled={isEarly && !confirmed}
            className={isEarly ? 'btn-danger flex-1' : 'btn-primary flex-1 flex items-center justify-center gap-2'}>
            {isEarly ? 'Break & Unlock' : <><Unlock size={13}/>Unlock</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
