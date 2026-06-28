const sharp = require('sharp');
const { ethers } = require('ethers');

const ERC721_METADATA_ABI = [
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
];

async function fetchImpl(url) {
  if (typeof fetch === 'function') {
    return fetch(url);
  }

  const mod = await import('node-fetch');
  return mod.default(url);
}

function resolveIpfs(uri, gateway = 'https://ipfs.io/ipfs/') {
  if (!uri) return null;
  if (!uri.startsWith('ipfs://')) return uri;
  return `${gateway}${uri.replace('ipfs://', '')}`;
}

async function fetchJsonWithFallback(uri) {
  const primary = resolveIpfs(uri, 'https://ipfs.io/ipfs/');
  const fallback = resolveIpfs(uri, 'https://cloudflare-ipfs.com/ipfs/');

  for (const url of [primary, fallback]) {
    if (!url) continue;
    try {
      const res = await fetchImpl(url);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // continue fallback
    }
  }

  return null;
}

async function fetchMetadata(provider, collectionAddress, tokenId) {
  try {
    const contract = new ethers.Contract(collectionAddress, ERC721_METADATA_ABI, provider);
    const [tokenUri, collectionName] = await Promise.all([
      contract.tokenURI(tokenId),
      contract.name().catch(() => null),
    ]);

    const metadata = (await fetchJsonWithFallback(tokenUri)) || {};
    const image = resolveIpfs(metadata.image || metadata.image_url);

    return {
      collectionName,
      tokenUri,
      metadata,
      image,
      itemName: metadata.name || null,
    };
  } catch (error) {
    console.error('[metadata] Failed to fetch metadata:', error.message);
    return {
      collectionName: null,
      tokenUri: null,
      metadata: {},
      image: null,
      itemName: null,
    };
  }
}

async function fetchOptimizedImageBuffer(imageUrl) {
  if (!imageUrl) return null;

  try {
    const res = await fetchImpl(imageUrl);
    if (!res.ok) return null;

    const arr = await res.arrayBuffer();
    const input = Buffer.from(arr);

    return await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch (error) {
    console.error('[metadata] Failed to optimize image:', error.message);
    return null;
  }
}

module.exports = {
  resolveIpfs,
  fetchMetadata,
  fetchOptimizedImageBuffer,
};
