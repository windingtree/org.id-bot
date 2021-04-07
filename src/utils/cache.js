const {
  asyncGet,
  asyncSet
} = require('../helpers/redis');
const { orgIdCacheExpiration } = require('../config');

// Save key to Redis async
module.exports.setCache = (key, value, expire = orgIdCacheExpiration) => asyncSet(
  key,
  value,
  'EX',
  expire
);

// Get key from Redis async
module.exports.getCache = key => asyncGet(key);
