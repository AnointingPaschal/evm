import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/wallet_provider.dart';
import '../../services/chain_service.dart';
import '../../services/price_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class SwapScreen extends StatefulWidget {
  const SwapScreen({super.key});
  @override State<SwapScreen> createState() => _SwapScreenState();
}

class _SwapScreenState extends State<SwapScreen> {
  int _fromIdx = 0;
  int _toIdx   = 1;
  final _amtCtrl = TextEditingController();

  @override void dispose() { _amtCtrl.dispose(); super.dispose(); }

  void _swapDir() {
    final tmp = _fromIdx;
    setState(() { _fromIdx = _toIdx; _toIdx = tmp; _amtCtrl.clear(); });
  }

  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final net = kNetworks[wp.network]!;

    final allTokens = [
      {'address': 'native', 'symbol': net.symbol, 'name': net.name, 'isNative': true, 'decimals': 18, 'logo': null},
      ...wp.tokens.map((t) => {'address': t.address, 'symbol': t.symbol, 'name': t.name,
        'isNative': false, 'decimals': t.decimals, 'logo': t.logo}),
    ];
    if (allTokens.length < 2) _toIdx = 0;
    final safeFrom = _fromIdx.clamp(0, allTokens.length - 1);
    final safeTo   = _toIdx.clamp(0, allTokens.length - 1);

    final fromTk = allTokens[safeFrom];
    final toTk   = allTokens[safeTo];
    final fromSym = (fromTk['symbol'] as String).toUpperCase();
    final toSym   = (toTk['symbol']   as String).toUpperCase();
    final fromPrice = wp.prices[fromSym]?.price ?? 0.0;
    final toPrice   = wp.prices[toSym]?.price   ?? 0.0;
    final fromLogo  = !(fromTk['isNative'] as bool) ? (wp.prices[fromSym]?.imageUrl ?? fromTk['logo'] as String?) : null;
    final toLogo    = !(toTk['isNative']   as bool) ? (wp.prices[toSym]?.imageUrl   ?? toTk['logo'] as String?) : null;
    final fromBal   = wp.balances[fromTk['address'] == 'native' ? 'native' : (fromTk['address'] as String).toLowerCase()] ?? 0.0;
    final rate      = fromPrice > 0 && toPrice > 0 ? fromPrice / toPrice : 0.0;
    final amt       = double.tryParse(_amtCtrl.text) ?? 0;
    final estOut    = amt * rate;
    final fromUsd   = amt * fromPrice;

