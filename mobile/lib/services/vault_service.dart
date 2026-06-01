import 'package:web3dart/web3dart.dart';
import 'package:http/http.dart' as http;
import '../models/vault_model.dart';

// ───────────────────────────────────────────────────────────────────
//  VaultWallet Smart Contract
//  Deployed: BSC → 0x16AfD62Cf894a1be65F631e9e953E180A70134ae
//  Constructor: (_feeWallet: 0xCca...DF383, _breakFeePercentage: 10)
// ───────────────────────────────────────────────────────────────────

const kVaultAddresses = {
  'bsc': '0x16AfD62Cf894a1be65F631e9e953E180A70134ae',
  'ethereum': null, // not deployed yet
};

const kBreakFeePct = 10; // 10% penalty on early break
const kFeeWallet = '0xCca907AE079DB7638A4d2D3e82defaea5FBDF383';

const _vaultAbiJson = '''[
  {"name":"lockTokens","type":"function","stateMutability":"nonpayable",
   "inputs":[{"name":"_token","type":"address"},{"name":"_amount","type":"uint256"},{"name":"_lockDays","type":"uint256"}],
   "outputs":[]},
  {"name":"withdraw","type":"function","stateMutability":"nonpayable",
   "inputs":[{"name":"_lockId","type":"uint256"}],"outputs":[]},
  {"name":"breakVault","type":"function","stateMutability":"nonpayable",
   "inputs":[{"name":"_lockId","type":"uint256"}],"outputs":[]},
  {"name":"getUserLocks","type":"function","stateMutability":"view",
   "inputs":[{"name":"_user","type":"address"}],
   "outputs":[{"name":"","type":"tuple[]","components":[
     {"name":"token","type":"address"},{"name":"amount","type":"uint256"},
     {"name":"unlockTime","type":"uint256"},{"name":"withdrawn","type":"bool"}
   ]}]},
  {"name":"breakFeePercentage","type":"function","stateMutability":"view",
   "inputs":[],"outputs":[{"name":"","type":"uint256"}]},
  {"name":"feeWallet","type":"function","stateMutability":"view",
   "inputs":[],"outputs":[{"name":"","type":"address"}]}
]''';

const _erc20AbiJson = '''[
  {"name":"approve","type":"function","stateMutability":"nonpayable",
   "inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],
   "outputs":[{"name":"","type":"bool"}]},
  {"name":"allowance","type":"function","stateMutability":"view",
   "inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],
   "outputs":[{"name":"","type":"uint256"}]}
]''';

class VaultService {
  final Map<String, Web3Client> _clients;

  VaultService(String rpcBsc)
    : _clients = {'bsc': Web3Client(rpcBsc, http.Client())};

  bool isDeployed(String network) => kVaultAddresses[network] != null;

  Web3Client? _client(String network) => _clients[network];

  DeployedContract _vaultContract(String network) {
    final addr = kVaultAddresses[network]!;
    return DeployedContract(
      ContractAbi.fromJson(_vaultAbiJson, 'VaultWallet'),
      EthereumAddress.fromHex(addr),
    );
  }

  DeployedContract _erc20(String tokenAddr) => DeployedContract(
    ContractAbi.fromJson(_erc20AbiJson, 'ERC20'),
    EthereumAddress.fromHex(tokenAddr),
  );

  // ── Read: fetch all locks for a user ─────────────────────────────
  Future<List<Map<String, dynamic>>> getRawLocks(String userAddress, String network) async {
    if (!isDeployed(network)) return [];
    try {
      final client = _client(network)!;
      final contract = _vaultContract(network);
      final fn = contract.function('getUserLocks');
      final result = await client.call(
        contract: contract, function: fn,
        params: [EthereumAddress.fromHex(userAddress)],
      );
      if (result.isEmpty) return [];
      final rawList = result[0] as List;
      return rawList.asMap().entries.map((entry) {
        final i = entry.key;
        final lock = entry.value as List;
        return {
          'lockId': i,
          'token': (lock[0] as EthereumAddress).hexEip55,
          'amount': lock[1] as BigInt,
          'unlockTime': lock[2] as BigInt,
          'withdrawn': lock[3] as bool,
        };
      }).toList();
    } catch (e) {
      print('[VaultService] getRawLocks error: $e');
      return [];
    }
  }

  // ── Write: lock tokens ────────────────────────────────────────────
  Future<String> lockTokens({
    required EthPrivateKey credentials,
    required String tokenAddress,
    required BigInt amountWei,
    required int lockDays,
    required String network,
    required int chainId,
  }) async {
    if (!isDeployed(network)) throw Exception('Vault not deployed on $network');
    final client = _client(network)!;
    final vaultAddr = kVaultAddresses[network]!;

    // Step 1: Check and set ERC-20 approval
    final erc20 = _erc20(tokenAddress);
    final allowanceFn = erc20.function('allowance');
    final allowResult = await client.call(
      contract: erc20, function: allowanceFn,
      params: [credentials.address, EthereumAddress.fromHex(vaultAddr)],
    );
    final currentAllowance = allowResult[0] as BigInt;

    if (currentAllowance < amountWei) {
      final approveTx = Transaction.callContract(
        contract: erc20, function: erc20.function('approve'),
        parameters: [EthereumAddress.fromHex(vaultAddr), amountWei],
        maxGas: 100000,
      );
      final hash = await client.sendTransaction(credentials, approveTx, chainId: chainId);
      // Wait for approval
      await _waitForReceipt(client, hash);
    }

    // Step 2: Lock
    final contract = _vaultContract(network);
    final lockTx = Transaction.callContract(
      contract: contract, function: contract.function('lockTokens'),
      parameters: [
        EthereumAddress.fromHex(tokenAddress),
        amountWei,
        BigInt.from(lockDays),
      ],
      maxGas: 200000,
    );
    return client.sendTransaction(credentials, lockTx, chainId: chainId);
  }

  // ── Write: withdraw (no penalty) ─────────────────────────────────
  Future<String> withdraw({
    required EthPrivateKey credentials,
    required int lockId,
    required String network,
    required int chainId,
  }) async {
    if (!isDeployed(network)) throw Exception('Vault not deployed on $network');
    final client = _client(network)!;
    final contract = _vaultContract(network);
    final tx = Transaction.callContract(
      contract: contract, function: contract.function('withdraw'),
      parameters: [BigInt.from(lockId)], maxGas: 150000,
    );
    return client.sendTransaction(credentials, tx, chainId: chainId);
  }

  // ── Write: break vault early (10% penalty) ────────────────────────
  Future<String> breakVault({
    required EthPrivateKey credentials,
    required int lockId,
    required String network,
    required int chainId,
  }) async {
    if (!isDeployed(network)) throw Exception('Vault not deployed on $network');
    final client = _client(network)!;
    final contract = _vaultContract(network);
    final tx = Transaction.callContract(
      contract: contract, function: contract.function('breakVault'),
      parameters: [BigInt.from(lockId)], maxGas: 150000,
    );
    return client.sendTransaction(credentials, tx, chainId: chainId);
  }

  Future<void> _waitForReceipt(Web3Client client, String txHash, {int retries = 20}) async {
    for (int i = 0; i < retries; i++) {
      await Future.delayed(const Duration(seconds: 3));
      final receipt = await client.getTransactionReceipt(txHash);
      if (receipt != null) return;
    }
  }
}
