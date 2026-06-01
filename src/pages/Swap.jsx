import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { NETWORKS, formatBal, isValidAddress } from '../utils/wallet';
import { fmtNum } from '../utils/api';
import { ArrowLeft, ArrowUpDown, ExternalLink, Info, ChevronDown } from 'lucide-react';
import TokenAvatar from '../components/ui/TokenAvatar';

export default function Swap() {
  const { tokens, balances, prices, network, activeWallet } = useWallet();
  const net = NETWORKS[network];
  const navigate = useNavigate();

  const allTokens = [
    { address:'native', symbol:net.symbol, name:net.name, decimals:18, isNative:true },
    ...tokens.filter(t=>t.network===network)
  ];

  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(Math.min(1, allTokens.length-1));
  const [amount, setAmount] = useState('');
  const [selectingFor, setSelectingFor] = useState(null); // 'from' | 'to'

  const fromToken = allTokens[fromIdx] || allTokens[0];
  const toToken = allTokens[toIdx] || allTokens[Math.min(1,allTokens.length-1)];
  const fromSym = fromToken?.symbol?.toUpperCase();
  const toSym = toToken?.symbol?.toUpperCase();

  const fromPrice = prices[fromSym]?.price || 0;
  const toPrice = prices[toSym]?.price || 0;
  const fromLogo = !fromToken?.isNative && prices[fromSym]?.imageUrl ? prices[fromSym].imageUrl : fromToken?.logo;
  const toLogo = !toToken?.isNative && prices[toSym]?.imageUrl ? prices[toSym].imageUrl : toToken?.logo;

  const fromBal = parseFloat(balances[fromToken?.isNative?'native':fromToken?.address?.toLowerCase()]||'0');
  const rate = fromPrice && toPrice ? fromPrice / toPrice : 0;
  const estOut = parseFloat(amount||'0') * rate;
  const fromUSD = parseFloat(amount||'0') * fromPrice;

  const swapDir = () => {
    const tmp = fromIdx;
    setFromIdx(toIdx);
    setToIdx(tmp);
    setAmount('');
  };

  // DEX links for executing swap
  const DEX_LINKS = {
    ethereum: [
      { name:'Uniswap', url:`https://app.uniswap.org/#/swap?inputCurrency=${fromToken?.isNative?'ETH':fromToken?.address}&outputCurrency=${toToken?.isNative?'ETH':toToken?.address}&chain=mainnet`, icon:'🦄', color:'#FF007A' },
      { name:'1inch', url:`https://app.1inch.io/#/1/unified/swap/${fromSym}/${toSym}`, icon:'🔮', color:'#2B64D0' },
      { name:'Paraswap', url:'https://app.paraswap.io/', icon:'⚡', color:'#26C3B4' },
      { name:'Curve', url:'https://curve.fi/#/ethereum/swap', icon:'🌊', color:'#3466AF' },
    ],
    bsc: [
      { name:'PancakeSwap', url:`https://pancakeswap.finance/swap?inputCurrency=${fromToken?.isNative?'BNB':fromToken?.address}&outputCurrency=${toToken?.isNative?'BNB':toToken?.address}`, icon:'🥞', color:'#1FC7D4' },
      { name:'1inch BSC', url:`https://app.1inch.io/#/56/unified/swap/${fromSym}/${toSym}`, icon:'🔮', color:'#2B64D0' },
      { name:'BiSwap', url:'https://exchange.biswap.org/swap', icon:'💎', color:'#3E68F1' },
    ],
  };
  const dexList = DEX_LINKS[network] || DEX_LINKS.ethereum;

  const TokenPicker = ({ value, onChange, exclude }) => (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-navy-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden animate-slide-down max-h-64 overflow-y-auto">
      {allTokens.filter((_,i)=>i!==exclude).map((t,i) => {
        const s = t.symbol?.toUpperCase();
        const p = prices[s]||{};
        const lg = !t.isNative && p.imageUrl ? p.imageUrl : t.logo;
        const b = parseFloat(balances[t.isNative?'native':t.address?.toLowerCase()]||'0');
        const ti = allTokens.indexOf(t);
        return (
          <button key={t.address} onClick={() => { onChange(ti); setSelectingFor(null); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors">
            <TokenAvatar logo={lg} symbol={s} size={36}/>
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
  );

  return (
    <div className="flex flex-col min-h-screen bg-app">
      <div className="header-bg px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-white font-bold text-lg">Swap</h1>
          <span className="ml-auto badge bg-white/15 text-white/70 text-[10px]">{net.name}</span>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-3 px-5 pt-6 pb-28">
        {/* Swap box */}
        <div className="relative mb-2">
          {/* From */}
          <div className="bg-slate-50 dark:bg-navy-900 rounded-3xl p-4 mb-2">
            <p className="text-secondary text-xs font-medium mb-3">You Pay</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <button onClick={() => setSelectingFor(selectingFor==='from'?null:'from')}
                  className="flex items-center gap-2 bg-white dark:bg-navy-800 rounded-2xl px-3 py-2.5 shadow-sm border border-slate-100 dark:border-white/10 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all">
                  <TokenAvatar logo={fromLogo} symbol={fromSym} size={28}/>
                  <span className="font-semibold text-primary text-sm">{fromSym}</span>
                  <ChevronDown size={14} className="text-secondary"/>
                </button>
                {selectingFor === 'from' && <TokenPicker value={fromIdx} onChange={setFromIdx} exclude={toIdx}/>}
              </div>
              <div className="flex-1 text-right">
                <input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}
                  className="w-full text-right text-xl font-bold text-primary bg-transparent focus:outline-none placeholder-slate-200 dark:placeholder-slate-700"/>
                <div className="flex justify-end gap-3 mt-1">
                  <span className="text-secondary text-xs">{fmtNum(fromUSD)}</span>
                  <button onClick={()=>setAmount(formatBal(fromBal.toString(),6))} className="text-brand-500 text-xs font-medium">Max</button>
                </div>
              </div>
            </div>
            <p className="text-secondary text-xs mt-2">Balance: {formatBal(fromBal.toString(),4)} {fromSym}</p>
          </div>

          {/* Swap direction button */}
          <div className="flex justify-center my-1 relative z-10">
            <button onClick={swapDir}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-navy-800 border-2 border-slate-100 dark:border-white/10 shadow-card flex items-center justify-center text-brand-500 hover:bg-brand-50 dark:hover:bg-navy-700 hover:border-brand-200 transition-all active:scale-90">
              <ArrowUpDown size={16}/>
            </button>
          </div>

          {/* To */}
          <div className="bg-slate-50 dark:bg-navy-900 rounded-3xl p-4 mt-1">
            <p className="text-secondary text-xs font-medium mb-3">You Receive (est.)</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <button onClick={() => setSelectingFor(selectingFor==='to'?null:'to')}
                  className="flex items-center gap-2 bg-white dark:bg-navy-800 rounded-2xl px-3 py-2.5 shadow-sm border border-slate-100 dark:border-white/10 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all">
                  <TokenAvatar logo={toLogo} symbol={toSym} size={28}/>
                  <span className="font-semibold text-primary text-sm">{toSym}</span>
                  <ChevronDown size={14} className="text-secondary"/>
                </button>
                {selectingFor === 'to' && <TokenPicker value={toIdx} onChange={setToIdx} exclude={fromIdx}/>}
              </div>
              <div className="flex-1 text-right">
                <p className="text-xl font-bold text-primary">{estOut > 0 ? estOut.toFixed(6) : '0.00'}</p>
                <p className="text-secondary text-xs mt-1">{fmtNum(estOut*toPrice)}</p>
              </div>
            </div>
            {rate > 0 && amount && (
              <p className="text-secondary text-xs mt-2 font-mono">1 {fromSym} ≈ {rate.toFixed(6)} {toSym}</p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-500/20 mb-5">
          <Info size={14} className="text-brand-500 flex-shrink-0 mt-0.5"/>
          <p className="text-brand-700 dark:text-brand-300 text-xs">Swaps execute via external DEX aggregators. Choose your preferred platform below for the best rates.</p>
        </div>

        {/* DEX buttons */}
        <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Swap on</p>
        <div className="grid grid-cols-2 gap-2">
          {dexList.map(dex => (
            <a key={dex.name} href={dex.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-white/5 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all group active:scale-95">
              <span className="text-2xl">{dex.icon}</span>
              <div className="flex-1">
                <p className="text-primary font-semibold text-sm">{dex.name}</p>
                <p className="text-secondary text-[10px]">Best rates</p>
              </div>
              <ExternalLink size={12} className="text-secondary group-hover:text-brand-500 transition-colors"/>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
