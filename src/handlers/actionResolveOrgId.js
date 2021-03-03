const { Markup } = require('telegraf');
const {
  resolveOrgId,
  fetchOrgIdCreationDate
} = require('../utils/auth');
const { replayWithSplit } = require('../utils/message');
const {
  getDeepValue,
  toChecksObject
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
    await ctx.answerCbQuery('Something goes wrong');
  }
};

const resolveOrgIdFlow = async (ctx, orgId) => {
  // Show welcome message
  await ctx.answerCbQuery(`Resolving of the ${orgId} is started. Please wait`);

  // Resolve an ORGiD and print info
  const didResult = await resolveOrgId(orgId);
  await ctx.reply(`A raw ORGiD ${orgId} resolution report:`);
  await replayWithSplit(ctx, JSON.stringify(didResult, null, 2));
};

// Prints button(s) for getting ORGiD report
const orgIdsButton = (didResults, action = 'resolveOrgId') => Markup.inlineKeyboard(
  didResults.map(
    ({ didDocument }) => {
      const name = getDeepValue(didDocument, 'legalEntity.legalName') ||
        getDeepValue(didDocument, 'organizationalUnit.name');
      const orgId = didDocument.id.split(':')[2];
      return Markup.button.callback(`${name} - ${orgId}`, action);
    }
  )
);
module.exports.orgIdsButton = orgIdsButton;

const parseTrustAssertions = didResult => {
  const trustAssertions = getDeepValue(didResult.didDocument, 'trust.assertions');
  const checks = toChecksObject(didResult.checks);
  let errors = [];
  if (checks.TRUST_ASSERTIONS.errors) {
    errors = checks.TRUST_ASSERTIONS.errors.map(
      error => getDeepValue(
        didResult.didDocument,
        error.split(':')[0]
      )
    );
  }
  const websites = trustAssertions.reduce(
    (a, v) => {
      if (v.type === 'domain') {
        const notVerified = errors.filter(e => (e.type === 'domain' && e.claim === v.claim))[0];
        a.push(`${notVerified ? '⚠' : '✅'} Website — ${v.claim}${notVerified ? ' — not verified yet' : ''}`);
      }
      return a;
    },
    []
  );
  const other = trustAssertions.reduce(
    (a, v) => {
      if (v.type !== 'domain' && v.type !== 'dns') {
        const notVerified = errors.filter(e => (e.type === 'domain' && e.claim === v.claim))[0];
        a.push(`${notVerified ? '⚠' : '✅'} Website — ${v.claim}${notVerified ? ' — not verified yet' : ''}`);
      }
      return a;
    },
    []
  );
  const lifStake = Number(getDeepValue(checks, 'lifDeposit.deposit'));

  return `${websites.length > 0 ? websites.join('\n') : ''}
${other.length > 0 ? other.join('\n') : ''}
${!isNaN(lifStake) && lifStake > 0 ? '✅ LÍF stake — '+lifStake+'LÍF' : '❌ LÍF stake — not staked'}`.trim();
};
module.exports.parseTrustAssertions = parseTrustAssertions;

// Generate ORGiD resolver report
const orgIdReport = async (ctx, didResult, query) => {
  const name = getDeepValue(didResult.didDocument, 'legalEntity.legalName') ||
    getDeepValue(didResult.didDocument, 'organizationalUnit.name');
  const evidence = parseTrustAssertions(didResult);
  const orgIdCreationDate = await fetchOrgIdCreationDate(didResult.id);
  return ctx.replyWithMarkdown(
    `${query ? 'User *@'+query+'* is mentioned in the following ORGiD:\n' : ''}
*ORGANIZATION NAME*

${name}

*EVIDENCE*

${evidence ? evidence : '❌ No evidence provided'}

✅ *ORGiD* ${orgIdCreationDate ? '— created on '+orgIdCreationDate : ''}
${didResult.id}

⚠ Beware of fake organizations, stolen identity attempts, and phishing. Double-check website spelling, social URL’s etc ⚠

You can retrieve raw ORGiD resolution report by clicking on the ORGiD button below`,
    orgIdsButton([
      didResult
    ])
  );
};
module.exports.orgIdReport = orgIdReport;

// Resolve an ORGiD and return didResult
module.exports.onActionResolveOrgId = async ctx => {
  try {
    // Extract query from the callback data
    const orgId = ctx
      .callbackQuery
      .message
      .reply_markup
      .inline_keyboard[0][0]
      .text
      .match(/0x[a-z0-9]{64}/)[0];

    await resolveOrgIdFlow(ctx, orgId);
  } catch (error) {
    console.log('Error:', error);
    await ctx.answerCbQuery('Something gone wrong');
  }
};

// Resolve an ORGiD and return report
module.exports.onActionPreviewOrgId = async ctx => {
  try {
    // Extract query from the callback data
    const orgId = ctx
      .callbackQuery
      .message
      .reply_markup
      .inline_keyboard[0][0]
      .text
      .match(/0x[a-z0-9]{64}/)[0];

    const didResult = await resolveOrgId(orgId);
    orgIdReport(ctx, didResult);
  } catch (error) {
    console.log('Error:', error);
    await ctx.answerCbQuery('Something gone wrong');
  }
};
