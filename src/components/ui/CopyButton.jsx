import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={copy} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${copied ? 'text-emerald-400 bg-emerald-500/15' : 'text-gray-500 hover:text-gold-400 hover:bg-gold-500/10'} ${className}`}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
