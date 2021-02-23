const { OrgIdResolver } = require('@windingtree/org.id-resolver');
const BotError = require('../../../src/utils/error');
const {
  assertThrow
} = require('../../utils/assertions');
const {
  ganache,
  getAccounts
} = require('../../utils/ganache');
const {
  createAuthToken,
  createAuthHeaders
} = require('../../utils/auth');
const {
  getDidResult
} = require('../../utils/orgId');
const {
  zeroAddress
} = require('../../../src/utils/constants');
const {
  createOrgIdResolver,
  validateAuthHeader,
  verifyToken,
  validateDidDocumentChecks
} = require('../../../src/utils/auth');
require('chai').should();

describe('Auth', () => {
  const person = {
    name: 'name',
    accounts: [
      {
        type: 'telegram',
        value: '@username'
      }
    ]
  };
  let web3;
  let accounts;

  before(async () => {
    const ganacheServer = await ganache();
    web3 = ganacheServer.web3;
    accounts = await getAccounts(web3);
  });

  describe('#validateAuthHeader', () => {
    let validToken;

    before(async () => {
      validToken = await createAuthToken(
        web3,
        accounts[0],
        zeroAddress,
        person.name,
        person.accounts
      );
    });

    it('should create a proper Error', async () => {
      const authHeaders = createAuthHeaders(validToken);
      (validateAuthHeader(authHeaders)).should.equal(validToken);
    });

    it('should throw if authorization header is missing', async () => {
      const authHeadersNoAuthorization = createAuthHeaders(validToken, ['noAuthorization']);
      (() => validateAuthHeader(authHeadersNoAuthorization)).should.to.throw(BotError);
    });

    it('should throw if wrong auth type', async () => {
      const authHeadersNoBearer = createAuthHeaders(validToken, ['noBearer']);
      (() => validateAuthHeader(authHeadersNoBearer)).should.to.throw(BotError);
    });
  });

  describe('#validateDidDocumentChecks', () => {
    it('should throw if organization is disabled', async () => {
      const disabledDidResult = getDidResult(
        zeroAddress,
        accounts[0],
        zeroAddress,
        ['notActive']
      );
      (() => validateDidDocumentChecks(disabledDidResult)).should.to.throw(
        BotError,
        `Organization: ${zeroAddress} is disabled`
      );
    });

    it('should throw if didDocument is broken', async () => {
      const brokenDidResult = getDidResult(
        zeroAddress,
        accounts[1],
        zeroAddress,
        ['brokenDidDocument']
      );
      (() => validateDidDocumentChecks(brokenDidResult)).should.to.throw(
        BotError
      );
    });
  });

  describe('#createOrgIdResolver', () => {
    it('should instantiate OrgIdResolver', async () => {
      (createOrgIdResolver(web3, zeroAddress)).should.be.instanceOf(OrgIdResolver);
    });
  });

  describe('#verifyToken', () => {
    let validToken;
    let validDidResult;

    before(async () => {
      validToken = await createAuthToken(
        web3,
        accounts[0],
        zeroAddress,
        person.name,
        person.accounts
      );
      validDidResult = getDidResult(zeroAddress, accounts[0]);
    });

    afterEach(async () => {
      global.TEST_DID_RESULT = undefined;
    });

    it('should verify a valid token', async () => {
      global.TEST_DID_RESULT = validDidResult;
      const result = await verifyToken(validToken);
      (result.payload.sub.name).should.equal(person.name);
      (result.payload.sub.accounts).should.to.deep.equal(person.accounts);
    });

    it('should throw if token expired', async () => {
      global.TEST_DID_RESULT = validDidResult;
      const expiredToken = await createAuthToken(
        web3,
        accounts[0],
        zeroAddress,
        person.name,
        person.accounts,
        ['expired']
      );
      await assertThrow(
        verifyToken(expiredToken),
        BotError,
        'Token is expired'
      );
    });

    it('should throw if missing issuing ORGiD', async () => {
      global.TEST_DID_RESULT = validDidResult;
      const noOrgIdToken = await createAuthToken(
        web3,
        accounts[0],
        zeroAddress,
        person.name,
        person.accounts,
        ['onOrgId']
      );
      await assertThrow(
        verifyToken(noOrgIdToken),
        BotError,
        'Token is missing issuing ORGiD'
      );
    });

    it('should throw if organization is disabled', async () => {
      const disabledDidResult = getDidResult(
        zeroAddress,
        accounts[0],
        zeroAddress,
        ['notActive']
      );
      global.TEST_DID_RESULT = disabledDidResult;
      await assertThrow(
        verifyToken(validToken),
        BotError,
        `Organization: ${zeroAddress} is disabled`
      );
    });

    it('should throw if token signed by unknown key (with director)', async () => {
      const disabledDidResult = getDidResult(
        zeroAddress,
        accounts[1],
        accounts[2]
      );
      global.TEST_DID_RESULT = disabledDidResult;
      await assertThrow(
        verifyToken(validToken),
        BotError,
        'Token is signed by unknown key'
      );
    });

    it('should throw if token signed by unknown key', async () => {
      const disabledDidResult = getDidResult(
        zeroAddress,
        accounts[1]
      );
      global.TEST_DID_RESULT = disabledDidResult;
      await assertThrow(
        verifyToken(validToken),
        BotError,
        'Token is signed by unknown key'
      );
    });

    it('should throw if didDocument is broken', async () => {
      const brokenDidResult = getDidResult(
        zeroAddress,
        accounts[1],
        zeroAddress,
        ['brokenDidDocument']
      );
      global.TEST_DID_RESULT = brokenDidResult;
      await assertThrow(
        verifyToken(validToken),
        BotError
      );
    });
  });
});
