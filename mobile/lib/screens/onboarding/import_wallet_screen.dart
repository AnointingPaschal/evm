import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/app_widgets.dart';

class ImportWalletScreen extends StatefulWidget {
  const ImportWalletScreen({super.key});
  @override State<ImportWalletScreen> createState() => _ImportWalletScreenState();
}

class _ImportWalletScreenState extends State<ImportWalletScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _phraseCtrl = TextEditingController();
  final _pkCtrl     = TextEditingController();
  final _nameCtrl   = TextEditingController();
  final _pwdCtrl    = TextEditingController();
  final _pwd2Ctrl   = TextEditingController();
  bool _loading = false;

  // 12-box mnemonic input
  final List<TextEditingController> _wordCtrls =
      List.generate(12, (_) => TextEditingController());

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _phraseCtrl.dispose(); _pkCtrl.dispose();
    _nameCtrl.dispose(); _pwdCtrl.dispose(); _pwd2Ctrl.dispose();
    for (final c in _wordCtrls) c.dispose();
    super.dispose();
  }

  bool get _valid => _pwdCtrl.text.length >= 8 && _pwdCtrl.text == _pwd2Ctrl.text;

  Future<void> _import() async {
    if (!_valid) { Fluttertoast.showToast(msg: 'Check password fields'); return; }
    setState(() => _loading = true);
    try {
      final bool isMnemonic = _tabs.index == 0;
      final String phrase = isMnemonic
          ? _wordCtrls.map((c) => c.text.trim().toLowerCase()).join(' ')
          : _pkCtrl.text.trim();
      await context.read<WalletProvider>().importWallet(
        phrase, _nameCtrl.text.trim(), _pwdCtrl.text,
        isMnemonic: isMnemonic);
      if (!mounted) return;
      Navigator.of(context).popUntil((r) => r.isFirst);
    } catch (e) {
      Fluttertoast.showToast(msg: e.toString().replaceAll('Exception: ', ''));
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(children: [
        Container(
          decoration: const BoxDecoration(gradient: kHeaderGradient),
          child: SafeArea(bottom: false, child: Padding(
            padding: const EdgeInsets.fromLTRB(4, 8, 16, 0),
            child: Row(children: [
              IconButton(onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.white, size: 20)),
              const Text('Import Wallet', style: TextStyle(
                  color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
            ]),
          )),
        ),
        // Tab bar sits in the header area
        Container(
          color: AppColors.navy900,
          child: TabBar(
            controller: _tabs,
            indicatorColor: AppColors.brand400,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white38,
            labelStyle: const TextStyle(fontWeight: FontWeight.w600),
            tabs: const [Tab(text: 'Recovery Phrase'), Tab(text: 'Private Key')],
          ),
        ),
        Expanded(child: TabBarView(controller: _tabs, children: [
          // ── Mnemonic tab ────────────────────────────────────────
          SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SectionLabel('ENTER YOUR 12 RECOVERY WORDS'),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3, childAspectRatio: 2.4,
                  mainAxisSpacing: 8, crossAxisSpacing: 8),
                itemCount: 12,
                itemBuilder: (_, i) => Row(children: [
                  SizedBox(
                    width: 16,
                    child: Text('${i + 1}',
                        style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  ),
                  Expanded(child: TextField(
                    controller: _wordCtrls[i],
                    textInputAction: i < 11
                        ? TextInputAction.next : TextInputAction.done,
                    autocorrect: false, enableSuggestions: false,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 10),
                      hintText: 'word ${i + 1}',
                      hintStyle: const TextStyle(fontSize: 11)),
                  )),
                ]),
              ),
              // Paste from clipboard
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pastePhrase,
                child: Row(mainAxisAlignment: MainAxisAlignment.end, children: const [
                  Icon(Icons.content_paste_rounded,
                      size: 14, color: AppColors.brand500),
                  SizedBox(width: 4),
                  Text('Paste phrase', style: TextStyle(
                      fontSize: 12, color: AppColors.brand500,
                      fontWeight: FontWeight.w600)),
                ]),
              ),
              const SizedBox(height: 20),
              ..._commonFields(),
              const SizedBox(height: 20),
              PrimaryBtn(label: 'Import Wallet', loading: _loading, onTap: _import),
              const SizedBox(height: 40),
            ]),
          ),
          // ── Private key tab ─────────────────────────────────────
          SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.shade200)),
                child: Row(children: const [
                  Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 16),
                  SizedBox(width: 8),
                  Expanded(child: Text(
                    'Never share your private key. Anyone with it has full access to your funds.',
                    style: TextStyle(fontSize: 12, color: Colors.orange))),
                ]),
              ),
              const SizedBox(height: 16),
              const SectionLabel('PRIVATE KEY'),
              const SizedBox(height: 8),
              TextField(controller: _pkCtrl,
                  autocorrect: false, enableSuggestions: false,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                  maxLines: 3,
                  decoration: const InputDecoration(
                      hintText: '0x or raw 64-char hex...')),
              const SizedBox(height: 20),
              ..._commonFields(),
              const SizedBox(height: 20),
              PrimaryBtn(label: 'Import Wallet', loading: _loading, onTap: _import),
              const SizedBox(height: 40),
            ]),
          ),
        ])),
      ]),
    );
  }

  List<Widget> _commonFields() => [
    const SectionLabel('WALLET NAME (OPTIONAL)'),
    const SizedBox(height: 8),
    TextField(controller: _nameCtrl,
        decoration: const InputDecoration(hintText: 'e.g. Hardware Wallet')),
    const SizedBox(height: 14),
    const SectionLabel('SET PASSWORD'),
    const SizedBox(height: 8),
    PasswordField(controller: _pwdCtrl, hint: 'Min. 8 characters',
        action: TextInputAction.next),
    const SizedBox(height: 8),
    PasswordField(controller: _pwd2Ctrl, hint: 'Confirm password'),
    if (_pwdCtrl.text.isNotEmpty && _pwd2Ctrl.text.isNotEmpty
        && _pwdCtrl.text != _pwd2Ctrl.text)
      const Padding(padding: EdgeInsets.only(top: 4),
        child: Text('Passwords do not match',
            style: TextStyle(fontSize: 11, color: AppColors.error))),
  ];

  Future<void> _pastePhrase() async {
    final cbd = await Clipboard.getData(Clipboard.kTextPlain);
    final data = cbd?.text;
    if (data == null) return;
    final words = data.trim().split(RegExp(r'\s+'));
    if (words.length == 12) {
      for (int i = 0; i < 12; i++) {
        _wordCtrls[i].text = words[i];
      }
      setState(() {});
    } else {
      Fluttertoast.showToast(msg: 'Clipboard must contain exactly 12 words');
    }
  }
}


