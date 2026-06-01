import axios from 'axios';

const CC_BASE = 'https://min-api.cryptocompare.com/data';

// === CryptoCompare ===
export const getCCPrice = async (symbols) => {
  if (!symbols.length) return {};
  const fsyms = [...new Set(symbols)].join(',');
  try {
    const r = await axios.get(`${CC_BASE}/pricemultifull?fsyms=${fsyms}&tsyms=USD`);
    return r.data?.RAW || {};
  } catch { return {}; }
};

export const getCCTokenLogo = async (symbol) => {
  try {
    const r = await axios.get(`${CC_BASE}/coin/generalinfo?fsyms=${symbol.toUpperCase()}&tsym=USD`);
    const img = r.data?.Data?.[0]?.CoinInfo?.ImageUrl;
    return img ? `https://www.cryptocompare.com${img}` : null;
  } catch { return null; }
};

export const getCCOHLCV = async (symbol, limit = 168) => {
  try {
    const r = await axios.get(`${CC_BASE}/v2/histohour?fsym=${symbol}&tsym=USD&limit=${limit}`);
    return (r.data?.Data?.Data || []).map(d => ({
      time: d.time * 1000,
      open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volumeto,
    }));
  } catch { return []; }
};

// CoinGecko for charts when CC falls short
export const getCGChart = async (cgId, days = 7) => {
  try {
    const r = await axios.get(`https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`);
    return (r.data?.prices || []).map(([t, p]) => ({ time: t, price: p }));
  } catch { return []; }
};

// DexScreener for token metadata
export const getDexData = async (tokenAddr, network = 'ethereum') => {
  const chain = network === 'ethereum' ? 'ethereum' : 'bsc';
  try {
    const r = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddr}`);
    const pairs = (r.data?.pairs || []).filter(p => p.chainId === chain);
    if (!pairs.length) return null;
    const top = pairs.sort((a,b) => (b.volume?.h24||0) - (a.volume?.h24||0))[0];
    return {
      priceUsd: top.priceUsd,
      priceChange1h: top.priceChange?.h1,
      priceChange24h: top.priceChange?.h24,
      priceChange7d: top.priceChange?.d7,
      volume24h: top.volume?.h24,
      liquidity: top.liquidity?.usd,
      marketCap: top.fdv,
      pairAddress: top.pairAddress,
      dexId: top.dexId,
      txns: top.txns?.h24,
      url: top.url,
    };
  } catch { return null; }
};

// CoinGecko contract lookup
export const getCGTokenInfo = async (tokenAddr, network = 'ethereum') => {
  const platform = network === 'ethereum' ? 'ethereum' : 'binance-smart-chain';
  try {
    const r = await axios.get(`https://api.coingecko.com/api/v3/coins/${platform}/contract/${tokenAddr.toLowerCase()}`);
    return { id: r.data.id, image: r.data.image?.small, symbol: r.data.symbol };
  } catch { return null; }
};

export const fmtNum = (n, prefix='$') => {
  if (n == null || isNaN(+n)) return 'N/A';
  const v = +n;
  if (v >= 1e12) return `${prefix}${(v/1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${prefix}${(v/1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${prefix}${(v/1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${prefix}${(v/1e3).toFixed(2)}K`;
  return `${prefix}${v.toFixed(4)}`;
};

export const fmtPct = (n) => {
  if (n == null || isNaN(+n)) return 'N/A';
  const v = +n; return `${v>=0?'+':''}${v.toFixed(2)}%`;
};
