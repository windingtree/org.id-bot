const { resolveOrgId } = require('../utils/auth');
const { replayWithSplit } = require('../utils/message');

// Resolve an ORGiD chosen by action
module.exports.onActionResolveOrgId = async ctx => {
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
    const didResult = await resolveOrgId(orgId);
    await ctx.reply(`ORGiD ${orgId} resolution result:`);
    await replayWithSplit(ctx, JSON.stringify(didResult, null, 2));
  } catch (error) {
    console.log('Error:', error);
    await ctx.answerCbQuery(`Something goes wrong`);
  }
}
