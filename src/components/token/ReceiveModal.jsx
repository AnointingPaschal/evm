import { useEffect, useRef } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import CopyButton from '../ui/CopyButton';

export default function ReceiveModal({ isOpen, onClose }) {
  const { activeWallet } = useWallet();
  const qrRef = useRef(null);
  const addr = activeWallet?.address || '';

  useEffect(() => {
    if (!isOpen || !addr) return;
    const timer = setTimeout(() => {
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        try {
          if (window.QRCode) {
            new window.QRCode(qrRef.current, { text: addr, width: 180, height: 180, colorDark: '#F59E0B', colorLight: '#0A1628', correctLevel: window.QRCode.CorrectLevel.H });
          } else {
            qrRef.current.innerHTML = `<div style="background:#0A1628;padding:12px;display:inline-block;border:1px solid rgba(245,158,11,0.2);border-radius:8px"><img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${addr}&bgcolor=0A1628&color=F59E0B" width="160" height="160" /></div>`;
          }
        } catch {}
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, addr]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive" size="sm">
      <div className="text-center space-y-4">
        <p className="text-xs text-gray-500">Send only ETH/BNB and ERC-20/BEP-20 tokens to this address</p>
        <div className="flex justify-center p-5 rounded-2xl bg-navy-800/60 border border-gold-500/10">
          <div ref={qrRef} />
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-navy-800/60 border border-gold-500/10">
          <span className="flex-1 font-mono text-xs text-gray-300 break-all text-left">{addr}</span>
          <CopyButton text={addr} />
        </div>
        <p className="text-[10px] text-gray-600">Your wallet address · Always verify before sending</p>
      </div>
    </Modal>
  );
}
