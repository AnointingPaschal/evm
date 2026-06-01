import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/wallet_provider.dart';
import '../../services/wallet_service.dart';
import '../../services/price_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class SendScreen extends StatefulWidget {
  final String? defaultTokenAddr;
  const SendScreen({super.key, this.defaultTokenAddr});
  @override State<SendScreen> createState() => _SendScreenState();
}

class _SendScreenState extends State<SendScreen> {
  final _toCtrl     = TextEditingController();
  final _amtCtrl    = TextEditingController();
  final _pwdCtrl    = TextEditingController();
  String? _selAddr;
  int _step = 0; // 0=form, 1=confirm, 2=done
  bool _loading = false;
  String _txHash = '';
  final _walletSvc = WalletService();

  @override
  void initState() {
    super.initState();
    _selAddr = widget.defaultTokenAddr ?? 'native';
  }

  @override void dispose() {
    _toCtrl.dispose(); _amtCtrl.dispose(); _pwdCtrl.dispose(); super.dispose();
  }

  Future<void> _send() async {
    setState(() => _loading = true);
    try {
      final wp = context.read<WalletProvider>();
      String hash;
      if (_selAddr == 'native') {
        hash = await wp.sendNative(_toCtrl.text.trim(), double.parse(_amtCtrl.text));
      } else {
        final token = wp.tokens.firstWhere((t) => t.address == _selAddr);
        hash = await wp.sendToken(_selAddr!, _toCtrl.text.trim(), double.parse(_amtCtrl.text), token.decimals);
      }
      _txHash = hash;
      setState(() { _step = 2; _loading = false; });
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString().replaceAll('Exception: ', ''));
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final net = kNetworks[wp.network]!;

    final allTokens = [
      {'address': 'native', 'symbol': net.symbol, 'name': net.name, 'isNative': true, 'decimals': 18},
      ...wp.tokens.map((t) => {'address': t.address, 'symbol': t.symbol, 'name': t.name,
        'isNative': false, 'decimals': t.decimals}),
    ];
    final selToken = allTokens.firstWhere((t) => t['address'] == _selAddr, orElse: () => allTokens.first);
    final sym = (selToken['symbol'] as String).toUpperCase();
    final priceInfo = wp.prices[sym];
    final balKey = _selAddr == 'native' ? 'native' : _selAddr?.toLowerCase() ?? '';
    final bal = wp.balances[balKey] ?? 0.0;
    final usdEst = double.tryParse(_amtCtrl.text) ?? 0;
    final usdVal = usdEst * (priceInfo?.price ?? 0);

    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 16, 16),
            child: Row(children: [
              IconButton(onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20)),
              const Text('Send', style: TextStyle(color: Colors.white,
                fontSize: 18, fontWeight: FontWeight.w700)),
            ]),
          )),
        ),
        Expanded(child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _step == 0 ? _form(context, wp, allTokens, selToken, sym, bal, usdVal, isDark)
            : _step == 1 ? _confirm(sym, usdVal, isDark)
            : _done(net.explorerUrl, isDark),
        )),
      ]),
    );
  }

  Widget _form(BuildContext context, WalletProvider wp, List allTokens,
    Map selToken, String sym, double bal, double usdVal, bool isDark) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SectionLabel('SELECT TOKEN'),
      const SizedBox(height: 8),
      ...allTokens.map((t) {
        final s = (t['symbol'] as String).toUpperCase();
        final p = wp.prices[s];
        final b = wp.balances[t['address'] == 'native' ? 'native' : (t['address'] as String).toLowerCase()] ?? 0.0;
        final isSelected = t['address'] == _selAddr;
        return GestureDetector(
          onTap: () => setState(() => _selAddr = t['address'] as String),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                ? AppColors.brand500.withOpacity(0.08) : (isDark ? AppColors.darkInput : AppColors.lightInput),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected ? AppColors.brand500 : Colors.transparent, width: 1.5)),
            child: Row(children: [
              TokenAvatar(logo: p?.imageUrl, symbol: s, size: 36),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(t['name'] as String, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(b.toStringAsFixed(4), style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(PriceService.fmtUsd(b * (p?.price ?? 0)),
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ]),
            ]),
          ),
        );
      }),
      const SizedBox(height: 16),
      const SectionLabel('RECIPIENT ADDRESS'),
      const SizedBox(height: 8),
      TextField(controller: _toCtrl,
        decoration: const InputDecoration(hintText: '0x...'),
        style: const TextStyle(fontFamily: 'monospace', fontSize: 13)),
      const SizedBox(height: 16),
      Row(children: [
        const Expanded(child: SectionLabel('AMOUNT')),
        TextButton(
          onPressed: () => setState(() => _amtCtrl.text = bal.toStringAsFixed(6)),
          child: Text('Max: ${bal.toStringAsFixed(4)} $sym',
            style: const TextStyle(fontSize: 12, color: AppColors.brand500))),
      ]),
      TextField(controller: _amtCtrl, keyboardType: TextInputType.number,
        decoration: InputDecoration(hintText: '0.00', suffixText: sym),
        onChanged: (_) => setState(() {})),
      if (_amtCtrl.text.isNotEmpty && usdVal > 0)
        Padding(padding: const EdgeInsets.only(top: 4),
          child: Text('≈ ${PriceService.fmtUsd(usdVal)}',
            style: const TextStyle(fontSize: 12, color: Colors.grey))),
      if (wp.sessionPwd == null) ...[
        const SizedBox(height: 16),
        const SectionLabel('WALLET PASSWORD'),
        const SizedBox(height: 8),
        PasswordField(controller: _pwdCtrl, hint: 'Confirm with password'),
      ],
      const SizedBox(height: 24),
      PrimaryBtn(label: 'Review Transaction',
        onTap: _toCtrl.text.isNotEmpty && _amtCtrl.text.isNotEmpty
          ? () => setState(() => _step = 1) : null),
    ]);
  }

  Widget _confirm(String sym, double usdVal, bool isDark) {
    return Column(children: [
      const SizedBox(height: 20),
      InnerCard(child: Column(children: [
        _row('Sending', '${_amtCtrl.text} $sym'),
        const Divider(height: 1),
        _row('USD Value', PriceService.fmtUsd(usdVal)),
        const Divider(height: 1),
        _row('To', '${_toCtrl.text.substring(0, 10)}...${_toCtrl.text.substring(_toCtrl.text.length - 6)}'),
      ])),
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.orange.shade200)),
        child: Row(children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 18),
          const SizedBox(width: 10),
          const Expanded(child: Text(
            'This transaction is irreversible. Verify the address carefully.',
            style: TextStyle(fontSize: 12, color: Colors.orange))),
        ]),
      ),
      const SizedBox(height: 24),
      Row(children: [
        Expanded(child: GhostBtn(label: 'Back', onTap: () => setState(() => _step = 0))),
        const SizedBox(width: 12),
        Expanded(child: PrimaryBtn(label: 'Confirm', loading: _loading, onTap: _send)),
      ]),
    ]);
  }

  Widget _done(String explorerUrl, bool isDark) => Column(children: [
    const SizedBox(height: 40),
    Container(
      width: 72, height: 72,
      decoration: BoxDecoration(
        color: AppColors.success.withOpacity(0.12),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.success.withOpacity(0.3))),
      child: const Icon(Icons.check_rounded, color: AppColors.success, size: 36)),
    const SizedBox(height: 16),
    const Text('Transaction Sent!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
    const SizedBox(height: 8),
    Text('${_txHash.substring(0, 16)}...', style: const TextStyle(fontFamily: 'monospace', color: Colors.grey)),
    const SizedBox(height: 32),
    PrimaryBtn(label: 'Done', onTap: () => Navigator.pop(context)),
  ]);

  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
    child: Row(children: [
      Expanded(child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
    ]),
  );
}
