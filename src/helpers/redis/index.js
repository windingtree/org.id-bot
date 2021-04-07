/* istanbul ignore file */
const redis = require('redis');
const config = require('../../config');

// Creation of the Redis client
let redisClient = redis.createClient({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,

  retry_strategy: function(options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      console.log('The server refused the connection');
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 25 * 10) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      console.log('Retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.log('Attempt more than 10 times.');
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    console.log('We will try to reconnect in 1.5 seconds.');
    return Math.min(options.attempt * 100, 1500);
  },
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
