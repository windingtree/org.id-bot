const {
  Telegraf
} = require('telegraf');
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

bot.catch(error => console.error('Unhandled error:', error));
bot.start(ctx => ctx.replyWithMarkdown('Hi I\'m the *ORGiD Bot* powered by *Winding Tree*. I am here to help you with your verification needs. Please provide a Telegram Username in the format of @username'));
bot.help(ctx => ctx.reply('Send me an ORGiD or a Telegram user profile name'));

// Actions
bot.action(/^resolveOrgIdSummary:\d+$/, onActionResolveOrgIdSummary);
bot.action('resolveOrgId', onActionResolveOrgId);

// Events handlers
bot.on('message', onMessage);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start the Bot
if  (!webhookEnabled) {
  bot.launch();
} else {
  bot.telegram.setWebhook(webhookPath);
}

// AWS Lambda handler
module.exports.handler = telegrafAws(bot);
