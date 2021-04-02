const {
  Telegraf,
  Markup
} = require('telegraf');
const telegrafAws = require('telegraf-aws');

const {
  botToken,
  webhookEnabled,
  webhookPath
} = require('./config');
const handleInfoCommand = require('./handlers/commandInfo');
const {
  onActionPreviewOrgId,
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

const botIntroText = `Hi there!

I am the one and only ORGiD Bot created by Winding Tree.

The world of cryptocurrency is rife with scammers and phishing attempts. My job is to help you verify people on Telegram using blockchain technology so that you can do business with confidence in a digital world.

Try asking me @TheoCrypt for an example.`

bot.catch(error => console.error('Unhandled error:', error));
bot.start(ctx => ctx.replyWithMarkdown(
  botIntroText,
  Markup.inlineKeyboard([
    Markup.button.callback('How it works', '/info'),
  ])
));
bot.command('info', handleInfoCommand);
bot.help(handleInfoCommand);

// Actions
bot.action(/^previewOrgId:\d+$/, onActionPreviewOrgId);
bot.action('resolveOrgId', onActionResolveOrgId);
bot.action('/info', handleInfoCommand);
bot.action('/help', handleInfoCommand);

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
