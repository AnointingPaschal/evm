import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/wallet_service.dart';
import '../../services/price_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';
import '../token/token_detail_screen.dart';
import '../token/send_screen.dart';
import '../token/receive_screen.dart';
import '../token/swap_screen.dart';
import 'add_token_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _hideBalance = false;
  final _walletSvc = WalletService();

  void _showAddToken() => showModalBottomSheet(
    context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
    builder: (_) => const AddTokenSheet());

  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    final theme = context.watch<ThemeProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final net = kNetworks[wp.network]!;

    final nativeSym = net.symbol;
    final nativePrice = wp.nativePrice;
    final nativeBal = wp.nativeBalance;
    final totalUsd = wp.totalUsd;
    final change = nativePrice?.change24h;

    return Scaffold(
      backgroundColor: isDark ? AppColors.navy950 : AppColors.lightBg,
      body: RefreshIndicator(
        onRefresh: () async {
          await wp.refreshBalances();
          await wp.refreshPrices();
          await wp.refreshVaults();
        },
        child: CustomScrollView(slivers: [
          // ── Dark header ─────────────────────────────────────────
          SliverToBoxAdapter(child: Container(
            decoration: const BoxDecoration(gradient: kHeaderGradient),
            child: SafeArea(bottom: false, child: Column(children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(children: [
                  Expanded(child: GestureDetector(
                    onTap: _showWalletPicker,
                    child: Row(children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12)),
                        child: Center(child: Text(
                          (wp.active?.name ?? 'W')[0].toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
                      ),
                      const SizedBox(width: 10),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(wp.active?.name ?? '', style: const TextStyle(
                          color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                        Text(_walletSvc.shortAddress(wp.active?.address ?? ''),
                          style: const TextStyle(color: Colors.white54, fontSize: 11,
                            fontFamily: 'monospace')),
                      ]),
                      const SizedBox(width: 4),
                      const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white54, size: 18),
                    ]),
                  )),
                  IconButton(
                    onPressed: () => wp.refreshPrices(),
                    icon: wp.loadingBal
                      ? const SizedBox(width: 18, height: 18,
                          child: CircularProgressIndicator(color: Colors.white54, strokeWidth: 2))
                      : const Icon(Icons.refresh_rounded, color: Colors.white54, size: 20)),
                  IconButton(
                    onPressed: theme.toggle,
                    icon: Icon(theme.isDark ? Icons.wb_sunny_rounded : Icons.dark_mode_rounded,
                      color: Colors.white54, size: 20)),
                ]),
              ),
              // Network toggle
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14)),
                  child: Row(children: ['bsc', 'ethereum'].map((n) => Expanded(
                    child: GestureDetector(
                      onTap: () => wp.setNetwork(n),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: wp.network == n ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(11)),
                        child: Text(n == 'bsc' ? '◈ BNB Chain' : '⟠ Ethereum',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600,
                            color: wp.network == n ? AppColors.navy900 : Colors.white60)),
                      ),
                    ),
                  )).toList()),
                ),
              ),
              // Balance
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text('Total Balance', style: TextStyle(
                      color: Colors.white.withOpacity(0.5), fontSize: 12)),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => setState(() => _hideBalance = !_hideBalance),
                      child: Icon(_hideBalance ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                        color: Colors.white38, size: 16)),
                  ]),
                  const SizedBox(height: 4),
                  Text(_hideBalance ? '••••••' : PriceService.fmtUsd(totalUsd),
                    style: const TextStyle(color: Colors.white, fontSize: 34,
                      fontWeight: FontWeight.w800)),
                  if (change != null) Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(children: [
                      Icon(change >= 0 ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                        color: change >= 0 ? AppColors.success : AppColors.error, size: 16),
                      const SizedBox(width: 4),
                      Text(PriceService.fmtPct(change),
                        style: TextStyle(
                          color: change >= 0 ? AppColors.success : AppColors.error,
                          fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(width: 4),
                      Text('today', style: TextStyle(color: Colors.white38, fontSize: 12)),
                    ]),
                  ),
                  if (wp.vaults.where((v) => v.isLocked).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(children: [
                        const Icon(Icons.lock_rounded, color: Color(0xFF06B6D4), size: 12),
                        const SizedBox(width: 4),
                        Text('${wp.vaults.where((v) => v.isLocked).length} vault(s) active',
                          style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 11)),
                      ]),
                    ),
                ]),
              ),
              // Action buttons
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  ActionBtn(icon: Icons.send_rounded, label: 'Send',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SendScreen()))),
                  ActionBtn(icon: Icons.qr_code_rounded, label: 'Receive',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReceiveScreen()))),
                  ActionBtn(icon: Icons.swap_horiz_rounded, label: 'Swap',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SwapScreen()))),
                  ActionBtn(icon: Icons.lock_rounded, label: 'Vault',
                    onTap: () {/* navigate to first token detail with vault tab */},
                    highlight: true),
                ]),
              ),
            ])),
          )),

          // ── White bottom sheet ──────────────────────────────────
          SliverToBoxAdapter(child: Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.navy800 : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 20, offset: const Offset(0, -4))],
            ),
            child: Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(children: [
                  const Text('Assets', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Row(children: [
                    Container(width: 8, height: 8,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle, color: AppColors.success)),
                    const SizedBox(width: 6),
                    Text(net.name, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ]),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: _showAddToken,
                    child: Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        color: AppColors.brand50,
                        shape: BoxShape.circle),
                      child: const Icon(Icons.add, color: AppColors.brand500, size: 16)),
                  ),
                ]),
              ),
            ]),
          )),

          // ── Token list ──────────────────────────────────────────
          SliverToBoxAdapter(child: Container(
            color: isDark ? AppColors.navy800 : Colors.white,
            child: Column(children: [
              _buildNativeRow(context, wp, nativeSym, nativeBal, nativePrice, isDark),
              ...wp.tokens.map((t) => _buildTokenRow(context, wp, t, isDark)),
              if (wp.tokens.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(children: [
                    Text('No tokens added', style: TextStyle(color: Colors.grey.shade500)),
                    const SizedBox(height: 8),
                    TextButton(onPressed: _showAddToken,
                      child: const Text('+ Add your first token')),
                  ]),
                ),
              const SizedBox(height: 100),
            ]),
          )),
        ]),
      ),
    );
  }

  Widget _buildNativeRow(BuildContext context, WalletProvider wp,
    String sym, double bal, dynamic priceInfo, bool isDark) {
    final price = priceInfo?.price ?? 0.0;
    final change = priceInfo?.change24h;
    final usd = bal * price;
    return _tokenRow(
      context: context,
      logo: null, symbol: sym, name: kNetworks[wp.network]!.name,
      balance: bal, usd: usd, change: change, isDark: isDark,
      onTap: () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => const TokenDetailScreen(tokenId: 'native'))),
    );
  }

  Widget _buildTokenRow(BuildContext context, WalletProvider wp, token, bool isDark) {
    final sym = token.symbol.toUpperCase();
    final priceInfo = wp.prices[sym];
    final ccLogo = priceInfo?.imageUrl;
    final logo = ccLogo ?? token.logo;
    final bal = wp.balances[token.address.toLowerCase()] ?? 0.0;
    final price = priceInfo?.price ?? 0.0;
    final usd = bal * price;
    final change = priceInfo?.change24h;
    final locked = wp.vaults.where((v) =>
      v.isLocked && v.tokenAddress.toLowerCase() == token.address.toLowerCase())
      .fold(0.0, (s, v) => s + v.amount);
    return _tokenRow(
      context: context,
      logo: logo, symbol: sym, name: token.name,
      balance: bal, usd: usd, change: change, locked: locked, isDark: isDark,
      onTap: () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => TokenDetailScreen(tokenId: token.address))),
    );
  }

  Widget _tokenRow({
    required BuildContext context, String? logo, required String symbol, required String name,
    required double balance, required double usd, double? change, double locked = 0,
    required bool isDark, required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(children: [
          Stack(children: [
            TokenAvatar(logo: logo, symbol: symbol, size: 44),
            if (locked > 0) Positioned(
              bottom: 0, right: 0,
              child: Container(
                width: 16, height: 16,
                decoration: BoxDecoration(
                  color: AppColors.cyan, shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark ? AppColors.navy800 : Colors.white, width: 2)),
                child: const Icon(Icons.lock_rounded, size: 8, color: Colors.white),
              ),
            ),
          ]),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text(symbol, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              if (locked > 0) ...[
                const SizedBox(width: 6),
                AppBadge(
                  label: '+${locked.toStringAsFixed(2)} locked',
                  color: AppColors.cyan),
              ],
            ]),
            const SizedBox(height: 2),
            Row(children: [
              Text(name, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              if (change != null) ...[
                const SizedBox(width: 6),
                Text(PriceService.fmtPct(change),
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                    color: change >= 0 ? AppColors.success : AppColors.error)),
              ],
            ]),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(_hideBalance ? '••••' : balance.toStringAsFixed(4),
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 2),
            Text(_hideBalance ? '••' : PriceService.fmtUsd(usd),
              style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ]),
        ]),
      ),
    );
  }

  void _showWalletPicker() {
    final wp = context.read<WalletProvider>();
    showModalBottomSheet(
      context: context, backgroundColor: Colors.transparent, isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.navy800 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SheetHandle(),
          const Text('Switch Wallet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          ...wp.wallets.map((w) => ListTile(
            leading: CircleAvatar(backgroundColor: AppColors.brand100,
              child: Text(w.name[0].toUpperCase(),
                style: const TextStyle(color: AppColors.brand600, fontWeight: FontWeight.w700))),
            title: Text(w.name),
            subtitle: Text(WalletService().shortAddress(w.address),
              style: const TextStyle(fontFamily: 'monospace', fontSize: 11)),
            trailing: wp.active?.id == w.id
              ? const Icon(Icons.check_circle, color: AppColors.brand500) : null,
            onTap: () { Navigator.pop(ctx); wp.switchWallet(w.id); },
          )),
          const Divider(),
          ListTile(
            leading: const CircleAvatar(backgroundColor: AppColors.brand50,
              child: Icon(Icons.add, color: AppColors.brand500)),
            title: const Text('Add / Import Wallet'),
            onTap: () {/* navigate to onboarding */},
          ),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }
}
