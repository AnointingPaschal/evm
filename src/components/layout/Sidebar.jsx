import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { shortAddr } from '../../utils/wallet';
import { LayoutDashboard, History, Settings, Lock, ChevronDown, LogOut, Plus, Shield, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { NETWORKS } from '../../utils/wallet';

export default function Sidebar() {
  const { wallets, activeWallet, switchWallet, lockWallet, network, setNetwork, tokens, prices, balances, refreshBalances, loadingBal } = useWallet();
  const [walletDrop, setWalletDrop] = useState(false);
  const navigate = useNavigate();
  const netInfo = NETWORKS[network];

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Portfolio' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-60 h-screen flex flex-col glass-dark flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gold-500/8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/25 flex-shrink-0">
            <Lock size={16} className="text-navy-900" />
          </div>
          <div>
            <div className="font-display font-bold text-base shimmer-text leading-tight">VaultChain</div>
            <div className="text-[10px] text-gray-600 font-mono">EVM Savings Wallet</div>
          </div>
        </div>
      </div>

      {/* Wallet selector */}
      <div className="px-4 py-3 border-b border-gold-500/8">
        <div className="relative">
          <button onClick={() => setWalletDrop(!walletDrop)}
            className="w-full flex items-center gap-2 p-2.5 rounded-xl glass-sm border border-gold-500/10 hover:border-gold-500/25 transition-all">
            <div className="w-7 h-7 rounded-lg gold-gradient flex-shrink-0 flex items-center justify-center text-navy-900 text-xs font-bold">
              {(activeWallet?.name?.[0] || 'W').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-medium text-white truncate">{activeWallet?.name || 'No Wallet'}</div>
              <div className="text-[10px] text-gray-600 font-mono">{shortAddr(activeWallet?.address)}</div>
            </div>
            <ChevronDown size={13} className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${walletDrop?'rotate-180':''}`} />
          </button>
          {walletDrop && (
            <div className="absolute top-full left-0 right-0 mt-1 glass border border-gold-500/20 rounded-xl overflow-hidden z-50 shadow-2xl">
              {wallets.map(w => (
                <button key={w.id} onClick={() => { switchWallet(w.id); setWalletDrop(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gold-500/8 transition-colors ${activeWallet?.id===w.id?'bg-gold-500/12':''}`}>
                  <div className="w-6 h-6 rounded-md gold-gradient flex-shrink-0 flex items-center justify-center text-navy-900 text-[10px] font-bold">{(w.name?.[0]||'W').toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="text-xs text-white truncate">{w.name}</div>
                    <div className="text-[10px] text-gray-600 font-mono">{shortAddr(w.address)}</div>
                  </div>
                </button>
              ))}
              <div className="border-t border-gold-500/8">
                <button onClick={() => { navigate('/onboarding'); setWalletDrop(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-gold-400 hover:bg-gold-500/8 text-xs transition-colors">
                  <Plus size={12} /><span>Add / Import Wallet</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Network toggle */}
        <div className="flex mt-2 rounded-lg overflow-hidden border border-gold-500/10 text-[11px]">
          {['ethereum','bsc'].map(n => (
            <button key={n} onClick={() => setNetwork(n)}
              className={`flex-1 py-1.5 font-mono font-medium transition-all ${network===n?'gold-gradient text-navy-900':'text-gray-600 hover:text-gray-400'}`}>
              {n === 'ethereum' ? '⟠ ETH' : '◈ BSC'}
            </button>
          ))}
        </div>
      </div>

      {/* Token list quick nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="text-[10px] text-gray-600 font-mono px-1 mb-2 uppercase tracking-wider">Navigation</div>
        <nav className="space-y-0.5 mb-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Icon size={16} /><span className="text-[13px]">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Tokens */}
        {tokens.length > 0 && (
          <>
            <div className="text-[10px] text-gray-600 font-mono px-1 mb-2 uppercase tracking-wider">Tokens</div>
            <nav className="space-y-0.5">
              {tokens.filter(t => t.network === network).map(t => {
                const sym = t.symbol?.toUpperCase();
                const p = prices[sym];
                const change = p?.change24h;
                return (
                  <NavLink key={t.address} to={`/token/${t.address}`}
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''} !py-2`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-navy-700 flex items-center justify-center">
                      {t.logo ? <img src={t.logo} alt={sym} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                        : <span className="text-[9px] font-bold text-gold-400">{sym?.[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium">{sym}</span>
                        {change != null && (
                          <span className={`text-[10px] font-mono ${change>=0?'text-emerald-400':'text-red-400'}`}>
                            {change>=0?'+':''}{change.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* Bottom */}
      <div className="px-4 py-3 border-t border-gold-500/8">
        <button onClick={refreshBalances} disabled={loadingBal}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mb-2">
          <RefreshCw size={11} className={loadingBal?'animate-spin':''} />
          <span className="font-mono">Refresh Balances</span>
        </button>
        <div className="flex items-center gap-1.5 px-1 mb-2">
          <Shield size={10} className="text-gold-600/50" />
          <span className="text-[10px] text-gray-700 font-mono">End-to-end encrypted</span>
        </div>
        {activeWallet && (
          <button onClick={lockWallet}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/8 text-xs transition-colors">
            <LogOut size={12} /><span>Lock Wallet</span>
          </button>
        )}
      </div>
    </aside>
  );
}
