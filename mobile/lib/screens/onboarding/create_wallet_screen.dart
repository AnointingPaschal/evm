import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';
import 'backup_screen.dart';

class CreateWalletScreen extends StatefulWidget {
  const CreateWalletScreen({super.key});
  @override State<CreateWalletScreen> createState() => _CreateWalletScreenState();
}

class _CreateWalletScreenState extends State<CreateWalletScreen> {
  final _nameCtrl = TextEditingController();
  final _pwdCtrl  = TextEditingController();
  final _pwd2Ctrl = TextEditingController();
  bool _agree = false;
  bool _loading = false;

  @override void dispose() { _nameCtrl.dispose(); _pwdCtrl.dispose(); _pwd2Ctrl.dispose(); super.dispose(); }

  bool get _valid => _pwdCtrl.text.length >= 8 &&
      _pwdCtrl.text == _pwd2Ctrl.text && _agree;

  Future<void> _create() async {
    if (!_valid) return;
    setState(() => _loading = true);
    try {
      final result = await context.read<WalletProvider>()
          .createWallet(_nameCtrl.text.trim(), _pwdCtrl.text);
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => BackupScreen(
          mnemonic: result['mnemonic']!,
          address: result['address']!,
        )),
        (_) => false,
      );
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString().replaceAll('Exception: ', ''));
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(4, 8, 16, 16),
            child: Row(children: [
              IconButton(onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.white, size: 20)),
              const Text('Create Wallet',
                  style: TextStyle(color: Colors.white, fontSize: 18,
                      fontWeight: FontWeight.w700)),
            ]),
          )),
        ),
        Expanded(child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Info banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.brand50,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brand100)),
              child: Row(children: const [
                Icon(Icons.info_outline_rounded, color: AppColors.brand500, size: 16),
                SizedBox(width: 10),
                Expanded(child: Text(
                  'A 12-word recovery phrase will be generated. Write it down — it\'s the only way to restore your wallet.',
                  style: TextStyle(fontSize: 12, color: AppColors.brand700))),
              ]),
            ),
            const SizedBox(height: 24),
            const SectionLabel('WALLET NAME'),
            const SizedBox(height: 8),
            TextField(controller: _nameCtrl,
                decoration: const InputDecoration(hintText: 'e.g. My Main Wallet')),
            const SizedBox(height: 16),
            const SectionLabel('PASSWORD'),
            const SizedBox(height: 8),
            PasswordField(controller: _pwdCtrl, hint: 'Min. 8 characters',
                action: TextInputAction.next),
            const SizedBox(height: 10),
            PasswordField(controller: _pwd2Ctrl, hint: 'Confirm password',
                onSubmit: (_) => _create()),
            const SizedBox(height: 4),
            // Password strength
            ValueListenableBuilder(
              valueListenable: _pwdCtrl,
              builder: (_, __, ___) {
                final len = _pwdCtrl.text.length;
                final strength = len == 0 ? 0.0 : len < 8 ? 0.25 : len < 12 ? 0.55 : 0.9;
                final color = strength < 0.3 ? AppColors.error
                    : strength < 0.6 ? AppColors.warning : AppColors.success;
                final label = strength == 0 ? '' : strength < 0.3 ? 'Weak'
                    : strength < 0.6 ? 'Fair' : 'Strong';
                return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: strength, minHeight: 4,
                      backgroundColor: isDark ? AppColors.darkInput : AppColors.lightInput,
                      valueColor: AlwaysStoppedAnimation(color))),
                  if (label.isNotEmpty) Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(label,
                        style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600))),
                ]);
              },
            ),
            if (_pwdCtrl.text.isNotEmpty && _pwd2Ctrl.text.isNotEmpty
                && _pwdCtrl.text != _pwd2Ctrl.text)
              const Padding(padding: EdgeInsets.only(top: 4),
                child: Text('Passwords do not match',
                    style: TextStyle(fontSize: 11, color: AppColors.error))),
            const SizedBox(height: 20),
            // Agreement
            GestureDetector(
              onTap: () => setState(() => _agree = !_agree),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  width: 20, height: 20, margin: const EdgeInsets.only(top: 1),
                  decoration: BoxDecoration(
                    color: _agree ? AppColors.brand500 : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                        color: _agree ? AppColors.brand500 : Colors.grey, width: 1.5)),
                  child: _agree ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                ),
                const SizedBox(width: 10),
                const Expanded(child: Text(
                  'I understand that if I lose my recovery phrase, my funds are permanently inaccessible. Gatenet cannot recover them.',
                  style: TextStyle(fontSize: 13, height: 1.4))),
              ]),
            ),
            const SizedBox(height: 28),
            PrimaryBtn(
              label: 'Create Wallet',
              icon: Icons.rocket_launch_rounded,
              loading: _loading,
              onTap: _valid ? _create : null,
            ),
          ]),
        )),
      ]),
    );
  }
}