    final dexLinks = wp.network == 'bsc' ? [
      {'name': 'PancakeSwap', 'icon': '🥞', 'color': 0xFF1FC7D4,
        'url': 'https://pancakeswap.finance/swap?inputCurrency=${fromTk['address'] == 'native' ? 'BNB' : fromTk['address']}&outputCurrency=${toTk['address'] == 'native' ? 'BNB' : toTk['address']}'},
      {'name': '1inch (BSC)', 'icon': '🔮', 'color': 0xFF2B64D0,
        'url': 'https://app.1inch.io/#/56/unified/swap/$fromSym/$toSym'},
    ] : [
      {'name': 'Uniswap', 'icon': '🦄', 'color': 0xFFFF007A,
        'url': 'https://app.uniswap.org/#/swap?inputCurrency=${fromTk['address'] == 'native' ? 'ETH' : fromTk['address']}&outputCurrency=${toTk['address'] == 'native' ? 'ETH' : toTk['address']}'},
      {'name': '1inch', 'icon': '🔮', 'color': 0xFF2B64D0,
        'url': 'https://app.1inch.io/#/1/unified/swap/$fromSym/$toSym'},
    ];

    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Row(children: [
              const Expanded(child: Text('Swap', style: TextStyle(
                color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20)),
                child: Text(net.name, style: const TextStyle(color: Colors.white70, fontSize: 11)),
              ),
            ]),
          )),
        ),
        Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
            // From/To swap box
            Stack(children: [
              Column(children: [
                // From
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkInput : AppColors.lightInput,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('You Pay', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                    const SizedBox(height: 12),
                    Row(children: [
                      GestureDetector(
                        onTap: () => _showTokenPicker(context, wp, allTokens, true),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.navy800 : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            TokenAvatar(logo: fromLogo, symbol: fromSym, size: 28),
                            const SizedBox(width: 6),
                            Text(fromSym, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                            const SizedBox(width: 4),
                            const Icon(Icons.keyboard_arrow_down_rounded, size: 16),
                          ]),
                        ),
                      ),
                      const Spacer(),
                      Expanded(flex: 2, child: TextField(
                        controller: _amtCtrl, textAlign: TextAlign.right,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                        decoration: const InputDecoration(
                          hintText: '0.00', border: InputBorder.none,
                          fillColor: Colors.transparent, filled: false),
                        onChanged: (_) => setState(() {}),
                      )),
                    ]),
                    const SizedBox(height: 8),
                    Row(children: [
                      Text('Balance: ${fromBal.toStringAsFixed(4)} $fromSym',
                        style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      const Spacer(),
                      GestureDetector(
                        onTap: () => setState(() => _amtCtrl.text = fromBal.toStringAsFixed(6)),
                        child: const Text('MAX', style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.brand500))),
                    ]),
                  ]),
                ),
                // To
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.navy900.withOpacity(0.5) : const Color(0xFFF8FAFC),
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20))),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('You Receive (est.)', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                    const SizedBox(height: 12),
                    Row(children: [
                      GestureDetector(
                        onTap: () => _showTokenPicker(context, wp, allTokens, false),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.navy800 : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            TokenAvatar(logo: toLogo, symbol: toSym, size: 28),
                            const SizedBox(width: 6),
                            Text(toSym, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                            const SizedBox(width: 4),
                            const Icon(Icons.keyboard_arrow_down_rounded, size: 16),
                          ]),
                        ),
                      ),
                      const Spacer(),
                      Text(estOut > 0 ? estOut.toStringAsFixed(6) : '0.00',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                          color: Theme.of(context).colorScheme.onSurface)),
                    ]),
                    if (rate > 0 && amt > 0) Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text('1 $fromSym ≈ ${rate.toStringAsFixed(6)} $toSym',
                        style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey)),
                    ),
                  ]),
                ),
              ]),
              // Swap direction button
              Positioned.fill(child: Align(alignment: Alignment.center,
                child: GestureDetector(
                  onTap: _swapDir,
                  child: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.navy800 : Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, width: 2),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8)]),
                    child: const Icon(Icons.swap_vert_rounded, color: AppColors.brand500, size: 20)),
                ),
              )),
            ]),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.brand50,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brand100)),
              child: Row(children: const [
                Icon(Icons.info_outline_rounded, color: AppColors.brand500, size: 16),
                SizedBox(width: 8),
                Expanded(child: Text(
                  'Swaps execute via external DEX aggregators at the best available rates.',
                  style: TextStyle(fontSize: 12, color: AppColors.brand600))),
              ]),
            ),
            const SizedBox(height: 20),
            const SectionLabel('SWAP ON'),
            const SizedBox(height: 10),
            ...dexLinks.map((dex) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GestureDetector(
                onTap: () => launchUrl(Uri.parse(dex['url'] as String)),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkInput : AppColors.lightInput,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                  child: Row(children: [
                    Text(dex['icon'] as String, style: const TextStyle(fontSize: 26)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(dex['name'] as String, style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14)),
                      const Text('Open in browser', style: TextStyle(
                        fontSize: 11, color: Colors.grey)),
                    ])),
                    const Icon(Icons.open_in_new_rounded, color: Colors.grey, size: 16),
                  ]),
                ),
              ),
            )),
            const SizedBox(height: 80),
          ],
        ))),
      ]),
    );
  }

  void _showTokenPicker(BuildContext context, WalletProvider wp,
    List<Map<String, dynamic>> all, bool isFrom) {
    showModalBottomSheet(
      context: context, backgroundColor: Colors.transparent, isScrollControlled: true,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.6,
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
        child: Column(children: [
          const SheetHandle(),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(isFrom ? 'Select token to pay' : 'Select token to receive',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700))),
          const SizedBox(height: 8),
          Expanded(child: ListView.builder(
            itemCount: all.length,
            itemBuilder: (_, i) {
              final t = all[i];
              final sym = (t['symbol'] as String).toUpperCase();
              final p = wp.prices[sym];
              final logo = !(t['isNative'] as bool) ? (p?.imageUrl ?? t['logo'] as String?) : null;
              final bal = wp.balances[t['address'] == 'native' ? 'native' : (t['address'] as String).toLowerCase()] ?? 0.0;
              return ListTile(
                leading: TokenAvatar(logo: logo, symbol: sym, size: 40),
                title: Text(sym, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text(t['name'] as String),
                trailing: Column(mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(bal.toStringAsFixed(4), style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(PriceService.fmtUsd(bal * (p?.price ?? 0)),
                    style: const TextStyle(fontSize: 11, color: Colors.grey)),
                ]),
                onTap: () {
                  Navigator.pop(ctx);
                  setState(() { if (isFrom) _fromIdx = i; else _toIdx = i; });
                },
              );
            },
          )),
        ]),
      ),
    );
  }
}
