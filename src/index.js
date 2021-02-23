const {
  Telegraf
} = require('telegraf');
// const makeHandler = require('lambda-request-handler');
const telegrafAws = require('telegraf-aws');

const {
  botToken,
  webhookEnabled,
  webhookPath
} = require('./config');
const {
  onActionResolveOrgIdSummary,
  onActionResolveOrgId
} = require('./handlers/actionResolveOrgId');
const { onMessage } = require('./handlers/message');
// const { onInlineQuery } = require('./handlers/inlineQuery');

const bot = new Telegraf(
  botToken,
  webhookEnabled
    ? {
      telegram: {
        webhookReply: true
      }
    }
    : undefined
);
// bot.use(session());
bot.catch(error => console.error('Unhandled error:', error));
bot.start(ctx => ctx.replyWithMarkdown('Hi I\'m the *ORGiD Bot* powered by *Winding Tree*. I am here to help you with your verification needs. Please provide a Telegram Username in the format of @username'));
bot.help(ctx => ctx.reply('Send me an ORGiD or a Telegram user profile name'));

// Actions
bot.action(/^resolveOrgIdSummary:\d+$/, onActionResolveOrgIdSummary);
bot.action('resolveOrgId', onActionResolveOrgId);

// Events handlers
bot.on('message', onMessage);
// bot.on('inline_query', onInlineQuery);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start the Bot
// bot.launch();
// if  (!webhookEnabled) {
//   bot.launch();
// }

if  (webhookEnabled) {
  bot.telegram.setWebhook(webhookPath);
}

// AWS Lambda handler
// module.exports.handler = makeHandler(
//   bot.webhookCallback(webhookPath)
// );

module.exports.handler = telegrafAws(bot);
