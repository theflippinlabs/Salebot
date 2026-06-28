const { ethers } = require('ethers');
const config = require('./config');

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const MAX_PROCESSED_TX_CACHE = 1000;
const INITIAL_RETRY_DELAY_MS = 400;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseAddress(topic) {
  return ethers.getAddress(`0x${topic.slice(-40)}`);
}

function parseTokenId(topic) {
  return BigInt(topic).toString();
}

function toLower(value) {
  return value ? value.toLowerCase() : value;
}

function classifyMarketplace({ tx, receipt, ebisusBayContract, collectionAddress }) {
  const ebisu = toLower(ebisusBayContract);
  const txTo = toLower(tx.to);
  const isEbisuTxTo = txTo === ebisu;
  const isEbisuInLogs = receipt.logs.some((log) => toLower(log.address) === ebisu);

  if (isEbisuTxTo || isEbisuInLogs) {
    return "Ebisu's Bay";
  }

  if (tx.value > 0n) {
    if (toLower(tx.to) === toLower(collectionAddress)) {
      return 'Direct Sale';
    }
    return 'Crypto.com NFT';
  }

  return null;
}

function createMonitor({
  onSale,
  pollIntervalMs = config.POLL_INTERVAL_MS,
  rpcUrl = config.CRONOS_RPC_URL,
  backupRpcUrl = config.CRONOS_RPC_BACKUP,
  collectionAddresses = config.COLLECTION_ADDRESSES,
  collectionNames = config.COLLECTION_NAMES,
  collectionTags = config.COLLECTION_TAGS,
  ebisusBayContract = config.EBISUS_BAY_CONTRACT,
}) {
  const normalizedCollections = collectionAddresses.map((address, index) => ({
    address: ethers.getAddress(address),
    name: collectionNames[index] || null,
    tag: collectionTags[index] || null,
  }));

  let primaryProvider = new ethers.JsonRpcProvider(rpcUrl);
  const backupProvider = new ethers.JsonRpcProvider(backupRpcUrl);
  let provider = primaryProvider;

  let lastProcessedBlock = null;
  const processedTxs = new Set();
  const txQueue = [];
  let timer = null;
  let running = false;

  async function callWithRetry(fn, label) {
    let delay = INITIAL_RETRY_DELAY_MS;

    for (let i = 0; i < MAX_RETRIES; i += 1) {
      try {
        return await fn(provider);
      } catch (error) {
        if (i === MAX_RETRIES - 1) break;
        console.warn(`[monitor] ${label} failed attempt ${i + 1}, retrying...`);
        await sleep(delay);
        delay *= 2;
      }
    }

    if (provider === primaryProvider) {
      console.warn('[monitor] Primary RPC failing. Switching to backup RPC.');
      provider = backupProvider;
      return fn(provider);
    }

    throw new Error(`${label} failed after retries`);
  }

  function rememberTx(txHash) {
    if (processedTxs.has(txHash)) return false;

    processedTxs.add(txHash);
    txQueue.push(txHash);

    if (txQueue.length > MAX_PROCESSED_TX_CACHE) {
      const old = txQueue.shift();
      processedTxs.delete(old);
    }

    return true;
  }

  async function init() {
    if (!normalizedCollections.length) return;

    const block = await callWithRetry((p) => p.getBlockNumber(), 'getBlockNumber(init)');
    lastProcessedBlock = Math.max(0, block - 1);
    console.log(`[monitor] Initialized at block ${lastProcessedBlock}`);
  }

  async function processLog(log, collectionInfo) {
    if (!rememberTx(log.transactionHash)) return;

    const [tx, receipt] = await Promise.all([
      callWithRetry((p) => p.getTransaction(log.transactionHash), 'getTransaction'),
      callWithRetry((p) => p.getTransactionReceipt(log.transactionHash), 'getTransactionReceipt'),
    ]);

    if (!tx || !receipt) {
      return;
    }

    const marketplace = classifyMarketplace({
      tx,
      receipt,
      ebisusBayContract,
      collectionAddress: collectionInfo.address,
    });

    if (!marketplace) {
      return;
    }

    const sale = {
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      collectionAddress: collectionInfo.address,
      collectionName: collectionInfo.name,
      collectionTag: collectionInfo.tag,
      tokenId: parseTokenId(log.topics[3]),
      seller: parseAddress(log.topics[1]),
      buyer: parseAddress(log.topics[2]),
      priceWei: tx.value,
      priceCro: Number(ethers.formatEther(tx.value)),
      marketplace,
    };

    await onSale(sale, provider);
  }

  async function poll() {
    if (running || !normalizedCollections.length) return;
    running = true;

    try {
      if (lastProcessedBlock === null) {
        await init();
      }

      const latestBlock = await callWithRetry((p) => p.getBlockNumber(), 'getBlockNumber(poll)');
      if (latestBlock <= lastProcessedBlock) return;

      const fromBlock = lastProcessedBlock + 1;
      const toBlock = latestBlock;

      for (const collectionInfo of normalizedCollections) {
        const logs = await callWithRetry(
          (p) =>
            p.getLogs({
              address: collectionInfo.address,
              topics: [TRANSFER_TOPIC],
              fromBlock,
              toBlock,
            }),
          'getLogs',
        );

        for (const log of logs) {
          if (!log.topics?.[3]) continue;
          await processLog(log, collectionInfo);
        }
      }

      lastProcessedBlock = toBlock;
    } catch (error) {
      console.error('[monitor] Poll error:', error.message);
    } finally {
      running = false;
    }
  }

  async function start() {
    await poll();
    timer = setInterval(() => {
      poll().catch((error) => console.error('[monitor] interval poll error:', error.message));
    }, pollIntervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    start,
    stop,
    poll,
  };
}

module.exports = {
  createMonitor,
  TRANSFER_TOPIC,
};
