class TokenModel {
  final String address;
  final String name;
  final String symbol;
  final int decimals;
  final String network;
  final String? logo;
  final String? coingeckoId;
  final DateTime addedAt;

  const TokenModel({
    required this.address, required this.name, required this.symbol,
    required this.decimals, required this.network,
    this.logo, this.coingeckoId, required this.addedAt,
  });

  bool get isNative => address == 'native';

  Map<String, dynamic> toJson() => {
    'address': address, 'name': name, 'symbol': symbol,
    'decimals': decimals, 'network': network, 'logo': logo,
    'coingeckoId': coingeckoId, 'addedAt': addedAt.toIso8601String(),
  };

  factory TokenModel.fromJson(Map<String, dynamic> j) => TokenModel(
    address: j['address'], name: j['name'], symbol: j['symbol'],
    decimals: j['decimals'] ?? 18, network: j['network'] ?? 'bsc',
    logo: j['logo'], coingeckoId: j['coingeckoId'],
    addedAt: DateTime.tryParse(j['addedAt'] ?? '') ?? DateTime.now(),
  );
}
