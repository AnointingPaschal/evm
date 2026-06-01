import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:web3dart/web3dart.dart';
import '../models/wallet_model.dart';
import '../models/token_model.dart';
import '../models/vault_model.dart';
import '../models/price_model.dart';
import '../services/storage_service.dart';
import '../services/wallet_service.dart';
import '../services/chain_service.dart';
import '../services/price_service.dart';
import '../services/vault_service.dart';

class WalletProvider extends ChangeNotifier {
  final StorageService _store;
  final WalletService _walletSvc;
  final ChainService _chainSvc;
  final PriceService _priceSvc;
  final VaultService _vaultSvc;

  WalletProvider(this._store, this._walletSvc, this._chainSvc, this._priceSvc, this._vaultSvc);

  // ── State ─────────────────────────────────────────────────────────
  List<WalletModel>   _wallets    = [];
  WalletModel?        _active;
  List<TokenModel>    _tokens     = [];
  List<VaultModel>    _vaults     = [];
  Map<String, double> _balances   = {};
  Map<String, PriceModel> _prices = {};
  String              _network    = 'bsc';
  String?             _sessionPwd;
  bool                _isLocked   = false;
  bool                _loadingBal = false;
  bool                _loadingVault = false;

  Timer? _priceTimer;

  // ── Getters ───────────────────────────────────────────────────────
  List<WalletModel>       get wallets    => _wallets;
  WalletModel?            get active     => _active;
  List<TokenModel>        get tokens     => _tokens.where((t) => t.network == _network).toList();
  List<VaultModel>        get vaults     => _vaults;
  Map<String, double>     get balances   => _balances;
  Map<String, PriceModel> get prices     => _prices;
  String                  get network    => _network;
  bool                    get isLocked   => _isLocked;
  bool                    get hasWallet  => _active != null;
  bool                    get loadingBal => _loadingBal;
  bool                    get loadingVault => _loadingVault;
  String?                 get sessionPwd => _sessionPwd;

  double get nativeBalance => _balances['native'] ?? 0;
  PriceModel? get nativePrice => _prices[_network == 'ethereum' ? 'ETH' : 'BNB'];

  double get totalUsd {
    double total = nativeBalance * (nativePrice?.price ?? 0);
    for (final t in tokens) {
      final bal = _balances[t.address.toLowerCase()] ?? 0;
      final p = _prices[t.symbol.toUpperCase()]?.price ?? 0;
      total += bal * p;
    }
    return total;
  }

  // ── Init ──────────────────────────────────────────────────────────
  Future<void> init() async {
    _wallets = _store.getWallets();
    _active  = _store.getActiveWallet();
    final settings = _store.getSettings();
    _network = settings['network'] ?? 'bsc';
    if (_active != null) {
      _tokens = _store.getTokens(_active!.id);
      _isLocked = true; // locked on start
    }
    notifyListeners();
  }

  // ── Wallet CRUD ───────────────────────────────────────────────────
  Future<Map<String, String>> createWallet(String name, String password) async {
    final wd = _walletSvc.createWallet();
    final wallet = WalletModel(
      id: 'vc_${DateTime.now().millisecondsSinceEpoch}',
      name: name.isEmpty ? 'Wallet ${_wallets.length + 1}' : name,
      address: wd.address, network: _network,
      encryptedData: _walletSvc.encryptWalletData(
        {'privateKey': wd.privateKey, 'mnemonic': wd.mnemonic}, password),
      createdAt: DateTime.now(),
    );
    await _store.saveWallet(wallet);
    _wallets = _store.getWallets();
    await _activateWallet(wallet, password);
    return {'mnemonic': wd.mnemonic ?? '', 'address': wd.address};
  }

  Future<void> importWallet(String phrase, String name, String password, {bool isMnemonic = true}) async {
    final wd = isMnemonic
      ? _walletSvc.importFromMnemonic(phrase)
      : _walletSvc.importFromPrivateKey(phrase);
    final wallet = WalletModel(
      id: 'vc_${DateTime.now().millisecondsSinceEpoch}',
      name: name.isEmpty ? 'Imported ${_wallets.length + 1}' : name,
      address: wd.address, network: _network,
      encryptedData: _walletSvc.encryptWalletData(
        {'privateKey': wd.privateKey, 'mnemonic': wd.mnemonic}, password),
      createdAt: DateTime.now(), imported: true,
    );
    await _store.saveWallet(wallet);
    _wallets = _store.getWallets();
    await _activateWallet(wallet, password);
  }

  Future<void> switchWallet(String id) async {
    final w = _wallets.firstWhere((x) => x.id == id);
    _sessionPwd = null; _isLocked = true;
    _tokens = _store.getTokens(w.id);
    _active = w; _balances = {}; _vaults = [];
    await _store.setActiveId(id);
    notifyListeners();
  }

