const { getVerifiedTokens } = require('../utils/auth');
const {
  setSession,
  addVerifiedUserToSession
} = require('../utils/session');
const { resolveOrgId } = require('../utils/auth');

const {
  unauthorizedUserMessagesLimit,
  messagesHandlerMode
} = require('../config');

const replayWithSplit = (ctx, message) => message
    .match(/(.|[\r\n]){1,4095}/gm)
    .map(m => ctx.reply(`${m}\n`));

const handleDirectMessages = async ctx => {
  const query = ctx.message.text;

  if (query && query.match(/^[@]*[a-zA-Z._-]+$/)) {
    const verifiedTokens = await getVerifiedTokens(query.match(/^[@]*([a-zA-Z._-]+)$/)[1]);

    if (verifiedTokens.length > 0) {
      const orgIds = [];
      for (const verifiedToken of verifiedTokens) {
        orgIds.push(verifiedToken.sub.did.split(':')[2]);
      }
      return ctx.reply(`User @${query} is officially representing following ORGiDs: ${orgIds.join('; ')}`);
    } else {
      return ctx.reply(`User @${query} does not represent any ORGiD registered company`);
    }
  } else if (query && query.match(/^0x\w{64}$/)) {
    const didResult = await resolveOrgId(query);
    await Promise.all(replayWithSplit(ctx, JSON.stringify(didResult, null, 2)));
  } else {
    return ctx.reply(`Your "${query}" does not looks like an ORGiD neither profile name`);
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
