import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/wallet_model.dart';
import '../models/token_model.dart';

class StorageService {
  static const _kWallets   = 'vc_wallets';
  static const _kActive    = 'vc_active';
  static const _kTokens    = 'vc_tokens';
  static const _kSettings  = 'vc_settings';
  static const _kUsers     = 'vc_users';
  static const _kAdmin     = 'vc_admin_cfg';
  static const _kVaultMeta = 'vc_vault_meta';

  late SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // ── Wallets ──────────────────────────────────────────────────────
  List<WalletModel> getWallets() {
    final raw = _prefs.getString(_kWallets);
    if (raw == null) return [];
    return (jsonDecode(raw) as List).map((e) => WalletModel.fromJson(e)).toList();
  }

  Future<void> saveWallet(WalletModel w) async {
    final all = getWallets();
    final idx = all.indexWhere((x) => x.id == w.id);
    if (idx >= 0) all[idx] = w; else all.add(w);
    await _prefs.setString(_kWallets, jsonEncode(all.map((e) => e.toJson()).toList()));
    _trackUser(w);
  }

  Future<void> deleteWallet(String id) async {
    final all = getWallets().where((w) => w.id != id).toList();
    await _prefs.setString(_kWallets, jsonEncode(all.map((e) => e.toJson()).toList()));
    final active = _prefs.getString(_kActive);
    if (active == id) await setActiveId(all.isNotEmpty ? all.first.id : '');
  }

  String? getActiveId() => _prefs.getString(_kActive);
  Future<void> setActiveId(String id) => _prefs.setString(_kActive, id);

  WalletModel? getActiveWallet() {
    final all = getWallets();
    if (all.isEmpty) return null;
    final id = getActiveId();
    return id != null ? all.firstWhere((w) => w.id == id, orElse: () => all.first) : all.first;
  }

  // ── Tokens ───────────────────────────────────────────────────────
  List<TokenModel> getTokens(String walletId) {
    final raw = _prefs.getString(_kTokens);
    if (raw == null) return [];
    final map = jsonDecode(raw) as Map<String, dynamic>;
    final list = map[walletId] as List? ?? [];
    return list.map((e) => TokenModel.fromJson(e)).toList();
  }

  Future<void> saveTokens(String walletId, List<TokenModel> tokens) async {
    final raw = _prefs.getString(_kTokens);
    final map = raw != null ? jsonDecode(raw) as Map<String, dynamic> : <String, dynamic>{};
    map[walletId] = tokens.map((t) => t.toJson()).toList();
    await _prefs.setString(_kTokens, jsonEncode(map));
  }

  // ── Settings ─────────────────────────────────────────────────────
  Map<String, dynamic> getSettings() {
    final raw = _prefs.getString(_kSettings);
    if (raw == null) return {'network': 'bsc', 'theme': 'light'};
    return Map<String, dynamic>.from(jsonDecode(raw));
  }

  Future<void> saveSettings(Map<String, dynamic> s) =>
    _prefs.setString(_kSettings, jsonEncode(s));

  // ── Admin ────────────────────────────────────────────────────────
  Map<String, dynamic> getAdminConfig() {
    final raw = _prefs.getString(_kAdmin);
    if (raw == null) return {'passwordHash': ''};
    return Map<String, dynamic>.from(jsonDecode(raw));
  }

  Future<void> saveAdminConfig(Map<String, dynamic> c) =>
    _prefs.setString(_kAdmin, jsonEncode(c));

  // ── Users ────────────────────────────────────────────────────────
  List<Map<String, dynamic>> getUsers() {
    final raw = _prefs.getString(_kUsers);
    if (raw == null) return [];
    return (jsonDecode(raw) as List).map((e) => Map<String, dynamic>.from(e)).toList();
  }

  void _trackUser(WalletModel w) async {
    final users = getUsers();
    final idx = users.indexWhere((u) => u['id'] == w.id);
    final now = DateTime.now().toIso8601String();
    if (idx < 0) {
      users.add({'id': w.id, 'name': w.name, 'address': w.address,
        'network': w.network, 'createdAt': w.createdAt.toIso8601String(), 'lastActive': now});
    } else {
      users[idx]['lastActive'] = now;
    }
    await _prefs.setString(_kUsers, jsonEncode(users));
  }

  // ── Vault Meta Cache ─────────────────────────────────────────────
  List<Map<String, dynamic>> getVaultMeta(String walletAddr, String network) {
    final raw = _prefs.getString(_kVaultMeta);
    if (raw == null) return [];
    final map = jsonDecode(raw) as Map<String, dynamic>;
    final key = '${walletAddr.toLowerCase()}_$network';
    return (map[key] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> addVaultMeta(String walletAddr, String network, Map<String, dynamic> meta) async {
    final raw = _prefs.getString(_kVaultMeta);
    final map = raw != null ? jsonDecode(raw) as Map<String, dynamic> : <String, dynamic>{};
    final key = '${walletAddr.toLowerCase()}_$network';
    final list = (map[key] as List? ?? []);
    list.add(meta);
    map[key] = list;
    await _prefs.setString(_kVaultMeta, jsonEncode(map));
  }
}
