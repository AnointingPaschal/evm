import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { decryptData, shortAddr } from '../utils/wallet';
import { Eye, EyeOff, Copy, Check, Download, Trash2, Shield, AlertTriangle, Moon, Sun, ChevronRight, Plus, Lock, Globe } from 'lucide-react';
import Modal from '../components/ui/Modal';
import TokenAvatar from '../components/ui/TokenAvatar';
import toast from 'react-hot-toast';

export default function Settings() {
  const { activeWallet, wallets, removeWallet, updateSettings, settings, sessionPwd, lockWallet, switchWallet, network, setNetwork } = useWallet();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [showExport, setShowExport] = useState(false);
  const [expType, setExpType] = useState('mnemonic');
  const [expPwd, setExpPwd] = useState('');
  const [expData, setExpData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [delTxt, setDelTxt] = useState('');

  const doExport = () => {
    try {
      const keys = decryptData(activeWallet.encryptedData, expPwd||sessionPwd);
      if (expType==='mnemonic' && !keys.mnemonic) return toast.error('No mnemonic (imported by key)');
      setExpData(expType==='mnemonic' ? keys.mnemonic : keys.privateKey);
    } catch { toast.error('Wrong password'); }
  };

  const copy = (txt) => { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const Row = ({ icon: Icon, label, value, danger, action, right }) => (
    <button onClick={action} className={`w-full flex items-center gap-3.5 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left ${danger?'':''}` }>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${danger?'bg-red-100 dark:bg-red-900/30':'bg-slate-100 dark:bg-navy-700'}`}>
        <Icon size={17} className={danger?'text-red-500':'text-secondary'}/>
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger?'text-red-500':'text-primary'}`}>{label}</p>
        {value && <p className="text-secondary text-xs mt-0.5">{value}</p>}
      </div>
      {right || <ChevronRight size={16} className="text-secondary flex-shrink-0"/>}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-app">
      <div className="header-bg px-5 pt-12 pb-5">
        <h1 className="text-white font-bold text-lg">Settings</h1>
      </div>

      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-3 pb-28">
        {/* Active wallet */}
        {activeWallet && (
          <div className="px-5 pt-5 pb-3">
            <p className="section-title mb-3">Active Wallet</p>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-3xl p-4 flex items-center gap-3 border border-brand-100 dark:border-brand-500/20">
              <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-base">
                {activeWallet.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-primary font-semibold">{activeWallet.name}</p>
                <p className="text-secondary text-xs font-mono mt-0.5">{shortAddr(activeWallet.address, 8)}</p>
              </div>
              {activeWallet.imported && <span className="badge badge-blue">Imported</span>}
            </div>
          </div>
        )}

        <div className="divider mx-5 my-1"/>

        {/* Wallet actions */}
        <div>
          <Row icon={Download} label="Export Seed Phrase" value="Backup your recovery phrase" action={() => { setExpType('mnemonic'); setExpData(null); setExpPwd(''); setShowExport(true); }}/>
          <Row icon={Shield} label="Export Private Key" value="View your private key" action={() => { setExpType('privatekey'); setExpData(null); setExpPwd(''); setShowExport(true); }}/>
          <Row icon={Lock} label="Lock Wallet" value="Require password to access" action={() => lockWallet()}/>
          <Row icon={Trash2} label="Remove Wallet" danger action={() => setShowDel(true)}/>
        </div>

        <div className="divider mx-5 my-1"/>

        {/* Appearance */}
        <div className="px-5 py-3">
          <p className="section-title mb-3">Appearance</p>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-navy-700 flex items-center justify-center">
                {dark ? <Moon size={17} className="text-secondary"/> : <Sun size={17} className="text-secondary"/>}
              </div>
              <p className="text-primary text-sm font-medium">Dark Mode</p>
            </div>
            <button onClick={toggle}
              className={`w-12 h-7 rounded-full transition-colors relative ${dark?'bg-brand-500':'bg-slate-200'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${dark?'left-6':'left-1'}`}/>
            </button>
          </div>
        </div>

        <div className="divider mx-5 my-1"/>

        {/* Network */}
        <div className="px-5 py-3">
          <p className="section-title mb-3">Network</p>
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-navy-900 rounded-2xl">
            {['ethereum','bsc'].map(n => (
              <button key={n} onClick={()=>setNetwork(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${network===n?'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm':'text-secondary'}`}>
                {n==='ethereum'?'⟠ Ethereum':'◈ BNB Chain'}
              </button>
            ))}
          </div>
        </div>

        <div className="divider mx-5 my-1"/>

        {/* All wallets */}
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Wallets ({wallets.length})</p>
            <button onClick={() => navigate('/onboarding')} className="flex items-center gap-1 text-brand-500 text-xs font-semibold">
              <Plus size={13}/> Add
            </button>
          </div>
          <div className="space-y-2">
            {wallets.map(w => (
              <button key={w.id} onClick={() => switchWallet(w.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left ${activeWallet?.id===w.id?'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-500/30':'bg-slate-50 dark:bg-navy-900/50 border border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}>
                <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                  {w.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-primary font-medium text-sm truncate">{w.name}</p>
                  <p className="text-secondary text-xs font-mono">{shortAddr(w.address)}</p>
                </div>
                {activeWallet?.id===w.id && <div className="w-2 h-2 rounded-full bg-brand-500"/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <Modal isOpen={showExport} onClose={() => setShowExport(false)} title={expType==='mnemonic'?'Seed Phrase':'Private Key'}>
        <div className="space-y-4">
          <div className="flex p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 gap-2.5">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5"/>
            <p className="text-red-700 dark:text-red-300 text-xs">Never share this with anyone. Anyone with this can steal all your funds.</p>
          </div>
          {!expData ? (
            <>
              {!sessionPwd && (
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" value={expPwd} onChange={e=>setExpPwd(e.target.value)} placeholder="Confirm with password"/>
                </div>
              )}
              <button onClick={doExport} className="btn-primary w-full">Reveal</button>
            </>
          ) : (
            <>
              {expType==='mnemonic' ? (
                <div className="grid grid-cols-3 gap-2">
                  {expData.split(' ').map((w,i) => (
                    <div key={i} className="bg-slate-100 dark:bg-navy-900 rounded-xl px-2.5 py-2 flex items-center gap-1.5">
                      <span className="text-[9px] text-secondary w-3.5 font-mono">{i+1}.</span>
                      <span className="text-xs font-mono text-primary font-medium">{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-navy-900 rounded-2xl p-4">
                  <p className="font-mono text-xs text-primary break-all">{expData}</p>
                </div>
              )}
              <button onClick={() => copy(expData)} className="btn-ghost w-full flex items-center justify-center gap-2">
                {copied ? <><Check size={14} className="text-emerald-500"/>Copied!</> : <><Copy size={14}/>Copy</>}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDel} onClose={() => setShowDel(false)} title="Remove Wallet">
        <div className="space-y-4">
          <p className="text-secondary text-sm">Type <span className="text-red-500 font-mono font-bold">DELETE</span> to confirm removing <strong className="text-primary">{activeWallet?.name}</strong>.</p>
          <input className="input" placeholder="DELETE" value={delTxt} onChange={e=>setDelTxt(e.target.value)}/>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>setShowDel(false)} className="btn-ghost">Cancel</button>
            <button disabled={delTxt!=='DELETE'} onClick={()=>{removeWallet(activeWallet.id);setShowDel(false);setDelTxt('');}} className="btn-danger">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
