const { redisClient } = require('../helpers/redis');
const { orgIdCacheExpiration } = require('../config');

// Save key to Redis async
module.exports.setCache = (key, value, expire = orgIdCacheExpiration) => redisClient.asyncSet(
  key,
  value,
  'EX',
  expire
);

// Get key from Redis async
module.exports.getCache = key => redisClient.asyncGet(key);
