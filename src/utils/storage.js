const K = {
  WALLETS:'vc_wallets', ACTIVE:'vc_active', TOKENS:'vc_tokens',
  VAULTS:'vc_vaults', SETTINGS:'vc_settings', ADMIN:'vc_admin_cfg', USERS:'vc_users',
};
const g = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const s = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const saveWallet = (w) => {
  const all = g(K.WALLETS) || [];
  const i = all.findIndex(x => x.id === w.id);
  if (i >= 0) all[i] = w; else all.push(w);
  s(K.WALLETS, all);
  // track user
  const users = g(K.USERS) || [];
  const exists = users.find(u => u.id === w.id);
  if (!exists) users.push({ id: w.id, name: w.name, address: w.address, network: w.network, createdAt: w.createdAt, lastActive: new Date().toISOString() });
  else exists.lastActive = new Date().toISOString();
  s(K.USERS, users);
};
export const getWallets = () => g(K.WALLETS) || [];
export const getActiveWallet = () => {
  const all = getWallets(); const id = g(K.ACTIVE);
  return id ? (all.find(w => w.id === id) || all[0] || null) : (all[0] || null);
};
export const setActiveId = (id) => s(K.ACTIVE, id);
export const deleteWallet = (id) => {
  s(K.WALLETS, getWallets().filter(w => w.id !== id));
  s(K.USERS, (g(K.USERS)||[]).filter(u => u.id !== id));
};
export const saveTokens = (wid, tokens) => { const all = g(K.TOKENS)||{}; all[wid] = tokens; s(K.TOKENS, all); };
export const getTokens = (wid) => (g(K.TOKENS)||{})[wid] || [];
export const saveVaults = (wid, vaults) => { const all = g(K.VAULTS)||{}; all[wid] = vaults; s(K.VAULTS, all); };
export const getVaults = (wid) => (g(K.VAULTS)||{})[wid] || [];
export const getSettings = () => g(K.SETTINGS) || { network:'ethereum', currency:'USD', autoLock:15 };
export const saveSettings = (v) => s(K.SETTINGS, v);
export const getAdminConfig = () => g(K.ADMIN) || { passwordHash: 'e0a3e3e3b3c3d3e3f3a3b3c3d3e3f3a3' };
export const saveAdminConfig = (v) => s(K.ADMIN, v);
export const getAllUsers = () => g(K.USERS) || [];
