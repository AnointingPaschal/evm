import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { 
  createWallet, importFromMnemonic, importFromPrivateKey, encryptData, decryptData, 
  getNativeBalance, getTokenBalance, getTokenInfo, isValidAddress,
  // NEW ON-CHAIN VAULT IMPORTS:
  getUserVaultsOnChain, lockTokensOnChain, withdrawFromVaultOnChain, breakVaultOnChain 
} from '../utils/wallet';
import { 
  saveWallet, getWallets, getActiveWallet, setActiveId, deleteWallet, 
  saveTokens, getTokens, getSettings, saveSettings 
} from '../utils/storage';
import { getCCTokenLogo, getCGTokenInfo, getCCPrice } from '../utils/api';
import toast from 'react-hot-toast';

const Ctx = createContext(null);
export const useWallet = () => { const c = useContext(Ctx); if (!c) throw new Error('No WalletProvider'); return c; };

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActive] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [vaults, setVaults] = useState([]); // Now populated strictly from the blockchain
  const [settings, setSettings] = useState(getSettings());
  const [sessionPwd, setSessionPwd] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState({});
  const [loadingBal, setLoadingBal] = useState(false);
  const priceRef = useRef(null);
  const network = settings.network || 'ethereum';

  useEffect(() => {
    const ws = getWallets(); setWallets(ws);
    const aw = getActiveWallet();
    if (aw) { 
      setActive(aw); 
      setTokens(getTokens(aw.id)); 
      // Removed local storage getVaults. Handled async now.
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    if (!activeWallet) return;
    const sym = network === 'ethereum' ? 'ETH' : 'BNB';
    const tokenSyms = tokens.filter(t => t.network === network && t.symbol).map(t => t.symbol.toUpperCase());
    const all = [...new Set([sym, ...tokenSyms])];
    const raw = await getCCPrice(all);
    const mapped = {};
    for (const [s, d] of Object.entries(raw)) {
      if (d?.USD) mapped[s.toUpperCase()] = {
        price: d.USD.PRICE, change24h: d.USD.CHANGEPCT24HOUR, change1h: d.USD.CHANGEPCTHOUR,
        high24h: d.USD.HIGH24HOUR, low24h: d.USD.LOW24HOUR, volume24h: d.USD.VOLUME24HOURTO,
        marketCap: d.USD.MKTCAP, supply: d.USD.SUPPLY,
        imageUrl: d.USD.IMAGEURL ? `https://www.cryptocompare.com${d.USD.IMAGEURL}` : null,
      };
    }
    setPrices(mapped);
  }, [activeWallet, tokens, network]);

  const refreshBalances = useCallback(async () => {
    if (!activeWallet) return;
    setLoadingBal(true);
    try {
      // 1. Fetch Standard Balances
      const bals = { native: await getNativeBalance(activeWallet.address, network) };
      for (const t of tokens.filter(tk => tk.network === network)) {
        bals[t.address.toLowerCase()] = await getTokenBalance(t.address, activeWallet.address, network);
      }
      setBalances(bals);

      // 2. Fetch ON-CHAIN Vaults dynamically
      const onChainVaults = await getUserVaultsOnChain(activeWallet.address, network);
      
      const formattedVaults = onChainVaults.map(v => {
        // Find matching token to get correct decimals and symbols
        const t = tokens.find(tk => tk.address.toLowerCase() === v.tokenAddress.toLowerCase());
        const decimals = t ? t.decimals : 18;
        const symbol = t ? t.symbol : 'Token';

        return {
          id: v.id, // Contract Array Index (Needed for withdraws)
          tokenAddress: v.tokenAddress,
          tokenSymbol: symbol,
          amount: ethers.formatUnits(v.amount, decimals), // Convert from Wei
          unlockAt: new Date(v.unlockTimestamp).toISOString(),
          status: v.status
        };
      });
      setVaults(formattedVaults);

    } catch (err) {
      console.error("Balance/Vault Sync Error:", err);
    }
    setLoadingBal(false);
  }, [activeWallet, tokens, network]);

  useEffect(() => {
    if (activeWallet && !isLocked) {
      refreshBalances(); refreshPrices();
      if (priceRef.current) clearInterval(priceRef.current);
      priceRef.current = setInterval(refreshPrices, 30000); // Poll every 30s
    }
    return () => { if (priceRef.current) clearInterval(priceRef.current); };
  }, [activeWallet, network, isLocked]);

  const _activate = (w) => {
    setActive(w); setActiveId(w.id);
    const t = getTokens(w.id); setTokens(t);
    setVaults([]); setBalances({}); setPrices({});
  };

  const createNew = async (name, password) => {
    const wd = createWallet();
    const wallet = { id:`vc_${Date.now()}`, name: name||`Wallet ${wallets.length+1}`, address:wd.address, encryptedData:encryptData({privateKey:wd.privateKey,mnemonic:wd.mnemonic},password), createdAt:new Date().toISOString(), network };
    saveWallet(wallet); setWallets(getWallets()); _activate(wallet); setSessionPwd(password); setIsLocked(false);
    toast.success('Wallet created!');
    return { ...wallet, mnemonic:wd.mnemonic, privateKey:wd.privateKey };
  };

  const importWallet = async (phrase, name, password, type='mnemonic') => {
    const wd = type==='mnemonic' ? importFromMnemonic(phrase) : importFromPrivateKey(phrase);
    const wallet = { id:`vc_${Date.now()}`, name:name||`Wallet ${wallets.length+1}`, address:wd.address, encryptedData:encryptData({privateKey:wd.privateKey,mnemonic:wd.mnemonic},password), createdAt:new Date().toISOString(), network, imported:true };
    saveWallet(wallet); setWallets(getWallets()); _activate(wallet); setSessionPwd(password); setIsLocked(false);
    toast.success('Wallet imported!');
    return wallet;
  };

  const switchWallet = (id) => { const w=wallets.find(x=>x.id===id); if(w){_activate(w);setSessionPwd(null);setIsLocked(true);} };
  const removeWallet = (id) => { deleteWallet(id); const r=getWallets(); setWallets(r); if(activeWallet?.id===id){const n=r[0]||null; if(n)_activate(n); else{setActive(null);setTokens([]);setVaults([]);}} toast.success('Wallet removed'); };
  const getKeys = (pwd) => { if(!activeWallet)throw new Error('No wallet'); return decryptData(activeWallet.encryptedData, pwd||sessionPwd); };

  const addToken = async (contractAddr, tokenNetwork) => {
    const net = tokenNetwork||network;
    if(!isValidAddress(contractAddr)) throw new Error('Invalid address');
    if(tokens.find(t=>t.address.toLowerCase()===contractAddr.toLowerCase()&&t.network===net)) throw new Error('Already added');
    const info = await getTokenInfo(contractAddr, net);
    let logo=null, coingeckoId=null;
    try { logo = await getCCTokenLogo(info.symbol); } catch {}
    if(!logo) { try { const cg=await getCGTokenInfo(contractAddr,net); if(cg){logo=cg.image;coingeckoId=cg.id;} } catch {} }
    const token = { ...info, logo, coingeckoId, addedAt:new Date().toISOString() };
    const updated = [...tokens, token]; setTokens(updated); saveTokens(activeWallet.id, updated);
    toast.success(`${info.symbol} added!`); return token;
  };

  const removeToken = (addr) => { const u=tokens.filter(t=>t.address.toLowerCase()!==addr.toLowerCase()); setTokens(u); saveTokens(activeWallet.id,u); };

  // === ON-CHAIN VAULT WRITE FUNCTIONS ===

  const createVault = async ({ tokenAddress, tokenSymbol, amount, lockMonths }) => {
    if(!sessionPwd) throw new Error('Wallet is locked');
    if(lockMonths < 1) throw new Error('Minimum 1 month');
    if(amount <= 0) throw new Error('Invalid amount');

    // Get Decimals
    const t = tokens.find(tk => tk.address.toLowerCase() === tokenAddress.toLowerCase());
    const decimals = t ? t.decimals : 18;
    const lockDays = lockMonths * 30; // Contract uses days
    
    // Decrypt keys for signing
    const pk = getKeys(sessionPwd).privateKey;

    toast.loading("Locking on-chain (Approve + Lock)...", { id: 'vault_tx' });
    try {
      await lockTokensOnChain(pk, tokenAddress, amount, decimals, lockDays, network);
      toast.success(`🔒 Locked ${tokenSymbol} securely on-chain!`, { id: 'vault_tx' });
      refreshBalances(); // Syncs balances and fetches the new vault
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Transaction failed. Check gas.", { id: 'vault_tx' });
      throw error;
    }
  };

  const unlockVault = async (vaultId, fee = 0) => {
    if(!sessionPwd) throw new Error('Wallet is locked');
    const pk = getKeys(sessionPwd).privateKey;
    const isBreaking = fee > 0;

    toast.loading(isBreaking ? "Breaking vault and paying penalty..." : "Withdrawing unlocked tokens...", { id: 'vault_tx' });
    try {
      if (isBreaking) {
        await breakVaultOnChain(pk, vaultId, network);
      } else {
        await withdrawFromVaultOnChain(pk, vaultId, network);
      }
      toast.success(isBreaking ? "Vault broken! Penalty routed to Admin." : "Tokens withdrawn successfully!", { id: 'vault_tx' });
      refreshBalances(); // Sync UI with blockchain
    } catch (error) {
      console.error(error);
      toast.error("Transaction failed. Make sure you have BNB/ETH for gas.", { id: 'vault_tx' });
      throw error;
    }
  };

  // =======================================

  const setNetwork = (n) => updateSettings({ network:n });
  const updateSettings = (patch) => { const u={...settings,...patch}; setSettings(u); saveSettings(u); };
  const lockWallet = () => { setSessionPwd(null); setIsLocked(true); };
  const unlockWallet = (pwd) => { try { if(!activeWallet)return false; decryptData(activeWallet.encryptedData,pwd); setSessionPwd(pwd); setIsLocked(false); return true; } catch { return false; } };

  return (
    <Ctx.Provider value={{ wallets,activeWallet,tokens,vaults,settings,sessionPwd,isLocked,balances,prices,loadingBal,network,
      createNew,importWallet,switchWallet,removeWallet,getKeys,addToken,removeToken,
      createVault,unlockVault, // <--- These now execute real blockchain transactions!
      updateSettings,setNetwork,lockWallet,unlockWallet,refreshBalances,refreshPrices }}>
      {children}
    </Ctx.Provider>
  );
};
