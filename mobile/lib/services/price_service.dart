import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/price_model.dart';

class PriceService {
  static const _ccBase = 'https://min-api.cryptocompare.com/data';

  // ── Live multi-price from CryptoCompare ─────────────────────────
  Future<Map<String, PriceModel>> getPrices(List<String> symbols) async {
    if (symbols.isEmpty) return {};
    try {
      final syms = symbols.toSet().join(',');
      final res = await http.get(Uri.parse(
        '$_ccBase/pricemultifull?fsyms=$syms&tsyms=USD'));
      final body = jsonDecode(res.body);
      final raw  = body['RAW'] as Map<String, dynamic>? ?? {};
      final result = <String, PriceModel>{};
      for (final entry in raw.entries) {
        final usd = (entry.value as Map<String, dynamic>)['USD'];
        if (usd != null) {
          result[entry.key.toUpperCase()] =
            PriceModel.fromCC(usd as Map<String, dynamic>);
        }
      }
      return result;
    } catch (_) { return {}; }
  }

  // ── Token logo from CryptoCompare ────────────────────────────────
  Future<String?> getTokenLogo(String symbol) async {
    try {
      final res = await http.get(Uri.parse(
        '$_ccBase/coin/generalinfo?fsyms=${symbol.toUpperCase()}&tsym=USD'));
      final body = jsonDecode(res.body);
      final img = (body['Data']?[0]?['CoinInfo']?['ImageUrl']) as String?;
      return img != null ? 'https://www.cryptocompare.com$img' : null;
    } catch (_) { return null; }
  }

  // ── OHLCV for chart ───────────────────────────────────────────────
  Future<List<OhlcPoint>> getOhlcv(String symbol, {int limit = 168}) async {
    try {
      final res = await http.get(Uri.parse(
        '$_ccBase/v2/histohour?fsym=${symbol.toUpperCase()}&tsym=USD&limit=$limit'));
      final body = jsonDecode(res.body);
      final data = body['Data']?['Data'] as List? ?? [];
      return data.map((d) => OhlcPoint(
        time: DateTime.fromMillisecondsSinceEpoch((d['time'] as int) * 1000),
        open: (d['open'] ?? 0).toDouble(),
        high: (d['high'] ?? 0).toDouble(),
        low: (d['low'] ?? 0).toDouble(),
        close: (d['close'] ?? 0).toDouble(),
      )).toList();
    } catch (_) { return []; }
  }

  // ── DexScreener metadata ──────────────────────────────────────────
  Future<Map<String, dynamic>?> getDexData(String tokenAddr, String network) async {
    final chain = network == 'ethereum' ? 'ethereum' : 'bsc';
    try {
      final res = await http.get(Uri.parse(
        'https://api.dexscreener.com/latest/dex/tokens/$tokenAddr'));
      final body = jsonDecode(res.body);
      final pairs = (body['pairs'] as List? ?? [])
        .where((p) => p['chainId'] == chain)
        .toList()
        ..sort((a, b) =>
          ((b['volume']?['h24'] ?? 0) as num).compareTo((a['volume']?['h24'] ?? 0) as num));
      if (pairs.isEmpty) return null;
      final top = pairs.first;
      return {
        'priceUsd': top['priceUsd'],
        'priceChange24h': top['priceChange']?['h24'],
        'priceChange1h': top['priceChange']?['h1'],
        'volume24h': top['volume']?['h24'],
        'liquidity': top['liquidity']?['usd'],
        'marketCap': top['fdv'],
        'buys24h': top['txns']?['h24']?['buys'],
        'sells24h': top['txns']?['h24']?['sells'],
        'dexId': top['dexId'],
        'url': top['url'],
      };
    } catch (_) { return null; }
  }

  // ── CoinGecko contract lookup ─────────────────────────────────────
  Future<Map<String, dynamic>?> getCGTokenInfo(String addr, String network) async {
    final platform = network == 'ethereum' ? 'ethereum' : 'binance-smart-chain';
    try {
      final res = await http.get(Uri.parse(
        'https://api.coingecko.com/api/v3/coins/$platform/contract/${addr.toLowerCase()}'));
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body);
      return {'id': body['id'], 'image': body['image']?['small']};
    } catch (_) { return null; }
  }

  // ── Format helpers ────────────────────────────────────────────────
  static String fmtUsd(double? v, {bool compact = true}) {
    if (v == null) return 'N/A';
    if (compact) {
      if (v >= 1e12) return '\$${(v / 1e12).toStringAsFixed(2)}T';
      if (v >= 1e9)  return '\$${(v / 1e9).toStringAsFixed(2)}B';
      if (v >= 1e6)  return '\$${(v / 1e6).toStringAsFixed(2)}M';
      if (v >= 1e3)  return '\$${(v / 1e3).toStringAsFixed(2)}K';
      return '\$${v.toStringAsFixed(4)}';
    }
    return '\$${v.toStringAsFixed(2)}';
  }

  static String fmtPct(double? v) {
    if (v == null) return 'N/A';
    return '${v >= 0 ? '+' : ''}${v.toStringAsFixed(2)}%';
  }
}
