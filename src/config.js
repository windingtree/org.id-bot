// Initialize variables from the local .env file if exist
require('dotenv').config();

module.exports.botToken = process.env.BOT_TOKEN;
module.exports.marketplaceApiPath = process.env.MARKETPLACE_API_PATH;
module.exports.ipfsApiPath = process.env.MARKETPLACE_IPFS;
module.exports.ethereumNetwork = process.env.ETHEREUM_NETWORK;
module.exports.infuraKey = process.env.INFURA_KEY;
module.exports.unauthorizedUserMessagesLimit = Number(process.env.UNAUTHORIZED_USER_MESSAGES_LIMIT);
module.exports.messagesHandlerMode = process.env.MESSAGES_HANDLER_MODE;
module.exports.webhookEnabled = process.env.WEBHOOK_ENABLED === 'yes';
module.exports.webhookPath = process.env.WEBHOOK_PATH || '/';
module.exports.redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PSWD || '',
  db: process.env.REDIS_DB || 0,
};
module.exports.twitterApiKey = process.env.TWITTER_API_KEY;
module.exports.vcIssuerDid = process.env.VC_ISSUER_DID;
module.exports.vcKeyType = process.env.VC_KEY_TYPE;
module.exports.vcKey = process.env.VC_KEY;

// Constants
module.exports.orgIdCacheExpiration = 60 * 15; // 15 min
module.exports.usernameCacheExpiration = 60 * 15; // 15 min
