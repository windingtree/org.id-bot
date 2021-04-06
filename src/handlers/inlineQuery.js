const { Markup } = require('telegraf');
const { getUid } = require('../utils/uid');

// Inline query handler
module.exports.onInlineQuery = async ctx => {
  try {
    const query = ctx.inlineQuery.query;

    if (query) {
      const title = `Resolve → ${query}`;
      return await ctx.answerInlineQuery(
        [
          {
            type: 'article',
            id: getUid(),
            title,
            input_message_content: {
              message_text: query
            },
            reply_markup: Markup.inlineKeyboard([
              Markup.button.callback(query, query)
            ])
          }
        ],
        {
          cache_time: 0
        }
      );
    }
  } catch (error) {
    console.log('Error:', error);
  }
};
