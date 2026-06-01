import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

// === 1. CORE NETWORK & PROVIDER SETUP ===
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

// === 2. WALLET CREATION & CRYPTO ===
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

// === 3. READ / WRITE UTILS ===
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

// ==========================================
// === 4. ON-CHAIN VAULT SMART CONTRACT ===
// ==========================================
export const VAULT_CONTRACT_ADDRESSES = {
  ethereum: "0xYourEthDeployedContractAddress", 
  bsc: "0x16AfD62Cf894a1be65F631e9e953E180A70134ae" 
};
const VAULT_ABI = [
  "function lockTokens(address _tokenAddress, uint256 _amount, uint256 _lockDays) external",
  "function withdraw(uint256 _lockId) external",
  "function breakVault(uint256 _lockId) external",
  "function getUserLocks(address _user) external view returns (tuple(address tokenAddress, uint256 amount, uint256 unlockTimestamp, bool isWithdrawn)[])"
];
export const MINIMAL_ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export const getUserVaultsOnChain = async (wAddr, network = 'ethereum') => {
  try {
    const contractAddr = VAULT_CONTRACT_ADDRESSES[network];
    if (!contractAddr || contractAddr.startsWith("0xYour")) return [];
    const contract = new ethers.Contract(contractAddr, VAULT_ABI, getProvider(network));
    const rawLocks = await contract.getUserLocks(wAddr);
    return rawLocks.map((lock, index) => {
      const unlockMs = Number(lock.unlockTimestamp) * 1000;
      let status = lock.isWithdrawn ? 'withdrawn' : (Date.now() >= unlockMs ? 'unlocked' : 'locked');
      return {
        id: index, tokenAddress: lock.tokenAddress, amount: lock.amount.toString(), 
        unlockTimestamp: unlockMs, isWithdrawn: lock.isWithdrawn, status
      };
    });
  } catch (error) { console.error("Vault Error:", error); return []; }
};

export const lockTokensOnChain = async (pk, tokenAddr, amount, decimals, lockDays, network = 'ethereum') => {
  if (tokenAddr === 'native' || tokenAddr === ethers.ZeroAddress) throw new Error("Vault only supports BEP20/ERC20 tokens.");
  const wallet = new ethers.Wallet(pk, getProvider(network));
  const vaultAddr = VAULT_CONTRACT_ADDRESSES[network];
  const amountInWei = ethers.parseUnits(String(amount), decimals);
  const tokenContract = new ethers.Contract(tokenAddr, MINIMAL_ERC20_ABI, wallet);
  const currentAllowance = await tokenContract.allowance(wallet.address, vaultAddr);
  if (currentAllowance < amountInWei) {
    const approveTx = await tokenContract.approve(vaultAddr, amountInWei);
    await approveTx.wait();
  }
  const vaultContract = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const lockTx = await vaultContract.lockTokens(tokenAddr, amountInWei, lockDays);
  return await lockTx.wait();
};

export const withdrawFromVaultOnChain = async (pk, lockId, network = 'ethereum') => {
  const vaultContract = new ethers.Contract(VAULT_CONTRACT_ADDRESSES[network], VAULT_ABI, new ethers.Wallet(pk, getProvider(network)));
  return await (await vaultContract.withdraw(lockId)).wait();
};

export const breakVaultOnChain = async (pk, lockId, network = 'ethereum') => {
  const vaultContract = new ethers.Contract(VAULT_CONTRACT_ADDRESSES[network], VAULT_ABI, new ethers.Wallet(pk, getProvider(network)));
  return await (await vaultContract.breakVault(lockId)).wait();
};

// ==========================================
// === 5. NATIVE DEX SWAP ROUTING ===
// ==========================================
const ROUTER_ADDRESSES = {
  ethereum: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  bsc: "0x10ED43C718714eb63d5aA57B78B54704E256024E"      // PancakeSwap V2
};
const WNATIVE_ADDRESSES = {
  ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  bsc: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"      // WBNB
};
const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

export const executeSwapOnChain = async (pk, fromToken, toToken, amountInStr, amountOutStr, slippage = 1.5, network = 'ethereum') => {
  const wallet = new ethers.Wallet(pk, getProvider(network));
  const routerAddr = ROUTER_ADDRESSES[network];
  const router = new ethers.Contract(routerAddr, ROUTER_ABI, wallet);
  
  const isFromNative = fromToken.isNative || fromToken.address === 'native';
  const isToNative = toToken.isNative || toToken.address === 'native';
  
  const fromAddress = isFromNative ? WNATIVE_ADDRESSES[network] : fromToken.address;
  const toAddress = isToNative ? WNATIVE_ADDRESSES[network] : toToken.address;
  
  const amountIn = ethers.parseUnits(String(amountInStr), fromToken.decimals || 18);
  const expectedOut = ethers.parseUnits(String(amountOutStr), toToken.decimals || 18);
  
  // Calculate BigInt slippage minimum
  const multiplier = BigInt(10000 - Math.floor(slippage * 100));
  const amountOutMin = (expectedOut * multiplier) / 10000n;
  
  const path = [fromAddress, toAddress];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  if (!isFromNative) {
    const tokenContract = new ethers.Contract(fromAddress, MINIMAL_ERC20_ABI, wallet);
    const allowance = await tokenContract.allowance(wallet.address, routerAddr);
    if (allowance < amountIn) {
      const txApprove = await tokenContract.approve(routerAddr, amountIn);
      await txApprove.wait();
    }
  }

  let tx;
  if (isFromNative) {
    tx = await router.swapExactETHForTokens(amountOutMin, path, wallet.address, deadline, { value: amountIn });
  } else if (isToNative) {
    tx = await router.swapExactTokensForETH(amountIn, amountOutMin, path, wallet.address, deadline);
  } else {
    tx = await router.swapExactTokensForTokens(amountIn, amountOutMin, path, wallet.address, deadline);
  }

  return await tx.wait();
};
