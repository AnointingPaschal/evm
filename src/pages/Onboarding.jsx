import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Copy, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const { createNew, importWallet } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState('home'); // home | create | created | import
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [importType, setImportType] = useState('mnemonic');
  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState(null);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [confirmedBackup, setConfirmedBackup] = useState(false);

  const pwdStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = pwdStrength(pwd);
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength];
  const strengthColor = ['','bg-red-500','bg-orange-400','bg-yellow-400','bg-emerald-400'][strength];

  const handleCreate = async () => {
    if (!pwd || pwd.length < 8) return toast.error('Password must be at least 8 characters');
    if (pwd !== confirmPwd) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const data = await createNew(name || 'My Wallet', pwd);
      setCreatedData(data);
      setStep('created');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!phrase.trim()) return toast.error('Enter your phrase or key');
    if (!pwd || pwd.length < 8) return toast.error('Password must be at least 8 characters');
    if (pwd !== confirmPwd) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await importWallet(phrase, name || 'Imported Wallet', pwd, importType);
      navigate('/dashboard');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const copyPhrase = () => {
    navigator.clipboard.writeText(createdData?.mnemonic || '');
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 3000);
  };

  const words = createdData?.mnemonic?.split(' ') || [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{animationDelay:'1.5s'}} />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* HOME */}
        {step === 'home' && (
          <div className="text-center">
            <div className="w-20 h-20 gold-gradient rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-gold-500/30 animate-float">
              <Lock size={36} className="text-navy-900" />
            </div>
            <h1 className="font-display font-bold text-3xl shimmer-text mb-2">VaultChain</h1>
            <p className="text-gray-500 text-sm mb-10">Your self-custody EVM savings wallet</p>
            <div className="space-y-3">
              <button onClick={() => setStep('create')} className="btn-primary w-full py-3.5 text-base">
                Create New Wallet
              </button>
              <button onClick={() => setStep('import')} className="btn-ghost w-full py-3.5 text-base">
                Import Existing Wallet
              </button>
            </div>
            <p className="mt-8 text-xs text-gray-700 font-mono">Non-custodial · Open source · Your keys, your coins</p>
          </div>
        )}

        {/* CREATE */}
        {step === 'create' && (
          <div className="card">
            <button onClick={() => setStep('home')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="font-display font-bold text-xl text-white mb-1">Create Wallet</h2>
            <p className="text-gray-500 text-sm mb-6">Set a strong password to protect your wallet</p>
            <div className="space-y-4">
              <div>
                <label className="label">Wallet Name (optional)</label>
                <input className="input" placeholder="My Savings Wallet" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input className="input pr-10" type={showPwd?'text':'password'} placeholder="Min. 8 characters" value={pwd} onChange={e => setPwd(e.target.value)} />
                  <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {pwd && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i<=strength ? strengthColor : 'bg-navy-600'} transition-all`} />)}
                    </div>
                    <span className="text-xs text-gray-500">{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input className="input" type={showPwd?'text':'password'} placeholder="Repeat password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
              <button onClick={handleCreate} disabled={loading || !pwd || pwd !== confirmPwd} className="btn-primary w-full py-3 mt-2">
                {loading ? 'Creating...' : 'Create Wallet'} {!loading && <ArrowRight size={15} className="inline ml-1"/>}
              </button>
            </div>
          </div>
        )}

        {/* CREATED — backup phrase */}
        {step === 'created' && createdData && (
          <div className="card">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-6">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">Write down your secret phrase and keep it safe. Never share it!</p>
            </div>
            <h2 className="font-display font-bold text-lg text-white mb-4">Your Secret Recovery Phrase</h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {words.map((w, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-navy-800 rounded-lg px-2.5 py-2 border border-gold-500/10">
                  <span className="text-[10px] text-gray-600 w-4 font-mono">{i+1}.</span>
                  <span className="text-xs font-mono text-white">{w}</span>
                </div>
              ))}
            </div>
            <button onClick={copyPhrase} className="btn-ghost w-full mb-4 flex items-center justify-center gap-2">
              {copiedPhrase ? <><Check size={14} className="text-emerald-400"/> Copied!</> : <><Copy size={14}/> Copy Phrase</>}
            </button>
            <label className="flex items-start gap-2.5 cursor-pointer mb-4">
              <input type="checkbox" checked={confirmedBackup} onChange={e => setConfirmedBackup(e.target.checked)} className="mt-0.5 accent-gold-500" />
              <span className="text-xs text-gray-400">I have saved my recovery phrase securely and understand I cannot recover it if lost</span>
            </label>
            <button onClick={() => navigate('/dashboard')} disabled={!confirmedBackup} className="btn-primary w-full py-3">
              Continue to Wallet <ArrowRight size={15} className="inline ml-1"/>
            </button>
          </div>
        )}

        {/* IMPORT */}
        {step === 'import' && (
          <div className="card">
            <button onClick={() => setStep('home')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="font-display font-bold text-xl text-white mb-1">Import Wallet</h2>
            <p className="text-gray-500 text-sm mb-5">Restore your wallet using seed phrase or private key</p>
            <div className="flex rounded-xl overflow-hidden border border-gold-500/15 mb-5 text-sm">
              {['mnemonic','privatekey'].map(t => (
                <button key={t} onClick={() => setImportType(t)}
                  className={`flex-1 py-2.5 font-medium transition-all ${importType===t?'gold-gradient text-navy-900':'text-gray-500 hover:text-gray-300'}`}>
                  {t === 'mnemonic' ? 'Seed Phrase' : 'Private Key'}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Wallet Name (optional)</label>
                <input className="input" placeholder="Imported Wallet" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">{importType === 'mnemonic' ? '12 or 24 word seed phrase' : 'Private Key (0x...)'}</label>
                <textarea className="input resize-none font-mono text-xs" rows={3} placeholder={importType==='mnemonic'?'word1 word2 word3...':'0x...'} value={phrase} onChange={e => setPhrase(e.target.value)} />
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input className="input pr-10" type={showPwd?'text':'password'} placeholder="Min. 8 characters" value={pwd} onChange={e => setPwd(e.target.value)} />
                  <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><EyeOff size={15}/></button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input className="input" type={showPwd?'text':'password'} placeholder="Repeat password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
              <button onClick={handleImport} disabled={loading || !phrase || !pwd || pwd !== confirmPwd} className="btn-primary w-full py-3">
                {loading ? 'Importing...' : 'Import Wallet'} {!loading && <ArrowRight size={15} className="inline ml-1"/>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
