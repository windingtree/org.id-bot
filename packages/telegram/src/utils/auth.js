const { OrgIdResolver, httpFetchMethod } = require('@windingtree/org.id-resolver');
const { addresses } = require('@windingtree/org.id');
const { JWT } = require('jose');
const ethers = require('ethers');
const Web3 = require('web3');
const { getAccountsByUsername } = require('./marketplaceApi');
const { getFile } = require('./ipfs');

const {
  ethereumNetwork,
  infuraKey
} = require('../config');

const web3 = new Web3(`https://${ethereumNetwork}.infura.io/v3/${infuraKey}`);
const orgIdAddress = addresses[ethereumNetwork];

// OrgIdResolver creation helper
const createOrgIdResolver = () => {
  const resolver = new OrgIdResolver({
      web3,
      orgId: orgIdAddress
  });
  resolver.registerFetchMethod(httpFetchMethod);
  return resolver;
};
module.exports.createOrgIdResolver = createOrgIdResolver;

// OrgIdResolver checks result converter
// Returns an object with mapped checks: checkType => checkResult
const toChecksObject = checks => checks.reduce(
  (a, {
    type,
    passed,
    errors = [],
    warnings = []
  }) => {
    a = {
      ...a,
      [type]: {
        passed,
        errors,
        warnings
      }
    };
    return a;
  },
  {}
);
module.exports.toChecksObject = toChecksObject;

// Verify auth token
const verifyToken = async token => {
  const orgIdResolver = createOrgIdResolver();

  // If passed headers object
  // then extract token from authorization header
  if (typeof token === 'object') {

    if (!token.authorization) {
      throw createError(
        'Authorization missing',
        403
      );
    }

    let [ type, authToken ] = token.authorization.split(' ');

    if (type !== 'Bearer') {
      throw createError(
        'Unknown authorization method',
        403
      );
    }

    token = authToken;
  }

  const decodedToken = JWT.decode(token, {
      complete: true
  });
  const { payload: { exp, iss } } = decodedToken;

  // Token should not be expired
  if (exp < (Date.now() / 1000)) {
    throw createError(
          'Token is expired',
          403
      );
  }

  // Issuer should be defined
  if (!iss || iss === '') {
      throw createError(
          'Token is missing issuing ORGiD',
          403
      );
  }

  // Resolve did to didDocument
  const { did } = iss.match(/(?<did>did:orgid:0x\w{64})(?:#{1})?(?<fragment>\w+)?/).groups;
  const didResult = await orgIdResolver.resolve(did);
  const checks = toChecksObject(didResult.checks);

  // didDocument should be resolved
  if (!checks.DID_DOCUMENT.passed) {
      throw createError(
          checks.DID_DOCUMENT.errors.join('; '),
          403
      );
  }

  // Organization should not be disabled
  if (!didResult.organization.isActive) {
      throw createError(
          `Organization: ${didResult.organization.orgId} is disabled`,
          403
      );
  }

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
          ...(didResult.organization.director !== '0x0000000000000000000000000000000000000000'
              && didResult.organization.isDirectorshipAccepted
              ? [didResult.organization.director]
              : []
          )
      ].includes(signingAddress)
  ) {
      throw createError(
          'Token is signed by unknown key',
      403);
  }

  return decodedToken;
};
module.exports.verifyToken = verifyToken;

// Get verified tokens by username
module.exports.getVerifiedTokens = async username => {
  const resolvedAccounts = await getAccountsByUsername(username);
  const verifiedTokens = [];

  if (resolvedAccounts.length > 0) {
    // Fetch tokens and verify accounts
    for (const account of resolvedAccounts) {
      const token = await getFile(account.ipfs);
      console.log('Token:', token);
      const decodedToken = await verifyToken(token);
      console.log('Decoded Token:', decodedToken);
      verifiedTokens.push(decodedToken.payload);
    }
  }

  return verifiedTokens;
}

// Resolve an ORGiD
module.exports.resolveOrgId = async orgId => {
  const orgIdResolver = createOrgIdResolver();
  const didResult = await orgIdResolver.resolve(`did:orgid:${orgId}`);
  const checks = toChecksObject(didResult.checks);

  // didDocument should be resolved
  if (!checks.DID_DOCUMENT.passed) {
      throw createError(
          checks.DID_DOCUMENT.errors.join('; '),
          403
      );
  }

  // Organization should not be disabled
  if (!didResult.organization.isActive) {
      throw createError(
          `Organization: ${didResult.organization.orgId} is disabled`,
          403
      );
  }

  return didResult;
};
