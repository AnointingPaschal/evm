import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { sendNative, sendToken, isValidAddress, formatBal, NETWORKS } from '../utils/wallet';
import { fmtNum } from '../utils/api';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import TokenAvatar from '../components/ui/TokenAvatar';
import toast from 'react-hot-toast';

export default function Send() {
  const { tokens, balances, prices, network, getKeys, sessionPwd, refreshBalances } = useWallet();
  const net = NETWORKS[network];
  const navigate = useNavigate();

  const allTokens = [
    { address:'native', symbol:net.symbol, name:net.name, decimals:18, isNative:true },
    ...tokens.filter(t=>t.network===network)
  ];

  const [selectedAddr, setSelectedAddr] = useState('native');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [pwd, setPwd] = useState('');
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const token = allTokens.find(t=>t.address===selectedAddr)||allTokens[0];
  const sym = token?.symbol?.toUpperCase();
  const priceInfo = prices[sym]||{};
  const ccLogo = !token?.isNative && priceInfo.imageUrl;
  const logo = ccLogo || token?.logo;
  const balKey = token?.isNative ? 'native' : token?.address?.toLowerCase();
  const bal = parseFloat(balances[balKey]||'0');
  const usdEst = parseFloat(amount||'0')*(priceInfo.price||0);
  const toValid = to && isValidAddress(to);

  const send = async () => {
    setLoading(true);
    try {
      const keys = getKeys(sessionPwd||pwd);
      let tx;
      if (token.isNative) tx = await sendNative(keys.privateKey, to, amount, network);
      else tx = await sendToken(keys.privateKey, token.address, to, amount, token.decimals, network);
      setTxHash(tx.hash); setStep('done');
      setTimeout(() => refreshBalances(), 3000);
    } catch(e) { toast.error(e.message||'Failed'); }
    setLoading(false);
  };

  if (step === 'done') return (
    <div className="page flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
        <CheckCircle size={40} className="text-emerald-500"/>
      </div>
      <h2 className="text-primary font-bold text-xl mb-2">Sent!</h2>
      <p className="text-secondary text-sm mb-1">{amount} {sym}</p>
      <p className="text-secondary text-xs font-mono">{txHash?.slice(0,16)}...</p>
      <button onClick={() => { navigate('/history'); }} className="btn-primary mt-8 w-full">View History</button>
      <button onClick={() => { setStep('form');setTo('');setAmount('');setTxHash(''); }} className="btn-ghost mt-2 w-full">Send Again</button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-app">
      <div className="header-bg px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-white font-bold text-lg">Send</h1>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-3 px-5 pt-6 pb-28">
        {step === 'form' && (
          <div className="space-y-5">
            {/* Token selector */}
            <div>
              <label className="label">Select Token</label>
              <div className="space-y-2">
                {allTokens.map(t => {
                  const s = t.symbol?.toUpperCase();
                  const p = prices[s]||{};
                  const lg = !t.isNative && p.imageUrl ? p.imageUrl : t.logo;
                  const b = parseFloat(balances[t.isNative?'native':t.address?.toLowerCase()]||'0');
                  return (
                    <button key={t.address} onClick={() => setSelectedAddr(t.address)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${selectedAddr===t.address?'border-brand-500 bg-brand-50 dark:bg-brand-900/20':'border-transparent bg-slate-50 dark:bg-navy-900/50 hover:border-slate-200 dark:hover:border-white/10'}`}>
                      <TokenAvatar logo={lg} symbol={s} size={38}/>
                      <div className="flex-1">
                        <p className="text-primary font-semibold text-sm">{s}</p>
                        <p className="text-secondary text-xs">{t.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary text-sm font-medium">{formatBal(b.toString(),4)}</p>
                        <p className="text-secondary text-xs">{fmtNum(b*(p.price||0))}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">Recipient Address</label>
              <input className="input font-mono text-xs" placeholder="0x..." value={to} onChange={e=>setTo(e.target.value)}/>
              {to && !toValid && <p className="text-red-500 text-xs mt-1">Invalid address</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="label mb-0">Amount</label>
                <button onClick={()=>setAmount(formatBal(bal.toString(),6))} className="text-brand-500 text-xs font-medium">
                  Max: {formatBal(bal.toString(),4)} {sym}
                </button>
              </div>
              <input className="input font-mono" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/>
              {amount && usdEst > 0 && <p className="text-secondary text-xs mt-1.5">≈ {fmtNum(usdEst)}</p>}
            </div>

            {!sessionPwd && (
              <div>
                <label className="label">Wallet Password</label>
                <input className="input" type="password" placeholder="Enter password to sign" value={pwd} onChange={e=>setPwd(e.target.value)}/>
              </div>
            )}

            <button onClick={() => setStep('confirm')} disabled={!to||!amount||!toValid||parseFloat(amount)<=0} className="btn-primary w-full">
              Review Transaction
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full overflow-hidden">
                <TokenAvatar logo={logo} symbol={sym} size={56}/>
              </div>
            </div>
            <div className="card-inner divide-y divide-slate-100 dark:divide-white/5">
              {[
                {label:'Sending',v:`${amount} ${sym}`},
                {label:'USD Value',v:fmtNum(usdEst)},
                {label:'To',v:to.slice(0,10)+'...'+to.slice(-8),mono:true},
                {label:'Network',v:net.name},
              ].map(({label,v,mono})=>(
                <div key={label} className="flex justify-between items-center py-3 px-4">
                  <span className="text-secondary text-sm">{label}</span>
                  <span className={`text-primary text-sm font-semibold ${mono?'font-mono text-xs':''}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5"/>
              <p className="text-amber-700 dark:text-amber-300 text-xs">This transaction is irreversible. Double-check the address before confirming.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep('form')} className="btn-ghost">Back</button>
              <button onClick={send} disabled={loading} className="btn-primary">
                {loading ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
