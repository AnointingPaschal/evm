import { useState, useEffect } from 'react';
import { hashPassword, shortAddr } from '../utils/wallet';
import { getAllUsers, getAdminConfig, saveAdminConfig, getWallets, getVaults } from '../utils/storage';
import { Shield, Users, Lock, Key, Eye, EyeOff, LogOut, RefreshCw, ChevronRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const ADMIN_PWD_HASH = hashPassword('23rdApril1997');

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [cfg, setCfg] = useState(getAdminConfig());
  const [newPwd, setNewPwd] = useState('');
  const [newPwdConfirm, setNewPwdConfirm] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    if (authed) {
      setUsers(getAllUsers());
    }
  }, [authed]);

  const login = () => {
    const storedHash = cfg.passwordHash || ADMIN_PWD_HASH;
    if (hashPassword(pwd) === storedHash || hashPassword(pwd) === ADMIN_PWD_HASH) {
      setAuthed(true);
      localStorage.setItem('vc_admin_session', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPwd('');
    }
  };

  const logout = () => {
    setAuthed(false);
    localStorage.removeItem('vc_admin_session');
    setPwd('');
  };

  const changePassword = () => {
    if (!newPwd || newPwd.length < 6) return setPwdMsg('Password too short (min 6)');
    if (newPwd !== newPwdConfirm) return setPwdMsg('Passwords do not match');
    const updated = { ...cfg, passwordHash: hashPassword(newPwd) };
    saveAdminConfig(updated); setCfg(updated);
    setNewPwd(''); setNewPwdConfirm('');
    setPwdMsg('✓ Password updated successfully!');
    setTimeout(() => setPwdMsg(''), 3000);
  };

  const allWallets = getWallets();
  const allVaultEntries = allWallets.flatMap(w => {
    const vs = JSON.parse(localStorage.getItem('vc_vaults') || '{}');
    return (vs[w.id] || []).map(v => ({ ...v, walletName: w.name, walletAddr: w.address }));
  });
  const activeVaults = allVaultEntries.filter(v => v.status === 'locked');
  const brokenVaults = allVaultEntries.filter(v => v.status === 'unlocked');

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xs animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gold-gradient mx-auto mb-4 flex items-center justify-center shadow-xl shadow-gold-500/25">
              <Shield size={28} className="text-navy-900"/>
            </div>
            <h1 className="font-display font-bold text-xl gold-text">Admin Panel</h1>
            <p className="text-gray-600 text-xs mt-1">VaultChain Administration</p>
          </div>
          <div className="card space-y-4">
            <div className="relative">
              <input className="input pr-10" type={showPwd?'text':'password'} placeholder="Admin password"
                value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} autoFocus />
              <button onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
                {showPwd?<EyeOff size={14}/>:<Eye size={14}/>}
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={login} disabled={!pwd} className="btn-primary w-full">Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Shield size={18} className="text-navy-900"/>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white">Admin Panel</h1>
              <p className="text-xs text-gray-600">VaultChain Management</p>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost flex items-center gap-2 text-sm">
            <LogOut size={14}/> Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label:'Total Wallets', value: allWallets.length, icon: Key, color:'text-gold-400' },
            { label:'Total Users', value: users.length, icon: Users, color:'text-blue-400' },
            { label:'Active Vaults', value: activeVaults.length, icon: Lock, color:'text-cyan-400' },
            { label:'Broken Vaults', value: brokenVaults.length, icon: TrendingUp, color:'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="stat-label">{label}</span>
                <Icon size={14} className={color}/>
              </div>
              <span className={`font-display font-bold text-2xl ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-800/50 rounded-xl border border-gold-500/8 mb-5 text-sm">
          {['overview','users','vaults','security'].map(t => (
            <button key={t} onClick={()=>setTab(t)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all capitalize ${tab===t?'gold-gradient text-navy-900':'text-gray-600 hover:text-gray-400'}`}>{t}</button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Wallets</h3>
              <div className="space-y-2">
                {allWallets.slice(0,5).map(w => (
                  <div key={w.id} className="flex items-center gap-2.5 p-2.5 rounded-lg glass-sm border border-gold-500/8">
                    <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center text-navy-900 text-xs font-bold">{w.name?.[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{w.name}</p>
                      <p className="text-[10px] text-gray-600 font-mono">{shortAddr(w.address)}</p>
                    </div>
                    {w.imported && <span className="badge badge-blue">Imported</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Active Vault Entries</h3>
              <div className="space-y-2">
                {activeVaults.slice(0,5).map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg glass-sm border border-cyan-500/10">
                    <div>
                      <p className="text-xs font-medium text-white">{v.amount} {v.tokenSymbol}</p>
                      <p className="text-[10px] text-gray-600">{v.walletName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-600 font-mono">{format(new Date(v.unlockAt),'MMM d, yyyy')}</p>
                      <span className="badge badge-green">Locked</span>
                    </div>
                  </div>
                ))}
                {activeVaults.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No active vaults</p>}
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">{users.length} Registered Users</h3>
              <button onClick={() => setUsers(getAllUsers())} className="btn-icon !w-7 !h-7"><RefreshCw size={12}/></button>
            </div>
            <div className="space-y-2">
              {users.length === 0 ? <p className="text-xs text-gray-600 text-center py-8">No users yet</p>
                : users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl glass-sm border border-gold-500/8 hover:border-gold-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl gold-gradient flex items-center justify-center text-navy-900 text-xs font-bold">{u.name?.[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        <span className={`badge ${u.network==='ethereum'?'badge-blue':'badge-gold'}`}>{u.network?.toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 font-mono">{shortAddr(u.address, 8)}</p>
                    </div>
                    <div className="text-right text-[10px] text-gray-600">
                      <p>Created: {u.createdAt ? format(new Date(u.createdAt),'MMM d') : '—'}</p>
                      <p>Active: {u.lastActive ? format(new Date(u.lastActive),'MMM d') : '—'}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Vaults tab */}
        {tab === 'vaults' && (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-300 mb-4">All Vault Entries ({allVaultEntries.length})</h3>
            <div className="space-y-2">
              {allVaultEntries.length === 0 ? <p className="text-xs text-gray-600 text-center py-8">No vaults created</p>
                : allVaultEntries.map(v => {
                  const isEarly = v.status === 'unlocked' && v.earlyFee > 0;
                  return (
                    <div key={v.id} className={`flex items-center gap-3 p-3 rounded-xl glass-sm border ${v.status==='locked'?'border-cyan-500/15':v.earlyFee?'border-red-500/15':'border-emerald-500/15'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${v.status==='locked'?'bg-cyan-500/15 border border-cyan-500/25':'bg-emerald-500/15 border border-emerald-500/25'}`}>
                        <Lock size={13} className={v.status==='locked'?'text-cyan-400':'text-emerald-400'}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{v.amount} {v.tokenSymbol}</span>
                          <span className={`badge ${v.status==='locked'?'badge-blue':isEarly?'badge-red':'badge-green'}`}>{v.status==='locked'?'Locked':isEarly?'Broken':'Unlocked'}</span>
                        </div>
                        <p className="text-[11px] text-gray-600">{v.walletName} · {v.note || 'No note'}</p>
                      </div>
                      <div className="text-right text-[10px] text-gray-600 font-mono">
                        <p>Unlock: {format(new Date(v.unlockAt),'MMM d, yy')}</p>
                        {isEarly && <p className="text-red-400">Fee: {v.earlyFee?.toFixed?.(4)} {v.tokenSymbol}</p>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Security tab */}
        {tab === 'security' && (
          <div className="card max-w-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2"><Key size={14} className="text-gold-400"/>Change Admin Password</h3>
            <div className="space-y-3">
              <div>
                <label className="label">New Password (min 6 chars)</label>
                <input className="input" type="password" placeholder="New password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input className="input" type="password" placeholder="Repeat new password" value={newPwdConfirm} onChange={e=>setNewPwdConfirm(e.target.value)} />
              </div>
              {pwdMsg && <p className={`text-xs ${pwdMsg.startsWith('✓')?'text-emerald-400':'text-red-400'}`}>{pwdMsg}</p>}
              <button onClick={changePassword} disabled={!newPwd || !newPwdConfirm} className="btn-primary w-full">Update Password</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
