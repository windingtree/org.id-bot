// Initialize variables from the local .env file if exist
require('dotenv').config();

module.exports.botToken = process.env.BOT_TOKEN;
module.exports.marketplaceApiPath = process.env.MARKETPLACE_API_PATH;
module.exports.ipfsApiPath = process.env.MARKETPLACE_IPFS;
module.exports.ethereumNetwork = process.env.ETHEREUM_NETWORK;
module.exports.infuraKey = process.env.INFURA_KEY;
module.exports.unauthorizedUserMessagesLimit = Number(process.env.UNAUTHORIZED_USER_MESSAGES_LIMIT);
module.exports.messagesHandlerMode = process.env.MESSAGES_HANDLER_MODE;
