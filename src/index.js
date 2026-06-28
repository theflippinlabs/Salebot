const express = require('express');
const config = require('./config');
const { createMonitor } = require('./monitor');
const { createTwitterClient, postSaleTweet } = require('./twitter');
const { fetchMetadata, fetchOptimizedImageBuffer } = require('./metadata');
const { getCroUsdPrice } = require('./price');
const { formatSaleTweet } = require('./format');

config.validateConfig();

const app = express();
const twitterClient = createTwitterClient(config);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cronos-nft-salesbot', uptime: process.uptime() });
});

const monitor = createMonitor({
  onSale: async (sale, provider) => {
    try {
      const metadata = await fetchMetadata(provider, sale.collectionAddress, sale.tokenId);
      const croUsd = await getCroUsdPrice();
      const priceUsd = sale.priceCro * croUsd;

      const text = formatSaleTweet({
        collectionName: metadata.collectionName || sale.collectionName,
        collectionTag: sale.collectionTag || sale.collectionName || metadata.collectionName || 'CronosNFT',
        tokenId: sale.tokenId,
        itemName: metadata.itemName,
        priceCro: sale.priceCro,
        priceUsd,
        marketplace: sale.marketplace,
        buyer: sale.buyer,
        seller: sale.seller,
        txHash: sale.txHash,
      });

      const imageBuffer = await fetchOptimizedImageBuffer(metadata.image);
      await postSaleTweet(twitterClient, text, imageBuffer);

      console.log(`[sale] Posted ${sale.txHash} (${sale.marketplace})`);
    } catch (error) {
      console.error('[index] Failed to process sale:', error.message);
    }
  },
});

async function bootstrap() {
  app.listen(config.PORT, () => {
    console.log(`[server] Listening on :${config.PORT}`);
  });

  monitor.start().catch((error) => {
    console.error('[index] Monitor start failed:', error.message);
  });
}

bootstrap().catch((error) => {
  console.error('[index] Bootstrap failed:', error.message);
});
