process.setMaxListeners(0);
const { Telegraf } = require('telegraf');
const telegrafAws = require('telegraf-aws');

const {
  botToken,
  webhookEnabled,
  webhookPath
} = require('./config');
const onStartMessage = require('./handlers/onStart');
const handleInfoCommand = require('./handlers/commandInfo');
const {
  onActionPreviewOrgId,
  onActionResolveOrgId
} = require('./handlers/actionResolveOrgId');
const { onInlineQuery } = require('./handlers/inlineQuery');
const { onMessage } = require('./handlers/message');
const handleCreateGroupProof = require('./handlers/createGroupProof');

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
bot.start(onStartMessage);
bot.help(handleInfoCommand);

// Commands
bot.command('info', handleInfoCommand);
bot.command('proof', handleCreateGroupProof);

// Actions
bot.action(/^previewOrgId:\d+$/, onActionPreviewOrgId);
bot.action('resolveOrgId', onActionResolveOrgId);
bot.action('/info', handleInfoCommand);
bot.action('/help', handleInfoCommand);

// Events handlers
bot.on('message', onMessage);

// Inline queries handler
bot.on('inline_query', onInlineQuery);

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
