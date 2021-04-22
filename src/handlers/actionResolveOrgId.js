const moment = require('moment');
const { Markup } = require('telegraf');
const {
  resolveOrgId,
  fetchOrgIdCreationDate,
  fetchLifDepositCreationDate,
  web3
} = require('../utils/auth');
const { replayWithSplit } = require('../utils/message');
const { withEllipsis } = require('../utils/string');
const {
  getDeepValue
} = require('../utils/object');
const { ethereumNetwork } = require('../config');

// const orgIdButton = orgId => Markup.inlineKeyboard(
//   [
//     Markup.button.callback(
//       orgId,
//       'resolveOrgId'
//     )
//   ]
// );

// Resolve an OrgId and print a summary
// module.exports.onActionResolveOrgIdSummary = async ctx => {
//   try {
//     // Extract query from the callback data
//     const dataIndex = Number(ctx.callbackQuery.data.split(':')[1]);
//     const orgId = ctx
//       .callbackQuery
//       .message
//       .reply_markup
//       .inline_keyboard[0][dataIndex]
//       .text;

//     // Show welcome message
//     await ctx.answerCbQuery(`Resolving of the ${orgId} is started. Please wait`);

//     // Resolve an ORGiD and print info
//     const { didDocument, trust } = await resolveOrgId(orgId);

//     // Extract a summary data from didDocument
//     const logo = getDeepValue(didDocument, 'legalEntity.media.logo') ||
//       getDeepValue(didDocument, 'organizationalUnit.media.logo');
//     const name = getDeepValue(didDocument, 'legalEntity.legalName') ||
//       getDeepValue(didDocument, 'organizationalUnit.name');
//     const website = getDeepValue(didDocument, 'legalEntity.contacts[0].website') ||
//       getDeepValue(didDocument, 'organizationalUnit.contacts[0].website');
//     const trustAssertions = trust.assertions
//       .reduce(
//         (a, v) => ({
//           ...a,
//           [v.type]: v.verified
//         }),
//         {}
//       );

//     // Send summary to chat
//     await ctx.replyWithMarkdown(`ORGiD: *${orgId}*`);
//     if (logo) {
//       await ctx.replyWithPhoto({
//         url: logo
//       });
//     }
//     await ctx.replyWithMarkdown(`
// *Company:* ${name}
// *Website:* ${website || 'not defined in ORG.JSON'} ${website && trustAssertions.domain ? '(verified)' : ''}
// `);

//     // Print additional button for getting details
//     await ctx.replyWithMarkdown(
//       `Interested in learning more about the *${name}* ORGiD? Click the button below.`,
//       orgIdButton(orgId)
//     );
//   } catch (error) {
//     console.log('Error:', error);
//     await ctx.answerCbQuery('Something goes wrong');
//   }
// };

// Resolve an ORGiD and show report with raw data obtained from the resolver
const resolveOrgIdFlow = async (ctx, orgId) => {
  // Show welcome message
  await ctx.answerCbQuery(`Resolving of the ${orgId} is started. Please wait`);

  // Resolve an ORGiD and print info
  const didResult = await resolveOrgId(orgId);
  await ctx.reply(`A raw ORGiD ${orgId} resolution report:`);
  await replayWithSplit(
    ctx,
    `${JSON.stringify(didResult, null, 2)}\n\nSee technical documentation for ORGiD standard at developers.windingtree.com`
  );
};

// Prints button(s) for getting ORGiD report
const orgIdsButton = (didResults, action = 'resolveOrgId', indexed = false) => Markup.inlineKeyboard(
  didResults.map(
    ({ didDocument }, index) => {
      const name = getDeepValue(didDocument, 'legalEntity.legalName') ||
        getDeepValue(didDocument, 'organizationalUnit.name');
      const orgId = didDocument.id.split(':')[2];
      return Markup.button.callback(`${name} — ${orgId}`, `${action}${indexed ? ':'+index : ''}`);
    }
  )
);
module.exports.orgIdsButton = orgIdsButton;

