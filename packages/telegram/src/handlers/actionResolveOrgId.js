const { Markup } = require('telegraf');
const { resolveOrgId } = require('../utils/auth');
const { replayWithSplit } = require('../utils/message');
const {
  getDeepValue
} = require('../utils/object');

const orgIdButton = orgId => Markup.inlineKeyboard(
  [
    Markup.button.callback(
      orgId,
      'resolveOrgId'
    )
  ]
);

// Resolve an OrgId and print a summary
module.exports.onActionResolveOrgIdSummary = async ctx => {
  try {
    // Extract query from the callback data
    const dataIndex = Number(ctx.callbackQuery.data.split(':')[1]);
    const orgId = ctx
      .callbackQuery
      .message
      .reply_markup
      .inline_keyboard[0][dataIndex]
      .text;

    // Show welcome message
    await ctx.answerCbQuery(`Resolving of the ${orgId} is started. Please wait`);

    // Resolve an ORGiD and print info
    const { didDocument, trust } = await resolveOrgId(orgId);

    // Extract a summary data from didDocument
    const logo = getDeepValue(didDocument, 'legalEntity.media.logo') ||
      getDeepValue(didDocument, 'organizationalUnit.media.logo');
    const name = getDeepValue(didDocument, 'legalEntity.legalName') ||
      getDeepValue(didDocument, 'organizationalUnit.name');
    const website = getDeepValue(didDocument, 'legalEntity.contacts[0].website') ||
      getDeepValue(didDocument, 'organizationalUnit.contacts[0].website');
    const trustAssertions = trust.assertions
      .reduce(
        (a, v) => ({
          ...a,
          [v.type]: v.verified
        }),
        {}
      );

    // Send summary to chat
    await ctx.replyWithMarkdown(`ORGiD: *${orgId}*`);
    if (logo) {
      await ctx.replyWithPhoto({
        url: logo
      });
    }
    await ctx.replyWithMarkdown(`
*Company:* ${name}
*Website:* ${website || 'not defined in ORG.JSON'} ${website && trustAssertions.domain ? '(verified)' : ''}
`);

    // Print additional button for getting details
    await ctx.replyWithMarkdown(
      `Interested in learning more about the *${name}* ORGiD? Click the button below.`,
      orgIdButton(orgId)
    );
  } catch (error) {
    console.log('Error:', error);
    await ctx.answerCbQuery(`Something goes wrong`);
  }
};

// Resolve an ORGiD chosen by action
module.exports.onActionResolveOrgId = async ctx => {
  try {
    // Extract query from the callback data
    const orgId = ctx
      .callbackQuery
      .message
      .reply_markup
      .inline_keyboard[0][0]
      .text;

    // Show welcome message
    await ctx.answerCbQuery(`Resolving of the ${orgId} is started. Please wait`);

    // Resolve an ORGiD and print info
    const didResult = await resolveOrgId(orgId);
    await ctx.reply(`ORGiD ${orgId} resolution report:`);
    await replayWithSplit(ctx, JSON.stringify(didResult, null, 2));
  } catch (error) {
    console.log('Error:', error);
    await ctx.answerCbQuery(`Something goes wrong`);
  }
}
