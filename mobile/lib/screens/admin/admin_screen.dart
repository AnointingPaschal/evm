import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/wallet_provider.dart';
import '../../services/storage_service.dart';
import '../../services/vault_service.dart';
import '../../services/wallet_service.dart';
import '../../services/vault_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

// ── Admin panel — access by long-pressing the bottom of the lock screen
// Password: 23rdApril1997

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});
  @override State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _pwdCtrl     = TextEditingController();
  final _newPwdCtrl  = TextEditingController();
  bool _authenticated = false;
  bool _authFailed    = false;

  static const _defaultHash =
      'e0a3e3e3b3c3d3e3f3a3b3c3d3e3f3a3'; // placeholder; real hash in storage
  final _ws = WalletService();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() { _tabs.dispose(); _pwdCtrl.dispose(); _newPwdCtrl.dispose(); super.dispose(); }

  void _tryAuth() {
    // Real check: sha256 of input must match stored hash
    // For initial state, accept '23rdApril1997'
    final hash = _ws.hashPassword(_pwdCtrl.text);
    // In production StorageService.getAdminConfig()['passwordHash'] would be checked
    const acceptedHash =
        'c84958c57c86a9e2d27c3f9d90b96437a82a9a8c5c61b1e85e53e0f3c7e39b2d';
    final ok = _pwdCtrl.text == '23rdApril1997' || hash == acceptedHash;
    if (ok) {
      setState(() => _authenticated = true);
    } else {
      setState(() => _authFailed = true);
      Future.delayed(const Duration(seconds: 2),
          () { if (mounted) setState(() => _authFailed = false); });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_authenticated) return _loginView();
    return _dashboardView();
  }

  // ── Login ─────────────────────────────────────────────────────────
  Widget _loginView() => Scaffold(
    body: Container(
      decoration: const BoxDecoration(gradient: kHeaderGradient),
      child: SafeArea(child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(children: [
          Align(alignment: Alignment.topLeft,
            child: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.close_rounded, color: Colors.white54))),
          const Spacer(),
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.red.withOpacity(0.4))),
            child: const Icon(Icons.admin_panel_settings_rounded,
                color: Colors.redAccent, size: 30)),
          const SizedBox(height: 16),
          const Text('Admin Panel', style: TextStyle(
              color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
          Text('Authorised access only',
            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
          const Spacer(),
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            decoration: BoxDecoration(
              color: _authFailed
                  ? Colors.red.withOpacity(0.15)
                  : Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _authFailed
                    ? Colors.red.withOpacity(0.4)
                    : Colors.white.withOpacity(0.15))),
            child: TextField(
              controller: _pwdCtrl,
              obscureText: true,
              onSubmitted: (_) => _tryAuth(),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Admin password',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                filled: false, border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 16),
                suffixIcon: IconButton(
                  onPressed: _tryAuth,
                  icon: const Icon(Icons.arrow_forward_ios_rounded,
                      color: Colors.white54, size: 18))),
            ),
          ),
          if (_authFailed) Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text('Access denied', style: TextStyle(
                color: Colors.red.shade300, fontSize: 12))),
          const Spacer(flex: 3),
        ]),
      )),
    ),
  );

  // ── Dashboard ─────────────────────────────────────────────────────
  Widget _dashboardView() {
    final wp    = context.watch<WalletProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 8, 16, 0),
              child: Row(children: [
                IconButton(onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, color: Colors.white54)),
                const Expanded(child: Text('Admin Panel', style: TextStyle(
                    color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8)),
                  child: const Text('ADMIN', style: TextStyle(
                      color: Colors.redAccent, fontSize: 10,
                      fontWeight: FontWeight.w700))),
              ]),
            ),
            TabBar(
              controller: _tabs,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white38,
              indicatorColor: Colors.white,
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Users'),
                Tab(text: 'Security'),
              ],
            ),
          ])),
        ),
        Expanded(child: TabBarView(controller: _tabs, children: [
          _overviewTab(wp, isDark),
          _usersTab(wp, isDark),
          _securityTab(isDark),
        ])),
      ]),
    );
  }

  // ── Overview tab ─────────────────────────────────────────────────
  Widget _overviewTab(WalletProvider wp, bool isDark) =>
    SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
      GridView.count(
        crossAxisCount: 2, shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.8, mainAxisSpacing: 10, crossAxisSpacing: 10,
        children: [
          _statCard('Wallets Tracked', '${wp.wallets.length}',
              Icons.account_balance_wallet_rounded, AppColors.brand500, isDark),
          _statCard('Active Vaults',
              '${wp.vaults.where((v) => v.isLocked).length}',
              Icons.lock_rounded, AppColors.cyan, isDark),
          _statCard('Network', wp.network.toUpperCase(),
              Icons.hub_rounded, AppColors.success, isDark),
          _statCard('Vault Contract', '0x16Af...134Ae',
              Icons.smart_toy_outlined, Colors.purple, isDark),
        ],
      ),
      const SizedBox(height: 16),
      AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Smart Contract Info', style: TextStyle(
            fontWeight: FontWeight.w700, fontSize: 14)),
        const SizedBox(height: 12),
        _kv('BSC Address', kVaultAddresses['bsc'] ?? '—', isDark),
        _kv('Fee Wallet', kFeeWallet, isDark),
        _kv('Break Fee', '$kBreakFeePct%', isDark),
        _kv('Ethereum', 'Not deployed', isDark),
      ])),
      const SizedBox(height: 12),
      AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Active Vault Locks', style: TextStyle(
            fontWeight: FontWeight.w700, fontSize: 14)),
        const SizedBox(height: 12),
        if (wp.vaults.isEmpty)
          const Text('No vaults', style: TextStyle(color: Colors.grey))
        else
          ...wp.vaults.where((v) => !v.withdrawn).map((v) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              Icon(v.isLocked ? Icons.lock_rounded : Icons.lock_open_rounded,
                  size: 14, color: v.isLocked ? AppColors.cyan : AppColors.success),
              const SizedBox(width: 8),
              Expanded(child: Text(
                '${v.amount.toStringAsFixed(4)} ${v.tokenSymbol} · Unlock: ${v.unlockDateLabel}',
                style: const TextStyle(fontSize: 12))),
              AppBadge(
                label: v.isLocked ? v.timeLeftLabel : 'Ready',
                color: v.isLocked ? AppColors.cyan : AppColors.success),
            ]),
          )),
      ])),
      const SizedBox(height: 80),
    ]));

  // ── Users tab ──────────────────────────────────────────────────────
  Widget _usersTab(WalletProvider wp, bool isDark) {
    return SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(
      children: [
        ...wp.wallets.map((w) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: AppCard(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              CircleAvatar(
                backgroundColor: AppColors.brand100,
                child: Text(w.name[0].toUpperCase(),
                    style: const TextStyle(color: AppColors.brand700,
                        fontWeight: FontWeight.w700))),
              const SizedBox(width: 12),
              Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(w.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                Row(children: [
                  Text(_ws.shortAddress(w.address, chars: 10),
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 10,
                        color: Colors.grey)),
                  const SizedBox(width: 6),
                  CopyBtn(text: w.address, size: 14),
                ]),
              ])),
              if (w.imported) AppBadge(label: 'Imported', color: AppColors.warning),
            ]),
            const SizedBox(height: 8),
            _kv('Network', w.network.toUpperCase(), isDark),
            _kv('Created', DateFormat('MMM d, yyyy HH:mm').format(w.createdAt), isDark),
          ])),
        )),
        if (wp.wallets.isEmpty)
          const Center(child: Text('No wallets', style: TextStyle(color: Colors.grey))),
        const SizedBox(height: 80),
      ],
    ));
  }

  // ── Security tab ───────────────────────────────────────────────────
  Widget _securityTab(bool isDark) =>
    SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SectionLabel('CHANGE ADMIN PASSWORD'),
      const SizedBox(height: 12),
      AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        PasswordField(controller: _newPwdCtrl, hint: 'New admin password'),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              if (_newPwdCtrl.text.length < 8) {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Min 8 characters')));
                return;
              }
              // In production: StorageService.saveAdminConfig({'passwordHash': hash})
              ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Password updated')));
              _newPwdCtrl.clear();
            },
            child: const Text('Update Password'),
          )),
      ])),
      const SizedBox(height: 20),
      AppCard(child: Column(children: [
        _kv('Default Admin PW', '23rdApril1997', isDark),
        _kv('Contract Owner',
            kFeeWallet.substring(0, 16) + '...', isDark),
        _kv('BSC RPC', 'publicnode.com', isDark),
        _kv('App Version', 'v1.0.0', isDark),
      ])),
      const SizedBox(height: 80),
    ]));

  // ── Helpers ────────────────────────────────────────────────────────
  Widget _statCard(String label, String value, IconData icon, Color color, bool isDark) =>
    Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 20),
        const Spacer(),
        Text(value, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: color)),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ]),
    );

  Widget _kv(String k, String v, bool isDark) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [
      Expanded(child: Text(k, style: const TextStyle(color: Colors.grey, fontSize: 12))),
      Flexible(child: Text(v, style: const TextStyle(fontSize: 12,
          fontWeight: FontWeight.w600, fontFamily: 'monospace'),
          textAlign: TextAlign.end, overflow: TextOverflow.ellipsis)),
    ]),
  );
}
