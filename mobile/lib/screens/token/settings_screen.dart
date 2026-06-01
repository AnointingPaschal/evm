import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/wallet_service.dart';
import '../../services/chain_service.dart';
import '../../services/vault_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';
import '../onboarding/welcome_screen.dart';
import '../onboarding/import_wallet_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final wp    = context.watch<WalletProvider>();
    final theme = context.watch<ThemeProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ws = WalletService();
    final net = kNetworks[wp.network]!;

    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Settings', style: TextStyle(
                  color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 2),
              Text('Manage wallets and preferences',
                  style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
            ]),
          )),
        ),
        Expanded(child: ListView(padding: const EdgeInsets.all(16), children: [
          // ── Active wallet card ─────────────────────────────────
          _sectionLabel('ACTIVE WALLET'),
          const SizedBox(height: 8),
          AppCard(child: Column(children: [
            Row(children: [
              CircleAvatar(
                backgroundColor: AppColors.brand100,
                child: Text((wp.active?.name ?? 'W')[0].toUpperCase(),
                    style: const TextStyle(color: AppColors.brand700,
                        fontWeight: FontWeight.w700))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(wp.active?.name ?? '—',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                Text(ws.shortAddress(wp.active?.address ?? '', chars: 10),
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 11,
                        color: Colors.grey)),
              ])),
              CopyBtn(text: wp.active?.address ?? '', size: 18),
            ]),
            const Divider(height: 20),
            Row(children: [
              Expanded(child: _infoChip(isDark, 'Network',
                  net.name, AppColors.brand500)),
              const SizedBox(width: 8),
              Expanded(child: _infoChip(isDark, 'Type',
                  (wp.active?.imported ?? false) ? 'Imported' : 'Created',
                  AppColors.cyan)),
            ]),
          ])),
          const SizedBox(height: 20),

          // ── Network ────────────────────────────────────────────
          _sectionLabel('NETWORK'),
          const SizedBox(height: 8),
          AppCard(padding: const EdgeInsets.all(4), child: Column(
              children: ['bsc', 'ethereum'].map((n) => RadioListTile<String>(
                value: n, groupValue: wp.network,
                onChanged: (v) => wp.setNetwork(v!),
                title: Text(n == 'bsc' ? '◈ BNB Chain' : '⟠ Ethereum',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(kNetworks[n]!.rpcUrl,
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace')),
                activeColor: AppColors.brand500,
              )).toList())),
          const SizedBox(height: 20),

          // ── Appearance ─────────────────────────────────────────
          _sectionLabel('APPEARANCE'),
          const SizedBox(height: 8),
          AppCard(child: Column(children: [
            _switchTile('Dark Mode', Icons.dark_mode_rounded,
                theme.isDark, (_) => theme.toggle()),
          ])),
          const SizedBox(height: 20),

          // ── Security ───────────────────────────────────────────
          _sectionLabel('SECURITY & KEYS'),
          const SizedBox(height: 8),
          AppCard(child: Column(children: [
            _tappableTile(context, 'View Recovery Phrase',
                Icons.visibility_rounded, AppColors.brand500,
                () => _showPhrase(context, wp)),
            const Divider(height: 1, indent: 52),
            _tappableTile(context, 'View Private Key',
                Icons.key_rounded, AppColors.warning,
                () => _showPrivateKey(context, wp)),
            const Divider(height: 1, indent: 52),
            _tappableTile(context, 'Copy Address',
                Icons.copy_rounded, AppColors.cyan,
                () async {
                  await Clipboard.setData(
                      ClipboardData(text: wp.active?.address ?? ''));
                  Fluttertoast.showToast(msg: 'Address copied!');
                }),
          ])),
          const SizedBox(height: 20),

          // ── Wallets ────────────────────────────────────────────
          _sectionLabel('WALLETS'),
          const SizedBox(height: 8),
          AppCard(child: Column(children: [
            _tappableTile(context, 'Add / Import Wallet',
                Icons.add_circle_outline_rounded, AppColors.brand500,
                () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const ImportWalletScreen()))),
            const Divider(height: 1, indent: 52),
            ...wp.wallets.map((w) {
              final isActive = wp.active?.id == w.id;
              return Column(children: [
                ListTile(
                  leading: CircleAvatar(
                    radius: 18,
                    backgroundColor: isActive
                        ? AppColors.brand100 : (isDark ? AppColors.navy900 : const Color(0xFFF1F5F9)),
                    child: Text(w.name[0].toUpperCase(), style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: isActive ? AppColors.brand700 : Colors.grey))),
                  title: Text(w.name,
                      style: TextStyle(fontWeight: FontWeight.w600,
                          color: isActive ? AppColors.brand500 : null)),
                  subtitle: Text(ws.shortAddress(w.address),
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 10)),
                  trailing: isActive
                      ? const Icon(Icons.check_circle, color: AppColors.brand500, size: 18)
                      : TextButton(
                          onPressed: () => wp.switchWallet(w.id),
                          child: const Text('Switch', style: TextStyle(fontSize: 12))),
                  onLongPress: isActive ? null : () => _confirmRemove(context, wp, w.id, w.name),
                ),
                if (w.id != wp.wallets.last.id) const Divider(height: 1, indent: 52),
              ]);
            }),
          ])),
          const SizedBox(height: 20),

          // ── Danger zone ────────────────────────────────────────
          _sectionLabel('DANGER ZONE'),
          const SizedBox(height: 8),
          AppCard(child: Column(children: [
            _tappableTile(context, 'Remove Active Wallet',
                Icons.delete_outline_rounded, AppColors.error,
                () => _confirmRemove(
                    context, wp, wp.active!.id, wp.active?.name ?? '')),
            const Divider(height: 1, indent: 52),
            _tappableTile(context, 'Lock Wallet',
                Icons.lock_rounded, Colors.grey,
                () => wp.lockWallet()),
          ])),
          const SizedBox(height: 32),
          Center(child: Text('Gatenet v1.0.0  ·  BSC Contract: ${kVaultAddresses['bsc']!.substring(0, 10)}...',
              style: const TextStyle(fontSize: 10, color: Colors.grey),
              textAlign: TextAlign.center)),
          const SizedBox(height: 80),
        ])),
      ]),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────
  Widget _sectionLabel(String t) => Padding(
    padding: const EdgeInsets.only(left: 4),
    child: SectionLabel(t),
  );

  Widget _infoChip(bool isDark, String label, String value, Color color) =>
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 10, color: color.withOpacity(0.7))),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
      ]),
    );

  Widget _switchTile(String label, IconData icon, bool value, ValueChanged<bool> onChanged) =>
    SwitchListTile(
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      secondary: Icon(icon, size: 20),
      value: value, onChanged: onChanged,
      activeColor: AppColors.brand500,
    );

  Widget _tappableTile(BuildContext ctx, String label, IconData icon,
      Color color, VoidCallback onTap) =>
    ListTile(
      leading: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color, size: 18)),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
      trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 18),
      onTap: onTap,
    );

  void _showPhrase(BuildContext context, WalletProvider wp) =>
    _confirmPassword(context, wp, (keys) {
      final mnemonic = keys['mnemonic'];
      if (mnemonic == null) {
        Fluttertoast.showToast(msg: 'This wallet was imported with a private key — no phrase available');
        return;
      }
      _showSecretDialog(context, 'Recovery Phrase', mnemonic, isMnemonic: true);
    });

  void _showPrivateKey(BuildContext context, WalletProvider wp) =>
    _confirmPassword(context, wp, (keys) {
      _showSecretDialog(context, 'Private Key', keys['privateKey'] ?? '');
    });

  void _confirmPassword(BuildContext context, WalletProvider wp,
      Function(Map<String, dynamic>) onSuccess) {
    final ctrl = TextEditingController();
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Confirm Password'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Enter your wallet password to continue.',
            style: TextStyle(fontSize: 13)),
        const SizedBox(height: 12),
        PasswordField(controller: ctrl, hint: 'Password'),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        TextButton(
          onPressed: () {
            try {
              final keys = wp.getKeys(ctrl.text);
              Navigator.pop(ctx);
              onSuccess(keys);
            } catch (_) {
              Fluttertoast.showToast(msg: 'Incorrect password');
            }
          },
          child: const Text('Confirm'),
        ),
      ],
    ));
  }

  void _showSecretDialog(BuildContext context, String title, String secret,
      {bool isMnemonic = false}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: Row(children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.orange),
          const SizedBox(width: 8),
          Text(title),
        ]),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(12)),
            child: const Text('Keep this secret. Do not share it.',
                style: TextStyle(color: Colors.orange, fontSize: 12,
                    fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12)),
            child: SelectableText(
              secret,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
            ),
          ),
        ]),
        actions: [
          TextButton(
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: secret));
              Fluttertoast.showToast(msg: 'Copied to clipboard');
            },
            child: const Text('Copy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _confirmRemove(BuildContext context, WalletProvider wp,
      String id, String name) {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Remove Wallet?'),
      content: Text(
          'Remove "$name"? This cannot be undone. Make sure you have your recovery phrase.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        TextButton(
          style: TextButton.styleFrom(foregroundColor: AppColors.error),
          onPressed: () {
            Navigator.pop(ctx);
            wp.removeWallet(id);
            if (wp.wallets.isEmpty) {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const WelcomeScreen()),
                (_) => false);
            }
          },
          child: const Text('Remove'),
        ),
      ],
    ));
  }
}
