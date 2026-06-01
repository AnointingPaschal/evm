import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { NETWORKS, formatBal } from '../utils/wallet';
import { fmtNum } from '../utils/api';
import { ArrowLeft, ArrowDown, Settings2, Info, ChevronDown, RefreshCcw } from 'lucide-react';
import TokenAvatar from '../components/ui/TokenAvatar';
import toast from 'react-hot-toast';

export default function Swap() {
  const { tokens, balances, prices, network, swapTokens, sessionPwd } = useWallet();
  const net = NETWORKS[network];
  const navigate = useNavigate();

  const allTokens = [
    { address:'native', symbol:net.symbol, name:net.name, decimals:18, isNative:true },
    ...tokens.filter(t => t.network === network)
  ];

  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(Math.min(1, allTokens.length - 1));
  const [amount, setAmount] = useState('');
  const [selectingFor, setSelectingFor] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const fromToken = allTokens[fromIdx] || allTokens[0];
  const toToken = allTokens[toIdx] || allTokens[Math.min(1, allTokens.length - 1)];
  const fromSym = fromToken?.symbol?.toUpperCase();
  const toSym = toToken?.symbol?.toUpperCase();

  const fromPrice = prices[fromSym]?.price || 0;
  const toPrice = prices[toSym]?.price || 0;
  const fromLogo = !fromToken?.isNative && prices[fromSym]?.imageUrl ? prices[fromSym].imageUrl : fromToken?.logo;
  const toLogo = !toToken?.isNative && prices[toSym]?.imageUrl ? prices[toSym].imageUrl : toToken?.logo;

  const fromBal = parseFloat(balances[fromToken?.isNative ? 'native' : fromToken?.address?.toLowerCase()] || '0');
  const rate = fromPrice && toPrice ? fromPrice / toPrice : 0;
  const estOut = parseFloat(amount || '0') * rate;
  const fromUSD = parseFloat(amount || '0') * fromPrice;

  const swapDir = () => {
    const tmp = fromIdx;
    setFromIdx(toIdx);
    setToIdx(tmp);
    setAmount('');
  };

  const handleSwap = async () => {
    if (!sessionPwd) {
      toast.error("Please unlock your wallet first to sign transactions.");
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > fromBal) return toast.error(`Insufficient ${fromSym} balance`);

    setIsSwapping(true);
    try {
      await swapTokens(fromToken, toToken, amount, estOut.toFixed(6));
      setAmount('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSwapping(false);
    }
  };

  const TokenPicker = ({ value, onChange, exclude }) => (
    <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 dark:bg-navy-800/95 backdrop-blur-2xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-white/10 z-50 overflow-hidden animate-slide-down max-h-[300px] overflow-y-auto">
      <div className="p-2 text-xs font-semibold text-secondary uppercase tracking-wider px-4 pt-3">Select Token</div>
      {allTokens.filter((_, i) => i !== exclude).map((t) => {
        const s = t.symbol?.toUpperCase();
        const p = prices[s] || {};
        const lg = !t.isNative && p.imageUrl ? p.imageUrl : t.logo;
        const b = parseFloat(balances[t.isNative ? 'native' : t.address?.toLowerCase()] || '0');
        const ti = allTokens.indexOf(t);
        return (
          <button key={t.address} onClick={() => { onChange(ti); setSelectingFor(null); }}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <TokenAvatar logo={lg} symbol={s} size={36} className="shadow-sm rounded-full"/>
              <div className="text-left">
                <p className="text-primary font-bold text-[15px]">{s}</p>
                <p className="text-secondary text-[12px] font-medium">{t.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary text-[14px] font-bold">{formatBal(b.toString(), 4)}</p>
              <p className="text-secondary text-[12px] font-medium">{fmtNum(b * (p.price || 0))}</p>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-app">
      <div className="header-bg px-5 pt-safe pb-8 relative z-10 flex flex-col pt-6">
        <div className="flex items-center justify-between z-20">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white transition-all">
            <ArrowLeft size={20} strokeWidth={2.5}/>
          </button>
          <h1 className="text-white font-bold text-lg tracking-wide">Swap</h1>
          <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white transition-all">
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-t-[32px] -mt-5 px-3 pt-6 pb-28 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-20 relative flex flex-col border-t border-default">
        <div className="relative mb-6">
          <div className="bg-slate-50 dark:bg-navy-900 rounded-[28px] p-4 pb-5 border border-slate-100 dark:border-white/5 relative z-10 hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <p className="text-secondary text-[13px] font-bold tracking-wide">You Pay</p>
              <p className="text-secondary text-[12px] font-semibold">Balance: <span className="text-primary font-bold">{formatBal(fromBal.toString(), 4)}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <button onClick={() => setSelectingFor(selectingFor === 'from' ? null : 'from')} className="flex items-center gap-2 bg-white dark:bg-navy-800 rounded-2xl px-3 py-2 shadow-sm border border-slate-200 dark:border-white/10 hover:shadow-md transition-all">
                  <TokenAvatar logo={fromLogo} symbol={fromSym} size={28} className="rounded-full"/>
                  <span className="font-bold text-primary text-[15px] tracking-tight">{fromSym}</span>
                  <ChevronDown size={16} className="text-secondary ml-1"/>
                </button>
                {selectingFor === 'from' && <TokenPicker value={fromIdx} onChange={setFromIdx} exclude={toIdx}/>}
              </div>
              <div className="flex-1 text-right flex flex-col items-end">
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full text-right text-[32px] font-extrabold text-primary bg-transparent focus:outline-none placeholder-slate-300 dark:placeholder-slate-700 tracking-tight"/>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-secondary text-[12px] font-semibold">{fmtNum(fromUSD)}</span>
                  <button onClick={() => setAmount(fromBal.toString())} className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-colors">Max</button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20">
            <button onClick={swapDir} className="w-12 h-12 rounded-[18px] bg-white dark:bg-navy-800 border-[4px] border-white dark:border-card shadow-lg flex items-center justify-center text-brand-500 hover:text-brand-600 hover:rotate-180 transition-all duration-300 active:scale-90">
              <ArrowDown size={20} strokeWidth={3}/>
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-navy-900 rounded-[28px] p-4 pt-6 mt-1 border border-slate-100 dark:border-white/5 relative z-0 hover:border-brand-200 dark:hover:border-brand-500/30 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <p className="text-secondary text-[13px] font-bold tracking-wide">You Receive (est.)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <button onClick={() => setSelectingFor(selectingFor === 'to' ? null : 'to')} className="flex items-center gap-2 bg-white dark:bg-navy-800 rounded-2xl px-3 py-2 shadow-sm border border-slate-200 dark:border-white/10 hover:shadow-md transition-all">
                  <TokenAvatar logo={toLogo} symbol={toSym} size={28} className="rounded-full"/>
                  <span className="font-bold text-primary text-[15px] tracking-tight">{toSym}</span>
                  <ChevronDown size={16} className="text-secondary ml-1"/>
                </button>
                {selectingFor === 'to' && <TokenPicker value={toIdx} onChange={setToIdx} exclude={fromIdx}/>}
              </div>
              <div className="flex-1 text-right">
                <input type="text" readOnly value={estOut > 0 ? estOut.toFixed(6) : ''} placeholder="0.00" className="w-full text-right text-[32px] font-extrabold text-primary bg-transparent focus:outline-none placeholder-slate-300 dark:placeholder-slate-700 tracking-tight"/>
                <p className="text-secondary text-[12px] font-semibold mt-1">{fmtNum(estOut * toPrice)}</p>
              </div>
            </div>
          </div>
        </div>

        {rate > 0 && (
          <div className="bg-slate-50 dark:bg-navy-900/50 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-secondary text-[13px] font-medium flex items-center gap-1.5"><Info size={14}/> Exchange Rate</span>
              <span className="text-primary text-[13px] font-bold">1 {fromSym} ≈ {rate.toFixed(4)} {toSym}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-[13px] font-medium">Max Slippage</span>
              <span className="text-primary text-[13px] font-bold">1.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-[13px] font-medium">Network Fee</span>
              <span className="text-emerald-500 text-[13px] font-bold">Standard Gas</span>
            </div>
          </div>
        )}

        <button onClick={handleSwap} disabled={!amount || parseFloat(amount) <= 0 || isSwapping} className="w-full mt-auto mb-2 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 dark:disabled:bg-navy-800 disabled:text-slate-400 text-white font-extrabold text-[16px] py-4 rounded-[20px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-brand-500/25 disabled:shadow-none">
          {isSwapping ? <><RefreshCcw size={18} className="animate-spin" strokeWidth={2.5}/> Routing Swap...</> : `Execute Swap`}
        </button>
      </div>
    </div>
  );
}
