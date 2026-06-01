import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  createWallet, importFromMnemonic, importFromPrivateKey,
  encryptData, decryptData, getNativeBalance, getTokenBalance, getTokenInfo, isValidAddress
} from '../utils/wallet';
import {
  saveWallet, getWallets, getActiveWallet, setActiveId, deleteWallet,
  saveTokens, getTokens, saveVaults, getVaults, getSettings, saveSettings
} from '../utils/storage';
import { getCCTokenLogo, getCGTokenInfo, getCCPrice } from '../utils/api';
import toast from 'react-hot-toast';

const Ctx = createContext(null);
export const useWallet = () => { const c = useContext(Ctx); if (!c) throw new Error('No WalletProvider'); return c; };

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActive] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [sessionPwd, setSessionPwd] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState({});
  const [loadingBal, setLoadingBal] = useState(false);
  const network = settings.network || 'ethereum';
  const priceRef = useRef(null);

  useEffect(() => {
    const ws = getWallets(); setWallets(ws);
    const aw = getActiveWallet();
    if (aw) { setActive(aw); setTokens(getTokens(aw.id)); setVaults(getVaults(aw.id)); }
  }, []);

  // Live prices via CryptoCompare
  const refreshPrices = useCallback(async () => {
    if (!activeWallet) return;
    const symbols = [
      network === 'ethereum' ? 'ETH' : 'BNB',
      ...tokens.filter(t => t.symbol).map(t => t.symbol.toUpperCase())
    ];
    const raw = await getCCPrice([...new Set(symbols)]);
    const mapped = {};
    for (const [sym, data] of Object.entries(raw)) {
      if (data.USD) mapped[sym.toUpperCase()] = {
        price: data.USD.PRICE,
        change24h: data.USD.CHANGEPCT24HOUR,
        change1h: data.USD.CHANGEPCTHOUR,
        high24h: data.USD.HIGH24HOUR,
        low24h: data.USD.LOW24HOUR,
        volume24h: data.USD.VOLUME24HOURTO,
        marketCap: data.USD.MKTCAP,
        supply: data.USD.SUPPLY,
        imageUrl: data.USD.IMAGEURL ? `https://www.cryptocompare.com${data.USD.IMAGEURL}` : null,
      };
    }
    setPrices(mapped);
  }, [activeWallet, tokens, network]);

  const refreshBalances = useCallback(async () => {
    if (!activeWallet) return;
    setLoadingBal(true);
    try {
      const bals = {};
      bals['native'] = await getNativeBalance(activeWallet.address, network);
      for (const t of tokens.filter(tk => tk.network === network)) {
        bals[t.address.toLowerCase()] = await getTokenBalance(t.address, activeWallet.address, network);
      }
      setBalances(bals);
    } catch (e) { console.error(e); }
    setLoadingBal(false);
  }, [activeWallet, tokens, network]);

  useEffect(() => {
    if (activeWallet && !isLocked) {
      refreshBalances();
      refreshPrices();
      if (priceRef.current) clearInterval(priceRef.current);
      priceRef.current = setInterval(refreshPrices, 30000);
    }
    return () => { if (priceRef.current) clearInterval(priceRef.current); };
  }, [activeWallet, network, isLocked]);

  const _setWallet = (w) => {
    setActive(w); setActiveId(w.id);
    const t = getTokens(w.id); setTokens(t);
    setVaults(getVaults(w.id));
    setBalances({}); setPrices({});
  };

  const createNew = async (name, password) => {
    const wd = createWallet();
    const wallet = {
      id: `vc_${Date.now()}`, name: name || `Wallet ${wallets.length+1}`,
      address: wd.address, encryptedData: encryptData({ privateKey: wd.privateKey, mnemonic: wd.mnemonic }, password),
      createdAt: new Date().toISOString(), network,
    };
    saveWallet(wallet); setWallets(getWallets()); _setWallet(wallet);
    setSessionPwd(password); setIsLocked(false);
    toast.success('Wallet created!');
    return { ...wallet, mnemonic: wd.mnemonic, privateKey: wd.privateKey };
  };

  const importWallet = async (phrase, name, password, type = 'mnemonic') => {
    const wd = type === 'mnemonic' ? importFromMnemonic(phrase) : importFromPrivateKey(phrase);
    const wallet = {
      id: `vc_${Date.now()}`, name: name || `Imported ${wallets.length+1}`,
      address: wd.address, encryptedData: encryptData({ privateKey: wd.privateKey, mnemonic: wd.mnemonic }, password),
      createdAt: new Date().toISOString(), network, imported: true,
    };
    saveWallet(wallet); setWallets(getWallets()); _setWallet(wallet);
    setSessionPwd(password); setIsLocked(false);
    toast.success('Wallet imported!');
    return wallet;
  };

  const switchWallet = (id) => {
    const w = wallets.find(x => x.id === id);
    if (w) { _setWallet(w); setSessionPwd(null); setIsLocked(true); }
  };

  const removeWallet = (id) => {
    deleteWallet(id);
    const remaining = getWallets(); setWallets(remaining);
    if (activeWallet?.id === id) {
      const next = remaining[0] || null;
      if (next) _setWallet(next); else { setActive(null); setTokens([]); setVaults([]); }
    }
    toast.success('Wallet removed');
  };

  const getKeys = (password) => {
    if (!activeWallet) throw new Error('No wallet');
    return decryptData(activeWallet.encryptedData, password || sessionPwd);
  };

  const addToken = async (contractAddr, tokenNetwork) => {
    const net = tokenNetwork || network;
    if (!isValidAddress(contractAddr)) throw new Error('Invalid address');
    if (tokens.find(t => t.address.toLowerCase() === contractAddr.toLowerCase() && t.network === net))
      throw new Error('Token already added');
    const info = await getTokenInfo(contractAddr, net);
    let logo = null, coingeckoId = null;
    try { logo = await getCCTokenLogo(info.symbol); } catch {}
    if (!logo) {
      try { const cg = await getCGTokenInfo(contractAddr, net); if (cg) { logo = cg.image; coingeckoId = cg.id; } } catch {}
    }
    const token = { ...info, logo, coingeckoId, addedAt: new Date().toISOString() };
    const updated = [...tokens, token];
    setTokens(updated); saveTokens(activeWallet.id, updated);
    toast.success(`${info.symbol} added!`);
    return token;
  };

  const removeToken = (addr) => {
    const updated = tokens.filter(t => t.address.toLowerCase() !== addr.toLowerCase());
    setTokens(updated); saveTokens(activeWallet.id, updated);
  };

  // Vault: locked record stored on same wallet
  const createVault = ({ tokenAddress, tokenSymbol, amount, lockMonths, note }) => {
    if (lockMonths < 2) throw new Error('Minimum lock period is 2 months');
    if (amount <= 0) throw new Error('Amount must be positive');
    const unlockDate = new Date();
    unlockDate.setMonth(unlockDate.getMonth() + lockMonths);
    const vault = {
      id: `v_${Date.now()}`, tokenAddress, tokenSymbol, amount: String(amount),
      lockMonths, unlockAt: unlockDate.toISOString(), createdAt: new Date().toISOString(),
      note: note || '', status: 'locked', walletId: activeWallet.id,
    };
    const updated = [...vaults, vault];
    setVaults(updated); saveVaults(activeWallet.id, updated);
    toast.success(`🔒 ${tokenSymbol} locked for ${lockMonths} months!`);
    return vault;
  };

  const unlockVault = (vaultId, fee = 0) => {
    const updated = vaults.map(v =>
      v.id === vaultId ? { ...v, status: 'unlocked', unlockedAt: new Date().toISOString(), earlyFee: fee } : v
    );
    setVaults(updated); saveVaults(activeWallet.id, updated);
  };

  const setNetwork = (n) => updateSettings({ network: n });

  const updateSettings = (patch) => {
    const updated = { ...settings, ...patch };
    setSettings(updated); saveSettings(updated);
  };

  const lockWallet = () => { setSessionPwd(null); setIsLocked(true); };
  const unlockWallet = (pwd) => {
    try {
      if (!activeWallet) return false;
      decryptData(activeWallet.encryptedData, pwd);
      setSessionPwd(pwd); setIsLocked(false);
      return true;
    } catch { return false; }
  };

  return (
    <Ctx.Provider value={{
      wallets, activeWallet, tokens, vaults, settings, sessionPwd, isLocked,
      balances, prices, loadingBal, network,
      createNew, importWallet, switchWallet, removeWallet,
      getKeys, addToken, removeToken,
      createVault, unlockVault,
      updateSettings, setNetwork, lockWallet, unlockWallet,
      refreshBalances, refreshPrices,
    }}>
      {children}
    </Ctx.Provider>
  );
};
