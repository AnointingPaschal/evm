import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import '../../providers/wallet_provider.dart';
import '../../models/transaction_model.dart';
import '../../services/chain_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});
  @override State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<TxModel> _txns = [];
  bool _loading = false;
  String _filter = 'all';
  final _searchCtrl = TextEditingController();

  @override
  void initState() { super.initState(); _load(); }

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final wp = context.read<WalletProvider>();
    if (wp.active == null) { setState(() => _loading = false); return; }
    final raw = await ChainService().getTxHistory(wp.active!.address, wp.network);
    setState(() {
      _txns = raw.map((j) => TxModel.fromEtherscan(j)).toList();
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final net = kNetworks[wp.network]!;

    final q = _searchCtrl.text.toLowerCase();
    final filtered = _txns.where((tx) {
      final isSend = tx.isSend(wp.active?.address ?? '');
      if (_filter == 'sent' && !isSend) return false;
      if (_filter == 'received' && isSend) return false;
      if (q.isNotEmpty) return tx.hash.contains(q) || tx.to.contains(q) || tx.from.contains(q);
      return true;
    }).toList();

    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Row(children: [
              const Expanded(child: Text('History',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700))),
              IconButton(onPressed: _load,
                icon: _loading
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(color: Colors.white54, strokeWidth: 2))
                  : const Icon(Icons.refresh_rounded, color: Colors.white54, size: 20)),
            ]),
          )),
        ),
        Container(
          color: isDark ? AppColors.navy800 : Colors.white,
          padding: const EdgeInsets.all(12),
          child: Column(children: [
            // Filter tabs
            Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkInput : AppColors.lightInput,
                borderRadius: BorderRadius.circular(12)),
              child: Row(children: ['all', 'sent', 'received'].map((f) => Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _filter = f),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _filter == f ? (isDark ? AppColors.navy700 : Colors.white) : Colors.transparent,
                      borderRadius: BorderRadius.circular(9),
                      boxShadow: _filter == f ? [const BoxShadow(
                        color: Color(0x0D000000), blurRadius: 4)] : null),
                    child: Text(f[0].toUpperCase() + f.substring(1),
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                        color: _filter == f ? AppColors.brand500 : Colors.grey)),
                  ),
                ),
              )).toList()),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _searchCtrl,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'Search hash or address...',
                prefixIcon: Icon(Icons.search_rounded, size: 18)),
            ),
          ]),
        ),
        Expanded(child: _loading
          ? const Center(child: CircularProgressIndicator())
          : filtered.isEmpty
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.history_rounded, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              const Text('No transactions yet', style: TextStyle(color: Colors.grey)),
              Text('Transactions on ${net.name} will appear here',
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ]))
          : ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
              itemBuilder: (_, i) {
                final tx = filtered[i];
                final isSend = tx.isSend(wp.active?.address ?? '');
                return ListTile(
                  leading: Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: tx.isFailed ? AppColors.error.withOpacity(0.1)
                        : isSend ? Colors.orange.withOpacity(0.1)
                        : AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12)),
                    child: Icon(
                      tx.isFailed ? Icons.error_outline_rounded
                        : isSend ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                      color: tx.isFailed ? AppColors.error
                        : isSend ? Colors.orange : AppColors.success,
                      size: 20),
                  ),
                  title: Text(tx.isFailed ? 'Failed' : isSend ? 'Sent' : 'Received',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14,
                      color: tx.isFailed ? AppColors.error
                        : isSend ? Theme.of(context).colorScheme.onSurface : AppColors.success)),
                  subtitle: Text(
                    isSend ? 'To: ${tx.to.substring(0, 8)}...' : 'From: ${tx.from.substring(0, 8)}...',
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 11)),
                  trailing: Column(mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text('${isSend ? '-' : '+'}${tx.value}',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13,
                        color: isSend ? Theme.of(context).colorScheme.onSurface : AppColors.success)),
                    Text(DateFormat('MMM d, HH:mm').format(tx.time),
                      style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  ]),
                  onTap: () => launchUrl(Uri.parse('${net.explorerUrl}/tx/${tx.hash}')),
                );
              },
            )),
      ]),
    );
  }
}
