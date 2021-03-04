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
const handleHelpCommand = require('./handlers/commandHelp');
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

bot.catch(error => console.error('Unhandled error:', error));
bot.start(ctx => ctx.replyWithMarkdown(
  `Hi I'm the *ORGiD Bot* powered by *Winding Tree*. I can help you with verifying people on Telegram using ORGiD technology.

Try sending me @TheoCrypt to see how it works`,
  Markup.inlineKeyboard([
    Markup.button.callback('How it works', '/info'),
    Markup.button.callback('How to use', '/help')
  ])
));
bot.command('info', handleInfoCommand);
bot.help(handleHelpCommand);

// Actions
bot.action(/^previewOrgId:\d+$/, onActionPreviewOrgId);
bot.action('resolveOrgId', onActionResolveOrgId);
bot.action('/info', handleInfoCommand);
bot.action('/help', handleHelpCommand);

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
