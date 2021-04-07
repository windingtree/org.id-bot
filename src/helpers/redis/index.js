/* istanbul ignore file */
const redis = require('redis');
const { redisConfig } = require('../../config');

// Creation of the Redis client
let redisClient = redis.createClient({
  host: redisConfig.host,
  port: redisConfig.port,
  ...(
    redisConfig.password
      ? {
        password: redisConfig.password
      }
      : {}
  ),
  retry_strategy: options => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Asynchronous version of get
redisClient.asyncGet = key => new Promise(
  (resolve, reject) => redisClient.get(
    key,
    (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    }
  )
);

// Asynchronous version of set
redisClient.asyncSet = (...args) => new Promise(
  (resolve, reject) => redisClient.set.apply(
    redisClient,
    [
      ...args,
      error => {
        if (error) {
          return reject(error);
        }
        resolve();
      }
    ]
  )
);

// Errors handler
redisClient.on('error', (error) => {
  console.error(error);

  if (error.code === 'ECONNREFUSED') {
    // Fallback to Map
    console.log('Fallback to Map instead of Redis');
    redisClient = new Map();
    // Redefine async methods
    redisClient.asyncGet = key => Promise.resolve(redisClient.get(key));
    redisClient.asyncSet = (key, value) => Promise.resolve(redisClient.set(key, value));
  }
});

// Close connection to the Redis on exit
process.on('exit', () => redisClient.quit());

module.exports = {
  redis,
  redisClient
};
