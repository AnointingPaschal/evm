import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { NETWORKS, shortAddr, formatBal } from '../utils/wallet';
import { fmtNum, fmtPct } from '../utils/api';
import {
  Send, QrCode, ArrowLeftRight, Key, Plus, RefreshCw, ChevronDown,
  Lock, Eye, EyeOff, Moon, Sun, TrendingUp, TrendingDown, Wallet
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
      {/* ── HEADER SECTION ── */}
      <div className="header-bg px-4 pt-safe pb-8 relative z-10 flex flex-col pt-6">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-8 z-20">
          <button 
            onClick={() => setShowWalletPicker(!showWalletPicker)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/5 backdrop-blur-md px-3 py-1.5 rounded-full transition-all duration-200"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-400 to-cyan-300 flex items-center justify-center text-navy-900 font-bold text-xs shadow-inner">
              {activeWallet?.name?.[0]?.toUpperCase() || 'W'}
            </div>
            <span className="text-white text-[13px] font-semibold tracking-wide">{activeWallet?.name || 'Main Wallet'}</span>
            <ChevronDown size={14} className="text-white/60 ml-1" />
          </button>
          
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white transition-all">
              {dark ? <Sun size={16} strokeWidth={2.5}/> : <Moon size={16} strokeWidth={2.5}/>}
            </button>
            <button onClick={() => refreshBalances()} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white transition-all">
              <RefreshCw size={16} strokeWidth={2.5} className={loadingBal ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Full-Width Wallet Picker Dropdown */}
        {showWalletPicker && (
          <div className="absolute top-20 left-4 right-4 z-50 bg-navy-900/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-slide-down overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {wallets.map(w => (
                <button key={w.id} onClick={() => { switchWallet(w.id); setShowWalletPicker(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeWallet?.id===w.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-cyan-500 flex items-center justify-center text-navy-900 font-bold text-sm">
                    {w.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-[14px] font-semibold">{w.name}</p>
                    <p className="text-white/50 text-[11px] font-mono mt-0.5">{shortAddr(w.address)}</p>
                  </div>
                  {activeWallet?.id===w.id && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                </button>
              ))}
            </div>
            <div className="p-3 bg-black/20 border-t border-white/5">
              <button onClick={() => { navigate('/onboarding'); setShowWalletPicker(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 text-[13px] font-semibold transition-colors">
                <Plus size={16} strokeWidth={2.5}/> Add / Import Wallet
              </button>
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div className="flex flex-col items-center text-center mt-2 mb-8">
          <div className="flex items-center gap-2 text-white/70 mb-1">
            <span className="text-[13px] font-medium tracking-wider uppercase">Total Balance</span>
            <button onClick={() => setHideBalance(!hideBalance)} className="hover:text-white transition-colors p-1">
              {hideBalance ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
          
          <h1 className="text-white font-extrabold text-[42px] leading-tight tracking-tight mb-3">
            {hideBalance ? '••••••' : fmtNum(totalUSD)}
          </h1>
          
          <div className="flex items-center justify-center gap-2">
            {nativeChange != null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border ${nativeChange >= 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                {nativeChange >= 0 ? <TrendingUp size={12} strokeWidth={3}/> : <TrendingDown size={12} strokeWidth={3}/>}
                <span>{fmtPct(nativeChange)} Today</span>
              </div>
            )}
            
            {/* Dynamic Network Switcher */}
            <div className="flex bg-black/20 backdrop-blur-md rounded-full p-0.5 border border-white/10">
              {['ethereum','bsc'].map(n => (
                <button key={n} onClick={() => setNetwork(n)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${network===n ? 'bg-white text-navy-950 shadow-md scale-100' : 'text-white/60 hover:text-white scale-95'}`}>
                  {n==='ethereum' ? 'ETH' : 'BSC'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Grid (Squircles) */}
        <div className="grid grid-cols-4 gap-2 px-1">
          {[
            { icon: Send, label: 'Send', to: '/send' },
            { icon: QrCode, label: 'Receive', to: '/receive' },
            { icon: ArrowLeftRight, label: 'Swap', to: '/swap' },
            { icon: Wallet, label: 'Vault', to: '/vault' }, // Swapped Export for Vault given the app nature
          ].map(({ icon: Icon, label, to }) => (
            <button key={label} onClick={() => navigate(to)} className="group flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-[60px] h-[60px] rounded-[18px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 group-active:scale-[0.92] transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                <Icon size={24} strokeWidth={2} />
              </div>
              <span className="text-white/90 text-[12px] font-semibold tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── ASSETS BOTTOM SHEET (Full Width inside container) ── */}
      <div className="flex-1 bg-card rounded-t-[32px] -mt-4 pt-4 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-20 relative flex flex-col border-t border-default">
        
        {/* Notch */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-4 px-1">
          <span className="font-bold text-primary text-xl tracking-tight">Crypto</span>
          <button onClick={() => setShowAdd(true)}
            className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center hover:bg-brand-500/20 active:scale-90 transition-all">
            <Plus size={18} strokeWidth={2.5}/>
          </button>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide -mx-2 px-2">
          {allTokens.map(token => {
            const sym = token.symbol?.toUpperCase();
            const bal = token.isNative ? nativeBal : parseFloat(balances?.[token.address?.toLowerCase()] || '0');
            const p = prices?.[sym] || {};
            const usd = bal * (p.price || 0);
            const change = p.change24h;
            const logo = (!token.isNative && p.imageUrl) ? p.imageUrl : token.logo;
            const locked = vaults.filter(v => v.status==='locked' && (token.isNative ? v.tokenAddress==='native' : v.tokenAddress?.toLowerCase()===token.address?.toLowerCase()))
              .reduce((s,v)=>s+parseFloat(v.amount||0),0);
              
            return (
              <button key={token.address} onClick={() => navigate(`/token/${token.isNative?'native':token.address}`)}
                className="w-full flex items-center justify-between p-3 mb-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all bg-transparent">
                
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <TokenAvatar logo={logo} symbol={sym} size={44} className="shadow-sm rounded-full" />
                    {locked > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-card rounded-full flex items-center justify-center border-2 border-card shadow-sm">
                        <Lock size={10} className="text-cyan-500 dark:text-cyan-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary text-[15px]">{sym}</span>
                      {locked > 0 && <span className="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide">Locked</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-secondary text-[12px] font-medium">{token.name}</span>
                      {change != null && (
                        <span className={`text-[11px] font-bold ${change>=0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {change >= 0 ? '+' : ''}{fmtPct(change)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-primary text-[15px] tracking-tight">{hideBalance ? '••••' : formatBal(bal.toString(), 4)}</p>
                  <p className="text-secondary text-[12px] font-medium mt-0.5">{hideBalance ? '••' : fmtNum(usd)}</p>
                </div>
              </button>
            );
          })}

          {allTokens.length === 1 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 mt-4 bg-slate-50 dark:bg-navy-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-navy-800 flex items-center justify-center mb-3">
                <Plus size={20} className="text-secondary" strokeWidth={2.5} />
              </div>
              <p className="text-primary text-[15px] font-bold mb-1">No Custom Tokens</p>
              <p className="text-secondary text-[13px] mb-4 text-center">Import standard ERC20/BEP20 tokens.</p>
              <button onClick={() => setShowAdd(true)} className="bg-brand-500 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 active:scale-95">
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
