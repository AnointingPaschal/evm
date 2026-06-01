import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'providers/wallet_provider.dart';
import 'providers/theme_provider.dart';
import 'services/storage_service.dart';
import 'services/wallet_service.dart';
import 'services/chain_service.dart';
import 'services/price_service.dart';
import 'services/vault_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp, DeviceOrientation.portraitDown,
  ]);

  final store = StorageService();
  await store.init();

  final themeProv = ThemeProvider();
  await themeProv.init();

  final chainSvc  = ChainService();
  final priceSvc  = PriceService();
  final walletSvc = WalletService();
  final vaultSvc  = VaultService('https://bsc-rpc.publicnode.com');

  final walletProv = WalletProvider(store, walletSvc, chainSvc, priceSvc, vaultSvc);
  await walletProv.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: themeProv),
        ChangeNotifierProvider.value(value: walletProv),
      ],
      child: const GatenetApp(),
    ),
  );
}