  Future<void> removeWallet(String id) async {
    await _store.deleteWallet(id);
    _wallets = _store.getWallets();
    if (_active?.id == id) {
      _active = _wallets.isNotEmpty ? _wallets.first : null;
      _tokens = _active != null ? _store.getTokens(_active!.id) : [];
      _balances = {}; _vaults = {};
    }
    notifyListeners();
  }

  Future<void> _activateWallet(WalletModel w, String password) async {
    _active = w; _sessionPwd = password; _isLocked = false;
    _tokens = _store.getTokens(w.id);
    _balances = {}; _vaults = [];
    await _store.setActiveId(w.id);
    notifyListeners();
    await _startDataSync();
  }

  // ── Lock / Unlock ─────────────────────────────────────────────────
  void lockWallet() {
    _sessionPwd = null; _isLocked = true;
    _priceTimer?.cancel();
    notifyListeners();
  }

  bool unlockWallet(String password) {
    try {
      if (_active == null) return false;
      _walletSvc.decryptWalletData(_active!.encryptedData, password);
      _sessionPwd = password; _isLocked = false;
      notifyListeners();
      _startDataSync();
      return true;
    } catch (_) { return false; }
  }

  Map<String, dynamic> getKeys([String? password]) {
    if (_active == null) throw Exception('No wallet');
    return _walletSvc.decryptWalletData(
      _active!.encryptedData, password ?? _sessionPwd ?? '');
  }

  // ── Network ───────────────────────────────────────────────────────
  Future<void> setNetwork(String n) async {
    _network = n; _balances = {}; _vaults = [];
    final s = _store.getSettings(); s['network'] = n;
    await _store.saveSettings(s);
    notifyListeners();
    _startDataSync();
  }

  // ── Data Sync ─────────────────────────────────────────────────────
  Future<void> _startDataSync() async {
    _priceTimer?.cancel();
    await Future.wait([refreshBalances(), refreshPrices(), refreshVaults()]);
    _priceTimer = Timer.periodic(const Duration(seconds: 30), (_) => refreshPrices());
  }

  Future<void> refreshBalances() async {
    if (_active == null) return;
    _loadingBal = true; notifyListeners();
    final bals = <String, double>{};
    bals['native'] = await _chainSvc.getNativeBalance(_active!.address, _network);
    for (final t in _tokens.where((tk) => tk.network == _network)) {
      bals[t.address.toLowerCase()] =
        await _chainSvc.getTokenBalance(t.address, _active!.address, _network);
    }
    _balances = bals; _loadingBal = false; notifyListeners();
  }

  Future<void> refreshPrices() async {
    if (_active == null) return;
    final nativeSym = _network == 'ethereum' ? 'ETH' : 'BNB';
    final syms = [nativeSym, ..._tokens.map((t) => t.symbol.toUpperCase())].toSet().toList();
    _prices = await _priceSvc.getPrices(syms);
    notifyListeners();
  }

  Future<void> refreshVaults() async {
    if (_active == null || !_vaultSvc.isDeployed(_network)) return;
    _loadingVault = true; notifyListeners();
    try {
      final rawLocks = await _vaultSvc.getRawLocks(_active!.address, _network);
      final metaList = _store.getVaultMeta(_active!.address, _network);
      _vaults = rawLocks.map((raw) {
        final lockId = raw['lockId'] as int;
        final meta = lockId < metaList.length ? metaList[lockId] : null;
        final unlockMs = (raw['unlockTime'] as BigInt).toInt() * 1000;
        final unlockAt = DateTime.fromMillisecondsSinceEpoch(unlockMs);
        final withdrawn = raw['withdrawn'] as bool;
        final now = DateTime.now();
        final status = withdrawn ? VaultStatus.withdrawn
          : now.isAfter(unlockAt) ? VaultStatus.matured : VaultStatus.locked;
        final token = _tokens.firstWhere(
          (t) => t.address.toLowerCase() == (raw['token'] as String).toLowerCase(),
          orElse: () => TokenModel(address: raw['token'], name: 'Token', symbol: meta?['tokenSymbol'] ?? '?',
            decimals: meta?['tokenDecimals'] ?? 18, network: _network, addedAt: DateTime.now()),
        );
        return VaultModel(
          lockId: lockId, tokenAddress: raw['token'],
          tokenSymbol: token.symbol, tokenDecimals: token.decimals,
          rawAmount: raw['amount'] as BigInt,
          unlockAt: unlockAt, withdrawn: withdrawn, status: status,
          lockMonths: meta?['lockMonths'], note: meta?['note'],
          createdAt: meta?['createdAt'] != null ? DateTime.tryParse(meta!['createdAt']) : null,
        );
      }).toList();
    } catch (e) { print('[Vault] refresh error: $e'); }
    _loadingVault = false; notifyListeners();
  }

