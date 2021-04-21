const moment = require('moment');
const {
  OrgIdResolver,
  twitterFetchMethod,
  httpFetchMethod,
  whoisService
} = require('@windingtree/org.id-resolver');
const {
  addresses,
  OrgIdContract
} = require('@windingtree/org.id');
const {
  addresses: addressesStake,
  LifDepositContract
} = require('@windingtree/org.id-lif-deposit');
const { JWT } = require('jose');
const ethers = require('ethers');
const Web3 = require('web3');
const { getAccountsByUsername } = require('./marketplaceApi');
const { getFile } = require('./ipfs');
const { toChecksObject } = require('../utils/object');
const BotError = require('../utils/error');
const { zeroAddress } = require('../utils/constants');
const {
  getCache,
  setCache,
  delCache
} = require('../utils/cache');

const {
  ethereumNetwork,
  infuraKey,
  orgIdCacheExpiration,
  usernameCacheExpiration,
  twitterApiKey
} = require('../config');

const web3 = new Web3(`https://${ethereumNetwork}.infura.io/v3/${infuraKey}`);
const orgIdAddress = addresses[ethereumNetwork.replace('mainnet', 'main')];
const lifStakeAddress = addressesStake[ethereumNetwork.replace('mainnet', 'main')];

module.exports.web3 = web3;

// Fetch ORGiD creation date
const fetchOrgIdCreationDate = async orgId => {
  const contract = new web3.eth.Contract(OrgIdContract.abi, orgIdAddress);
  const event = await contract.getPastEvents('OrganizationCreated', {
    filter: {
      orgId
    },
    fromBlock: 0,
    toBlock: 'latest'
  });
  let orgIdCreationDate;
  let isFresh;
  if (event.length === 1) {
    const block = await web3.eth.getBlock(event[0].blockNumber);
    const creationDate = moment(new Date(block.timestamp * 1000));
    orgIdCreationDate = creationDate.format('DD MMMM YYYY');
    isFresh = moment(new Date()).diff(creationDate, 'days') <= 1;
  }
  return {
    orgIdCreationDate,
    isFresh
  };
};
module.exports.fetchOrgIdCreationDate = fetchOrgIdCreationDate;

// Fetch Lif Deposit creation date
const fetchLifDepositCreationDate = async orgId => {
  const contract = new web3.eth.Contract(LifDepositContract.abi, lifStakeAddress);
  const events = await contract.getPastEvents('LifDepositAdded', {
    filter: {
      organization: orgId
    },
    fromBlock: 0,
    toBlock: 'latest'
  });
  const latestEvent = events.sort((a, b) => (a.blockNumber > b.blockNumber) ? 1 : -1)[0];
  if (latestEvent) {
    const block = await web3.eth.getBlock(latestEvent.blockNumber);
    return moment(new Date(block.timestamp * 1000)).format('DD MMMM YYYY');
  }
};
module.exports.fetchLifDepositCreationDate = fetchLifDepositCreationDate;

// OrgIdResolver creation helper
const createOrgIdResolver = (web3Instance = web3, orgIdContractAddress = orgIdAddress) => {
  const resolver = new OrgIdResolver({
    web3: web3Instance,
    orgId: orgIdContractAddress,
    lifDeposit: lifStakeAddress
  });
  resolver.registerSocialFetchMethod(twitterFetchMethod, {
    key: twitterApiKey
  });
  resolver.registerFetchMethod(httpFetchMethod);
  resolver.registerService(whoisService);
  return resolver;
};
module.exports.createOrgIdResolver = createOrgIdResolver;

// Validate auth header
const validateAuthHeader = token => {
  // If passed headers object
  // then extract token from authorization header
  if (typeof token === 'object') {

    if (!token.authorization) {
      throw new BotError(
        'Authorization missing',
        403
      );
    }

    let [ type, authToken ] = token.authorization.split(' ');

    if (type !== 'Bearer') {
      throw new BotError(
        'Unknown authorization method',
        403
      );
    }

    token = authToken;
  }

  return token;
};
module.exports.validateAuthHeader = validateAuthHeader;

