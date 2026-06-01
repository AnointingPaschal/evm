import 'package:intl/intl.dart';

enum VaultStatus { locked, matured, withdrawn }

class VaultModel {
  final int lockId;
  final String tokenAddress;
  final String tokenSymbol;
  final int tokenDecimals;
  final BigInt rawAmount;
  final DateTime unlockAt;
  final bool withdrawn;
  final VaultStatus status;
  final int? lockMonths;
  final String? note;
  final DateTime? createdAt;

  const VaultModel({
    required this.lockId, required this.tokenAddress, required this.tokenSymbol,
    required this.tokenDecimals, required this.rawAmount, required this.unlockAt,
    required this.withdrawn, required this.status,
    this.lockMonths, this.note, this.createdAt,
  });

  double get amount {
    final d = BigInt.from(10).pow(tokenDecimals);
    return rawAmount / d;
  }

  bool get isLocked => status == VaultStatus.locked;
  bool get isMatured => status == VaultStatus.matured;
  bool get isEarlyBreak => isLocked;

  Duration get timeLeft => unlockAt.difference(DateTime.now());

  String get timeLeftLabel {
    final d = timeLeft;
    if (d.isNegative) return 'Unlocked';
    final days = d.inDays;
    if (days > 30) return '${(days / 30).floor()}mo ${days % 30}d left';
    if (days > 0) return '${days}d ${d.inHours % 24}h left';
    return '${d.inHours}h left';
  }

  double get progress {
    if (createdAt == null) return 0.5;
    final total = unlockAt.difference(createdAt!).inSeconds;
    final elapsed = DateTime.now().difference(createdAt!).inSeconds;
    return (elapsed / total).clamp(0.0, 1.0);
  }

  String get unlockDateLabel =>
    DateFormat('MMM d, yyyy').format(unlockAt);
}
