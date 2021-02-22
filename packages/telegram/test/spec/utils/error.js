const { HTTP_STATUS_CODES } = require('../../../src/utils/constants');
const BotError = require('../../../src/utils/error');
require('chai').should();

describe('Error', () => {

  describe('#BotError', () => {

    it('should create a proper Error', async () => {
      const error = new BotError(
        'ERROR'
      );
      (error).should.be.an.instanceof(Error);
      (error.status).should.equal(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    });
  });
});
