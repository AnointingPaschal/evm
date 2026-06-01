import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/wallet_provider.dart';
import '../../services/wallet_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class LockScreen extends StatefulWidget {
  const LockScreen({super.key});
  @override State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  final _pwdCtrl = TextEditingController();
  bool _loading = false;
  bool _shaking = false;
  int _attempts = 0;
  final _ws = WalletService();

  @override void dispose() { _pwdCtrl.dispose(); super.dispose(); }

  Future<void> _unlock() async {
    setState(() => _loading = true);
    final ok = context.read<WalletProvider>().unlockWallet(_pwdCtrl.text);
    setState(() => _loading = false);
    if (!ok) {
      _pwdCtrl.clear();
      _attempts++;
      setState(() => _shaking = true);
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) setState(() => _shaking = false);
      Fluttertoast.showToast(
          msg: _attempts >= 3
              ? 'Incorrect password ($_attempts attempts)'
              : 'Incorrect password');
    }
  }

  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: kHeaderGradient),
        child: SafeArea(child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(children: [
            const Spacer(flex: 2),
            // Lock icon
            TweenAnimationBuilder<double>(
              key: ValueKey(_shaking),
              tween: Tween(begin: 0, end: _shaking ? 1 : 0),
              duration: const Duration(milliseconds: 500),
              builder: (_, v, child) => Transform.translate(
                offset: Offset(v > 0 ? (v < 0.5 ? v * 20 : (1 - v) * -20) : 0, 0),
                child: child),
              child: Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  color: _shaking
                      ? AppColors.error.withOpacity(0.2)
                      : Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _shaking
                        ? AppColors.error.withOpacity(0.4)
                        : Colors.white.withOpacity(0.2),
                    width: 2)),
                child: Icon(
                  _shaking ? Icons.lock_open_rounded : Icons.lock_rounded,
                  color: _shaking ? AppColors.error : Colors.white,
                  size: 36),
              ),
            ),
            const SizedBox(height: 24),
            Text(wp.active?.name ?? 'Wallet',
              style: const TextStyle(color: Colors.white,
                  fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(_ws.shortAddress(wp.active?.address ?? ''),
              style: TextStyle(color: Colors.white.withOpacity(0.4),
                  fontSize: 13, fontFamily: 'monospace')),
            const Spacer(flex: 2),
            // Password field (white card style)
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.15))),
              child: TextField(
                controller: _pwdCtrl,
                obscureText: true,
                autofocus: true,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _unlock(),
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  hintText: 'Enter password to unlock',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                  filled: false,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 16),
                  suffixIcon: _loading
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(width: 20, height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white54, strokeWidth: 2)))
                      : IconButton(
                          onPressed: _unlock,
                          icon: const Icon(Icons.arrow_forward_ios_rounded,
                              color: Colors.white54, size: 18))),
              ),
            ),
            const SizedBox(height: 16),
            // Multiple wallets
            if (wp.wallets.length > 1)
              TextButton(
                onPressed: () => _showWalletPicker(context, wp),
                child: Text('Switch wallet',
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.45), fontSize: 13)),
              ),
            const Spacer(flex: 3),
            // Admin hint (hidden)
            GestureDetector(
              onLongPress: () => Navigator.pushNamed(context, '/admin'),
              child: const SizedBox(width: 60, height: 20)),
            const SizedBox(height: 16),
          ]),
        )),
      ),
    );
  }

  void _showWalletPicker(BuildContext context, WalletProvider wp) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SheetHandle(),
          const Text('Select Wallet',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...wp.wallets.map((w) => ListTile(
            title: Text(w.name),
            subtitle: Text(_ws.shortAddress(w.address),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11)),
            trailing: wp.active?.id == w.id
                ? const Icon(Icons.check_circle, color: AppColors.brand500)
                : null,
            onTap: () {
              Navigator.pop(context);
              wp.switchWallet(w.id);
            },
          )),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }
}
