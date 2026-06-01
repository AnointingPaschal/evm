import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_theme.dart';

// ── Header gradient container (always dark) ────────────────────────
class HeaderBg extends StatelessWidget {
  final Widget child;
  final double? height;
  const HeaderBg({super.key, required this.child, this.height});
  @override
  Widget build(BuildContext context) => Container(
    height: height,
    decoration: const BoxDecoration(gradient: kHeaderGradient),
    child: SafeArea(bottom: false, child: child),
  );
}

// ── Round action button (Send / Receive / Swap / Vault) ────────────
class ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool highlight;
  const ActionBtn({super.key, required this.icon, required this.label,
    required this.onTap, this.highlight = false});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Column(children: [
      Container(
        width: 52, height: 52,
        decoration: BoxDecoration(
          color: highlight ? AppColors.cyan.withOpacity(0.25) : Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(icon, color: highlight ? AppColors.cyan : Colors.white, size: 22),
      ),
      const SizedBox(height: 6),
      Text(label, style: TextStyle(
        color: highlight ? AppColors.cyan.withOpacity(0.9) : Colors.white.withOpacity(0.8),
        fontSize: 11, fontWeight: FontWeight.w500)),
    ]),
  );
}

// ── Token avatar ───────────────────────────────────────────────────
class TokenAvatar extends StatelessWidget {
  final String? logo;
  final String symbol;
  final double size;
  const TokenAvatar({super.key, this.logo, required this.symbol, this.size = 44});

  Color _color() {
    const colors = [
      Color(0xFF3B82F6), Color(0xFF8B5CF6), Color(0xFF10B981),
      Color(0xFFF59E0B), Color(0xFFEF4444), Color(0xFF06B6D4), Color(0xFFEC4899),
    ];
    final idx = symbol.isEmpty ? 0 : symbol.codeUnitAt(0) % colors.length;
    return colors[idx];
  }

  @override
  Widget build(BuildContext context) {
    final c = _color();
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: c.withOpacity(0.12),
        border: Border.all(color: c.withOpacity(0.3), width: 1.5),
      ),
      child: logo != null && logo!.isNotEmpty
        ? ClipOval(child: Image.network(logo!, fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _fallback(c)))
        : _fallback(c),
    );
  }

  Widget _fallback(Color c) => Center(
    child: Text(symbol.isEmpty ? '?' : symbol[0].toUpperCase(),
      style: TextStyle(color: c, fontSize: size * 0.38, fontWeight: FontWeight.w700)));
}

// ── Copy button ────────────────────────────────────────────────────
class CopyBtn extends StatefulWidget {
  final String text;
  final double size;
  const CopyBtn({super.key, required this.text, this.size = 16});
  @override State<CopyBtn> createState() => _CopyBtnState();
}
class _CopyBtnState extends State<CopyBtn> {
  bool _copied = false;
  void _copy() async {
    await Clipboard.setData(ClipboardData(text: widget.text));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: _copy,
    child: Icon(_copied ? Icons.check_rounded : Icons.copy_rounded,
      size: widget.size,
      color: _copied ? AppColors.success : Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
  );
}

// ── Rounded card ───────────────────────────────────────────────────
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? color;
  const AppCard({super.key, required this.child, this.padding, this.color});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color ?? (isDark ? AppColors.darkCard : AppColors.lightCard),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
      ),
      child: child,
    );
  }
}

// ── Inner muted card ───────────────────────────────────────────────
class InnerCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  const InnerCard({super.key, required this.child, this.padding});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: padding ?? const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.navy900 : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
      ),
      child: child,
    );
  }
}

// ── Primary button ─────────────────────────────────────────────────
class PrimaryBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool loading;
  final IconData? icon;
  const PrimaryBtn({super.key, required this.label, this.onTap, this.loading = false, this.icon});
  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity, height: 52,
    child: ElevatedButton(
      onPressed: loading ? null : onTap,
      child: loading
        ? const SizedBox(width: 20, height: 20,
            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
        : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
            Text(label),
          ]),
    ),
  );
}

// ── Secondary / ghost button ───────────────────────────────────────
class GhostBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool danger;
  const GhostBtn({super.key, required this.label, this.onTap, this.danger = false});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fg = danger ? AppColors.error
      : (isDark ? Colors.white70 : const Color(0xFF334155));
    final bg = danger ? AppColors.error.withOpacity(0.1)
      : (isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF1F5F9));
    return SizedBox(
      width: double.infinity, height: 52,
      child: TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          backgroundColor: bg, foregroundColor: fg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      ),
    );
  }
}

// ── Badge ──────────────────────────────────────────────────────────
class AppBadge extends StatelessWidget {
  final String label;
  final Color color;
  const AppBadge({super.key, required this.label, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(
      color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.3)),
    ),
    child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
  );
}

// ── Stat item ──────────────────────────────────────────────────────
class StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const StatItem({super.key, required this.label, required this.value, this.valueColor});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.navy900 : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(
          fontSize: 11, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
          fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w600,
          color: valueColor ?? Theme.of(context).colorScheme.onSurface)),
      ]),
    );
  }
}

// ── Bottom sheet drag handle ───────────────────────────────────────
class SheetHandle extends StatelessWidget {
  const SheetHandle({super.key});
  @override
  Widget build(BuildContext context) => Center(
    child: Container(
      width: 36, height: 4,
      margin: const EdgeInsets.only(top: 10, bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.15),
        borderRadius: BorderRadius.circular(2)),
    ),
  );
}

// ── Password input field ───────────────────────────────────────────
class PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String hint;
  final TextInputAction action;
  final ValueChanged<String>? onSubmit;
  const PasswordField({super.key, required this.controller, this.hint = 'Password',
    this.action = TextInputAction.done, this.onSubmit});
  @override State<PasswordField> createState() => _PasswordFieldState();
}
class _PasswordFieldState extends State<PasswordField> {
  bool _show = false;
  @override
  Widget build(BuildContext context) => TextField(
    controller: widget.controller, obscureText: !_show,
    textInputAction: widget.action, onSubmitted: widget.onSubmit,
    decoration: InputDecoration(
      hintText: widget.hint,
      suffixIcon: IconButton(
        onPressed: () => setState(() => _show = !_show),
        icon: Icon(_show ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 20,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
      ),
    ),
  );
}

// ── Section label ──────────────────────────────────────────────────
class SectionLabel extends StatelessWidget {
  final String text;
  const SectionLabel(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Text(text,
    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8,
      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.45)));
}
