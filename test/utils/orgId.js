module.exports.getDidResult = (
  orgId = '0x0000000000000000000000000000000000000000',
  owner,
  director = '0x0000000000000000000000000000000000000000',
  options = []
) => (JSON.parse(`{
  "didDocument": {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://windingtree.com/ns/orgid/v1"
    ],
    "id": "did:orgid:${orgId}",
    "created": "2021-02-09T15:52:07.218Z",
    "legalEntity": {},
    "publicKey": [],
    "service": [],
    "trust": {
      "assertions": []
    },
    "updated": "2021-02-09T15:52:48.551Z"
  },
  "organization": {
    "orgId": "${orgId}",
    "orgJsonHash": "0x4f5b5a44bb0c61eb359e738edd957c7bf02c6692354588b1cc4d74412d2b9e47",
    "orgJsonUri": "path-to.json",
    "orgJsonUriBackup1": "",
    "orgJsonUriBackup2": "",
    "parentOrgId": "${orgId}",
    "owner": "${owner}",
    "director": "${director}",
    "isActive": ${(!options.includes('notActive')).toString()},
    "isDirectorshipAccepted": ${(!options.includes('directorshipNotAccepted')).toString()}
  },
  "checks": [
    {
      "type": "DID_SYNTAX",
      "passed": ${(!options.includes('brokenDidSyntax')).toString()}
    },
    {
      "type": "ORGID",
      "passed": ${(!options.includes('brokenOrgId')).toString()}
    },
    {
      "type": "DID_DOCUMENT",
      "passed": ${(!options.includes('brokenDidDocument')).toString()}
    }
  ]
}`));
