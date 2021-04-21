/* istanbul ignore file */
const redis = require('redis');
const { redisConfig } = require('../../config');

// Creation of the Redis client
const createClient = () => {
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
    db: redisConfig.db,
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
  // Errors handler
  redisClient.on('error', (error) => {
    console.error(error);
  });
  // Close connection to the Redis on exit
  process.on('exit', () => redisClient.quit());
  return redisClient;
};

// Asynchronous version of get
const asyncGet = key => new Promise(
  (resolve, reject) => {
    const redisClient = createClient();
    redisClient.get(
      key,
      (error, result) => {
        redisClient.quit();
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
  }
);

// Asynchronous version of set
const asyncSet = (...args) => new Promise(
  (resolve, reject) => {
    const redisClient = createClient();
    redisClient.set.apply(
      redisClient,
      [
        ...args,
        error => {
          redisClient.quit();
          if (error) {
            return reject(error);
          }
          resolve();
        }
      ]
    );
  }
);

// Asynchronous version of del
const asyncDel = (...args) => new Promise(
  (resolve, reject) => {
    const redisClient = createClient();
    redisClient.del.apply(
      redisClient,
      [
        ...args,
        error => {
          redisClient.quit();
          if (error) {
            return reject(error);
          }
          resolve();
        }
      ]
    );
  }
);


module.exports = {
  redis,
  asyncGet,
  asyncSet,
  asyncDel
};
