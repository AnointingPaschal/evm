import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { NETWORKS, shortAddr, formatBal } from '../utils/wallet';
import { fmtNum, fmtPct } from '../utils/api';
import {
  Send, QrCode, ArrowLeftRight, Key, Plus, RefreshCw, ChevronRight,
  Lock, Eye, EyeOff, Moon, Sun, TrendingUp, TrendingDown, Settings, ChevronDown
} from 'lucide-react';
import TokenAvatar from '../components/ui/TokenAvatar';
import AddTokenModal from '../components/modals/AddTokenModal';

export default function Home() {
  const { activeWallet, tokens, balances, prices, vaults, network, setNetwork, loadingBal, refreshBalances, wallets, switchWallet } = useWallet();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const net = NETWORKS[network];

  const nativeSym = net?.symbol || 'ETH';
  const nativeBal = parseFloat(balances?.native || '0');
  const nativePrice = prices?.[nativeSym]?.price || 0;
  const nativeUSD = nativeBal * nativePrice;

  const myTokens = tokens.filter(t => t.network === network);
  const totalUSD = myTokens.reduce((s, t) => {
    const b = parseFloat(balances[t.address.toLowerCase()] || '0');
    const p = prices[t.symbol?.toUpperCase()]?.price || 0;
    return s + b * p;
  }, nativeUSD);

  const activeVaults = vaults.filter(v => v.status === 'locked');
  const nativeChange = prices?.[nativeSym]?.change24h;

  const allTokens = [
    { address:'native', symbol:nativeSym, name:net?.name || 'Native', logo:null, isNative:true, decimals:18 },
    ...myTokens
  ];

  return (
    <div className="flex flex-col min-h-screen bg-app">
      {/* ── HEADER (App-like Gradient) ── */}
      <div className="header-bg px-5 pt-14 pb-12 relative z-10">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setShowWalletPicker(!showWalletPicker)}
            className="flex items-center gap-2 text-left bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors border border-white/10"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center text-white font-bold text-[10px]">
              {activeWallet?.name?.[0]?.toUpperCase() || 'W'}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-white text-sm font-semibold tracking-wide">{activeWallet?.name || 'Main Wallet'}</p>
                <ChevronDown size={14} className="text-white/70" />
              </div>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/5">
              {dark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
            <button onClick={() => refreshBalances()} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/5">
              <RefreshCw size={18} className={loadingBal ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Glassmorphic Wallet Picker Dropdown */}
        {showWalletPicker && (
          <div className="absolute top-28 left-5 right-5 z-50 bg-navy-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-slide-down">
            <div className="p-2">
              {wallets.map(w => (
                <button key={w.id} onClick={() => { switchWallet(w.id); setShowWalletPicker(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors text-left ${activeWallet?.id===w.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {w.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{w.name}</p>
                    <p className="text-white/50 text-xs font-mono mt-0.5">{shortAddr(w.address)}</p>
                  </div>
                  {activeWallet?.id===w.id && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-white/10 bg-black/20">
              <button onClick={() => { navigate('/onboarding'); setShowWalletPicker(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-cyan-400 hover:bg-white/5 text-sm font-semibold transition-colors">
                <Plus size={18}/> Add / Import Wallet
              </button>
            </div>
          </div>
        )}

        {/* Native-style Segmented Network Switcher */}
        <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-2xl mb-8 border border-white/5">
          {['ethereum','bsc'].map(n => (
            <button key={n} onClick={() => setNetwork(n)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${network===n ? 'bg-white text-navy-950 shadow-sm' : 'text-white/60 hover:text-white'}`}>
              {n==='ethereum' ? '⟠ Ethereum' : '◈ BNB Chain'}
            </button>
          ))}
        </div>

        {/* Balance Area */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2 text-white/60">
            <p className="text-sm font-medium tracking-wide">Total Balance</p>
            <button onClick={() => setHideBalance(!hideBalance)} className="hover:text-white transition-colors">
              {hideBalance ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
          <h1 className="text-white font-extrabold text-5xl tracking-tight mb-2">
            {hideBalance ? '••••••' : fmtNum(totalUSD)}
          </h1>
          <div className="flex flex-col items-center gap-1.5">
            {nativeChange != null && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${nativeChange >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {nativeChange >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                <span>{fmtPct(nativeChange)} Today</span>
              </div>
            )}
            {activeVaults.length > 0 && (
              <p className="text-white/50 text-xs flex items-center gap-1.5 mt-1">
                <Lock size={12} className="text-cyan-400" />
                {activeVaults.length} Active Vault{activeVaults.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3 px-2">
          {[
            { icon: Send, label: 'Send', to: '/send' },
            { icon: QrCode, label: 'Receive', to: '/receive' },
            { icon: ArrowLeftRight, label: 'Swap', to: '/swap' },
            { icon: Key, label: 'Export', to: '/settings' },
          ].map(({ icon: Icon, label, to }) => (
            <button key={label} onClick={() => navigate(to)} className="group flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[1.25rem] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 group-active:scale-95 transition-all shadow-lg">
                <Icon size={22} strokeWidth={2.5} />
              </div>
              <span className="text-white/80 text-[11px] font-semibold tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── ASSETS BOTTOM SHEET ── */}
      <div className="flex-1 bg-white dark:bg-navy-900 rounded-t-[2.5rem] -mt-6 pt-3 px-2 z-20 relative shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-white/10">
        
        {/* iOS style drag notch */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between px-4 mb-4">
          <span className="font-bold text-primary text-lg tracking-tight">Tokens</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-navy-800 rounded-full border border-slate-200 dark:border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
              <span className="text-secondary text-[11px] font-semibold">{net?.name || 'Connected'}</span>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center hover:bg-brand-500/20 transition-colors">
              <Plus size={18} strokeWidth={2.5}/>
            </button>
          </div>
        </div>

        {/* Token list */}
        <div className="px-2 pb-28">
          {allTokens.map(token => {
            const sym = token.symbol?.toUpperCase();
            const bal = token.isNative ? nativeBal : parseFloat(balances?.[token.address?.toLowerCase()] || '0');
            const p = prices?.[sym] || {};
            const usd = bal * (p.price || 0);
            const change = p.change24h;
            const ccLogo = !token.isNative && p.imageUrl ? p.imageUrl : null;
            const logo = ccLogo || token.logo;
            const locked = vaults.filter(v => v.status==='locked' && (token.isNative ? v.tokenAddress==='native' : v.tokenAddress?.toLowerCase()===token.address?.toLowerCase()))
              .reduce((s,v)=>s+parseFloat(v.amount||0),0);
              
            return (
              <button key={token.address} onClick={() => navigate(`/token/${token.isNative?'native':token.address}`)}
                className="w-full flex items-center justify-between p-3.5 mb-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all bg-transparent border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <TokenAvatar logo={logo} symbol={sym} size={48} className="shadow-sm rounded-full" />
                    {locked > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-navy-900 rounded-full flex items-center justify-center border-2 border-white dark:border-navy-900 shadow-sm">
                        <Lock size={10} className="text-cyan-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-primary text-base">{sym}</span>
                      {locked > 0 && <span className="bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">Locked</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-secondary text-[13px] font-medium">{token.name}</span>
                      {change != null && (
                        <span className={`text-[11px] font-semibold ${change>=0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {change >= 0 ? '+' : ''}{fmtPct(change)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-primary text-base tracking-tight">{hideBalance ? '••••' : formatBal(bal.toString(), 4)}</p>
                  <p className="text-secondary text-[13px] font-medium mt-0.5">{hideBalance ? '••' : fmtNum(usd)}</p>
                </div>
              </button>
            );
          })}

          {allTokens.length === 1 && (
            <div className="text-center py-12 px-5 bg-slate-50 dark:bg-navy-800/50 rounded-3xl mt-4 border border-dashed border-slate-200 dark:border-white/10">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-navy-700 flex items-center justify-center mx-auto mb-3">
                <Plus size={20} className="text-secondary" />
              </div>
              <p className="text-primary font-semibold mb-1">No Custom Tokens</p>
              <p className="text-secondary text-sm mb-4">Import tokens to track your portfolio.</p>
              <button onClick={() => setShowAdd(true)} className="bg-brand-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">
                Import Token
              </button>
            </div>
          )}
        </div>
      </div>

      <AddTokenModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
