class PriceModel {
  final double price;
  final double change24h;
  final double change1h;
  final double high24h;
  final double low24h;
  final double volume24h;
  final double marketCap;
  final String? imageUrl;

  const PriceModel({
    required this.price, required this.change24h, required this.change1h,
    required this.high24h, required this.low24h, required this.volume24h,
    required this.marketCap, this.imageUrl,
  });

  bool get isUp => change24h >= 0;

  factory PriceModel.fromCC(Map<String, dynamic> raw) => PriceModel(
    price: (raw['PRICE'] ?? 0).toDouble(),
    change24h: (raw['CHANGEPCT24HOUR'] ?? 0).toDouble(),
    change1h: (raw['CHANGEPCTHOUR'] ?? 0).toDouble(),
    high24h: (raw['HIGH24HOUR'] ?? 0).toDouble(),
    low24h: (raw['LOW24HOUR'] ?? 0).toDouble(),
    volume24h: (raw['VOLUME24HOURTO'] ?? 0).toDouble(),
    marketCap: (raw['MKTCAP'] ?? 0).toDouble(),
    imageUrl: raw['IMAGEURL'] != null
      ? 'https://www.cryptocompare.com${raw['IMAGEURL']}' : null,
  );
}

class OhlcPoint {
  final DateTime time;
  final double open, high, low, close;
  const OhlcPoint({required this.time, required this.open, required this.high, required this.low, required this.close});
}
