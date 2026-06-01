import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { NETWORKS, shortAddr } from '../utils/wallet';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, RefreshCw, Search, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ethers } from 'ethers';

async function fetchTxns(address, network) {
  const urls = { ethereum:`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc`, bsc:`https://api.bscscan.com/api?module=account&action=txlist&address=${address}&sort=desc` };
  try { const r=await fetch(urls[network]); const d=await r.json(); return d.status==='1'?d.result.slice(0,60):[]; } catch { return []; }
}

export default function History() {
  const { activeWallet, network } = useWallet();
  const net = NETWORKS[network];
  const navigate = useNavigate();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!activeWallet) return;
    setLoading(true);
    const data = await fetchTxns(activeWallet.address, network);
    setTxns(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [activeWallet, network]);

  const filtered = txns.filter(tx => {
    const isSend = tx.from?.toLowerCase() === activeWallet?.address?.toLowerCase();
    if (filter==='sent' && !isSend) return false;
    if (filter==='received' && isSend) return false;
    if (search) { const s=search.toLowerCase(); return tx.hash?.toLowerCase().includes(s)||tx.to?.toLowerCase().includes(s)||tx.from?.toLowerCase().includes(s); }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-app">
      <div className="header-bg px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">History</h1>
          <button onClick={load} disabled={loading} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <RefreshCw size={16} className={loading?'animate-spin':''}/>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-3 pt-5 pb-28">
        {/* Filter */}
        <div className="px-5 mb-4">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-navy-900 rounded-2xl mb-3">
            {['all','sent','received'].map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${filter===f?'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm':'text-secondary'}`}>{f}</button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary"/>
            <input className="input pl-9 py-3" placeholder="Search hash or address..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
            <p className="text-secondary text-sm">Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-5">
            <div className="w-16 h-16 bg-slate-100 dark:bg-navy-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={28} className="text-secondary"/>
            </div>
            <p className="text-primary font-medium mb-1">No transactions yet</p>
            <p className="text-secondary text-sm">Your {net.name} transactions will appear here</p>
          </div>
        ) : (
          <div>
            {filtered.map((tx,i) => {
              const isSend = tx.from?.toLowerCase() === activeWallet?.address?.toLowerCase();
              const val = (parseInt(tx.value||0)/1e18).toFixed(5);
              const failed = tx.isError==='1';
              const ts = parseInt(tx.timeStamp)*1000;
              const prev = filtered[i-1];
              const showDate = !prev || format(ts,'yyyy-MM-dd') !== format(parseInt(prev.timeStamp)*1000,'yyyy-MM-dd');
              return (
                <div key={tx.hash}>
                  {showDate && <p className="px-5 py-2 text-xs text-secondary font-semibold bg-slate-50 dark:bg-navy-900/50">{format(ts,'MMMM d, yyyy')}</p>}
                  <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${failed?'bg-red-100 dark:bg-red-900/30':isSend?'bg-amber-100 dark:bg-amber-900/30':'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                      {failed ? <span className="text-red-500 font-bold text-xs">!</span>
                        : isSend ? <ArrowUpRight size={18} className="text-amber-600 dark:text-amber-400"/>
                        : <ArrowDownLeft size={18} className="text-emerald-600 dark:text-emerald-400"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${failed?'text-red-500':isSend?'text-primary':'text-emerald-600 dark:text-emerald-400'}`}>
                        {failed?'Failed':isSend?'Sent':'Received'}
                      </p>
                      <p className="text-secondary text-xs font-mono mt-0.5 truncate">{isSend?`To: ${shortAddr(tx.to)}`:`From: ${shortAddr(tx.from)}`}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${isSend?'text-primary':'text-emerald-600 dark:text-emerald-400'}`}>{isSend?'-':'+'}  {val}</p>
                      <p className="text-secondary text-[10px]">{net.symbol}</p>
                    </div>
                    <a href={`${net.explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-secondary hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all flex-shrink-0">
                      <ExternalLink size={13}/>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Clock({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
