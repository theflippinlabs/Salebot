const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd';
// CoinGecko calls are cached for 60s to reduce request volume while keeping quotes fresh.
const CACHE_DURATION_MS = 60000;

let cache = {
  usd: null,
  ts: 0,
};

async function fetchImpl(url) {
  if (typeof fetch === 'function') {
    return fetch(url);
  }

  const mod = await import('node-fetch');
  return mod.default(url);
}

async function getCroUsdPrice() {
  const now = Date.now();
  if (cache.usd && now - cache.ts < CACHE_DURATION_MS) {
    return cache.usd;
  }

  try {
    const res = await fetchImpl(PRICE_URL);
    if (!res.ok) {
      throw new Error(`CoinGecko error: ${res.status}`);
    }

    const json = await res.json();
    const usd = Number(json?.['crypto-com-chain']?.usd || 0);
    cache = { usd, ts: now };
    return usd;
  } catch (error) {
    console.error('[price] Failed to fetch CRO/USD:', error.message);
    return cache.usd || 0;
  }
}

module.exports = {
  getCroUsdPrice,
};
