const { Markup } = require('telegraf');
const { getVerifiedTokens } = require('../utils/auth');
const {
  setSession,
  addVerifiedUserToSession
} = require('../utils/session');
const { resolveOrgId } = require('../utils/auth');
const { replayWithSplit } = require('../utils/message');
const { getDeepValue } = require('../utils/object');

const {
  unauthorizedUserMessagesLimit,
  messagesHandlerMode
} = require('../config');

const orgIdsButton = orgIds => Markup.inlineKeyboard(
  orgIds.map(
    (orgId, index) => Markup.button.callback(
      orgId,
      `resolveOrgIdSummary:${index}`
    )
  )
);

const handleDirectMessages = async ctx => {
  let query = ctx.message.text;

  if (ctx.message.forward_from && ctx.message.forward_from !== ctx.message.chat.username) {
    query = ctx.message.forward_from.username;
  } else if (ctx.message.forward_sender_name) {
    query = ctx.message.forward_sender_name;
  }

  if (query && query.match(/^[@]*[a-zA-Z._-]+$/)) {
    query = query.match(/^[@]*([a-zA-Z._-]+)$/)[1];
    const verifiedTokens = await getVerifiedTokens(query);

    if (verifiedTokens.length > 0) {
      const orgIds = [];
      for (const verifiedToken of verifiedTokens) {
        orgIds.push(verifiedToken.sub.did.split(':')[2]);
      }

      if (verifiedTokens.length === 1) {
        const { didDocument } = await resolveOrgId(verifiedTokens[0].sub.did.split(':')[2]);
        const name = getDeepValue(didDocument, 'legalEntity.legalName') ||
          getDeepValue(didDocument, 'organizationalUnit.name');
        const website = getDeepValue(didDocument, 'legalEntity.contacts[0].website') ||
          getDeepValue(didDocument, 'organizationalUnit.contacts[0].website');
        let websiteNote = '';
        if (website) {
          websiteNote = ` which can be found at ${website}`;
        }
        return ctx.replyWithMarkdown(
          `User *@${query}* is an official representative of *${name}*${websiteNote}.
You can retrieve detailed ORGiD resolution report by clicking on the ORGiD button below`,
          orgIdsButton(orgIds)
        );
      } else {
        return ctx.replyWithMarkdown(
          `User *@${query}* is associated with multiple ORGiD's.
You can retrieve detailed ORGiD resolutions reports by clicking on the button below`,
          orgIdsButton(orgIds)
        );
      }
    } else {
      return ctx.reply(
        `This person does not appear to be authorized to speak on behalf of any organization.
This does not mean they are not a real person or a scammer, just that they don't have authorization to speak on behalf of an organization dictated via an ORGiD record`);
    }
  } else if (query && query.match(/^0x\w{64}$/)) {
    const didResult = await resolveOrgId(query);
    await replayWithSplit(ctx, JSON.stringify(didResult, null, 2));
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
