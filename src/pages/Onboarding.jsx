import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Copy, Check, AlertTriangle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const { createNew, importWallet } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState('home');
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [cpwd, setCpwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [impType, setImpType] = useState('mnemonic');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [backed, setBacked] = useState(false);

  const strength = [pwd.length>=8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length;
  const strengthColor = ['','bg-red-500','bg-orange-400','bg-yellow-400','bg-emerald-500'][strength];
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength];

  const doCreate = async () => {
    if (pwd.length < 8) return toast.error('Min 8 characters');
    if (pwd !== cpwd) return toast.error('Passwords do not match');
    setLoading(true);
    try { const d = await createNew(name||'My Wallet', pwd); setCreated(d); setStep('backup'); }
    catch(e) { toast.error(e.message); }
    setLoading(false);
  };

  const doImport = async () => {
    if (!phrase.trim()) return toast.error('Enter phrase or key');
    if (pwd.length < 8) return toast.error('Min 8 characters');
    if (pwd !== cpwd) return toast.error('Passwords do not match');
    setLoading(true);
    try { await importWallet(phrase, name||'Imported Wallet', pwd, impType); navigate('/home'); }
    catch(e) { toast.error(e.message); }
    setLoading(false);
  };

  const copyPhrase = () => { navigator.clipboard.writeText(created?.mnemonic||''); setCopied(true); setTimeout(()=>setCopied(false),3000); };
  const words = created?.mnemonic?.split(' ')||[];

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Hero header */}
      <div className="header-bg px-5 pt-14 pb-8 text-center">
        {step !== 'home' && (
          <button onClick={() => setStep('home')} className="absolute top-12 left-5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft size={18}/>
          </button>
        )}
        <div className="w-16 h-16 rounded-3xl bg-brand-500 mx-auto mb-4 flex items-center justify-center shadow-brand-lg">
          <Shield size={30} className="text-white"/>
        </div>
        <h1 className="text-white font-bold text-2xl">VaultChain</h1>
        <p className="text-white/50 text-sm mt-1">Self-custody EVM savings wallet</p>
      </div>

      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-4 px-5 pt-7 pb-10">
        {step === 'home' && (
          <div className="space-y-3 mt-2">
            <button onClick={() => setStep('create')} className="btn-primary w-full py-4 text-base">Create New Wallet</button>
            <button onClick={() => setStep('import')} className="btn-ghost w-full py-4 text-base">Import Wallet</button>
            <p className="text-center text-secondary text-xs pt-4">Non-custodial · Your keys, your coins</p>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-5">
            <div>
              <label className="label">Wallet Name</label>
              <input className="input" placeholder="My Savings Wallet" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPwd?'text':'password'} placeholder="Min. 8 characters" value={pwd} onChange={e=>setPwd(e.target.value)}/>
                <button onClick={()=>setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
                  {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
              {pwd && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i<=strength?strengthColor:'bg-slate-200 dark:bg-navy-700'} transition-all`}/>)}
                  </div>
                  <span className="text-xs text-secondary">{strengthLabel}</span>
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type={showPwd?'text':'password'} placeholder="Repeat password" value={cpwd} onChange={e=>setCpwd(e.target.value)}/>
              {cpwd && pwd !== cpwd && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
            </div>
            <button onClick={doCreate} disabled={loading||!pwd||pwd!==cpwd||pwd.length<8} className="btn-primary w-full py-4">
              {loading ? 'Creating...' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'backup' && created && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5"/>
              <p className="text-amber-700 dark:text-amber-300 text-xs">Write down these words in order. This is the only way to recover your wallet.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {words.map((w,i) => (
                <div key={i} className="bg-slate-50 dark:bg-navy-900 rounded-xl px-2.5 py-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-secondary w-4 font-mono">{i+1}.</span>
                  <span className="text-sm font-mono text-primary font-medium">{w}</span>
                </div>
              ))}
            </div>
            <button onClick={copyPhrase} className="btn-ghost w-full flex items-center justify-center gap-2">
              {copied?<><Check size={14} className="text-emerald-500"/>Copied!</>:<><Copy size={14}/>Copy All Words</>}
            </button>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-navy-900">
              <input type="checkbox" checked={backed} onChange={e=>setBacked(e.target.checked)} className="mt-0.5 accent-brand-500 flex-shrink-0"/>
              <span className="text-sm text-primary">I've saved my recovery phrase in a safe place</span>
            </label>
            <button onClick={() => navigate('/home')} disabled={!backed} className="btn-primary w-full py-4">
              Go to Wallet
            </button>
          </div>
        )}

        {step === 'import' && (
          <div className="space-y-5">
            <div className="flex p-1 bg-slate-100 dark:bg-navy-900 rounded-2xl">
              {[['mnemonic','Seed Phrase'],['privatekey','Private Key']].map(([v,l]) => (
                <button key={v} onClick={()=>setImpType(v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${impType===v?'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm':'text-secondary'}`}>{l}</button>
              ))}
            </div>
            <div>
              <label className="label">Wallet Name</label>
              <input className="input" placeholder="Imported Wallet" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div>
              <label className="label">{impType==='mnemonic'?'12 or 24 word phrase':'Private Key (0x...)'}</label>
              <textarea className="input resize-none font-mono text-xs leading-relaxed" rows={3} placeholder={impType==='mnemonic'?'Enter words separated by spaces':'0x...'} value={phrase} onChange={e=>setPhrase(e.target.value)}/>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPwd?'text':'password'} placeholder="Min. 8 characters" value={pwd} onChange={e=>setPwd(e.target.value)}/>
                <button onClick={()=>setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary"><EyeOff size={16}/></button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type={showPwd?'text':'password'} placeholder="Repeat password" value={cpwd} onChange={e=>setCpwd(e.target.value)}/>
            </div>
            <button onClick={doImport} disabled={loading||!phrase||!pwd||pwd!==cpwd||pwd.length<8} className="btn-primary w-full py-4">
              {loading?'Importing...':'Import Wallet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
