import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppColors {
  static const brand50  = Color(0xFFEFF6FF);
  static const brand100 = Color(0xFFDBEAFE);
  static const brand400 = Color(0xFF60A5FA);
  static const brand500 = Color(0xFF3B82F6);
  static const brand600 = Color(0xFF2563EB);
  static const navy950  = Color(0xFF050D1A);
  static const navy900  = Color(0xFF0A1628);
  static const navy800  = Color(0xFF0F1F3D);
  static const navy700  = Color(0xFF162447);
  static const navy600  = Color(0xFF1E3A5F);
  static const success  = Color(0xFF10B981);
  static const warning  = Color(0xFFF59E0B);
  static const error    = Color(0xFFEF4444);
  static const cyan     = Color(0xFF06B6D4);
  static const lightBg     = Color(0xFFF0F4FF);
  static const lightCard   = Color(0xFFFFFFFF);
  static const lightBorder = Color(0xFFE2E8F0);
  static const lightInput  = Color(0xFFF1F5F9);
  static const darkCard    = Color(0xFF0F1F3D);
  static const darkBorder  = Color(0x1AFFFFFF);
  static const darkInput   = Color(0xFF0A1628);
}

const kHeaderGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [AppColors.navy900, AppColors.navy700, AppColors.navy600],
);

ThemeData lightTheme() => ThemeData(
  useMaterial3: true, brightness: Brightness.light,
  colorScheme: const ColorScheme.light(
    primary: AppColors.brand500, secondary: AppColors.brand400,
    surface: AppColors.lightCard, error: AppColors.error, onPrimary: Colors.white,
  ),
  scaffoldBackgroundColor: AppColors.lightBg,
  appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, elevation: 0,
    systemOverlayStyle: SystemUiOverlayStyle.light),
  cardTheme: CardTheme(color: AppColors.lightCard, elevation: 0,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24),
      side: const BorderSide(color: AppColors.lightBorder))),
  inputDecorationTheme: _inputTheme(AppColors.lightInput),
  elevatedButtonTheme: _btnTheme(),
  dividerTheme: const DividerThemeData(color: AppColors.lightBorder, thickness: 1, space: 0),
);

ThemeData darkTheme() => ThemeData(
  useMaterial3: true, brightness: Brightness.dark,
  colorScheme: const ColorScheme.dark(
    primary: AppColors.brand500, secondary: AppColors.brand400,
    surface: AppColors.darkCard, error: AppColors.error, onPrimary: Colors.white,
  ),
  scaffoldBackgroundColor: AppColors.navy950,
  appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, elevation: 0,
    systemOverlayStyle: SystemUiOverlayStyle.light),
  cardTheme: CardTheme(color: AppColors.darkCard, elevation: 0,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24),
      side: const BorderSide(color: AppColors.darkBorder))),
  inputDecorationTheme: _inputTheme(AppColors.darkInput),
  elevatedButtonTheme: _btnTheme(),
  dividerTheme: const DividerThemeData(color: AppColors.darkBorder, thickness: 1, space: 0),
);

InputDecorationTheme _inputTheme(Color fill) => InputDecorationTheme(
  filled: true, fillColor: fill,
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16),
    borderSide: const BorderSide(color: AppColors.brand500, width: 1.5)),
  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
);

ElevatedButtonThemeData _btnTheme() => ElevatedButtonThemeData(
  style: ElevatedButton.styleFrom(
    backgroundColor: AppColors.brand500, foregroundColor: Colors.white, elevation: 0,
    minimumSize: const Size(double.infinity, 52),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
  ),
);
