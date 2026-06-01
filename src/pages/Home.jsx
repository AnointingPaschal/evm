import { useState, useEffect } from 'react';
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

  const nativeSym = net.symbol;
  const nativeBal = parseFloat(balances.native || '0');
  const nativePrice = prices[nativeSym]?.price || 0;
  const nativeUSD = nativeBal * nativePrice;

  const myTokens = tokens.filter(t => t.network === network);
  const totalUSD = myTokens.reduce((s, t) => {
    const b = parseFloat(balances[t.address.toLowerCase()] || '0');
    const p = prices[t.symbol?.toUpperCase()]?.price || 0;
    return s + b * p;
  }, nativeUSD);

  const activeVaults = vaults.filter(v => v.status === 'locked');
  const nativeChange = prices[nativeSym]?.change24h;

  const allTokens = [
    { address:'native', symbol:nativeSym, name:net.name, logo:null, isNative:true, decimals:18 },
    ...myTokens
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HEADER (always dark) ── */}
      <div className="header-bg px-5 pt-12 pb-6 relative">
        {/* top bar */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setShowWalletPicker(!showWalletPicker)}
            className="flex items-center gap-2 text-left">
            <div>
              <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">{activeWallet?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-white/80 text-xs font-mono">{shortAddr(activeWallet?.address, 8)}</p>
                <ChevronDown size={12} className="text-white/50" />
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              {dark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <button onClick={() => refreshBalances()} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <RefreshCw size={16} className={loadingBal ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Wallet picker dropdown */}
        {showWalletPicker && (
          <div className="absolute top-20 left-4 right-4 z-50 bg-navy-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-slide-down">
            {wallets.map(w => (
              <button key={w.id} onClick={() => { switchWallet(w.id); setShowWalletPicker(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors text-left ${activeWallet?.id===w.id?'bg-white/5':''}`}>
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {w.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{w.name}</p>
                  <p className="text-white/40 text-[11px] font-mono">{shortAddr(w.address)}</p>
                </div>
                {activeWallet?.id===w.id && <div className="ml-auto w-2 h-2 rounded-full bg-brand-400" />}
              </button>
            ))}
            <button onClick={() => { navigate('/onboarding'); setShowWalletPicker(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 border-t border-white/8 text-brand-400 hover:bg-white/5 text-sm transition-colors">
              <Plus size={16}/> Add / Import Wallet
            </button>
          </div>
        )}

        {/* Network tabs */}
        <div className="flex gap-1 p-1 bg-white/10 rounded-2xl mb-5">
          {['ethereum','bsc'].map(n => (
            <button key={n} onClick={() => setNetwork(n)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${network===n?'bg-white text-navy-900':'text-white/60 hover:text-white'}`}>
              {n==='ethereum' ? '⟠ Ethereum' : '◈ BNB Chain'}
            </button>
          ))}
        </div>

        {/* Balance */}
        <div className="mb-5">
          <p className="text-white/50 text-xs mb-1">Total Balance</p>
          <div className="flex items-end gap-3">
            <h1 className="text-white font-bold text-4xl leading-none">
              {hideBalance ? '••••••' : fmtNum(totalUSD)}
            </h1>
            <button onClick={() => setHideBalance(!hideBalance)} className="text-white/40 hover:text-white/70 mb-1 transition-colors">
              {hideBalance ? <Eye size={16}/> : <EyeOff size={16}/>}
            </button>
          </div>
          {nativeChange != null && (
            <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${nativeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {nativeChange >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
              <span>{fmtPct(nativeChange)} today</span>
            </div>
          )}
          {activeVaults.length > 0 && (
            <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
              <Lock size={10} className="text-cyan-400" />
              {activeVaults.length} vault{activeVaults.length!==1?'s':''} active
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Send, label: 'Send', to: '/send' },
            { icon: QrCode, label: 'Receive', to: '/receive' },
            { icon: ArrowLeftRight, label: 'Swap', to: '/swap' },
            { icon: Key, label: 'Export', to: '/settings' },
          ].map(({ icon: Icon, label, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className="action-btn group">
              <div className="action-btn-icon group-active:scale-90 transition-transform">
                <Icon size={20} />
              </div>
              <span className="text-white/80 text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── ASSETS BOTTOM SHEET ── */}
      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-3 pt-5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-5 mb-3">
          <span className="font-semibold text-primary text-base">Assets</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-secondary text-xs">{net.name}</span>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
              <Plus size={14}/>
            </button>
          </div>
        </div>

        {/* Token list */}
        <div className="divide-y divide-slate-50 dark:divide-white/5">
          {allTokens.map(token => {
            const sym = token.symbol?.toUpperCase();
            const bal = token.isNative ? nativeBal : parseFloat(balances[token.address?.toLowerCase()] || '0');
            const p = prices[sym] || {};
            const usd = bal * (p.price || 0);
            const change = p.change24h;
            const ccLogo = !token.isNative && p.imageUrl ? p.imageUrl : null;
            const logo = ccLogo || token.logo;
            const locked = vaults.filter(v => v.status==='locked' && (token.isNative ? v.tokenAddress==='native' : v.tokenAddress?.toLowerCase()===token.address?.toLowerCase()))
              .reduce((s,v)=>s+parseFloat(v.amount||0),0);
            return (
              <button key={token.address} onClick={() => navigate(`/token/${token.isNative?'native':token.address}`)}
                className="token-row w-full text-left">
                <div className="relative">
                  <TokenAvatar logo={logo} symbol={sym} size={44} />
                  {locked > 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-white dark:border-navy-800">
                      <Lock size={7} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-primary text-[15px]">{sym}</span>
                    {locked > 0 && <span className="badge badge-cyan text-[9px]">+{formatBal(locked.toString(),2)} locked</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-secondary text-xs">{token.name}</span>
                    {change != null && (
                      <span className={`text-[11px] font-medium ${change>=0?'up':'down'}`}>{fmtPct(change)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary text-[15px]">{hideBalance ? '••••' : formatBal(bal.toString(),4)}</p>
                  <p className="text-secondary text-xs mt-0.5">{hideBalance ? '••' : fmtNum(usd)}</p>
                </div>
              </button>
            );
          })}
        </div>

        {allTokens.length === 1 && (
          <div className="text-center py-8 px-5">
            <p className="text-secondary text-sm mb-2">No tokens added yet</p>
            <button onClick={() => setShowAdd(true)} className="btn-secondary text-sm px-5 py-2.5">+ Add Token</button>
          </div>
        )}
        <div className="h-28" />
      </div>

      <AddTokenModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
