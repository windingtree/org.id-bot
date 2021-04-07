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
module.exports.redisUrl = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}${process.env.REDIS_PSWD ? '/?password='+process.env.REDIS_PSWD : ''}`;

// Constants
module.exports.orgIdCacheExpiration = 60 * 60 * 2; // 2 hours
module.exports.usernameCacheExpiration = 60 * 15; // 15 min
