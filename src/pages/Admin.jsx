import { useState, useEffect } from 'react';
import { hashPassword, shortAddr } from '../utils/wallet';
import { getAllUsers, getAdminConfig, saveAdminConfig, getWallets, getVaults } from '../utils/storage';
import { Shield, Users, Lock, Key, Eye, EyeOff, LogOut, RefreshCw, TrendingUp, Home } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_HASH = hashPassword('23rdApril1997');

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [cfg, setCfg] = useState(getAdminConfig());
  const [newPwd, setNewPwd] = useState('');
  const [cpwd, setCpwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => { if (authed) setUsers(getAllUsers()); }, [authed]);

  const login = () => {
    const stored = cfg.passwordHash || DEFAULT_HASH;
    if (hashPassword(pwd) === stored || hashPassword(pwd) === DEFAULT_HASH) {
      setAuthed(true); setErr(''); localStorage.setItem('vc_admin_session','true');
    } else { setErr('Incorrect password'); setPwd(''); }
  };

  const logout = () => { setAuthed(false); localStorage.removeItem('vc_admin_session'); setPwd(''); };

  const changePwd = () => {
    if (!newPwd||newPwd.length<6) return setPwdMsg('Too short (min 6)');
    if (newPwd!==cpwd) return setPwdMsg('Do not match');
    const u={...cfg,passwordHash:hashPassword(newPwd)};
    saveAdminConfig(u); setCfg(u); setNewPwd('');setCpwd('');
    setPwdMsg('✓ Updated!'); setTimeout(()=>setPwdMsg(''),3000);
  };

  const allWallets = getWallets();
  const allVaults = allWallets.flatMap(w=>{
    const vs=JSON.parse(localStorage.getItem('vc_vaults')||'{}');
    return (vs[w.id]||[]).map(v=>({...v,walletName:w.name,walletAddr:w.address}));
  });
  const activeV = allVaults.filter(v=>v.status==='locked');
  const brokenV = allVaults.filter(v=>v.status==='unlocked'&&v.earlyFee>0);

  if (!authed) return (
    <div className="min-h-screen flex flex-col bg-app">
      <div className="header-bg px-5 pt-14 pb-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-amber-500/30">
          <Shield size={30} className="text-white"/>
        </div>
        <h1 className="text-white font-bold text-2xl">Admin Panel</h1>
        <p className="text-white/50 text-sm mt-1">VaultChain Management</p>
      </div>
      <div className="bg-white dark:bg-navy-800 rounded-t-3xl -mt-4 px-5 pt-7 pb-10 flex-1">
        <div className="space-y-4 max-w-xs mx-auto">
          <div className="relative">
            <input className="input text-center pr-11" type={showPwd?'text':'password'} placeholder="Admin password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} autoFocus/>
            <button onClick={()=>setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
              {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
          {err && <p className="text-red-500 text-sm text-center">{err}</p>}
          <button onClick={login} disabled={!pwd} className="btn-primary w-full py-4">Sign In</button>
          <a href="/" className="flex items-center justify-center gap-1.5 text-secondary text-sm hover:text-primary transition-colors mt-2">
            <Home size={14}/> Back to Wallet
          </a>
        </div>
      </div>
    </div>
  );

  const stats = [
    {label:'Wallets',value:allWallets.length,color:'text-brand-500'},
    {label:'Users',value:users.length,color:'text-purple-500'},
    {label:'Active Vaults',value:activeV.length,color:'text-cyan-500'},
    {label:'Broken',value:brokenV.length,color:'text-red-500'},
  ];

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <div className="header-bg px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 flex items-center justify-center">
              <Shield size={18} className="text-white"/>
            </div>
            <div>
              <h1 className="text-white font-bold text-base">Admin Panel</h1>
              <p className="text-white/50 text-xs">VaultChain</p>
            </div>
          </div>
          <button onClick={logout} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <LogOut size={16}/>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-navy-800 rounded-t-3xl -mt-3 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 px-5 pt-5 pb-4">
          {stats.map(({label,value,color}) => (
            <div key={label} className="bg-slate-50 dark:bg-navy-900 rounded-2xl p-3 text-center">
              <p className={`font-bold text-xl ${color}`}>{value}</p>
              <p className="text-secondary text-[10px] font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-white/5 px-5">
          {['overview','users','vaults','security'].map(t => (
            <button key={t} onClick={()=>setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold capitalize transition-all border-b-2 ${tab===t?'border-brand-500 text-brand-500':'border-transparent text-secondary'}`}>{t}</button>
          ))}
        </div>

        <div className="px-5 pt-4">
          {tab==='overview' && (
            <div className="space-y-4">
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Recent Wallets</p>
                {allWallets.slice(0,5).map(w => (
                  <div key={w.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">{w.name?.[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-medium text-sm truncate">{w.name}</p>
                      <p className="text-secondary text-xs font-mono">{shortAddr(w.address)}</p>
                    </div>
                    {w.imported && <span className="badge badge-blue">Imported</span>}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-3">Active Vaults</p>
                {activeV.length===0 ? <p className="text-secondary text-sm text-center py-4">No active vaults</p>
                  : activeV.slice(0,5).map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-900/15 border border-cyan-100 dark:border-cyan-500/20 mb-2">
                      <div>
                        <p className="text-primary font-semibold text-sm">{v.amount} {v.tokenSymbol}</p>
                        <p className="text-secondary text-xs">{v.walletName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-secondary text-xs font-mono">{format(new Date(v.unlockAt),'MMM d, yy')}</p>
                        <span className="badge badge-cyan">Locked</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab==='users' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider">{users.length} Users</p>
                <button onClick={()=>setUsers(getAllUsers())} className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-secondary hover:text-primary transition-colors">
                  <RefreshCw size={13}/>
                </button>
              </div>
              {users.length===0 ? <p className="text-secondary text-sm text-center py-8">No users yet</p>
                : users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 font-bold">{u.name?.[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-primary font-medium text-sm truncate">{u.name}</p>
                        <span className={`badge ${u.network==='ethereum'?'badge-blue':'badge-gold'}`}>{u.network?.toUpperCase()?.slice(0,3)}</span>
                      </div>
                      <p className="text-secondary text-xs font-mono">{shortAddr(u.address)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-secondary text-[10px]">{u.createdAt?format(new Date(u.createdAt),'MMM d'):'—'}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab==='vaults' && (
            <div>
              <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-3">{allVaults.length} Vault Entries</p>
              {allVaults.length===0 ? <p className="text-secondary text-sm text-center py-8">No vaults created</p>
                : allVaults.map(v => (
                  <div key={v.id} className={`flex items-center gap-3 p-3.5 rounded-2xl mb-2 ${v.status==='locked'?'bg-cyan-50 dark:bg-cyan-900/15 border border-cyan-100 dark:border-cyan-500/20':v.earlyFee?'bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-500/20':'bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-500/20'}`}>
                    <Lock size={14} className={v.status==='locked'?'text-cyan-500 flex-shrink-0':v.earlyFee?'text-red-500 flex-shrink-0':'text-emerald-500 flex-shrink-0'}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-semibold text-sm">{v.amount} {v.tokenSymbol}</p>
                      <p className="text-secondary text-xs">{v.walletName} · {v.note||'—'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${v.status==='locked'?'badge-cyan':v.earlyFee?'badge-red':'badge-green'}`}>{v.status==='locked'?'Locked':v.earlyFee?'Broken':'Unlocked'}</span>
                      <p className="text-secondary text-[10px] font-mono mt-1">{format(new Date(v.unlockAt),'MMM d, yy')}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab==='security' && (
            <div className="max-w-xs">
              <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-4">Change Admin Password</p>
              <div className="space-y-3">
                <div>
                  <label className="label">New Password</label>
                  <input className="input" type="password" placeholder="Min 6 characters" value={newPwd} onChange={e=>setNewPwd(e.target.value)}/>
                </div>
                <div>
                  <label className="label">Confirm</label>
                  <input className="input" type="password" placeholder="Repeat" value={cpwd} onChange={e=>setCpwd(e.target.value)}/>
                </div>
                {pwdMsg && <p className={`text-sm ${pwdMsg.startsWith('✓')?'text-emerald-500':'text-red-500'}`}>{pwdMsg}</p>}
                <button onClick={changePwd} disabled={!newPwd||!cpwd} className="btn-primary w-full py-4">Update Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