// Validate DID document checks
const validateDidDocumentChecks = didResult => {
  const checks = toChecksObject(didResult.checks);

  // didDocument should be resolved
  if (!checks.DID_DOCUMENT.passed) {
    throw new BotError(
      checks.DID_DOCUMENT.errors.join('; '),
      403
    );
  }

  // Organization should not be disabled
  if (!didResult.organization.isActive) {
    throw new BotError(
      `Organization: ${didResult.organization.orgId} is disabled`,
      403
    );
  }
};
module.exports.validateDidDocumentChecks = validateDidDocumentChecks;

// Verify auth token
const verifyToken = async token => {
  const orgIdResolver = createOrgIdResolver();

  token = validateAuthHeader(token);
  const decodedToken = JWT.decode(token, {
    complete: true
  });
  const { payload: { exp, iss } } = decodedToken;

  // Token should not be expired
  if (exp < (Date.now() / 1000)) {
    throw new BotError(
      'Token is expired',
      403
    );
  }

  // Issuer should be defined
  if (!iss || iss === '') {
    throw new BotError(
      'Token is missing issuing ORGiD',
      403
    );
  }

  // Resolve did to didDocument
  let didResult;

  /* istanbul ignore if */
  if (process.env.TESTING !== 'yes') {
    const { did } = iss.match(/(?<did>did:orgid:0x\w{64})(?:#{1})?(?<fragment>\w+)?/).groups;
    didResult = await orgIdResolver.resolve(did);
  }

  // Override the didResult during testing
  /* istanbul ignore if */
  if (process.env.TESTING === 'yes' && global.TEST_DID_RESULT) {
    didResult = global.TEST_DID_RESULT;
  }

  validateDidDocumentChecks(didResult);

  // Validate signature of the organization owner or director
  const lastPeriod = token.lastIndexOf('.');
  const jwtMessage = token.substring(0, lastPeriod);
  let rawSign = decodedToken.signature
    .toString()
    .replace('-', '+')
    .replace('_', '/');
  const signatureB16 = Buffer
    .from(
      rawSign,
      'base64'
    )
    .toString('hex');

  const hashedMessage = ethers.utils.hashMessage(jwtMessage);
  const signingAddress = ethers.utils.recoverAddress(hashedMessage, `0x${signatureB16}`);

  // Signer address should be an owner address or director address
  // and director have to be confirmed
  if (
    ![
      didResult.organization.owner,
      ...(didResult.organization.director !== zeroAddress
        && didResult.organization.isDirectorshipAccepted
        ? [didResult.organization.director]
        : []
      )
    ].includes(signingAddress)
  ) {
    throw new BotError(
      'Token is signed by unknown key',
      403
    );
  }

  return decodedToken;
};
module.exports.verifyToken = verifyToken;

// Get verified tokens by username
/* istanbul ignore next */
module.exports.getVerifiedTokens = async (username) => {
  let verifiedTokens = await getCache(username);
  if (verifiedTokens) {
    return JSON.parse(verifiedTokens);
  }
  const resolvedAccounts = await getAccountsByUsername(username);
  verifiedTokens = [];
  if (resolvedAccounts.length > 0) {
    // Fetch tokens and verify accounts
    for (const account of resolvedAccounts) {
      const token = await getFile(account.ipfs);
      const decodedToken = await verifyToken(token);
      verifiedTokens.push(decodedToken.payload);
    }
    // Save result to cache
    await setCache(username, JSON.stringify(verifiedTokens), usernameCacheExpiration);
  }
  return verifiedTokens;
};

// Resolve an ORGiD
/* istanbul ignore next */
module.exports.resolveOrgId = async (orgId, doNoUseCache = false, removeCached = false) => {
  let didResult = await getCache(orgId);
  if (didResult && removeCached) {
    await delCache(orgId);
  }
  if (didResult && !doNoUseCache && !removeCached) {
    return JSON.parse(didResult);
  }
  const orgIdResolver = createOrgIdResolver();
  didResult = await orgIdResolver.resolve(`did:orgid:${orgId}`);
  // console.log('DID_Result', JSON.stringify(didResult, null, 2));
  validateDidDocumentChecks(didResult);
  if (!doNoUseCache) {
    await setCache(orgId, JSON.stringify(didResult), orgIdCacheExpiration);
  }
  return didResult;
};
