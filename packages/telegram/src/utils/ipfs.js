const IpfsHttpClient = require('ipfs-http-client');

const {
  ipfsApiPath
} = require('../config');

const ipfsClient = IpfsHttpClient(ipfsApiPath);

// Fetch file by IPFS path
module.exports.getFile = async path => {
  const tokenChunks = [];
  for await (const chunk of ipfsClient.cat(path)) {
    tokenChunks.push(chunk);
  }
  return Buffer.concat(tokenChunks).toString();
};
