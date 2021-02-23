const {
  getDeepValue,
  toChecksObject
} = require('../../../src/utils/object');
require('chai').should();

describe('Object', () => {

  describe('#getDeepValue', () => {
    const obj = {
      a: {
        b : {
          c: 'ccc'
        },
        x: [
          'xxx',
          'zzz'
        ]
      }
    };

    it('should get value from deep object', async () => {
      (getDeepValue(obj, 'a.b.c')).should.equal(obj.a.b.c);
    });

    it('should get value from deep object (with array)', async () => {
      (getDeepValue(obj, 'a.x[1]')).should.equal(obj.a.x[1]);
    });

    it('should return undefined if variable does not exist', async () => {
      (typeof  getDeepValue(obj, 'a.v')).should.equal('undefined');
    });
  });

  describe('#toChecksObject', () => {
    const checks = [
      {
        type: 'DID_SYNTAX',
        passed: true
      },
      {
        type: 'ORGID',
        passed: true
      },
      {
        type: 'DID_DOCUMENT',
        passed: true
      }
    ];


  });
});
