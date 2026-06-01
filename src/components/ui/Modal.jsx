import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size='md', noPad=false }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  if (!isOpen) return null;
  const sizes = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg' };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bottom-sheet animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 dark:bg-white/20 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
          <h2 className="font-semibold text-base text-primary mt-2">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-secondary hover:text-primary transition-colors mt-2">
            <X size={15} />
          </button>
        </div>
        <div className={`overflow-y-auto flex-1 ${noPad ? '' : 'px-5 pb-8'}`}>{children}</div>
      </div>
    </div>
  );
}
