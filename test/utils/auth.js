// btoa implementation for node.js
const btoa = str => {
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = Buffer.from(str.toString(), 'binary');
  }

  return buffer.toString('base64');
};

// Create eth-signed token
const createToken = (web3, options) => new Promise((resolve, reject) => {
  const {
    algorithm,
    expiration,
    issuerDidValue,
    audienceDidValue,
    scope,
    from,
    subject
  } = options;

  // Build the header
  const header = {
    alg: algorithm,
    typ: 'JWT'
  };

  // Using browser's time is dangerous, but used here as a PoC
  const now = Math.floor(new Date().getTime() / 1000);
  const expiry = parseInt(expiration, 10) + now;

  // Create the payload
  const payload = {
    iss: issuerDidValue,
    aud: audienceDidValue,
    exp: expiry,
    scope: scope,
    sub: subject
  };

  // console.log('@@@', payload);

  // Prepare content to sign
  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(payload);

  let toSign = '';

  toSign = btoa(sHeader) + '.' + btoa(sPayload);
  toSign = toSign.replace(/=/g, '');
  toSign = toSign.replace(/\+/g, '-');
  toSign = toSign.replace(/\//g, '_');

  // Handle the Ethereum signature process
  if (algorithm === 'ETH') {

    // Request request to web3 provider
    web3.eth.sign(
      toSign,
      from,
      (err, signature) => {

        if (err) {
          console.error(err);
          reject(err);
          return;
        }

        // Convert hex to base64
        // Leading '0x' is skipped, and each byte is unpacked using two hex chars
        var raw = '';

        for (let i = 2; i < signature.length; i += 2) {
          raw += String.fromCharCode(parseInt(signature.substring(i, i + 2), 16));
        }

        const b64Token = btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').split('=')[0];

        resolve(toSign + '.' + b64Token);
      }
    );
  } else {
    reject(new Error(`${algorithm} not supported yet`));
    return;
  }
});
module.exports.createToken = createToken;

// Create auth token
const createAuthToken = async (web3, from, orgId, name, accounts, options = []) => {
  const data = {
    did: `did:orgid:${orgId}`,
    name: name,
    accounts: accounts.map(account => ({
      type: account.type,
      value: account.value
    })),
    created: new Date().toISOString()
  };

  return createToken(
    web3,
    {
      algorithm: 'ETH',
      expiration: options.includes('expired') ? 0 : 60 * 60 * 24 * 365 * 10,
      issuerDidValue: options.includes('onOrgId') ? '' : data.did,
      subject: data,
      from
    }
  );
};
module.exports.createAuthToken = createAuthToken;

// Create auth headers object
const createAuthHeaders = (token, variants = []) => {
  const headers = {};

  if (variants.length === 0) {
    headers.authorization = `Bearer ${token}`;
  } else if (variants.includes('noBearer')) {
    headers.authorization = `${token}`;
  }

  return headers;
};
module.exports.createAuthHeaders = createAuthHeaders;
