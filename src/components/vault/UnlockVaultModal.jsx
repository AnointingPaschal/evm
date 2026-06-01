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
  const fee = isEarly ? parseFloat(vault.amount)*0.02 : 0;
  const sym = vault.tokenSymbol;
  const price = prices[sym?.toUpperCase()]?.price||0;
  const net = parseFloat(vault.amount)-fee;

  const handle = () => { unlockVault(vault.id, fee); onClose(); };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEarly?'Break Vault Early':'Unlock Vault'}>
      <div className="space-y-4">
        {isEarly && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5"/>
            <p className="text-red-700 dark:text-red-300 text-xs">Early unlock penalty: 2% fee. Vault unlocks on {format(new Date(vault.unlockAt),'MMM d, yyyy')}.</p>
          </div>
        )}
        <div className="card-inner divide-y divide-slate-100 dark:divide-white/5">
          {[{l:'Locked',v:`${vault.amount} ${sym}`},{l:'Fee',v:isEarly?`${fee.toFixed(6)} ${sym}`:'None'},{l:'You receive',v:`${net.toFixed(6)} ${sym}`},{l:'USD value',v:fmtNum(net*price)}].map(({l,v})=>(
            <div key={l} className="flex justify-between py-3 px-4">
              <span className="text-secondary text-sm">{l}</span>
              <span className="text-primary text-sm font-semibold">{v}</span>
            </div>
          ))}
        </div>
        {isEarly && (
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-navy-900">
            <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-0.5 accent-brand-500 flex-shrink-0"/>
            <span className="text-sm text-primary">I understand the 2% early fee will be deducted</span>
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handle} disabled={isEarly&&!confirmed} className={isEarly?'btn-danger':'btn-primary flex items-center justify-center gap-2'}>
            {isEarly?'Break & Unlock':<><Unlock size={14}/>Unlock</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
