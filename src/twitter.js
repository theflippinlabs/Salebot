const { TwitterApi } = require('twitter-api-v2');

function createTwitterClient(config) {
  const hasCreds =
    config.TWITTER_API_KEY &&
    config.TWITTER_API_SECRET &&
    config.TWITTER_ACCESS_TOKEN &&
    config.TWITTER_ACCESS_SECRET;

  if (!hasCreds) {
    return null;
  }

  return new TwitterApi({
    appKey: config.TWITTER_API_KEY,
    appSecret: config.TWITTER_API_SECRET,
    accessToken: config.TWITTER_ACCESS_TOKEN,
    accessSecret: config.TWITTER_ACCESS_SECRET,
  });
}

async function postSaleTweet(client, text, mediaBuffer) {
  if (!client) {
    console.warn('[twitter] Missing Twitter credentials. Tweet skipped.');
    return null;
  }

  try {
    let mediaIds = undefined;

    if (mediaBuffer) {
      const mediaId = await client.v1.uploadMedia(mediaBuffer, { mimeType: 'image/jpeg' });
      mediaIds = [mediaId];
    }

    return await client.v2.tweet({ text, media: mediaIds ? { media_ids: mediaIds } : undefined });
  } catch (error) {
    console.error('[twitter] Failed to post tweet:', error.message);
    return null;
  }
}

module.exports = {
  createTwitterClient,
  postSaleTweet,
};
