# cronos-nft-salesbot

Cronos NFT Sales Bot that monitors configured ERC-721 collections for real on-chain sales and posts sale announcements to X (Twitter).

## Features

- Polls Cronos chain for ERC-721 `Transfer` events every 15s
- Detects and tags sales from:
  - Ebisu's Bay (`0x7a3CdB2364f92369a602CAE81167d0679087e6a3`)
  - Crypto.com NFT / Direct Sales (heuristic based on tx value and destination)
- Fetches metadata from `tokenURI` and resolves IPFS URIs
- Optimizes NFT image with `sharp` for tweet uploads
- Fetches CRO/USD from CoinGecko with 60-second cache
- Posts professional sale tweets with media attachment when available
- Provides `/health` endpoint for Railway

## Environment Variables

```bash
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

CRONOS_RPC_URL=https://evm.cronos.org

COLLECTION_ADDRESSES=0xAAA...,0xBBB...
COLLECTION_NAMES=MyCollection,AnotherOne
COLLECTION_TAGS=MyCollection,AnotherOne

POLL_INTERVAL_MS=15000
PORT=3000
```

## Run

```bash
npm install
npm start
```

## Deploy (Railway)

This repository includes `railway.json` with:

- `startCommand`: `node src/index.js`
- restart policy: `ON_FAILURE` (max retries 10)
