function shortenAddress(address) {
  if (!address || address.length < 12) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatCroPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  const decimals = amount < 1 ? 4 : 2;
  return amount.toFixed(decimals).replace(/\.?0+$/, '');
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
  const croDisplay = formatCroPrice(priceCro);
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
