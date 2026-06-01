import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class ReceiveScreen extends StatelessWidget {
  const ReceiveScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    final addr = wp.active?.address ?? '';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 16, 16),
            child: Row(children: [
              IconButton(onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20)),
              const Text('Receive', style: TextStyle(color: Colors.white,
                fontSize: 18, fontWeight: FontWeight.w700)),
            ]),
          )),
        ),
        Expanded(child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(children: [
            Text('Scan QR or copy address to receive tokens',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
              textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20)]),
              child: QrImageView(data: addr, size: 200, backgroundColor: Colors.white,
                eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square,
                  color: AppColors.navy900),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square, color: AppColors.navy900)),
            ),
            const SizedBox(height: 24),
            AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(children: [
                Expanded(child: Text(addr, style: const TextStyle(
                  fontFamily: 'monospace', fontSize: 12), maxLines: 2, overflow: TextOverflow.visible)),
                const SizedBox(width: 8),
                CopyBtn(text: addr, size: 20),
              ]),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.orange.shade200)),
              child: Row(children: const [
                Icon(Icons.info_outline_rounded, color: Colors.orange, size: 16),
                SizedBox(width: 10),
                Expanded(child: Text(
                  'Only send ETH/BNB and ERC-20/BEP-20 tokens. Use the correct network.',
                  style: TextStyle(fontSize: 12, color: Colors.orange))),
              ]),
            ),
          ]),
        )),
      ]),
    );
  }
}
