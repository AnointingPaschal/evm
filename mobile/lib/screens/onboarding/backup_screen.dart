import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class BackupScreen extends StatefulWidget {
  final String mnemonic;
  final String address;
  const BackupScreen({super.key, required this.mnemonic, required this.address});
  @override State<BackupScreen> createState() => _BackupScreenState();
}

class _BackupScreenState extends State<BackupScreen> {
  bool _revealed = false;
  bool _confirmed = false;
  bool _copied = false;

  List<String> get _words => widget.mnemonic.split(' ');

  Future<void> _copy() async {
    await Clipboard.setData(ClipboardData(text: widget.mnemonic));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) setState(() => _copied = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.shield_rounded, color: AppColors.warning, size: 22),
                const SizedBox(width: 10),
                const Text('Back Up Recovery Phrase',
                  style: TextStyle(color: Colors.white, fontSize: 16,
                      fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 8),
              Text('Write down these 12 words in order and store them somewhere safe.',
                style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 13)),
            ]),
          )),
        ),
        Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Warning box
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.orange.shade200)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: const [
                  Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 16),
                  SizedBox(width: 6),
                  Text('Critical Security Warning',
                    style: TextStyle(fontWeight: FontWeight.w700,
                        color: Colors.orange, fontSize: 13)),
                ]),
                const SizedBox(height: 6),
                const Text(
                  '• Never share this phrase with anyone\n'
                  '• Gatenet cannot recover it for you\n'
                  '• Take a screenshot only if your device is secure\n'
                  '• Anyone with these words can steal your funds',
                  style: TextStyle(fontSize: 12, color: Colors.orange, height: 1.6)),
              ]),
            ),
            const SizedBox(height: 20),
            // Phrase card
            GestureDetector(
              onTap: () => setState(() => _revealed = !_revealed),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                child: Column(children: [
                  if (!_revealed) ...[
                    const SizedBox(height: 30),
                    const Icon(Icons.remove_red_eye_outlined,
                        color: Colors.grey, size: 36),
                    const SizedBox(height: 12),
                    const Text('Tap to reveal your recovery phrase',
                        style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 30),
                  ] else
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3, childAspectRatio: 2.6,
                            mainAxisSpacing: 8, crossAxisSpacing: 8),
                      itemCount: 12,
                      itemBuilder: (_, i) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.navy900
                              : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: isDark
                                  ? AppColors.darkBorder
                                  : AppColors.lightBorder)),
                        child: Row(children: [
                          Text('${i + 1}',
                              style: const TextStyle(
                                  fontSize: 9,
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w500)),
                          const SizedBox(width: 4),
                          Expanded(child: Text(_words[i],
                              style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600),
                              overflow: TextOverflow.ellipsis)),
                        ]),
                      ),
                    ),
                ]),
              ),
            ),
            const SizedBox(height: 12),
            if (_revealed)
              GestureDetector(
                onTap: _copy,
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                  Icon(_copied ? Icons.check_rounded : Icons.copy_rounded,
                      size: 14,
                      color: _copied ? AppColors.success : AppColors.brand500),
                  const SizedBox(width: 4),
                  Text(_copied ? 'Copied!' : 'Copy to clipboard',
                      style: TextStyle(
                          fontSize: 12,
                          color: _copied ? AppColors.success : AppColors.brand500,
                          fontWeight: FontWeight.w600)),
                ]),
              ),
            const SizedBox(height: 20),
            // Wallet address
            InnerCard(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Wallet Address', style: TextStyle(
                  fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Row(children: [
                Expanded(child: Text(widget.address,
                    style: const TextStyle(
                        fontFamily: 'monospace', fontSize: 11),
                    maxLines: 2)),
                CopyBtn(text: widget.address),
              ]),
            ])),
            const SizedBox(height: 24),
            // Confirmation checkbox
            GestureDetector(
              onTap: () => setState(() => _confirmed = !_confirmed),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  width: 20, height: 20,
                  margin: const EdgeInsets.only(top: 1),
                  decoration: BoxDecoration(
                    color: _confirmed ? AppColors.brand500 : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                        color: _confirmed ? AppColors.brand500 : Colors.grey,
                        width: 1.5)),
                  child: _confirmed
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : null,
                ),
                const SizedBox(width: 10),
                const Expanded(child: Text(
                  'I\'ve written down my recovery phrase and stored it safely.',
                  style: TextStyle(fontSize: 13, height: 1.4))),
              ]),
            ),
            const SizedBox(height: 24),
            PrimaryBtn(
              label: 'I\'ve Saved It — Continue',
              onTap: _confirmed && _revealed
                  ? () => Navigator.of(context).popUntil((r) => r.isFirst)
                  : null,
            ),
            const SizedBox(height: 40),
          ])),
        ),
      ]),
    );
  }
}
