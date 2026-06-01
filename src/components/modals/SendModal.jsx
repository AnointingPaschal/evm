import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sendNative, sendToken, isValidAddress, formatBal } from '../../utils/wallet';
import Modal from '../ui/Modal';
import { AlertTriangle } from 'lucide-react';
import { fmtNum } from '../../utils/api';
import toast from 'react-hot-toast';

export default function SendModal({ isOpen, onClose, defaultToken }) {
  const { tokens, balances, prices, network, getKeys, sessionPwd, refreshBalances } = useWallet();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [pwd, setPwd] = useState('');
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const token = defaultToken;
  const sym = token?.symbol?.toUpperCase();
  const priceInfo = prices[sym]||{};
  const balKey = token?.isNative||token?.address==='native' ? 'native' : token?.address?.toLowerCase();
  const bal = parseFloat(balances[balKey]||'0');
  const usd = parseFloat(amount||'0')*(priceInfo.price||0);
  const valid = to && isValidAddress(to);

  const send = async () => {
    setLoading(true);
    try {
      const keys = getKeys(sessionPwd||pwd);
      if (token?.isNative||token?.address==='native') await sendNative(keys.privateKey, to, amount, network);
      else await sendToken(keys.privateKey, token.address, to, amount, token.decimals, network);
      toast.success(`Sent ${amount} ${sym}!`);
      setStep('form'); setTo(''); setAmount(''); setPwd(''); onClose();
      setTimeout(()=>refreshBalances(), 3000);
    } catch(e) { toast.error(e.message||'Failed'); }
    setLoading(false);
  };

  const close = () => { onClose(); setStep('form'); setTo(''); setAmount(''); setPwd(''); };

  return (
    <Modal isOpen={isOpen} onClose={close} title={`Send ${sym}`}>
      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="label">Recipient</label>
            <input className="input font-mono text-xs" placeholder="0x..." value={to} onChange={e=>setTo(e.target.value)}/>
            {to && !valid && <p className="text-red-500 text-xs mt-1">Invalid address</p>}
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="label mb-0">Amount</label>
              <button onClick={()=>setAmount(formatBal(bal.toString(),6))} className="text-brand-500 text-xs font-medium">Max: {formatBal(bal.toString(),4)}</button>
            </div>
            <input className="input font-mono" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/>
            {amount && usd > 0 && <p className="text-secondary text-xs mt-1">≈ {fmtNum(usd)}</p>}
          </div>
          {!sessionPwd && (
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Wallet password" value={pwd} onChange={e=>setPwd(e.target.value)}/>
            </div>
          )}
          <button onClick={()=>setStep('confirm')} disabled={!to||!amount||!valid||parseFloat(amount)<=0} className="btn-primary w-full py-4">Review</button>
        </div>
      )}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="card-inner divide-y divide-slate-100 dark:divide-white/5">
            {[{l:'Sending',v:`${amount} ${sym}`},{l:'Value',v:fmtNum(usd)},{l:'To',v:to.slice(0,12)+'...'+to.slice(-6),m:true}].map(({l,v,m})=>(
              <div key={l} className="flex justify-between py-3 px-4">
                <span className="text-secondary text-sm">{l}</span>
                <span className={`text-primary text-sm font-semibold ${m?'font-mono text-xs':''}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5"/>
            <p className="text-amber-700 dark:text-amber-300 text-xs">Irreversible — verify address before confirming.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>setStep('form')} className="btn-ghost">Back</button>
            <button onClick={send} disabled={loading} className="btn-primary">{loading?'Sending...':'Send'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
