const config = {
  CRONOS_RPC_URL: process.env.CRONOS_RPC_URL || 'https://evm.cronos.org',
  CRONOS_RPC_BACKUP: 'https://cronos-evm-rpc.publicnode.com',
  COLLECTION_ADDRESSES: process.env.COLLECTION_ADDRESSES?.split(',').map((v) => v.trim()).filter(Boolean) || [],
  COLLECTION_NAMES: process.env.COLLECTION_NAMES?.split(',').map((v) => v.trim()) || [],
  COLLECTION_TAGS: process.env.COLLECTION_TAGS?.split(',').map((v) => v.trim()) || [],
  EBISUS_BAY_CONTRACT: '0x7a3CdB2364f92369a602CAE81167d0679087e6a3',
  TWITTER_API_KEY: process.env.TWITTER_API_KEY,
  TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS, 10) || 15000,
  PORT: parseInt(process.env.PORT, 10) || 3000,
};

function validateConfig() {
  if (!config.COLLECTION_ADDRESSES.length) {
    console.warn('[config] No COLLECTION_ADDRESSES provided. Monitor will idle.');
  }

  const mismatched =
    (config.COLLECTION_NAMES.length && config.COLLECTION_NAMES.length !== config.COLLECTION_ADDRESSES.length) ||
    (config.COLLECTION_TAGS.length && config.COLLECTION_TAGS.length !== config.COLLECTION_ADDRESSES.length);

  if (mismatched) {
    console.warn('[config] COLLECTION_NAMES/TAGS length should match COLLECTION_ADDRESSES.');
  }

  const hasTwitterCreds =
    config.TWITTER_API_KEY &&
    config.TWITTER_API_SECRET &&
    config.TWITTER_ACCESS_TOKEN &&
    config.TWITTER_ACCESS_SECRET;

  if (!hasTwitterCreds) {
    console.warn('[config] Twitter credentials are incomplete. Tweets will be skipped.');
  }
}

module.exports = {
  ...config,
  validateConfig,
};
