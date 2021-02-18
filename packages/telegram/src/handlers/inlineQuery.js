const Web3 = require('web3');
const {
  getVerifiedTokens,
  resolveOrgId
} = require('../utils/auth');

const createQueryAnswerMessage = (title, message) => ([
  {
    type: 'article',
    id: Web3.utils.soliditySha3(Math.random().toString() + message),
    title,
    input_message_content: {
      message_text: message
    }
  }
]);

// Inline query handler
module.exports.onInlineQuery = async ctx => {
  try {
    const query = ctx.inlineQuery.query;

    if (query.match(/^[@]*[a-zA-Z._-]+$/)) {
      const verifiedTokens = await getVerifiedTokens(query);

      if (verifiedTokens.length > 0) {
        const orgIds = [];
        for (const verifiedToken of verifiedTokens) {
          orgIds.push(verifiedToken.sub.did.split(':')[2]);
        }
        return ctx.answerInlineQuery(createQueryAnswerMessage(
          'User verification result',
          `User @${query} is officially representing following ORGiDs: ${orgIds.join('; ')}`
        ));
      } else {
        return ctx.answerInlineQuery(createQueryAnswerMessage(
          'User verification result',
          `User @${query} does not represent any ORGiD registered company`
        ));
      }
    } else if (query.match(/^0x\w{64}$/)) {
      const didResult = await resolveOrgId(query);
      return ctx.answerInlineQuery(createQueryAnswerMessage(
        'ORGiD resolver result',
        JSON.stringify(didResult, null, 2)
      ));
    }

    return ctx.answerInlineQuery(createQueryAnswerMessage(
      'Wrong query',
      'Please enter your query'
    ));
  } catch (error) {
    console.log('Error:', error);
    return ctx.answerInlineQuery(createQueryAnswerMessage(
      'Error',
      error.message
    ));
  }
};
