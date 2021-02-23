const Web3 = require('web3');
const ganache = require('ganache-core');

// Ganache port counter
let portNumber = 9000;

// Ganache server default options
const defaults = {
  gasLimit: 0xfffffffffff,
  gasPrice: 0x01,
  'total_accounts': 20,
  'default_balance_ether': 1000000
};
module.exports.defaults = defaults;

// Start Ganache server instance
module.exports.ganache = (options = defaults) => new Promise(
  (resolve, reject) => {
    const server = ganache.server(options);
    const provider = ganache.provider(options);
    provider.setMaxListeners(Infinity);

    server.listen(options.port ? options.port : portNumber++, error => {
      if (error) {
        return reject(error);
      }
      resolve({
        server,
        web3: new Web3(provider)
      });
    });
  }
);

// Get a list of accounts
const getAccounts = web3 => web3.eth.getAccounts();
module.exports.getAccounts = getAccounts;
