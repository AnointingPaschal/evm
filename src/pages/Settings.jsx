import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { decryptData } from '../utils/wallet';
import { Eye, EyeOff, Copy, Check, Download, Trash2, Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { shortAddr } from '../utils/wallet';

export default function Settings() {
  const { activeWallet, wallets, removeWallet, updateSettings, settings, sessionPwd } = useWallet();
  const [showExport, setShowExport] = useState(false);
  const [exportType, setExportType] = useState('mnemonic');
  const [exportPwd, setExportPwd] = useState('');
  const [exportData, setExportData] = useState(null);
  const [showExportData, setShowExportData] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [delConfirm, setDelConfirm] = useState('');

  const doExport = () => {
    try {
      const keys = decryptData(activeWallet.encryptedData, exportPwd || sessionPwd);
      if (exportType === 'mnemonic') {
        if (!keys.mnemonic) return toast.error('No mnemonic for this wallet (imported via private key)');
        setExportData(keys.mnemonic);
      } else {
        setExportData(keys.privateKey);
      }
      setShowExportData(true);
    } catch { toast.error('Wrong password'); }
  };

  const copyExport = () => {
    navigator.clipboard.writeText(exportData);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-xl mx-auto animate-fade-in">
      <h1 className="font-display font-bold text-xl text-white mb-6">Settings</h1>

      {/* Active wallet info */}
      {activeWallet && (
        <div className="card mb-4">
          <h2 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">Current Wallet</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-navy-900 font-bold">
              {activeWallet.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-white">{activeWallet.name}</p>
              <p className="text-xs text-gray-600 font-mono">{shortAddr(activeWallet.address, 8)}</p>
            </div>
            {activeWallet.imported && <span className="badge badge-blue ml-auto">Imported</span>}
          </div>
          <div className="space-y-2">
            <button onClick={() => { setExportType('mnemonic'); setShowExport(true); setExportData(null); setShowExportData(false); }}
              className="w-full flex items-center justify-between p-3 rounded-xl glass-sm border border-gold-500/8 hover:border-gold-500/25 transition-all group">
              <div className="flex items-center gap-2 text-sm text-gray-300 group-hover:text-white">
                <Download size={14} className="text-gold-400"/><span>Export Seed Phrase</span>
              </div>
              <ChevronRight size={13} className="text-gray-600"/>
            </button>
            <button onClick={() => { setExportType('privatekey'); setShowExport(true); setExportData(null); setShowExportData(false); }}
              className="w-full flex items-center justify-between p-3 rounded-xl glass-sm border border-gold-500/8 hover:border-gold-500/25 transition-all group">
              <div className="flex items-center gap-2 text-sm text-gray-300 group-hover:text-white">
                <Shield size={14} className="text-gold-400"/><span>Export Private Key</span>
              </div>
              <ChevronRight size={13} className="text-gray-600"/>
            </button>
            <button onClick={() => setShowDelete(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/8 border border-red-500/15 hover:border-red-500/30 transition-all group">
              <div className="flex items-center gap-2 text-sm text-red-400/70 group-hover:text-red-400">
                <Trash2 size={14}/><span>Remove Wallet</span>
              </div>
              <ChevronRight size={13} className="text-gray-600"/>
            </button>
          </div>
        </div>
      )}

      {/* Network */}
      <div className="card mb-4">
        <h2 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">Network</h2>
        <div className="flex gap-2 p-1 bg-navy-800/50 rounded-xl border border-gold-500/8">
          {['ethereum','bsc'].map(n => (
            <button key={n} onClick={() => updateSettings({ network: n })}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${settings.network===n?'gold-gradient text-navy-900':'text-gray-500 hover:text-gray-300'}`}>
              {n==='ethereum'?'⟠ Ethereum':'◈ BNB Chain'}
            </button>
          ))}
        </div>
      </div>

      {/* All wallets */}
      <div className="card">
        <h2 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">All Wallets ({wallets.length})</h2>
        <div className="space-y-2">
          {wallets.map(w => (
            <div key={w.id} className={`flex items-center gap-3 p-3 rounded-xl glass-sm border ${activeWallet?.id===w.id?'border-gold-500/25 bg-gold-500/5':'border-gold-500/8'}`}>
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-navy-900 text-xs font-bold">{w.name?.[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{w.name}</p>
                <p className="text-[11px] text-gray-600 font-mono">{shortAddr(w.address)}</p>
              </div>
              {activeWallet?.id===w.id && <span className="badge badge-gold">Active</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Export modal */}
      <Modal isOpen={showExport} onClose={() => setShowExport(false)} title={exportType==='mnemonic'?'Export Seed Phrase':'Export Private Key'} size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-red-300">Never share your {exportType==='mnemonic'?'seed phrase':'private key'} with anyone. Anyone with this can steal your funds.</p>
          </div>
          {!showExportData ? (
            <>
              {!sessionPwd && (
                <div>
                  <label className="label">Enter Password</label>
                  <input className="input" type="password" value={exportPwd} onChange={e=>setExportPwd(e.target.value)} placeholder="Wallet password" />
                </div>
              )}
              <button onClick={doExport} className="btn-primary w-full">Reveal {exportType==='mnemonic'?'Phrase':'Key'}</button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-navy-800 border border-red-500/20">
                {exportType === 'mnemonic' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {exportData.split(' ').map((w,i) => (
                      <div key={i} className="flex items-center gap-1 bg-navy-700 rounded-lg px-2 py-1.5">
                        <span className="text-[9px] text-gray-600 w-4 font-mono">{i+1}.</span>
                        <span className="text-xs font-mono text-white">{w}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-white break-all">{exportData}</p>
                )}
              </div>
              <button onClick={copyExport} className="btn-ghost w-full flex items-center justify-center gap-2">
                {copied ? <><Check size={13} className="text-emerald-400"/>Copied!</> : <><Copy size={13}/>Copy</>}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Remove Wallet" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Type <span className="text-red-400 font-mono">DELETE</span> to confirm removing <strong className="text-white">{activeWallet?.name}</strong>.</p>
          <input className="input" placeholder="DELETE" value={delConfirm} onChange={e=>setDelConfirm(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={() => setShowDelete(false)} className="btn-ghost flex-1">Cancel</button>
            <button disabled={delConfirm !== 'DELETE'} onClick={() => { removeWallet(activeWallet.id); setShowDelete(false); setDelConfirm(''); }} className="btn-danger flex-1">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
