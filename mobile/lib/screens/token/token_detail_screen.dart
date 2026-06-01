import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/wallet_provider.dart';
import '../../services/chain_service.dart';
import '../../services/price_service.dart';
import '../../models/price_model.dart';
import '../../models/vault_model.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';
import 'send_screen.dart';
import 'receive_screen.dart';
import 'swap_screen.dart';

class TokenDetailScreen extends StatefulWidget {
  final String tokenId;
  const TokenDetailScreen({super.key, required this.tokenId});
  @override State<TokenDetailScreen> createState() => _TokenDetailScreenState();
}

class _TokenDetailScreenState extends State<TokenDetailScreen>
  with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<OhlcPoint> _chart = [];
  Map<String, dynamic>? _dexData;
  bool _loadingChart = true;
  String _period = '7d';
  bool _showVaultCreate = false;
  final _vaultAmtCtrl   = TextEditingController();
  final _vaultNoteCtrl  = TextEditingController();
  int _lockMonths = 3;
  bool _lockingVault = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadChart();
  }

  @override
  void dispose() { _tabs.dispose(); _vaultAmtCtrl.dispose(); _vaultNoteCtrl.dispose(); super.dispose(); }

  bool get _isNative => widget.tokenId == 'native';

  Future<void> _loadChart() async {
    setState(() => _loadingChart = true);
    final wp = context.read<WalletProvider>();
    final sym = _isNative ? (kNetworks[wp.network]!.symbol) : wp.tokens.firstWhere(
      (t) => t.address.toLowerCase() == widget.tokenId.toLowerCase(),
      orElse: () => wp.tokens.first).symbol;
    final limits = {'1d': 24, '7d': 168, '30d': 720, '90d': 2160};
    final ps = PriceService();
    final results = await Future.wait([
      ps.getOhlcv(sym, limit: limits[_period] ?? 168),
      if (!_isNative) ps.getDexData(widget.tokenId, wp.network),
    ]);
    setState(() {
      _chart = results[0] as List<OhlcPoint>;
      if (!_isNative) _dexData = results[1] as Map<String, dynamic>?;
      _loadingChart = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final net = kNetworks[wp.network]!;

    final token = _isNative ? null : wp.tokens.firstWhere(
      (t) => t.address.toLowerCase() == widget.tokenId.toLowerCase(),
      orElse: () => wp.tokens.first);
    final sym = _isNative ? net.symbol : (token?.symbol ?? '?');
    final symUp = sym.toUpperCase();
    final priceInfo = wp.prices[symUp];
    final ccLogo = !_isNative ? (priceInfo?.imageUrl ?? token?.logo) : null;
    final balKey = _isNative ? 'native' : widget.tokenId.toLowerCase();
    final rawBal = wp.balances[balKey] ?? 0.0;
    final tokenVaults = wp.vaults.where((v) =>
      v.isLocked && (_isNative ? v.tokenAddress == 'native'
        : v.tokenAddress.toLowerCase() == widget.tokenId.toLowerCase())).toList();
    final locked = tokenVaults.fold(0.0, (s, v) => s + v.amount);
    final available = (rawBal - locked).clamp(0.0, double.infinity);
    final isUp = priceInfo?.isUp ?? true;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverToBoxAdapter(child: Container(
            decoration: const BoxDecoration(gradient: kHeaderGradient),
            child: SafeArea(bottom: false, child: Column(children: [
              // Top bar
              Padding(padding: const EdgeInsets.fromLTRB(4, 8, 16, 0),
                child: Row(children: [
                  IconButton(onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20)),
                  TokenAvatar(logo: ccLogo, symbol: symUp, size: 36),
                  const SizedBox(width: 10),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(symUp, style: const TextStyle(color: Colors.white,
                      fontSize: 17, fontWeight: FontWeight.w700)),
                    if (token != null) Text(token.name,
                      style: const TextStyle(color: Colors.white54, fontSize: 11)),
                  ]),
                  const Spacer(),
                  if (!_isNative) IconButton(
                    onPressed: () { if (confirm('Remove $symUp?')) {} },
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.white54, size: 20)),
                ])),
              // Price
              Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(priceInfo != null ? PriceService.fmtUsd(priceInfo.price) : '—',
                      style: const TextStyle(color: Colors.white,
                        fontSize: 30, fontWeight: FontWeight.w800)),
                    Row(children: [
                      if (priceInfo != null) ...[
                        Icon(isUp ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                          color: isUp ? AppColors.success : AppColors.error, size: 14),
                        const SizedBox(width: 4),
                        Text(PriceService.fmtPct(priceInfo.change24h),
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                            color: isUp ? AppColors.success : AppColors.error)),
                      ],
                    ]),
                  ])),
                ])),
              // Balance strip
              Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                child: Row(children: [
                  _balTile('Available', available, symUp, priceInfo),
                  Container(width: 1, height: 36, color: Colors.white12, margin: const EdgeInsets.symmetric(horizontal: 16)),
                  if (locked > 0) ...[
                    _balTile('Locked', locked, symUp, priceInfo, color: AppColors.cyan),
                    Container(width: 1, height: 36, color: Colors.white12, margin: const EdgeInsets.symmetric(horizontal: 16)),
                  ],
                  _balTile('Total', rawBal, symUp, priceInfo),
                ])),
              // Action buttons
              Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  ActionBtn(icon: Icons.send_rounded, label: 'Send',
                    onTap: () => Navigator.push(context, MaterialPageRoute(
                      builder: (_) => SendScreen(defaultTokenAddr: widget.tokenId)))),
                  ActionBtn(icon: Icons.qr_code_rounded, label: 'Receive',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReceiveScreen()))),
                  ActionBtn(icon: Icons.swap_horiz_rounded, label: 'Swap',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SwapScreen()))),
                  ActionBtn(icon: Icons.lock_rounded, label: 'Vault',
                    onTap: () { _tabs.animateTo(1); setState(() => _showVaultCreate = true); },
                    highlight: true),
                ])),
            ])),
          )),
          // Tab bar
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabBarDelegate(
              TabBar(
                controller: _tabs, labelColor: AppColors.brand500,
                unselectedLabelColor: Colors.grey,
                indicatorColor: AppColors.brand500,
                tabs: [
                  const Tab(text: 'Overview'),
                  Tab(text: tokenVaults.isEmpty ? 'Vault' : 'Vault (${tokenVaults.length})'),
                ],
              ),
              isDark ? AppColors.navy800 : Colors.white,
            ),
          ),
        ],
        body: TabBarView(controller: _tabs, children: [
          _overviewTab(context, wp, sym, symUp, priceInfo, isDark),
          _vaultTab(context, wp, sym, symUp, available, tokenVaults, priceInfo, isDark),
        ]),
      ),
    );
  }

  Widget _balTile(String label, double amount, String sym, PriceModel? p, {Color? color}) =>
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(color: color ?? Colors.white54, fontSize: 10)),
      const SizedBox(height: 2),
      Text('${amount.toStringAsFixed(4)} $sym',
        style: TextStyle(color: color ?? Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
      Text(PriceService.fmtUsd(amount * (p?.price ?? 0)),
        style: TextStyle(color: (color ?? Colors.white).withOpacity(0.5), fontSize: 10)),
    ]));

  // ── Overview: chart + metadata ────────────────────────────────────
  Widget _overviewTab(BuildContext context, WalletProvider wp,
    String sym, String symUp, PriceModel? p, bool isDark) {
    return SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Period selector
      Row(children: ['1d','7d','30d','90d'].map((period) => Padding(
        padding: const EdgeInsets.only(right: 6),
        child: GestureDetector(
          onTap: () { setState(() => _period = period); _loadChart(); },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _period == period ? AppColors.brand500
                : (isDark ? AppColors.darkInput : AppColors.lightInput),
              borderRadius: BorderRadius.circular(10)),
            child: Text(period, style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w600,
              color: _period == period ? Colors.white : Colors.grey)),
          ),
        ),
      )).toList()),
      const SizedBox(height: 12),
      // Chart
      Container(height: 180, child: _loadingChart
        ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
        : _chart.isEmpty
        ? const Center(child: Text('No chart data', style: TextStyle(color: Colors.grey)))
        : LineChart(LineChartData(
            gridData: FlGridData(show: false),
            titlesData: FlTitlesData(
              bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 22,
                getTitlesWidget: (v, _) {
                  final idx = v.toInt();
                  if (idx < 0 || idx >= _chart.length) return const SizedBox();
                  return Text(DateFormat('M/d').format(_chart[idx].time),
                    style: const TextStyle(fontSize: 9, color: Colors.grey));
                })),
              leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 52,
                getTitlesWidget: (v, _) => Text(PriceService.fmtUsd(v),
                  style: const TextStyle(fontSize: 9, color: Colors.grey)))),
              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            borderData: FlBorderData(show: false),
            lineBarsData: [LineChartBarData(
              spots: _chart.asMap().entries.map((e) =>
                FlSpot(e.key.toDouble(), e.value.close)).toList(),
              isCurved: true, color: (p?.isUp ?? true) ? AppColors.success : AppColors.error,
              barWidth: 2, dotData: FlDotData(show: false),
              belowBarData: BarAreaData(show: true,
                gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
                  colors: [(p?.isUp ?? true) ? AppColors.success.withOpacity(0.2)
                    : AppColors.error.withOpacity(0.2), Colors.transparent])),
            )],
          ))),
      const SizedBox(height: 16),
      // Price stats
      if (p != null) ...[
        const SectionLabel('PRICE STATS'),
        const SizedBox(height: 8),
        GridView.count(crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(), childAspectRatio: 2.5,
          mainAxisSpacing: 6, crossAxisSpacing: 6,
          children: [
            StatItem(label: '24h High', value: PriceService.fmtUsd(p.high24h)),
            StatItem(label: '24h Low',  value: PriceService.fmtUsd(p.low24h)),
            StatItem(label: '24h Volume', value: PriceService.fmtUsd(p.volume24h)),
            StatItem(label: 'Market Cap', value: PriceService.fmtUsd(p.marketCap)),
          ]),
        const SizedBox(height: 16),
      ],
      // DEX metadata
      if (_dexData != null) ...[
        Row(children: [
          const SectionLabel('DEX DATA'),
          const SizedBox(width: 8),
          AppBadge(label: _dexData!['dexId'] ?? 'DEX', color: AppColors.brand500),
        ]),
        const SizedBox(height: 8),
        GridView.count(crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(), childAspectRatio: 2.5,
          mainAxisSpacing: 6, crossAxisSpacing: 6,
          children: [
            StatItem(label: '24h Change',
              value: PriceService.fmtPct(_dexData!['priceChange24h']?.toDouble()),
              valueColor: (_dexData!['priceChange24h'] ?? 0) >= 0 ? AppColors.success : AppColors.error),
            StatItem(label: '24h Volume', value: PriceService.fmtUsd(_dexData!['volume24h']?.toDouble())),
            StatItem(label: 'Liquidity', value: PriceService.fmtUsd(_dexData!['liquidity']?.toDouble())),
            StatItem(label: 'Market Cap', value: PriceService.fmtUsd(_dexData!['marketCap']?.toDouble())),
            StatItem(label: '24h Buys', value: '${_dexData!['buys24h'] ?? '—'}'),
            StatItem(label: '24h Sells', value: '${_dexData!['sells24h'] ?? '—'}'),
          ]),
        if (_dexData!['url'] != null) Padding(
          padding: const EdgeInsets.only(top: 8),
          child: GestureDetector(
            onTap: () => launchUrl(Uri.parse(_dexData!['url'])),
            child: Row(children: const [
              Text('View on DexScreener', style: TextStyle(color: AppColors.brand500, fontSize: 13)),
              SizedBox(width: 4),
              Icon(Icons.open_in_new_rounded, size: 14, color: AppColors.brand500),
            ]),
          ),
        ),
        const SizedBox(height: 16),
      ],
      // Token info
      if (!_isNative) ...[
        const SectionLabel('TOKEN INFO'),
        const SizedBox(height: 8),
        InnerCard(child: Column(children: [
          _infoRow('Contract', wp.tokens.firstWhere(
            (t) => t.address.toLowerCase() == widget.tokenId.toLowerCase(),
            orElse: () => wp.tokens.first).address.substring(0, 14) + '...'),
          const Divider(height: 1),
          _infoRow('Network', wp.network.toUpperCase()),
          const Divider(height: 1),
          _infoRow('Decimals', (wp.tokens.firstWhere(
            (t) => t.address.toLowerCase() == widget.tokenId.toLowerCase(),
            orElse: () => wp.tokens.first).decimals).toString()),
        ])),
      ],
      const SizedBox(height: 80),
    ]));
  }

  Widget _infoRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
    child: Row(children: [
      Expanded(child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13,
        fontFamily: 'monospace')),
    ]),
  );

  // ── Vault tab ─────────────────────────────────────────────────────
  Widget _vaultTab(BuildContext context, WalletProvider wp,
    String sym, String symUp, double available,
    List<VaultModel> vaults, PriceModel? p, bool isDark) {
    return SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
      // Create vault button
      GestureDetector(
        onTap: () => setState(() => _showVaultCreate = !_showVaultCreate),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.brand200, width: 1.5, style: BorderStyle.solid),
            borderRadius: BorderRadius.circular(16),
            color: AppColors.brand50),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.lock_rounded, color: AppColors.brand500, size: 18),
            const SizedBox(width: 8),
            Text('Create Vault for $symUp',
              style: const TextStyle(color: AppColors.brand600, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
      if (_showVaultCreate) ...[
        const SizedBox(height: 16),
        _createVaultForm(context, wp, sym, symUp, available, p, isDark),
      ],
      if (vaults.isEmpty && !_showVaultCreate) ...[
        const SizedBox(height: 40),
        const Icon(Icons.lock_open_rounded, size: 52, color: Colors.grey),
        const SizedBox(height: 12),
        const Text('No active vaults', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        const Text('Lock tokens to save with discipline.\nMinimum lock: 1 month  ·  10% early break fee',
          style: TextStyle(color: Colors.grey, fontSize: 12), textAlign: TextAlign.center),
      ],
      ...vaults.map((v) => Padding(
        padding: const EdgeInsets.only(top: 12),
        child: _vaultCard(context, v, p, isDark),
      )),
      const SizedBox(height: 80),
    ]));
  }

  Widget _createVaultForm(BuildContext context, WalletProvider wp,
    String sym, String symUp, double available, PriceModel? p, bool isDark) {
    final presets = [1, 3, 6, 12];
    return AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.brand50, borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.brand100)),
        child: Row(children: const [
          Icon(Icons.shield_outlined, color: AppColors.brand500, size: 16),
          SizedBox(width: 8),
          Expanded(child: Text(
            'Tokens are locked on-chain via smart contract. 10% penalty for early break.',
            style: TextStyle(fontSize: 12, color: AppColors.brand700))),
        ]),
      ),
      const SizedBox(height: 14),
      Row(children: [
        const Expanded(child: Text('Amount', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
        GestureDetector(
          onTap: () => setState(() => _vaultAmtCtrl.text = available.toStringAsFixed(6)),
          child: Text('Max: ${available.toStringAsFixed(4)} $symUp',
            style: const TextStyle(fontSize: 12, color: AppColors.brand500, fontWeight: FontWeight.w600))),
      ]),
      const SizedBox(height: 8),
      TextField(controller: _vaultAmtCtrl, keyboardType: TextInputType.number,
        decoration: InputDecoration(hintText: '0.00', suffixText: symUp),
        onChanged: (_) => setState(() {})),
      const SizedBox(height: 14),
      const Text('Lock Period', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
      const SizedBox(height: 8),
      Row(children: presets.map((m) => Expanded(child: Padding(
        padding: const EdgeInsets.only(right: 6),
        child: GestureDetector(
          onTap: () => setState(() => _lockMonths = m),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: _lockMonths == m ? AppColors.brand500
                : (isDark ? AppColors.darkInput : AppColors.lightInput),
              borderRadius: BorderRadius.circular(12)),
            child: Text('${m}mo', textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                color: _lockMonths == m ? Colors.white : Colors.grey)),
          ),
        ),
      ))).toList()),
      const SizedBox(height: 8),
      SliderTheme(
        data: SliderTheme.of(context).copyWith(
          activeTrackColor: AppColors.brand500,
          thumbColor: AppColors.brand500,
          inactiveTrackColor: isDark ? AppColors.darkInput : AppColors.lightInput),
        child: Slider(value: _lockMonths.toDouble(), min: 1, max: 60,
          divisions: 59, onChanged: (v) => setState(() => _lockMonths = v.round())),
      ),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('1 month', style: TextStyle(fontSize: 11, color: Colors.grey)),
        Text('$_lockMonths month${_lockMonths != 1 ? 's' : ''}',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.brand500)),
      ]),
      const SizedBox(height: 12),
      TextField(controller: _vaultNoteCtrl,
        decoration: const InputDecoration(hintText: 'Vault note (optional)')),
      const SizedBox(height: 16),
      PrimaryBtn(
        label: 'Confirm & Lock On-Chain',
        icon: Icons.lock_rounded, loading: _lockingVault,
        onTap: _lockVault,
      ),
    ]));
  }

  Future<void> _lockVault() async {
    final wp = context.read<WalletProvider>();
    final amt = double.tryParse(_vaultAmtCtrl.text);
    if (amt == null || amt <= 0) { Fluttertoast.showToast(msg: 'Enter valid amount'); return; }
    final token = _isNative ? null : wp.tokens.firstWhere(
      (t) => t.address.toLowerCase() == widget.tokenId.toLowerCase(),
      orElse: () => wp.tokens.first);
    if (_isNative) { Fluttertoast.showToast(msg: 'Only ERC-20/BEP-20 tokens can be vaulted'); return; }
    setState(() => _lockingVault = true);
    try {
      await wp.lockVault(
        tokenAddress: token!.address, tokenSymbol: token.symbol,
        tokenDecimals: token.decimals, amount: amt,
        lockMonths: _lockMonths, note: _vaultNoteCtrl.text);
      setState(() { _showVaultCreate = false; _vaultAmtCtrl.clear(); _vaultNoteCtrl.clear(); });
      Fluttertoast.showToast(msg: '🔒 Locked on-chain!');
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString().replaceAll('Exception: ', ''));
    }
    setState(() => _lockingVault = false);
  }

  Widget _vaultCard(BuildContext context, VaultModel v, PriceModel? p, bool isDark) {
    final isReady = v.isMatured;
    final accentColor = isReady ? AppColors.success : AppColors.cyan;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkInput : AppColors.lightInput,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accentColor.withOpacity(0.3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.lock_rounded, color: accentColor, size: 16),
          const SizedBox(width: 8),
          Text('${v.amount.toStringAsFixed(4)} ${v.tokenSymbol}',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(width: 6),
          Text(PriceService.fmtUsd(v.amount * (p?.price ?? 0)),
            style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const Spacer(),
          AppBadge(label: isReady ? 'Ready' : v.timeLeftLabel, color: accentColor),
        ]),
        if (v.note?.isNotEmpty ?? false) Padding(
          padding: const EdgeInsets.only(top: 4, left: 24),
          child: Text(v.note!, style: const TextStyle(fontSize: 12, color: Colors.grey))),
        const SizedBox(height: 10),
        // Progress bar
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(v.createdAt != null ? DateFormat('MMM d').format(v.createdAt!) : '',
              style: const TextStyle(fontSize: 10, color: Colors.grey)),
            Text(v.unlockDateLabel, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ]),
          const SizedBox(height: 4),
          ClipRRect(borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: v.progress, minHeight: 6,
              backgroundColor: isDark ? AppColors.navy900 : AppColors.lightBorder,
              valueColor: AlwaysStoppedAnimation(accentColor))),
        ]),
        const SizedBox(height: 10),
        if (v.lockMonths != null)
          Text('${v.lockMonths} month lock · Created ${v.createdAt != null ? DateFormat('MMM d, yyyy').format(v.createdAt!) : '—'}',
            style: const TextStyle(fontSize: 11, color: Colors.grey)),
        const SizedBox(height: 10),
        SizedBox(width: double.infinity,
          child: isReady
            ? OutlinedButton.icon(
                onPressed: () => _doWithdraw(context, v),
                icon: const Icon(Icons.lock_open_rounded, size: 16),
                label: const Text('Unlock Vault'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.success,
                  side: const BorderSide(color: AppColors.success)))
            : OutlinedButton.icon(
                onPressed: () => _confirmBreak(context, v, p),
                icon: const Icon(Icons.lock_clock_rounded, size: 16),
                label: const Text('Break Early (10% fee)'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error))),
        ),
      ]),
    );
  }

  void _doWithdraw(BuildContext context, VaultModel v) async {
    final wp = context.read<WalletProvider>();
    try {
      await wp.withdrawVault(v.lockId);
      Fluttertoast.showToast(msg: '✅ Tokens withdrawn!');
    } catch (e) { Fluttertoast.showToast(msg: e.toString()); }
  }

  void _confirmBreak(BuildContext context, VaultModel v, PriceModel? p) {
    final fee = v.amount * 0.1;
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Break Vault Early?'),
      content: Text(
        'You will receive ${(v.amount - fee).toStringAsFixed(4)} ${v.tokenSymbol}\n'
        'after the 10% penalty fee (${fee.toStringAsFixed(4)} ${v.tokenSymbol}).'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        TextButton(
          onPressed: () async {
            Navigator.pop(ctx);
            try {
              await context.read<WalletProvider>().breakVault(v.lockId);
              Fluttertoast.showToast(msg: 'Vault broken. Fee deducted.');
            } catch (e) { Fluttertoast.showToast(msg: e.toString()); }
          },
          child: const Text('Break', style: TextStyle(color: Colors.red))),
      ],
    ));
  }

  bool confirm(String msg) { return true; }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color bg;
  const _TabBarDelegate(this.tabBar, this.bg);
  @override double get minExtent => tabBar.preferredSize.height;
  @override double get maxExtent => tabBar.preferredSize.height;
  @override Widget build(_, __, ___) => Container(color: bg, child: tabBar);
  @override bool shouldRebuild(_) => false;
}
