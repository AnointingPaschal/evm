import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sendNative, sendToken, isValidAddress, formatBal } from '../../utils/wallet';
import Modal from '../ui/Modal';
import { AlertTriangle, Send, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { fmtNum } from '../../utils/api';

export default function SendModal({ isOpen, onClose, defaultToken }) {
  const { tokens, balances, prices, network, getKeys, sessionPwd, refreshBalances } = useWallet();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(defaultToken?.address || 'native');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // form | confirm | done

  const nativeSymbol = network === 'ethereum' ? 'ETH' : 'BNB';
  const tokenOpts = [
    { address: 'native', symbol: nativeSymbol, decimals: 18 },
    ...tokens.filter(t => t.network === network)
  ];
  const token = tokenOpts.find(t => t.address === selectedToken) || tokenOpts[0];
  const sym = token?.symbol?.toUpperCase();
  const balKey = selectedToken === 'native' ? 'native' : selectedToken?.toLowerCase();
  const bal = parseFloat(balances[balKey] || '0');
  const price = prices[sym]?.price || 0;
  const usdEst = parseFloat(amount || '0') * price;

  const send = async () => {
    setLoading(true);
    try {
      const keys = getKeys(sessionPwd || pwd);
      let tx;
      if (selectedToken === 'native') {
        tx = await sendNative(keys.privateKey, to, amount, network);
      } else {
        tx = await sendToken(keys.privateKey, token.address, to, amount, token.decimals, network);
      }
      toast.success(`Sent! TX: ${tx.hash.slice(0,10)}...`);
      setStep('done');
      setTimeout(() => { refreshBalances(); onClose(); setStep('form'); setTo(''); setAmount(''); setPwd(''); }, 2000);
    } catch (e) { toast.error(e.message || 'Transaction failed'); }
    setLoading(false);
  };

  const handleClose = () => { onClose(); setStep('form'); setTo(''); setAmount(''); setPwd(''); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send" size="sm">
      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="label">Token</label>
            <select className="input" value={selectedToken} onChange={e=>setSelectedToken(e.target.value)}>
              {tokenOpts.map(t => <option key={t.address} value={t.address}>{t.symbol?.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recipient Address</label>
            <input className="input font-mono text-xs" placeholder="0x..." value={to} onChange={e=>setTo(e.target.value)} />
            {to && !isValidAddress(to) && <p className="text-[11px] text-red-400 mt-1">Invalid address</p>}
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="label mb-0">Amount</label>
              <button onClick={() => setAmount(formatBal(bal.toString(),6))} className="text-[11px] text-gold-400 hover:text-gold-300">
                Max: {formatBal(bal.toString(),4)} {sym}
              </button>
            </div>
            <input className="input font-mono" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} />
            {amount && price > 0 && <p className="text-[11px] text-gray-600 mt-1">≈ {fmtNum(usdEst)}</p>}
          </div>
          {!sessionPwd && (
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPwd?'text':'password'} placeholder="Wallet password" value={pwd} onChange={e=>setPwd(e.target.value)} />
                <button onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"><EyeOff size={14}/></button>
              </div>
            </div>
          )}
          <button onClick={() => setStep('confirm')} disabled={!to || !amount || !isValidAddress(to) || parseFloat(amount)<=0}
            className="btn-primary w-full">Review Transaction</button>
        </div>
      )}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-navy-800/60 border border-gold-500/10 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sending</span>
              <span className="font-display font-semibold text-white">{amount} {sym}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">USD Value</span>
              <span className="text-gray-300">{fmtNum(usdEst)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">To</span>
              <span className="font-mono text-xs text-gray-300 break-all">{to}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Network</span>
              <span className="text-gray-300">{network.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-300">Double-check the address. Blockchain transactions are irreversible.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('form')} className="btn-ghost flex-1">Back</button>
            <button onClick={send} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Sending...' : <><Send size={13} className="inline mr-1"/>Confirm Send</>}
            </button>
          </div>
        </div>
      )}
      {step === 'done' && (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Send size={24} className="text-emerald-400" />
          </div>
          <p className="font-display font-semibold text-white mb-1">Transaction Sent!</p>
          <p className="text-xs text-gray-500">Waiting for confirmation...</p>
        </div>
      )}
    </Modal>
  );
}
