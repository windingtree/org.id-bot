const { request } = require('./rest');
const {
  marketplaceApiPath
} = require('../config');

// Get registered account from the Marketplace API
module.exports.getAccountsByUsername = async username => {
  let resolvedAccounts = [];

  try {
    resolvedAccounts = await request(
      marketplaceApiPath,
      `/trustedPerson/accountType/telegram/@${username}`,
      'GET'
    );
    console.log('Accounts API call result:', resolvedAccounts);
  } catch (error) {
    console.log('Error:', error);
  }

  return resolvedAccounts;
};
