class TxModel {
  final String hash;
  final String from;
  final String to;
  final String value;     // in native token
  final DateTime time;
  final bool isFailed;
  final String network;

  const TxModel({
    required this.hash, required this.from, required this.to,
    required this.value, required this.time, required this.isFailed,
    required this.network,
  });

  bool isSend(String myAddress) =>
    from.toLowerCase() == myAddress.toLowerCase();

  factory TxModel.fromEtherscan(Map<String, dynamic> j) {
    final wei = BigInt.tryParse(j['value'] ?? '0') ?? BigInt.zero;
    final eth = wei / BigInt.from(10).pow(18);
    return TxModel(
      hash: j['hash'] ?? '',
      from: j['from'] ?? '',
      to: j['to'] ?? '',
      value: eth.toStringAsFixed(5),
      time: DateTime.fromMillisecondsSinceEpoch(
        (int.tryParse(j['timeStamp'] ?? '0') ?? 0) * 1000),
      isFailed: j['isError'] == '1',
      network: '',
    );
  }
}
