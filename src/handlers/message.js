const { getVerifiedTokens } = require('../utils/auth');
const {
  setSession,
  addVerifiedUserToSession
} = require('../utils/session');
const {
  resolveOrgId,
} = require('../utils/auth');
const { replayWithSplit } = require('../utils/message');
const {
  orgIdsButton,
  orgIdReport
} = require('./actionResolveOrgId');

const {
  unauthorizedUserMessagesLimit,
  messagesHandlerMode
} = require('../config');

const handleDirectMessages = async ctx => {
  let query = ctx.message.text;

  if (ctx.message.forward_from && ctx.message.forward_from !== ctx.message.chat.username) {
    query = ctx.message.forward_from.username;
  } else if (ctx.message.forward_sender_name) {
    query = ctx.message.forward_sender_name;
  }

  if (query && query.match(/^0x\w{64}$/)) {
    const didResult = await resolveOrgId(query);
    await replayWithSplit(ctx, JSON.stringify(didResult, null, 2));
  } else if (query && query.match(/^[@]*[a-zA-Z0-9._-]+$/)) {
    query = query.match(/^[@]*([a-zA-Z0-9._-]+)$/)[1];
    const verifiedTokens = await getVerifiedTokens(query);

    if (verifiedTokens.length > 0) {
      // Single match
      if (verifiedTokens.length === 1) {
        const didResult = await resolveOrgId(verifiedTokens[0].sub.did.split(':')[2]);
        return orgIdReport(ctx, didResult, query);
      } else {
      // Multiple matches
        const didResults = await Promise.all(verifiedTokens.map(
          token => resolveOrgId(token.sub.did.split(':')[2])
        ));
        return ctx.replyWithMarkdown(
          `User *@${query}* is mentioned in several ORGiD records.

Click the buttons below to see resolution for each ORGiD record`,
          orgIdsButton(didResults, 'previewOrgId', true)
        );
      }
    } else {
      return ctx.reply(
        `This Telegram user isn’t mentioned in any of the ORGiD records.

If the user claims he or she represents an Organization, and you know that given Organization has an ORGiD, then it’s a concern`);
    }
  } else {
    return ctx.reply('Please make sure that the username is provided in the format of @username');
  }
};

const handleChatMessages = async (ctx, next) => {
  const username = ctx.message.from.username;
  ctx.session = setSession(ctx);

  if (ctx.session.users[username]) {
    console.log('Cached verified user', username);
    return next();
  }

  const verifiedTokens = await getVerifiedTokens(username);

  if (verifiedTokens.length > 0) {
    ctx.session = addVerifiedUserToSession(ctx, username, verifiedTokens);
    return next();
  }

  if (!ctx.session.unauthorizedUsers[username] ||
    ctx.session.unauthorizedUsers[username] >= unauthorizedUserMessagesLimit) {
    // Reset unauthorized user
    ctx.session.unauthorizedUsers[username] = 1;
    return ctx.reply(`Warning: User @${username} does not represent any ORGiD registered company`);
  } else {
    ctx.session.unauthorizedUsers[username] += 1;
    console.log(`Reset unauthorized user [${username}] messages count: ${ctx.session.unauthorizedUsers[username]}`);
  }
};

// Message handler
module.exports.onMessage = async (ctx, next) => {
  try {
    switch (messagesHandlerMode) {
      case 'chat':
        await handleChatMessages(ctx, next);
        break;
      default:
        await handleDirectMessages(ctx, next);
    }
  } catch (error) {
    console.log('Error:', error);
    return next();
  }

  return next();
};
