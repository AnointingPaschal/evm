// === VAULT CONTRACT CONFIGURATION ===
export const VAULT_CONTRACT_ADDRESSES = {
  ethereum: "0xYourEthDeployedContractAddress", // Replace later when you deploy to ETH Mainnet
  bsc: "0x16AfD62Cf894a1be65F631e9e953E180A70134ae" // 🟢 LIVE: Your deployed BSC Smart Contract!
};

export const VAULT_ABI = [
  "function lockTokens(address _tokenAddress, uint256 _amount, uint256 _lockDays) external",
  "function withdraw(uint256 _lockId) external",
  "function breakVault(uint256 _lockId) external",
  "function getUserLocks(address _user) external view returns (tuple(address tokenAddress, uint256 amount, uint256 unlockTimestamp, bool isWithdrawn)[])"
];

// Standard ERC20 snippet required for giving the vault permission to transfer tokens
const MINIMAL_ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// === ON-CHAIN VAULT READ OPERATIONS ===

/**
 * Fetches all vaults for a specific user wallet address directly from the blockchain.
 * Replaces local storage reads for active locks.
 */
export const getUserVaultsOnChain = async (wAddr, network = 'ethereum') => {
  try {
    const contractAddr = VAULT_CONTRACT_ADDRESSES[network];
    if (!contractAddr || contractAddr.startsWith("0xYour")) return [];

    // Make sure getProvider is defined higher up in your wallet.js
    const contract = new ethers.Contract(contractAddr, VAULT_ABI, getProvider(network));
    const rawLocks = await contract.getUserLocks(wAddr);

    return rawLocks.map((lock, index) => {
      const unlockMs = Number(lock.unlockTimestamp) * 1000;
      let status = 'locked';
      if (lock.isWithdrawn) {
        status = 'withdrawn';
      } else if (Date.now() >= unlockMs) {
        status = 'unlocked';
      }

      return {
        id: index, // Array index corresponds exactly to the contract lockId
        tokenAddress: lock.tokenAddress,
        amount: lock.amount.toString(), // Keep raw; parse inside context based on decimals
        unlockTimestamp: unlockMs,
        isWithdrawn: lock.isWithdrawn,
        status: status
      };
    });
  } catch (error) {
    console.error("Error fetching on-chain vaults:", error);
    return [];
  }
};

// === ON-CHAIN VAULT WRITE OPERATIONS ===

/**
 * Locks tokens inside the smart contract wrapper. 
 * This is a 2-step process: 1. ERC20 Approval -> 2. Contract Deposit
 */
export const lockTokensOnChain = async (pk, tokenAddr, amount, decimals, lockDays, network = 'ethereum') => {
  // SAFETY CHECK: This smart contract expects ERC20/BEP20 tokens.
  if (tokenAddr === 'native' || tokenAddr === ethers.ZeroAddress) {
    throw new Error("This vault contract currently only supports BEP20/ERC20 tokens, not native BNB/ETH.");
  }

  const provider = getProvider(network);
  const wallet = new ethers.Wallet(pk, provider);
  const vaultAddr = VAULT_CONTRACT_ADDRESSES[network];
  const amountInWei = ethers.parseUnits(String(amount), decimals);

  // Step 1: ERC20 Token Approval
  const tokenContract = new ethers.Contract(tokenAddr, MINIMAL_ERC20_ABI, wallet);
  
  // Check existing allowance to avoid unnecessary gas spending
  const currentAllowance = await tokenContract.allowance(wallet.address, vaultAddr);
  if (currentAllowance < amountInWei) {
    const approveTx = await tokenContract.approve(vaultAddr, amountInWei);
    await approveTx.wait(); // Wait for approval confirmation block
  }

  // Step 2: Interact with Vault Contract
  const vaultContract = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const lockTx = await vaultContract.lockTokens(tokenAddr, amountInWei, lockDays);
  return await lockTx.wait();
};

/**
 * Normal claim routine when the lock duration has officially expired.
 */
export const withdrawFromVaultOnChain = async (pk, lockId, network = 'ethereum') => {
  const provider = getProvider(network);
  const wallet = new ethers.Wallet(pk, provider);
  const vaultAddr = VAULT_CONTRACT_ADDRESSES[network];

  const vaultContract = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const tx = await vaultContract.withdraw(lockId);
  return await tx.wait();
};

/**
 * Emergency break routine when breaking the vault early for your Admin penalty fee.
 */
export const breakVaultOnChain = async (pk, lockId, network = 'ethereum') => {
  const provider = getProvider(network);
  const wallet = new ethers.Wallet(pk, provider);
  const vaultAddr = VAULT_CONTRACT_ADDRESSES[network];

  const vaultContract = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const tx = await vaultContract.breakVault(lockId);
  return await tx.wait();
};
