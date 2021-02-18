const {
  Telegraf,
  session
} = require('telegraf');

const { botToken } = require('./config');
const { onMessage } = require('./handlers/message')
// const { onInlineQuery } = require('./handlers/inlineQuery');

const bot = new Telegraf(botToken);
bot.use(session());
bot.catch(error => console.error('Unhandled error:', error));
bot.start(ctx => ctx.reply('Welcome to the ORGiD Resolver Bot'));
bot.help(ctx => ctx.reply('Send me an ORGiD or a Telegram user profile name'));

// Events handlers
bot.on('message', onMessage);
// bot.on('inline_query', onInlineQuery);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start the Bot
bot.launch();
