import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
export default function CopyButton({ text, size=14, className='' }) {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),2000); };
  return (
    <button onClick={copy} className={`transition-colors ${ok?'text-emerald-500':'text-secondary hover:text-primary'} ${className}`}>
      {ok ? <Check size={size}/> : <Copy size={size}/>}
    </button>
  );
}