  // ── Tokens ────────────────────────────────────────────────────────
  Future<TokenModel> addToken(String contractAddr, String net) async {
    if (!_walletSvc.isValidAddress(contractAddr)) throw Exception('Invalid address');
    if (_tokens.any((t) => t.address.toLowerCase() == contractAddr.toLowerCase() && t.network == net)) {
      throw Exception('Token already added');
    }
    final info = await _chainSvc.getTokenInfo(contractAddr, net);
    String? logo = await _priceSvc.getTokenLogo(info.symbol);
    if (logo == null) {
      final cg = await _priceSvc.getCGTokenInfo(contractAddr, net);
      logo = cg?['image'];
    }
    final token = TokenModel(
      address: contractAddr, name: info.name, symbol: info.symbol,
      decimals: info.decimals, network: net, logo: logo, addedAt: DateTime.now(),
    );
    _tokens = [..._tokens, token];
    await _store.saveTokens(_active!.id, _tokens);
    notifyListeners();
    return token;
  }

  Future<void> removeToken(String addr) async {
    _tokens = _tokens.where((t) => t.address.toLowerCase() != addr.toLowerCase()).toList();
    await _store.saveTokens(_active!.id, _tokens);
    notifyListeners();
  }

  // ── Vault ─────────────────────────────────────────────────────────
  Future<String> lockVault({
    required String tokenAddress, required String tokenSymbol,
    required int tokenDecimals, required double amount, required int lockMonths,
    String note = '',
  }) async {
    if (_sessionPwd == null) throw Exception('Wallet locked');
    final keys = getKeys();
    final credentials = _walletSvc.credentialsFromPrivateKey(keys['privateKey']);
    final cfg = kNetworks[_network]!;
    final amountWei = BigInt.from(amount * (BigInt.from(10).pow(tokenDecimals).toDouble()));

    final txHash = await _vaultSvc.lockTokens(
      credentials: credentials, tokenAddress: tokenAddress,
      amountWei: amountWei, lockDays: lockMonths * 30,
      network: _network, chainId: cfg.chainId,
    );
    // Cache metadata
    await _store.addVaultMeta(_active!.address, _network, {
      'tokenSymbol': tokenSymbol, 'tokenDecimals': tokenDecimals,
      'lockMonths': lockMonths, 'note': note,
      'createdAt': DateTime.now().toIso8601String(),
    });
    await refreshVaults();
    await refreshBalances();
    return txHash;
  }

  Future<String> withdrawVault(int lockId) async {
    if (_sessionPwd == null) throw Exception('Wallet locked');
    final keys = getKeys();
    final credentials = _walletSvc.credentialsFromPrivateKey(keys['privateKey']);
    final cfg = kNetworks[_network]!;
    final txHash = await _vaultSvc.withdraw(
      credentials: credentials, lockId: lockId,
      network: _network, chainId: cfg.chainId,
    );
    await Future.delayed(const Duration(seconds: 5));
    await refreshVaults(); await refreshBalances();
    return txHash;
  }

  Future<String> breakVault(int lockId) async {
    if (_sessionPwd == null) throw Exception('Wallet locked');
    final keys = getKeys();
    final credentials = _walletSvc.credentialsFromPrivateKey(keys['privateKey']);
    final cfg = kNetworks[_network]!;
    final txHash = await _vaultSvc.breakVault(
      credentials: credentials, lockId: lockId,
      network: _network, chainId: cfg.chainId,
    );
    await Future.delayed(const Duration(seconds: 5));
    await refreshVaults(); await refreshBalances();
    return txHash;
  }

  // ── Send ──────────────────────────────────────────────────────────
  Future<String> sendNative(String to, double amount) async {
    if (_sessionPwd == null) throw Exception('Wallet locked');
    final keys = getKeys();
    final credentials = _walletSvc.credentialsFromPrivateKey(keys['privateKey']);
    return _chainSvc.sendNative(
      credentials: credentials, to: to, amount: amount, network: _network);
  }

  Future<String> sendToken(String tokenAddr, String to, double amount, int decimals) async {
    if (_sessionPwd == null) throw Exception('Wallet locked');
    final keys = getKeys();
    final credentials = _walletSvc.credentialsFromPrivateKey(keys['privateKey']);
    return _chainSvc.sendToken(
      credentials: credentials, tokenAddr: tokenAddr,
      to: to, amount: amount, decimals: decimals, network: _network);
  }

  @override
  void dispose() {
    _priceTimer?.cancel();
    _chainSvc.dispose();
    super.dispose();
  }
}
