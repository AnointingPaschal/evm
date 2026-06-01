import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class AddTokenSheet extends StatefulWidget {
  const AddTokenSheet({super.key});
  @override State<AddTokenSheet> createState() => _AddTokenSheetState();
}

class _AddTokenSheetState extends State<AddTokenSheet> {
  final _addrCtrl = TextEditingController();
  String _net = 'bsc';
  bool _loading = false;

  @override void dispose() { _addrCtrl.dispose(); super.dispose(); }

  Future<void> _add() async {
    final addr = _addrCtrl.text.trim();
    if (addr.isEmpty) return;
    setState(() => _loading = true);
    try {
      await context.read<WalletProvider>().addToken(addr, _net);
      if (mounted) Navigator.pop(context);
      Fluttertoast.showToast(msg: 'Token added!');
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString());
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SheetHandle(),
          const Text('Add Token', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          // Network toggle
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkInput : AppColors.lightInput,
              borderRadius: BorderRadius.circular(14)),
            child: Row(children: ['bsc', 'ethereum'].map((n) => Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _net = n),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: _net == n
                      ? (isDark ? AppColors.navy700 : Colors.white) : Colors.transparent,
                    borderRadius: BorderRadius.circular(11),
                    boxShadow: _net == n ? [const BoxShadow(
                      color: Color(0x0D000000), blurRadius: 4)] : null),
                  child: Text(n == 'bsc' ? 'BNB Chain' : 'Ethereum',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                      color: _net == n ? AppColors.brand500 : Colors.grey)),
                ),
              ),
            )).toList()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _addrCtrl,
            decoration: const InputDecoration(
              hintText: '0x contract address...',
              prefixIcon: Icon(Icons.search_rounded, size: 20),
            ),
            style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
          ),
          const SizedBox(height: 8),
          Text('Logo fetched from CryptoCompare',
            style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
          const SizedBox(height: 16),
          PrimaryBtn(label: 'Add Token', loading: _loading, onTap: _add),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }
}
