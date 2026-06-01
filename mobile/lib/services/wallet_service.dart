import 'dart:convert';
import 'dart:typed_data';
import 'package:bip39/bip39.dart' as bip39;
import 'package:bip32/bip32.dart' as bip32;
import 'package:hex/hex.dart';
import 'package:web3dart/web3dart.dart';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;

class WalletData {
  final String address;
  final String privateKey;
  final String? mnemonic;
  WalletData({required this.address, required this.privateKey, this.mnemonic});
}

class WalletService {
  static const _derivationPath = "m/44'/60'/0'/0/0";

  // ── Generate new HD wallet ──────────────────────────────────────
  WalletData createWallet() {
    final mnemonic = bip39.generateMnemonic();
    return _fromMnemonic(mnemonic);
  }

  // ── Import from mnemonic ────────────────────────────────────────
  WalletData importFromMnemonic(String mnemonic) {
    if (!bip39.validateMnemonic(mnemonic.trim())) {
      throw Exception('Invalid mnemonic phrase');
    }
    return _fromMnemonic(mnemonic.trim());
  }

  // ── Import from private key ─────────────────────────────────────
  WalletData importFromPrivateKey(String privateKey) {
    try {
      final pk = privateKey.trim().replaceFirst('0x', '');
      final credentials = EthPrivateKey.fromHex(pk);
      return WalletData(
        address: credentials.address.hexEip55,
        privateKey: '0x$pk',
      );
    } catch (_) {
      throw Exception('Invalid private key');
    }
  }

  WalletData _fromMnemonic(String mnemonic) {
    final seed = bip39.mnemonicToSeedHex(mnemonic);
    final seedBytes = Uint8List.fromList(HEX.decode(seed));
    final root = bip32.BIP32.fromSeed(seedBytes);

    // Derive m/44'/60'/0'/0/0
    final node = root.derivePath(_derivationPath);
    final privateKeyHex = HEX.encode(node.privateKey!);
    final credentials = EthPrivateKey.fromHex(privateKeyHex);

    return WalletData(
      address: credentials.address.hexEip55,
      privateKey: '0x$privateKeyHex',
      mnemonic: mnemonic,
    );
  }

  // ── Encryption ──────────────────────────────────────────────────
  String encryptWalletData(Map<String, dynamic> data, String password) {
    final keyBytes = sha256.convert(utf8.encode(password)).bytes;
    final key = enc.Key(Uint8List.fromList(keyBytes));
    final iv  = enc.IV.fromSecureRandom(16);
    final encrypter = enc.Encrypter(enc.AES(key));
    final encrypted = encrypter.encrypt(jsonEncode(data), iv: iv);
    // Store as base64(iv) + ':' + base64(ciphertext)
    return '${iv.base64}:${encrypted.base64}';
  }

  Map<String, dynamic> decryptWalletData(String encrypted, String password) {
    try {
      final parts = encrypted.split(':');
      if (parts.length < 2) throw Exception('Bad format');
      final keyBytes = sha256.convert(utf8.encode(password)).bytes;
      final key = enc.Key(Uint8List.fromList(keyBytes));
      final iv  = enc.IV.fromBase64(parts[0]);
      final encrypter = enc.Encrypter(enc.AES(key));
      final decrypted = encrypter.decrypt64(parts[1], iv: iv);
      return jsonDecode(decrypted) as Map<String, dynamic>;
    } catch (_) {
      throw Exception('Invalid password');
    }
  }

  String hashPassword(String password) {
    return sha256.convert(utf8.encode(password)).toString();
  }

  bool isValidAddress(String address) {
    try {
      EthereumAddress.fromHex(address);
      return true;
    } catch (_) { return false; }
  }

  String shortAddress(String address, {int chars = 6}) {
    if (address.length < chars + 4) return address;
    return '${address.substring(0, chars)}...${address.substring(address.length - 4)}';
  }

  EthPrivateKey credentialsFromPrivateKey(String privateKey) =>
    EthPrivateKey.fromHex(privateKey.replaceFirst('0x', ''));
}
