import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { NETWORKS, shortAddr, formatBal } from '../utils/wallet';
import { fmtNum, fmtPct } from '../utils/api';
import { Plus, Send, Download, RefreshCw, ChevronRight, Lock, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import AddTokenModal from '../components/token/AddTokenModal';
import SendModal from '../components/token/SendModal';
import ReceiveModal from '../components/token/ReceiveModal';
import SwapModal from '../components/token/SwapModal';
import CopyButton from '../components/ui/CopyButton';

export default function Dashboard() {
  const { activeWallet, tokens, balances, prices, vaults, network, loadingBal, refreshBalances } = useWallet();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const netInfo = NETWORKS[network];

  const nativeBalance = parseFloat(balances.native || '0');
  const nativePrice = prices[netInfo.symbol]?.price || 0;
  const nativeUSD = nativeBalance * nativePrice;

  const tokenList = tokens.filter(t => t.network === network);
  const totalUSD = tokenList.reduce((acc, t) => {
    const bal = parseFloat(balances[t.address.toLowerCase()] || '0');
    const p = prices[t.symbol?.toUpperCase()]?.price || 0;
    return acc + bal * p;
  }, nativeUSD);

  const activeVaults = vaults.filter(v => v.status === 'locked');
  const lockedUSD = activeVaults.reduce((acc, v) => {
    const sym = v.tokenSymbol?.toUpperCase();
    const p = prices[sym]?.price || 0;
    return acc + parseFloat(v.amount || 0) * p;
  }, 0);

  const nativeChange = prices[netInfo.symbol]?.change24h;

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-xl text-white">{activeWallet?.name}</h1>
            {activeWallet?.imported && <span className="badge badge-blue">Imported</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-gray-600 font-mono">{shortAddr(activeWallet?.address, 8)}</span>
            <CopyButton text={activeWallet?.address || ''} />
          </div>
        </div>
        <button onClick={() => setHideBalance(!hideBalance)} className="btn-icon">
          {hideBalance ? <Eye size={15}/> : <EyeOff size={15}/>}
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="card mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{background:'radial-gradient(ellipse at top right, #F59E0B18, transparent 70%)'}} />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 font-mono mb-1">Total Portfolio Value</p>
              <div className="font-display font-bold text-3xl text-white">
                {hideBalance ? '••••••' : fmtNum(totalUSD)}
              </div>
              {nativeChange != null && (
                <div className={`flex items-center gap-1 mt-1 text-sm ${nativeChange>=0?'text-emerald-400':'text-red-400'}`}>
                  {nativeChange>=0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  <span>{fmtPct(nativeChange)} (24h)</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 font-mono mb-1">Locked in Vault</div>
              <div className="flex items-center gap-1 justify-end">
                <Lock size={12} className="text-cyan-400" />
                <span className="font-display font-semibold text-cyan-400">{hideBalance ? '••••' : fmtNum(lockedUSD)}</span>
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">{activeVaults.length} active vault{activeVaults.length!==1?'s':''}</div>
            </div>
          </div>
          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Send, label: 'Send', action: () => setShowSend(true) },
              { icon: Download, label: 'Receive', action: () => setShowReceive(true) },
              { icon: RefreshCw, label: 'Swap', action: () => setShowSwap(true) },
              { icon: Plus, label: 'Add Token', action: () => setShowAdd(true) },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-navy-800/60 border border-gold-500/10 hover:border-gold-500/30 hover:bg-gold-500/8 transition-all group">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center group-hover:shadow-md group-hover:shadow-gold-500/25 transition-shadow">
                  <Icon size={15} className="text-navy-900" />
                </div>
                <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Native token */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs text-gray-500 font-mono uppercase tracking-wider">Assets</h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-300 transition-colors">
            <Plus size={12}/> Add Token
          </button>
        </div>

        {/* Native row */}
        <button onClick={() => navigate(`/token/native`)}
          className="w-full flex items-center gap-3 p-4 rounded-xl glass-sm border border-gold-500/8 hover:border-gold-500/25 hover:bg-gold-500/5 transition-all mb-2 group">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{background: netInfo.color+'22', border:`1px solid ${netInfo.color}44`}}>
            <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{color: netInfo.color}}>
              {netInfo.symbol[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-white">{netInfo.name}</span>
              <span className="font-display font-semibold text-sm text-white">{hideBalance ? '••••' : formatBal(balances.native||'0', 4)}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{netInfo.symbol}</span>
                {nativeChange != null && (
                  <span className={`text-[10px] font-mono ${nativeChange>=0?'text-emerald-400':'text-red-400'}`}>{fmtPct(nativeChange)}</span>
                )}
              </div>
              <span className="text-xs text-gray-600">{hideBalance ? '••' : fmtNum(nativeBalance * nativePrice)}</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
        </button>

        {/* Token rows */}
        {tokenList.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gold-500/10 rounded-xl">
            <p className="text-gray-600 text-sm">No tokens added yet</p>
            <button onClick={() => setShowAdd(true)} className="mt-2 text-gold-500 hover:text-gold-300 text-sm transition-colors">+ Add your first token</button>
          </div>
        ) : tokenList.map(token => {
          const sym = token.symbol?.toUpperCase();
          const bal = parseFloat(balances[token.address.toLowerCase()]||'0');
          const p = prices[sym] || {};
          const usdVal = bal * (p.price || 0);
          const change = p.change24h;
          const lockedAmt = vaults.filter(v => v.status==='locked' && v.tokenAddress===token.address)
            .reduce((s,v) => s + parseFloat(v.amount||0), 0);
          return (
            <button key={token.address} onClick={() => navigate(`/token/${token.address}`)}
              className="w-full flex items-center gap-3 p-4 rounded-xl glass-sm border border-gold-500/8 hover:border-gold-500/25 hover:bg-gold-500/5 transition-all mb-2 group text-left">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-navy-700 border border-gold-500/10">
                {token.logo
                  ? <img src={token.logo} alt={sym} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}} />
                  : <div className="w-full h-full flex items-center justify-center font-bold text-sm text-gold-400">{sym?.[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-white">{sym}</span>
                    {lockedAmt > 0 && <span className="badge badge-blue flex items-center gap-0.5"><Lock size={8}/> {lockedAmt.toFixed(2)}</span>}
                  </div>
                  <span className="font-display font-semibold text-sm text-white">{hideBalance ? '••••' : formatBal(bal.toString(), 4)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{token.name}</span>
                    {change != null && <span className={`text-[10px] font-mono ${change>=0?'text-emerald-400':'text-red-400'}`}>{fmtPct(change)}</span>}
                  </div>
                  <span className="text-xs text-gray-600">{hideBalance ? '••' : fmtNum(usdVal)}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Vault summary */}
      {activeVaults.length > 0 && (
        <div className="card border-cyan-500/15 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={14} className="text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Active Vaults ({activeVaults.length})</span>
          </div>
          <div className="space-y-2">
            {activeVaults.slice(0,3).map(v => {
              const unlockDate = new Date(v.unlockAt);
              const isUnlockable = new Date() >= unlockDate;
              const daysLeft = Math.max(0, Math.ceil((unlockDate - new Date()) / 86400000));
              return (
                <button key={v.id} onClick={() => navigate(`/token/${v.tokenAddress}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-navy-800/60 border border-cyan-500/10 hover:border-cyan-500/30 transition-all text-left">
                  <div>
                    <span className="text-xs font-medium text-white">{v.amount} {v.tokenSymbol}</span>
                    <span className="text-[10px] text-gray-600 ml-2 font-mono">{v.note}</span>
                  </div>
                  <div className="text-right">
                    {isUnlockable
                      ? <span className="badge badge-green">Unlockable</span>
                      : <span className="text-[11px] text-gray-500 font-mono">{daysLeft}d left</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AddTokenModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <SendModal isOpen={showSend} onClose={() => setShowSend(false)} />
      <ReceiveModal isOpen={showReceive} onClose={() => setShowReceive(false)} />
      <SwapModal isOpen={showSwap} onClose={() => setShowSwap(false)} />
    </div>
  );
}
