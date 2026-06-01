import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

export const NETWORKS = {
  ethereum: {
    id: 1, name: 'Ethereum', symbol: 'ETH',
    rpc: 'https://ethereum-rpc.publicnode.com',
    explorer: 'https://etherscan.io',
    color: '#627EEA', decimals: 18, coingeckoId: 'ethereum', ccSymbol: 'ETH',
  },
  bsc: {
    id: 56, name: 'BNB Chain', symbol: 'BNB',
    rpc: 'https://bsc-rpc.publicnode.com',
    explorer: 'https://bscscan.com',
    color: '#F3BA2F', decimals: 18, coingeckoId: 'binancecoin', ccSymbol: 'BNB',
  }
};

const _providers = {};
export const getProvider = (network = 'ethereum') => {
  if (!_providers[network]) _providers[network] = new ethers.JsonRpcProvider(NETWORKS[network].rpc);
  return _providers[network];
};

export const createWallet = () => {
  const w = ethers.Wallet.createRandom();
  return { address: w.address, mnemonic: w.mnemonic.phrase, privateKey: w.privateKey };
};
export const importFromMnemonic = (m) => {
  try { const w = ethers.Wallet.fromPhrase(m.trim()); return { address: w.address, mnemonic: w.mnemonic.phrase, privateKey: w.privateKey }; }
  catch { throw new Error('Invalid mnemonic phrase'); }
};
export const importFromPrivateKey = (pk) => {
  try { const w = new ethers.Wallet(pk.trim()); return { address: w.address, mnemonic: null, privateKey: w.privateKey }; }
  catch { throw new Error('Invalid private key'); }
};
export const encryptData = (data, pwd) => CryptoJS.AES.encrypt(JSON.stringify(data), pwd).toString();
export const decryptData = (enc, pwd) => {
  try { const s = CryptoJS.AES.decrypt(enc, pwd).toString(CryptoJS.enc.Utf8); if (!s) throw 0; return JSON.parse(s); }
  catch { throw new Error('Invalid password'); }
};
export const hashPassword = (pwd) => CryptoJS.SHA256(pwd).toString();

export const getNativeBalance = async (address, network = 'ethereum') => {
  try { return ethers.formatEther(await getProvider(network).getBalance(address)); } catch { return '0'; }
};
export const getTokenBalance = async (tAddr, wAddr, network = 'ethereum') => {
  try {
    const abi = ['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)'];
    const c = new ethers.Contract(tAddr, abi, getProvider(network));
    const [bal, dec] = await Promise.all([c.balanceOf(wAddr), c.decimals()]);
    return ethers.formatUnits(bal, dec);
  } catch { return '0'; }
};
export const getTokenInfo = async (tAddr, network = 'ethereum') => {
  const abi = ['function name() view returns (string)','function symbol() view returns (string)','function decimals() view returns (uint8)'];
  const c = new ethers.Contract(tAddr, abi, getProvider(network));
  const [name, symbol, decimals] = await Promise.all([c.name(), c.symbol(), c.decimals()]);
  return { name, symbol, decimals: Number(decimals), address: tAddr, network };
};
export const sendNative = async (pk, to, amount, network = 'ethereum') => {
  const w = new ethers.Wallet(pk, getProvider(network));
  return w.sendTransaction({ to, value: ethers.parseEther(String(amount)) });
};
export const sendToken = async (pk, tAddr, to, amount, decimals, network = 'ethereum') => {
  const w = new ethers.Wallet(pk, getProvider(network));
  const c = new ethers.Contract(tAddr, ['function transfer(address,uint256) returns (bool)'], w);
  return c.transfer(to, ethers.parseUnits(String(amount), decimals));
};
export const isValidAddress = (a) => { try { return ethers.isAddress(a); } catch { return false; } };
export const shortAddr = (a, n = 6) => a ? `${a.slice(0,n)}...${a.slice(-4)}` : '';
export const formatBal = (b, d = 6) => {
  const n = parseFloat(b);
  if (isNaN(n) || n === 0) return '0.000000';
  if (n < 0.000001) return '< 0.000001';
  return n.toFixed(d);
};
