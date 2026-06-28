function shortenAddress(address) {
  if (!address || address.length < 12) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatSaleTweet({
  collectionName,
  collectionTag,
  tokenId,
  itemName,
  priceCro,
  priceUsd,
  marketplace,
  buyer,
  seller,
  txHash,
}) {
  const resolvedCollection = collectionName || 'NFT Collection';
  const resolvedItem = itemName || `#${tokenId}`;
  const croDisplay = Number(priceCro).toFixed(2).replace(/\.00$/, '');
  const usdDisplay = Number.isFinite(priceUsd) ? priceUsd.toFixed(2) : '0.00';

  return [
    '🔔 SOLD!',
    '',
    `${resolvedCollection} #${tokenId}`,
    `"${resolvedItem}"`,
    '',
    `💰 ${croDisplay} CRO (~$${usdDisplay} USD)`,
    `📊 Marketplace: ${marketplace}`,
    '',
    `🛒 Buyer: ${shortenAddress(buyer)}`,
    `📤 Seller: ${shortenAddress(seller)}`,
    '',
    `🔗 View: https://cronoscan.com/tx/${txHash}`,
    '',
    `#${collectionTag || 'CronosNFT'} #Cronos #CRO #NFT #CroFam`,
  ].join('\n');
}

module.exports = {
  shortenAddress,
  formatSaleTweet,
};
