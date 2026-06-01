import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { NETWORKS, formatBal, shortAddr } from '../utils/wallet';
import { getCCOHLCV, getDexData, fmtNum, fmtPct } from '../utils/api';
import { ArrowLeft, Send, QrCode, ArrowLeftRight, Lock, Unlock, TrendingUp, TrendingDown, ExternalLink, Trash2, Plus, Clock, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import TokenAvatar from '../components/ui/TokenAvatar';
import SendModal from '../components/modals/SendModal';
import VaultModal from '../components/vault/VaultModal';
import UnlockVaultModal from '../components/vault/UnlockVaultModal';

export default function TokenDetail() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { tokens, balances, prices, vaults, network, removeToken } = useWallet();
  const net = NETWORKS[network];
  const isNative = tokenId === 'native';
  const token = isNative
    ? { symbol: net.symbol, name: net.name, address: 'native', network, decimals: 18, isNative: true }
    : tokens.find(t => t.address?.toLowerCase() === tokenId?.toLowerCase() && t.network === network);

  const [tab, setTab] = useState('overview');
  const [chartData, setChartData] = useState([]);
  const [dexData, setDexData] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [loadingChart, setLoadingChart] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState(null);

  const sym = token?.symbol?.toUpperCase();
  const priceInfo = prices[sym] || {};
  const ccLogo = !isNative && priceInfo.imageUrl ? priceInfo.imageUrl : null;
  const logo = ccLogo || token?.logo;
  const balKey = isNative ? 'native' : token?.address?.toLowerCase();
  const rawBal = parseFloat(balances[balKey] || '0');
  const tokenVaults = vaults.filter(v => v.status==='locked' && (isNative ? v.tokenAddress==='native' : v.tokenAddress?.toLowerCase()===tokenId?.toLowerCase()));
  const locked = tokenVaults.reduce((s,v) => s+parseFloat(v.amount||0), 0);
  const available = Math.max(0, rawBal - locked);
  const isUp = priceInfo.change24h >= 0;

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoadingChart(true);
      const limits = {'1d':24,'7d':168,'30d':720,'90d':2160};
      const data = await getCCOHLCV(sym, limits[period]||168);
      setChartData(data);
      if (!isNative && token.address) {
        const d = await getDexData(token.address, network);
        setDexData(d);
      }
      setLoadingChart(false);
    };
    load();
  }, [token, period, network]);

  if (!token) return (
    <div className="page text-center pt-20">
      <p className="text-secondary mb-4">Token not found</p>
      <button onClick={() => navigate('/home')} className="btn-primary">Go Home</button>
    </div>
  );

  const chartMin = chartData.length ? Math.min(...chartData.map(d=>d.close))*0.999 : 0;
  const chartMax = chartData.length ? Math.max(...chartData.map(d=>d.close))*1.001 : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-navy-800 rounded-xl px-3 py-2 border border-white/10 text-xs shadow-xl">
        <p className="text-white/50 font-mono mb-0.5">{format(new Date(d.time),'MMM d, HH:mm')}</p>
        <p className="text-white font-semibold">{fmtNum(d.close)}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-app">
      {/* Header */}
      <div className="header-bg px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft size={18}/>
          </button>
          <div className="flex items-center gap-3 flex-1">
            <TokenAvatar logo={logo} symbol={sym} size={38} />
            <div>
              <h1 className="text-white font-bold text-lg leading-none">{sym}</h1>
              <p className="text-white/50 text-xs mt-0.5">{token.name}</p>
            </div>
          </div>
          {!isNative && (
            <button onClick={() => { if(confirm(`Remove ${sym}?`)) { removeToken(token.address); navigate('/home'); }}}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors">
              <Trash2 size={16}/>
            </button>
          )}
        </div>

        {/* Price */}
        <div className="mb-1">
          <p className="text-white font-bold text-3xl">{priceInfo.price ? fmtNum(priceInfo.price) : '—'}</p>
          <div className="flex items-center gap-3 mt-1">
            {priceInfo.change24h != null && (
              <div className={`flex items-center gap-1 text-sm font-medium ${isUp?'text-emerald-400':'text-red-400'}`}>
                {isUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                {fmtPct(priceInfo.change24h)} (24h)
              </div>
            )}
            {priceInfo.change1h != null && (
              <span className={`text-xs ${priceInfo.change1h>=0?'text-emerald-400/70':'text-red-400/70'}`}>1h: {fmtPct(priceInfo.change1h)}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { icon: Send, label: 'Send', action: () => setShowSend(true) },
            { icon: QrCode, label: 'Receive', action: () => navigate('/receive') },
            { icon: ArrowLeftRight, label: 'Swap', action: () => navigate('/swap') },
            { icon: Lock, label: 'Vault', action: () => setShowVault(true) },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action} className="action-btn">
              <div className={`action-btn-icon ${label==='Vault'?'bg-cyan-500/30':'bg-white/15'}`}>
                <Icon size={19} className={label==='Vault'?'text-cyan-300':''} />
              </div>
              <span className="text-white/80 text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Balance strip */}
      <div className="bg-white dark:bg-navy-800 px-5 py-4 flex items-center gap-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex-1">
          <p className="text-secondary text-[11px] font-medium">Available</p>
          <p className="text-primary font-semibold text-base">{formatBal(available.toString(),4)} {sym}</p>
          <p className="text-secondary text-xs">{fmtNum(available*(priceInfo.price||0))}</p>
        </div>
        {locked > 0 && (
          <>
            <div className="w-px h-10 bg-slate-100 dark:bg-white/10" />
            <div className="flex-1">
              <p className="text-[11px] font-medium text-cyan-500 flex items-center gap-1"><Lock size={9}/>Locked</p>
              <p className="text-cyan-600 dark:text-cyan-400 font-semibold text-base">{formatBal(locked.toString(),4)} {sym}</p>
              <p className="text-secondary text-xs">{fmtNum(locked*(priceInfo.price||0))}</p>
            </div>
          </>
        )}
        <div className="w-px h-10 bg-slate-100 dark:bg-white/10" />
        <div className="flex-1">
          <p className="text-secondary text-[11px] font-medium">Total</p>
          <p className="text-primary font-semibold text-base">{formatBal(rawBal.toString(),4)} {sym}</p>
          <p className="text-secondary text-xs">{fmtNum(rawBal*(priceInfo.price||0))}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-navy-800 flex border-b border-slate-100 dark:border-white/5 sticky top-0 z-10">
        {['overview','vault'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3.5 text-sm font-semibold transition-all capitalize border-b-2 ${tab===t?'border-brand-500 text-brand-500':'border-transparent text-secondary hover:text-primary'}`}>
            {t} {t==='vault'&&tokenVaults.length>0&&`(${tokenVaults.length})`}
          </button>
        ))}
      </div>

      {/* Overview Tab: chart + metadata */}
      {tab === 'overview' && (
        <div className="bg-white dark:bg-navy-800 flex-1 pb-28">
          {/* Chart */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-primary text-sm font-semibold">Price Chart</span>
              <div className="flex gap-1">
                {['1d','7d','30d','90d'].map(p => (
                  <button key={p} onClick={()=>setPeriod(p)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${period===p?'bg-brand-500 text-white':'bg-slate-100 dark:bg-navy-700 text-secondary hover:text-primary'}`}>{p}</button>
                ))}
              </div>
            </div>
            {loadingChart ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isUp?"#10b981":"#ef4444"} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={isUp?"#10b981":"#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tickFormatter={t=>format(new Date(t),'M/d')} tick={{fontSize:9,fill:'#94a3b8'}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                  <YAxis domain={[chartMin,chartMax]} tick={{fontSize:9,fill:'#94a3b8'}} tickLine={false} axisLine={false} tickFormatter={v=>fmtNum(v)} width={52}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="close" stroke={isUp?"#10b981":"#ef4444"} strokeWidth={2} fill="url(#cg)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-secondary text-sm">No chart data</div>
            )}
          </div>

          {/* Quick stats */}
          <div className="px-5 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                {label:'24h High', v:fmtNum(priceInfo.high24h)},
                {label:'24h Low', v:fmtNum(priceInfo.low24h)},
                {label:'24h Volume', v:fmtNum(priceInfo.volume24h)},
                {label:'Market Cap', v:fmtNum(priceInfo.marketCap)},
              ].map(({label,v}) => (
                <div key={label} className="stat-item">
                  <p className="stat-label">{label}</p>
                  <p className="stat-value">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* DEX metadata */}
          {dexData && (
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-primary font-semibold text-sm">DEX Data</p>
                <span className="badge badge-blue">{dexData.dexId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:'Price (DEX)', v:`$${parseFloat(dexData.priceUsd||0).toFixed(6)}`},
                  {label:'24h Change', v:fmtPct(dexData.priceChange24h), colored:true, val:dexData.priceChange24h},
                  {label:'24h Volume', v:fmtNum(dexData.volume24h)},
                  {label:'Liquidity', v:fmtNum(dexData.liquidity)},
                  {label:'Market Cap', v:fmtNum(dexData.marketCap)},
                  {label:'24h Buys', v:dexData.txns?.buys?.toString()||'—'},
                  {label:'24h Sells', v:dexData.txns?.sells?.toString()||'—'},
                  {label:'Total Txns', v:dexData.txns?String((dexData.txns.buys||0)+(dexData.txns.sells||0)):'—'},
                ].map(({label,v,colored,val}) => (
                  <div key={label} className="stat-item">
                    <p className="stat-label">{label}</p>
                    <p className={`stat-value ${colored?(+val>=0?'up':'down'):''}`}>{v}</p>
                  </div>
                ))}
              </div>
              {dexData.url && (
                <a href={dexData.url} target="_blank" rel="noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-brand-500 text-xs font-medium">
                  View on DexScreener <ExternalLink size={11}/>
                </a>
              )}
            </div>
          )}

          {/* Token info */}
          {!isNative && (
            <div className="px-5 pb-4">
              <p className="text-primary font-semibold text-sm mb-3">Token Info</p>
              <div className="card-inner p-3 space-y-2">
                {[
                  {label:'Contract', v:shortAddr(token.address,8)},
                  {label:'Network', v:network.toUpperCase()},
                  {label:'Decimals', v:String(token.decimals)},
                ].map(({label,v}) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-secondary text-xs">{label}</span>
                    <span className="text-primary text-xs font-mono font-medium">{v}</span>
                  </div>
                ))}
                <a href={`${NETWORKS[network].explorer}/token/${token.address}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-brand-500 text-xs font-medium pt-1">
                  View on Explorer <ExternalLink size={11}/>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vault Tab */}
      {tab === 'vault' && (
        <div className="flex-1 bg-white dark:bg-navy-800 pb-28">
          <div className="px-5 pt-4 pb-3">
            <button onClick={() => setShowVault(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-brand-200 dark:border-brand-900/50 text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-sm font-medium mb-4">
              <Plus size={16}/> Create Vault for {sym}
            </button>

            {tokenVaults.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-slate-100 dark:bg-navy-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={24} className="text-secondary" />
                </div>
                <p className="text-primary font-medium mb-1">No active vaults</p>
                <p className="text-secondary text-sm">Lock tokens to save with discipline</p>
                <p className="text-secondary text-xs mt-1">Minimum 2 months · 2% early break fee</p>
              </div>
            ) : tokenVaults.map(v => {
              const unlockDate = new Date(v.unlockAt);
              const now = new Date();
              const isReady = now >= unlockDate;
              const daysLeft = Math.max(0, Math.ceil((unlockDate - now) / 86400000));
              const totalDays = v.lockMonths * 30;
              const elapsed = Math.max(0, totalDays - daysLeft);
              const progress = Math.min(100, (elapsed / totalDays) * 100);
              return (
                <div key={v.id} className={`card-inner p-4 mb-3 border ${isReady?'border-emerald-200 dark:border-emerald-500/30':'border-cyan-100 dark:border-cyan-500/20'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock size={14} className={isReady?'text-emerald-500':'text-cyan-500'}/>
                        <span className="font-semibold text-primary">{v.amount} {sym}</span>
                        <span className="text-secondary text-xs">{fmtNum(parseFloat(v.amount)*(priceInfo.price||0))}</span>
                      </div>
                      {v.note && <p className="text-secondary text-xs mt-0.5 ml-5">{v.note}</p>}
                    </div>
                    {isReady ? <span className="badge badge-green">Ready</span> : <span className="badge badge-cyan">{daysLeft}d left</span>}
                  </div>
                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-secondary font-mono mb-1">
                      <span>{format(new Date(v.createdAt),'MMM d')}</span>
                      <span>{format(unlockDate,'MMM d, yyyy')}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isReady?'bg-emerald-500':'bg-cyan-500'}`} style={{width:`${progress}%`}}/>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-secondary mb-3">
                    <Clock size={10}/> {v.lockMonths} month lock · Created {format(new Date(v.createdAt),'MMM d, yyyy')}
                  </div>
                  {isReady ? (
                    <button onClick={() => setUnlockTarget(v)} className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2 text-sm">
                      <Unlock size={14}/> Unlock Vault
                    </button>
                  ) : (
                    <button onClick={() => setUnlockTarget(v)} className="w-full btn-danger py-2.5 text-xs">
                      Break Early (2% fee)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SendModal isOpen={showSend} onClose={() => setShowSend(false)} defaultToken={token} />
      <VaultModal isOpen={showVault} onClose={() => setShowVault(false)} token={token} />
      {unlockTarget && <UnlockVaultModal vault={unlockTarget} onClose={() => setUnlockTarget(null)} token={token} />}
    </div>
  );
}
