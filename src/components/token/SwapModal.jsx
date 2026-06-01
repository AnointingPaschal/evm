import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import Modal from '../ui/Modal';
import { ArrowDownUp, ExternalLink } from 'lucide-react';
import { NETWORKS } from '../../utils/wallet';

export default function SwapModal({ isOpen, onClose, defaultToken }) {
  const { network, tokens, activeWallet } = useWallet();
  const netInfo = NETWORKS[network];
  const [fromToken, setFromToken] = useState(defaultToken?.symbol || netInfo.symbol);

  const DEX_LINKS = {
    ethereum: [
      { name: 'Uniswap', url: `https://app.uniswap.org/#/swap?inputCurrency=${defaultToken?.address||'ETH'}`, color: '#FF007A' },
      { name: '1inch', url: `https://app.1inch.io/#/1/unified/swap/${defaultToken?.symbol||'ETH'}`, color: '#1B314F' },
      { name: 'Curve', url: 'https://curve.fi/#/ethereum/swap', color: '#3466AF' },
      { name: 'Paraswap', url: 'https://app.paraswap.io/', color: '#26C3B4' },
    ],
    bsc: [
      { name: 'PancakeSwap', url: `https://pancakeswap.finance/swap?inputCurrency=${defaultToken?.address||'BNB'}`, color: '#1FC7D4' },
      { name: '1inch (BSC)', url: `https://app.1inch.io/#/56/unified/swap/${defaultToken?.symbol||'BNB'}`, color: '#1B314F' },
      { name: 'BiSwap', url: 'https://exchange.biswap.org/swap', color: '#3E68F1' },
    ],
  };
  const dexList = DEX_LINKS[network] || DEX_LINKS.ethereum;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Swap" size="sm">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-navy-800/60 border border-gold-500/8 text-center">
          <ArrowDownUp size={20} className="mx-auto text-gold-400 mb-2" />
          <p className="text-sm text-gray-300">Swap via integrated DEX aggregators</p>
          <p className="text-xs text-gray-600 mt-1">Best rates across multiple protocols</p>
        </div>
        <p className="text-xs text-gray-500 font-medium">Choose DEX on {netInfo.name}</p>
        <div className="space-y-2">
          {dexList.map(dex => (
            <a key={dex.name} href={dex.url} target="_blank" rel="noreferrer" onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-xl glass-sm border border-gold-500/8 hover:border-gold-500/25 hover:bg-gold-500/5 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] text-white" style={{background:dex.color+'33',border:`1px solid ${dex.color}55`}}>
                  {dex.name[0]}
                </div>
                <span className="text-sm font-medium text-white">{dex.name}</span>
              </div>
              <ExternalLink size={13} className="text-gray-600 group-hover:text-gold-400 transition-colors" />
            </a>
          ))}
        </div>
        <p className="text-[10px] text-gray-700 text-center">You will be redirected to the DEX. Connect your wallet there to swap.</p>
      </div>
    </Modal>
  );
}
