import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/wallet_provider.dart';
import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';
import 'screens/onboarding/welcome_screen.dart';
import 'screens/lock/lock_screen.dart';
import 'screens/home/main_scaffold.dart';
import 'screens/admin/admin_screen.dart';

class GatenetApp extends StatelessWidget {
  const GatenetApp({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();
    return MaterialApp(
      title: 'Gatenet Wallet',
      debugShowCheckedModeBanner: false,
      themeMode: theme.mode,
      theme: lightTheme(),
      darkTheme: darkTheme(),
      routes: {'/admin': (_) => const AdminScreen()},
      home: const AppRoot(),
    );
  }
}

class AppRoot extends StatelessWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context) {
    final wp = context.watch<WalletProvider>();
    if (!wp.hasWallet) return const WelcomeScreen();
    if (wp.isLocked)   return const LockScreen();
    return const MainScaffold();
  }
}
