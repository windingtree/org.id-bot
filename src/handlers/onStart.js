const { Markup } = require('telegraf');

const botIntroText = `Hi there!

I am the one and only ORGiD Bot created by Winding Tree.

The world of cryptocurrency is rife with scammers and phishing attempts. My job is to help you verify people on Telegram using blockchain technology so that you can do business with confidence in a digital world.

Try asking me @praawt for an example.`;

// Send message on the bot start
module.exports = async ctx => await ctx.replyWithMarkdown(
  botIntroText,
  Markup.inlineKeyboard([
    Markup.button.callback('How it works', '/info'),
  ])
);
