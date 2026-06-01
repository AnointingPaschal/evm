import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { NETWORKS, shortAddr } from '../utils/wallet';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';

async function fetchTxns(address, network) {
  const urls = {
    ethereum: `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc`,
    bsc: `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&sort=desc`,
  };
  try {
    const r = await fetch(urls[network]);
    const d = await r.json();
    return d.status === '1' ? d.result.slice(0,50) : [];
  } catch { return []; }
}

export default function History() {
  const { activeWallet, network } = useWallet();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const netInfo = NETWORKS[network];

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
    if (filter === 'sent' && !isSend) return false;
    if (filter === 'received' && isSend) return false;
    if (search) {
      const s = search.toLowerCase();
      return tx.hash?.toLowerCase().includes(s) || tx.to?.toLowerCase().includes(s) || tx.from?.toLowerCase().includes(s);
    }
    return true;
  });

  const explorer = netInfo.explorer;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-xl text-white">Transaction History</h1>
        <button onClick={load} disabled={loading} className="btn-icon">
          <RefreshCw size={15} className={loading?'animate-spin':''}/>
        </button>
      </div>

      {/* Filter + Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex gap-1 p-1 bg-navy-800/50 rounded-xl border border-gold-500/8">
          {['all','sent','received'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter===f?'gold-gradient text-navy-900':'text-gray-600 hover:text-gray-400'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"/>
          <input className="input pl-9 py-2 text-xs" placeholder="Search hash or address..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"/>
          <p className="text-gray-600 text-sm">Loading transactions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600">No transactions found</p>
          <p className="text-gray-700 text-xs mt-1">Transactions on {netInfo.name} will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => {
            const isSend = tx.from?.toLowerCase() === activeWallet?.address?.toLowerCase();
            const ethVal = (parseInt(tx.value||0) / 1e18).toFixed(5);
            const failed = tx.isError === '1';
            const ts = parseInt(tx.timeStamp) * 1000;
            return (
              <div key={tx.hash} className="card-sm flex items-center gap-3 hover:border-gold-500/20 transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${failed?'bg-red-500/15 border border-red-500/25': isSend?'bg-gold-500/15 border border-gold-500/25':'bg-emerald-500/15 border border-emerald-500/25'}`}>
                  {failed ? <span className="text-red-400 text-xs">✕</span> : isSend
                    ? <ArrowUpRight size={16} className="text-gold-400"/>
                    : <ArrowDownLeft size={16} className="text-emerald-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${failed?'text-red-400':isSend?'text-white':'text-emerald-400'}`}>
                      {failed ? 'Failed' : isSend ? 'Sent' : 'Received'}
                    </span>
                    <span className="font-display font-semibold text-sm text-white">{ethVal} {netInfo.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-gray-600 font-mono">
                      {isSend ? `To: ${shortAddr(tx.to)}` : `From: ${shortAddr(tx.from)}`}
                    </span>
                    <span className="text-[10px] text-gray-700">{ts ? format(ts,'MMM d, HH:mm') : ''}</span>
                  </div>
                </div>
                <a href={`${explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gold-400 hover:bg-gold-500/10 transition-all flex-shrink-0">
                  <ExternalLink size={12}/>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
