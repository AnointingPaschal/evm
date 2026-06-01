class WalletModel {
  final String id;
  final String name;
  final String address;
  final String encryptedData;
  final String network;
  final DateTime createdAt;
  final bool imported;

  const WalletModel({
    required this.id, required this.name, required this.address,
    required this.encryptedData, required this.network,
    required this.createdAt, this.imported = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id, 'name': name, 'address': address,
    'encryptedData': encryptedData, 'network': network,
    'createdAt': createdAt.toIso8601String(), 'imported': imported,
  };

  factory WalletModel.fromJson(Map<String, dynamic> j) => WalletModel(
    id: j['id'], name: j['name'], address: j['address'],
    encryptedData: j['encryptedData'], network: j['network'] ?? 'bsc',
    createdAt: DateTime.parse(j['createdAt']),
    imported: j['imported'] ?? false,
  );

  WalletModel copyWith({String? name, String? network}) => WalletModel(
    id: id, name: name ?? this.name, address: address,
    encryptedData: encryptedData, network: network ?? this.network,
    createdAt: createdAt, imported: imported,
  );
}
