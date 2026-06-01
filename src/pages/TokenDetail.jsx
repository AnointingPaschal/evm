import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { NETWORKS, formatBal, shortAddr } from '../utils/wallet';
import { getCCOHLCV, getDexData, fmtNum, fmtPct } from '../utils/api';
import { ArrowLeft, Send, Download, RefreshCw, Lock, Unlock, TrendingUp, TrendingDown, ExternalLink, Trash2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import SendModal from '../components/token/SendModal';
import ReceiveModal from '../components/token/ReceiveModal';
import SwapModal from '../components/token/SwapModal';
import VaultModal from '../components/vault/VaultModal';
import UnlockVaultModal from '../components/vault/UnlockVaultModal';

export default function TokenDetail() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { tokens, balances, prices, vaults, network, activeWallet, removeToken } = useWallet();
  const netInfo = NETWORKS[network];
  const isNative = tokenId === 'native';

  const token = isNative
    ? { symbol: netInfo.symbol, name: netInfo.name, address: 'native', network, decimals: 18 }
    : tokens.find(t => t.address.toLowerCase() === tokenId.toLowerCase() && t.network === network);

  const [chartData, setChartData] = useState([]);
  const [dexData, setDexData] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('7d');
  const [loadingChart, setLoadingChart] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showUnlock, setShowUnlock] = useState(null);
  const [activeTab, setActiveTab] = useState('chart');

  const sym = token?.symbol?.toUpperCase();
  const priceData = prices[sym] || {};
  const balKey = isNative ? 'native' : token?.address?.toLowerCase();
  const rawBal = parseFloat(balances[balKey] || '0');
  
  const tokenVaults = vaults.filter(v => v.status === 'locked' && (isNative ? v.tokenAddress === 'native' : v.tokenAddress?.toLowerCase() === tokenId.toLowerCase()));
  const lockedAmt = tokenVaults.reduce((s,v) => s + parseFloat(v.amount||0), 0);
  const availBal = Math.max(0, rawBal - lockedAmt);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoadingChart(true);
      const limitMap = {'1d':24,'7d':168,'30d':720,'90d':2160};
      const data = await getCCOHLCV(sym, limitMap[chartPeriod] || 168);
      setChartData(data);
      if (!isNative) {
        const dd = await getDexData(token.address, network);
        setDexData(dd);
      }
      setLoadingChart(false);
    };
    load();
  }, [token, chartPeriod, network]);

  if (!token) return (
    <div className="p-6 text-center">
      <p className="text-gray-500 mb-4">Token not found</p>
      <button onClick={() => navigate('/dashboard')} className="btn-ghost">Back to Dashboard</button>
    </div>
  );

  const chartMin = chartData.length ? Math.min(...chartData.map(d=>d.close)) * 0.998 : 0;
  const chartMax = chartData.length ? Math.max(...chartData.map(d=>d.close)) * 1.002 : 0;
  const isPositive = priceData.change24h >= 0;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="glass-sm rounded-lg p-2.5 border border-gold-500/15 text-xs">
        <div className="text-gray-400 font-mono mb-1">{format(new Date(d.time), 'MMM d, HH:mm')}</div>
        <div className="font-display font-semibold text-white">{fmtNum(d.close)}</div>
      </div>
    );
  };

  const explorer = `${netInfo.explorer}/token/${token.address}`;

  return (
    <div className="p-5 max-w-2xl mx-auto animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/dashboard')} className="btn-icon flex-shrink-0">
          <ArrowLeft size={16}/>
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-navy-700 border border-gold-500/15">
          {token.logo
            ? <img src={token.logo} alt={sym} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}}/>
            : <div className="w-full h-full flex items-center justify-center font-bold text-sm text-gold-400">{sym?.[0]}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-lg text-white">{sym}</h1>
            <span className="text-gray-500 text-sm">{token.name}</span>
          </div>
          {!isNative && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-gray-700 font-mono">{shortAddr(token.address)}</span>
              <a href={explorer} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-gold-400 transition-colors">
                <ExternalLink size={10}/>
              </a>
            </div>
          )}
        </div>
        {!isNative && (
          <button onClick={() => removeToken(token.address)}
            className="btn-icon !text-red-500/40 hover:!text-red-400 hover:!border-red-500/30">
            <Trash2 size={14}/>
          </button>
        )}
      </div>

      {/* Price */}
      <div className="card mb-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{background:`radial-gradient(ellipse at top left, ${isPositive?'#10b98118':'#f8717118'}, transparent 70%)`}} />
        <div className="relative">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs text-gray-500 font-mono">Current Price</p>
              <div className="font-display font-bold text-3xl text-white mt-0.5">
                {priceData.price ? fmtNum(priceData.price) : '—'}
              </div>
            </div>
            <div className="text-right">
              {priceData.change24h != null && (
                <div className={`flex items-center gap-1 justify-end text-sm font-medium ${isPositive?'text-emerald-400':'text-red-400'}`}>
                  {isPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  {fmtPct(priceData.change24h)}
                </div>
              )}
              {priceData.change1h != null && (
                <div className={`text-xs mt-0.5 ${priceData.change1h>=0?'text-emerald-400/70':'text-red-400/70'}`}>
                  1h: {fmtPct(priceData.change1h)}
                </div>
              )}
            </div>
          </div>
          {/* Balance summary */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gold-500/8">
            <div>
              <p className="text-[10px] text-gray-600 font-mono">Available</p>
              <p className="text-sm font-display font-semibold text-white">{formatBal(availBal.toString(), 4)} {sym}</p>
              <p className="text-[11px] text-gray-600">{fmtNum(availBal * (priceData.price||0))}</p>
            </div>
            <div className="w-px h-8 bg-gold-500/10" />
            <div>
              <p className="text-[10px] text-gray-600 font-mono flex items-center gap-1"><Lock size={9} className="text-cyan-400"/>Locked</p>
              <p className="text-sm font-display font-semibold text-cyan-400">{formatBal(lockedAmt.toString(), 4)} {sym}</p>
              <p className="text-[11px] text-gray-600">{fmtNum(lockedAmt * (priceData.price||0))}</p>
            </div>
            <div className="w-px h-8 bg-gold-500/10" />
            <div>
              <p className="text-[10px] text-gray-600 font-mono">Total Held</p>
              <p className="text-sm font-display font-semibold text-white">{formatBal(rawBal.toString(), 4)} {sym}</p>
              <p className="text-[11px] text-gray-600">{fmtNum(rawBal * (priceData.price||0))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          {icon: Send, label:'Send', action:()=>setShowSend(true), color:'gold'},
          {icon: Download, label:'Receive', action:()=>setShowReceive(true), color:'gold'},
          {icon: RefreshCw, label:'Swap', action:()=>setShowSwap(true), color:'gold'},
          {icon: Lock, label:'Create Vault', action:()=>setShowVault(true), color:'cyan'},
        ].map(({icon:Icon, label, action, color}) => (
          <button key={label} onClick={action}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all group ${color==='cyan'
              ? 'bg-cyan-500/8 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/12'
              : 'bg-navy-800/50 border-gold-500/10 hover:border-gold-500/30 hover:bg-gold-500/8'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-shadow ${color==='cyan'
              ? 'bg-cyan-500/20 group-hover:shadow-md group-hover:shadow-cyan-500/20'
              : 'gold-gradient group-hover:shadow-md group-hover:shadow-gold-500/20'}`}>
              <Icon size={15} className={color==='cyan'?'text-cyan-400':'text-navy-900'}/>
            </div>
            <span className={`text-[11px] ${color==='cyan'?'text-cyan-400/80':'text-gray-400'} group-hover:text-${color==='cyan'?'cyan':'gray'}-200 transition-colors`}>{label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-navy-800/50 rounded-xl border border-gold-500/8">
        {['chart','metadata','vaults'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${activeTab===tab?'gold-gradient text-navy-900':'text-gray-500 hover:text-gray-300'}`}>
            {tab} {tab==='vaults' && tokenVaults.length > 0 && `(${tokenVaults.length})`}
          </button>
        ))}
      </div>

      {/* Chart Tab */}
      {activeTab === 'chart' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">Price Chart</h3>
            <div className="flex gap-1">
              {['1d','7d','30d','90d'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${chartPeriod===p?'gold-gradient text-navy-900 font-bold':'text-gray-600 hover:text-gray-400'}`}>{p}</button>
              ))}
            </div>
          </div>
          {loadingChart ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{top:0,right:0,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive?"#10b981":"#f87171"} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={isPositive?"#10b981":"#f87171"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tickFormatter={t=>format(new Date(t),'MM/dd')} tick={{fontSize:10,fill:'#4B5563'}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                <YAxis domain={[chartMin,chartMax]} tick={{fontSize:10,fill:'#4B5563'}} tickLine={false} axisLine={false} tickFormatter={v=>fmtNum(v)} width={55}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="close" stroke={isPositive?"#10b981":"#f87171"} strokeWidth={1.5} fill="url(#chartGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No chart data available</div>}
          {/* Price stats */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gold-500/8">
            {[
              {label:'24h High', value: fmtNum(priceData.high24h)},
              {label:'24h Low', value: fmtNum(priceData.low24h)},
              {label:'24h Volume', value: fmtNum(priceData.volume24h)},
              {label:'Market Cap', value: fmtNum(priceData.marketCap)},
            ].map(({label,value}) => (
              <div key={label} className="stat-card">
                <span className="stat-label">{label}</span>
                <span className="stat-value text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Tab */}
      {activeTab === 'metadata' && (
        <div className="space-y-3">
          {dexData ? (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">DEX Trading Data</h3>
                  <span className="badge badge-blue">{dexData.dexId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {label:'Price USD', value: dexData.priceUsd ? `$${parseFloat(dexData.priceUsd).toFixed(6)}` : '—'},
                    {label:'24h Change', value: fmtPct(dexData.priceChange24h), colored: true, val: dexData.priceChange24h},
                    {label:'1h Change', value: fmtPct(dexData.priceChange1h), colored: true, val: dexData.priceChange1h},
                    {label:'7d Change', value: fmtPct(dexData.priceChange7d), colored: true, val: dexData.priceChange7d},
                    {label:'24h Volume', value: fmtNum(dexData.volume24h)},
                    {label:'Liquidity', value: fmtNum(dexData.liquidity)},
                    {label:'Market Cap', value: fmtNum(dexData.marketCap)},
                    {label:'24h Buys', value: dexData.txns?.buys?.toString() || '—'},
                    {label:'24h Sells', value: dexData.txns?.sells?.toString() || '—'},
                    {label:'Total Txns', value: dexData.txns ? String((dexData.txns.buys||0)+(dexData.txns.sells||0)) : '—'},
                  ].map(({label,value,colored,val}) => (
                    <div key={label} className="stat-card">
                      <span className="stat-label">{label}</span>
                      <span className={`stat-value text-sm ${colored?(+val>=0?'text-emerald-400':'text-red-400'):''}`}>{value}</span>
                    </div>
                  ))}
                </div>
                {dexData.url && (
                  <a href={dexData.url} target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-300 transition-colors">
                    View on DexScreener <ExternalLink size={11}/>
                  </a>
                )}
              </div>
              {/* TradingView iframe */}
              <div className="card">
                <h3 className="text-sm font-medium text-gray-300 mb-3">TradingView Chart</h3>
                <div className="rounded-xl overflow-hidden border border-gold-500/8" style={{height:300}}>
                  <iframe
                    src={`https://www.tradingview.com/widgetembed/?symbol=${sym}USD&interval=D&theme=dark&style=1&locale=en&toolbar_bg=%230A1628&enable_publishing=false&hide_top_toolbar=true&hide_legend=false&save_image=false&hide_volume=false`}
                    width="100%" height="300" frameBorder="0" allowTransparency
                    title="TradingView" className="w-full h-full" />
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Token Info</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:'Symbol', value: sym},
                  {label:'Network', value: network.toUpperCase()},
                  {label:'Decimals', value: token.decimals?.toString()},
                  {label:'Contract', value: isNative ? 'Native' : shortAddr(token.address)},
                  {label:'Market Cap', value: fmtNum(priceData.marketCap)},
                  {label:'24h Volume', value: fmtNum(priceData.volume24h)},
                  {label:'Circulating Supply', value: priceData.supply ? fmtNum(priceData.supply,'') : '—'},
                ].map(({label,value}) => (
                  <div key={label} className="stat-card">
                    <span className="stat-label">{label}</span>
                    <span className="stat-value text-sm">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vaults Tab */}
      {activeTab === 'vaults' && (
        <div className="space-y-3">
          <button onClick={() => setShowVault(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-cyan-500/25 text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-sm">
            <Lock size={15}/> Create New Vault for {sym}
          </button>
          {tokenVaults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">No active vaults for {sym}</p>
              <p className="text-gray-700 text-xs mt-1">Lock tokens to enforce saving discipline</p>
            </div>
          ) : tokenVaults.map(v => {
            const unlockDate = new Date(v.unlockAt);
            const now = new Date();
            const isUnlockable = now >= unlockDate;
            const daysLeft = Math.max(0, Math.ceil((unlockDate - now) / 86400000));
            const progress = Math.min(100, Math.max(0, 100 - (daysLeft / (v.lockMonths * 30)) * 100));
            return (
              <div key={v.id} className={`card border ${isUnlockable ? 'border-emerald-500/25' : 'border-cyan-500/15'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock size={14} className={isUnlockable ? 'text-emerald-400' : 'text-cyan-400'} />
                      <span className="font-display font-semibold text-white">{v.amount} {sym}</span>
                      <span className="text-xs text-gray-500">{fmtNum(parseFloat(v.amount) * (priceData.price||0))}</span>
                    </div>
                    {v.note && <p className="text-xs text-gray-600 mt-0.5 ml-5">{v.note}</p>}
                  </div>
                  {isUnlockable
                    ? <span className="badge badge-green">Ready</span>
                    : <span className="badge badge-blue">{daysLeft}d left</span>}
                </div>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-600 font-mono mb-1">
                    <span>{format(new Date(v.createdAt),'MMM d, yyyy')}</span>
                    <span>{format(unlockDate,'MMM d, yyyy')}</span>
                  </div>
                  <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isUnlockable?'bg-emerald-500':'bg-cyan-500'}`} style={{width:`${progress}%`}} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Clock size={10}/> Locked {v.lockMonths} month{v.lockMonths!==1?'s':''}
                  <span>· Created {format(new Date(v.createdAt),'MMM d')}</span>
                </div>
                {isUnlockable ? (
                  <button onClick={() => setShowUnlock(v)} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/25 transition-all">
                    <Unlock size={13}/> Unlock Vault
                  </button>
                ) : (
                  <button onClick={() => setShowUnlock(v)} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/70 text-xs hover:bg-red-500/15 transition-all">
                    Break Vault (fee applies)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SendModal isOpen={showSend} onClose={() => setShowSend(false)} defaultToken={token} />
      <ReceiveModal isOpen={showReceive} onClose={() => setShowReceive(false)} />
      <SwapModal isOpen={showSwap} onClose={() => setShowSwap(false)} defaultToken={token} />
      <VaultModal isOpen={showVault} onClose={() => setShowVault(false)} token={token} />
      {showUnlock && <UnlockVaultModal vault={showUnlock} onClose={() => setShowUnlock(null)} token={token} />}
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-sm rounded-lg p-2.5 border border-gold-500/15 text-xs">
      <div className="text-gray-400 font-mono mb-1">{format(new Date(d.time), 'MMM d HH:mm')}</div>
      <div className="font-display font-semibold text-white">{fmtNum(d.close)}</div>
    </div>
  );
}
