import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web3dart/web3dart.dart';

class NetworkConfig {
  final int chainId;
  final String name;
  final String symbol;
  final String rpcUrl;
  final String explorerUrl;
  final String explorerApiUrl;
  const NetworkConfig({
    required this.chainId, required this.name, required this.symbol,
    required this.rpcUrl, required this.explorerUrl, required this.explorerApiUrl,
  });
}

const kNetworks = {
  'ethereum': NetworkConfig(
    chainId: 1, name: 'Ethereum', symbol: 'ETH',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api',
  ),
  'bsc': NetworkConfig(
    chainId: 56, name: 'BNB Chain', symbol: 'BNB',
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    explorerUrl: 'https://bscscan.com',
    explorerApiUrl: 'https://api.bscscan.com/api',
  ),
};

class TokenInfo {
  final String name, symbol;
  final int decimals;
  const TokenInfo({required this.name, required this.symbol, required this.decimals});
}

class ChainService {
  final Map<String, Web3Client> _clients = {};

  Web3Client _client(String network) {
    return _clients.putIfAbsent(network, () {
      final cfg = kNetworks[network]!;
      return Web3Client(cfg.rpcUrl, http.Client());
    });
  }

  Future<void> dispose() async {
    for (final c in _clients.values) { await c.dispose(); }
  }

  // ── Balances ─────────────────────────────────────────────────────
  Future<double> getNativeBalance(String address, String network) async {
    try {
      final client = _client(network);
      final addr = EthereumAddress.fromHex(address);
      final wei = await client.getBalance(addr);
      return wei.getValueInUnit(EtherUnit.ether);
    } catch (_) { return 0; }
  }

  Future<double> getTokenBalance(String tokenAddr, String walletAddr, String network) async {
    try {
      final client = _client(network);
      final abi = ContractAbi.fromJson(
        '[{"name":"balanceOf","type":"function","inputs":[{"name":"account","type":"address"}],'
        '"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"},'
        '{"name":"decimals","type":"function","inputs":[],"outputs":[{"name":"","type":"uint8"}],"stateMutability":"view"}]',
        'ERC20');
      final contract = DeployedContract(abi, EthereumAddress.fromHex(tokenAddr));
      final balFn = contract.function('balanceOf');
      final decFn = contract.function('decimals');
      final results = await Future.wait([
        client.call(contract: contract, function: balFn, params: [EthereumAddress.fromHex(walletAddr)]),
        client.call(contract: contract, function: decFn, params: []),
      ]);
      final balance = results[0][0] as BigInt;
      final decimals = (results[1][0] as BigInt).toInt();
      return balance / BigInt.from(10).pow(decimals);
    } catch (_) { return 0; }
  }

  // ── Token Info ────────────────────────────────────────────────────
  Future<TokenInfo> getTokenInfo(String tokenAddr, String network) async {
    final client = _client(network);
    final abi = ContractAbi.fromJson(
      '[{"name":"name","type":"function","inputs":[],"outputs":[{"name":"","type":"string"}],"stateMutability":"view"},'
      '{"name":"symbol","type":"function","inputs":[],"outputs":[{"name":"","type":"string"}],"stateMutability":"view"},'
      '{"name":"decimals","type":"function","inputs":[],"outputs":[{"name":"","type":"uint8"}],"stateMutability":"view"}]',
      'ERC20');
    final contract = DeployedContract(abi, EthereumAddress.fromHex(tokenAddr));
    final results = await Future.wait([
      client.call(contract: contract, function: contract.function('name'), params: []),
      client.call(contract: contract, function: contract.function('symbol'), params: []),
      client.call(contract: contract, function: contract.function('decimals'), params: []),
    ]);
    return TokenInfo(
      name: results[0][0] as String,
      symbol: results[1][0] as String,
      decimals: (results[2][0] as BigInt).toInt(),
    );
  }

  // ── Send Native ───────────────────────────────────────────────────
  Future<String> sendNative({
    required EthPrivateKey credentials, required String to,
    required double amount, required String network,
  }) async {
    final client = _client(network);
    final cfg = kNetworks[network]!;
    final nonce = await client.getTransactionCount(credentials.address);
    final gasPrice = await client.getGasPrice();
    final tx = Transaction(
      to: EthereumAddress.fromHex(to),
      value: EtherAmount.fromBigInt(EtherUnit.wei, BigInt.from(amount * 1e18)),
      nonce: nonce,
      maxGas: 21000,
      gasPrice: gasPrice,
    );
    return client.sendTransaction(credentials, tx, chainId: cfg.chainId);
  }

  // ── Send ERC20 ────────────────────────────────────────────────────
  Future<String> sendToken({
    required EthPrivateKey credentials, required String tokenAddr,
    required String to, required double amount, required int decimals,
    required String network,
  }) async {
    final client = _client(network);
    final cfg = kNetworks[network]!;
    final abi = ContractAbi.fromJson(
      '[{"name":"transfer","type":"function","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],'
      '"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"}]',
      'ERC20');
    final contract = DeployedContract(abi, EthereumAddress.fromHex(tokenAddr));
    final amountWei = BigInt.from(amount * pow10(decimals));
    final data = contract.function('transfer')
      .encodeCall([EthereumAddress.fromHex(to), amountWei]);
    final gasPrice = await client.getGasPrice();
    final nonce = await client.getTransactionCount(credentials.address);
    final tx = Transaction.callContract(
      contract: contract, function: contract.function('transfer'),
      parameters: [EthereumAddress.fromHex(to), amountWei],
      nonce: nonce, gasPrice: gasPrice, maxGas: 100000,
    );
    return client.sendTransaction(credentials, tx, chainId: cfg.chainId);
  }

  // ── Transaction History ───────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getTxHistory(String address, String network) async {
    try {
      final cfg = kNetworks[network]!;
      final url = '${cfg.explorerApiUrl}?module=account&action=txlist'
        '&address=$address&sort=desc';
      final res = await http.get(Uri.parse(url));
      final body = jsonDecode(res.body);
      if (body['status'] == '1') {
        return List<Map<String, dynamic>>.from(body['result']).take(50).toList();
      }
      return [];
    } catch (_) { return []; }
  }

  static BigInt _pow10(int exp) => BigInt.from(10).pow(exp);
}