const parseTrustAssertions = didResult => {
  let isSomeEvidenceWrong = false;
  const trustAssertions = getDeepValue(didResult, 'trust.assertions');
  const websites = trustAssertions.reduce(
    (a, v) => {
      if (v.type === 'domain') {
        const dnsVerified = trustAssertions.filter(t => t.type === 'dns' && t.claim === v.claim && t.verified)[0];
        const domainVerified = dnsVerified || v.verified;
        let creationDate;
        if (v.whois) {
          creationDate = ` domain registered on ${moment(v.whois.creationDate).format('DD MMM YYYY')} (from WHOIS data)`;
        }
        if (!domainVerified) {
          isSomeEvidenceWrong = true;
        }
        a.push(`${domainVerified ? '✅' : '⚠'} Website [${v.claim}](${v.proof})${domainVerified ? ' — verified' : ''}\n${creationDate}\n`);
      }
      return a;
    },
    []
  );
  const other = trustAssertions.reduce(
    (a, v) => {
      if (
        v.type === 'social' &&
        !v.claim.match(/facebook/gi) &&
        !v.claim.match(/linkedin/gi) &&
        !v.claim.match(/instagram/gi)
      ) {
        const socialVerified = v.verified;
        let proofSubject = '';
        if (v.claim.match(/twitter/i)) {
          proofSubject = 'Twitter';
        } else if (v.claim.match(/t.me/i)) {
          proofSubject = 'Telegram';
        }
        if (v.proof.match(/^http/)) {
          // ORGiD publishing case
          a.push(`${socialVerified ? '✅' : '⚠'} ${proofSubject !== '' ? proofSubject+' — ' : ''}[${withEllipsis(v.proof, 34)}](${v.proof})${socialVerified ? ' — verified' : ''}`);
        } else if (v.proof.match(/^did/)) {
          // VC proof case
          a.push(`${socialVerified ? '✅' : '⚠'} ${proofSubject !== '' ? proofSubject+' — ' : ''}[${v.claim}](${v.claim})${socialVerified ? ' — verified' : ''}`);
        } else {
          // Unknown proof type
          console.log(`Unknown proof type provided: ${v.claim}`);
        }
        if (!socialVerified) {
          isSomeEvidenceWrong = true;
        }
      }
      return a;
    },
    []
  );

  return {
    evidence: `${websites.length > 0 ? websites.join('\n') : ''}
${other.length > 0 ? other.join('\n') : ''}`.trim(),
    isSomeEvidenceWrong
  };
};
module.exports.parseTrustAssertions = parseTrustAssertions;

// Generate ORGiD resolver report
const orgIdReport = async (ctx, didResult, query) => {
  let isSomethingWrong = false;
  const name = getDeepValue(didResult.didDocument, 'legalEntity.legalName') ||
    getDeepValue(didResult.didDocument, 'organizationalUnit.name');

  const { evidence, isSomeEvidenceWrong } = parseTrustAssertions(didResult);
  const {
    orgIdCreationDate,
    isFresh
  } = await fetchOrgIdCreationDate(didResult.id);

  const lifStakeWei = getDeepValue(didResult, 'lifDeposit.deposit');
  const lifStakeWithdrawalRequest = getDeepValue(didResult, 'lifDeposit.withdrawalRequest');
  const lifStake = web3.utils.fromWei(lifStakeWei);
  const isLifStakeOk = lifStake !== '0';
  let lifStakeDate = false;
  if (isLifStakeOk) {
    lifStakeDate = await fetchLifDepositCreationDate(didResult.id);
  } else {
    isSomethingWrong = true;
  }
  if (isSomeEvidenceWrong) {
    isSomethingWrong = true;
  }

  return ctx.replyWithMarkdown(
    `${query ? 'User *@'+query+'* is connected with following ORGiD:\n' : ''}
*${name}*
ORGiD — [${withEllipsis(didResult.id, 10)}](https://${ethereumNetwork === 'ropsten' ? 'staging.' : ''}marketplace.windingtree.com/organization/${didResult.id}) ${orgIdCreationDate ? '— created on '+orgIdCreationDate : ''}

*EVIDENCE*

${evidence ? evidence : '❌ No evidence provided'}

${isLifStakeOk ? '✅ LÍF stake — '+lifStake+' LÍF staked on '+lifStakeDate : '❌ LÍF stake — not staked'}${lifStakeWithdrawalRequest !== null ? '\n⚠ Attention! The organization has sent a stake withdrawal request\n' : ''}

${isSomethingWrong ? '⚠ Double check each link to verify authenticity. ⚠' : '*IMPORTANT*: Double check each link to verify authenticity of the organization.'}
${isFresh ? '⚠ ORGiD registered only 1 day ago. ⚠' : ''}`,
    {
      disable_web_page_preview: true,
      ...orgIdsButton([
        didResult
      ])
    }
  );
};
module.exports.orgIdReport = orgIdReport;
// disable_web_page_preview: true,

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
      .inline_keyboard[0][ctx.callbackQuery.data.split(':')[1] || 0]
      .text
      .match(/0x[a-z0-9]{64}/)[0];

    const didResult = await resolveOrgId(orgId);
    orgIdReport(ctx, didResult);
  } catch (error) {
    console.log('Error:', error);
    await ctx.answerCbQuery('Something gone wrong');
  }
};
