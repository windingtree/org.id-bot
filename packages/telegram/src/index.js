const {
  Telegraf,
  session
} = require('telegraf');

const { botToken } = require('./config');
const {
  onActionResolveOrgIdSummary,
  onActionResolveOrgId
} = require('./handlers/actionResolveOrgId');
const { onMessage } = require('./handlers/message');
// const { onInlineQuery } = require('./handlers/inlineQuery');

const bot = new Telegraf(botToken);
bot.use(session());
bot.catch(error => console.error('Unhandled error:', error));
bot.start(ctx => ctx.replyWithMarkdown(`*Hello, i'm ORGiD bot*

If you suspect a person in Telegram claiming that he or she represents Winding Tree, I can easily check if that's a real person or a scammer.

Send me the Telegram handle of that user and I will look it up from the ORGiD. If i find that handle in the ORGiD — you can trust this person. If not — then i will say what to do next
`));
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
bot.launch();
