import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', noPad = false }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  if (!isOpen) return null;
  const sizes = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg', xl:'max-w-2xl', '2xl':'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} glass rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gold-500/15 animate-slide-up max-h-[95vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gold-500/8 flex-shrink-0">
          <h2 className="font-display font-semibold text-base text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className={`overflow-y-auto flex-1 ${noPad ? '' : 'px-6 pb-6 pt-4'}`}>{children}</div>
      </div>
    </div>
  );
}
