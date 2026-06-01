// src/utils/storage.js

const K = {
  WALLETS: 'vc_wallets', 
  ACTIVE: 'vc_active', 
  TOKENS: 'vc_tokens',
  SETTINGS: 'vc_settings', 
  ADMIN: 'vc_admin_cfg', 
  USERS: 'vc_users',
  // NOTE: 'vc_vaults' has been removed. Vaults are now 100% on-chain!
};

// Helper: Safely get item from localStorage
const g = (k) => { 
  try { 
    const v = localStorage.getItem(k); 
    return v ? JSON.parse(v) : null; 
  } catch { 
    return null; 
  } 
};

// Helper: Safely set item in localStorage
const s = (k, v) => { 
  try { 
    localStorage.setItem(k, JSON.stringify(v)); 
    return true; 
  } catch { 
    return false; 
  } 
};

// === WALLET MANAGEMENT ===

export const saveWallet = (w) => {
  const all = g(K.WALLETS) || [];
  const i = all.findIndex(x => x.id === w.id);
  
  if (i >= 0) {
    all[i] = w; 
  } else {
    all.push(w);
  }
  s(K.WALLETS, all);
  
  // Track user history/activity
  const users = g(K.USERS) || [];
  const exists = users.find(u => u.id === w.id);
  
  if (!exists) {
    users.push({ 
      id: w.id, 
      name: w.name, 
      address: w.address, 
      network: w.network, 
      createdAt: w.createdAt, 
      lastActive: new Date().toISOString() 
    });
  } else {
    exists.lastActive = new Date().toISOString();
  }
  s(K.USERS, users);
};

export const getWallets = () => g(K.WALLETS) || [];

export const getActiveWallet = () => {
  const all = getWallets(); 
  const id = g(K.ACTIVE);
  return id ? (all.find(w => w.id === id) || all[0] || null) : (all[0] || null);
};

export const setActiveId = (id) => s(K.ACTIVE, id);

export const deleteWallet = (id) => {
  // Remove wallet
  const wallets = getWallets().filter(w => w.id !== id);
  s(K.WALLETS, wallets);
  
  // Remove user activity record
  const users = (g(K.USERS) || []).filter(u => u.id !== id);
  s(K.USERS, users);
  
  // If active wallet was deleted, default to the next available one
  if (g(K.ACTIVE) === id) {
    s(K.ACTIVE, wallets.length > 0 ? wallets[0].id : null);
  }
};

// === TOKEN MANAGEMENT ===

// Stores custom imported tokens per wallet ID
export const saveTokens = (wid, tokens) => { 
  const all = g(K.TOKENS) || {}; 
  all[wid] = tokens; 
  s(K.TOKENS, all); 
};

export const getTokens = (wid) => {
  const all = g(K.TOKENS) || {};
  return all[wid] || [];
};

// === APP SETTINGS ===

export const getSettings = () => g(K.SETTINGS) || { network: 'ethereum', currency: 'USD', autoLock: 15 };
export const saveSettings = (v) => s(K.SETTINGS, v);

// === ADMIN & USERS ===

export const getAdminConfig = () => g(K.ADMIN) || { passwordHash: 'e0a3e3e3b3c3d3e3f3a3b3c3d3e3f3a3' };
export const saveAdminConfig = (v) => s(K.ADMIN, v);
export const getAllUsers = () => g(K.USERS) || [];
