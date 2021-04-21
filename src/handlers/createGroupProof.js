const { resolveOrgId } = require('../utils/auth');
const { createVc } = require('@windingtree/vc');
const { vcIssuerDid, vcKey, vcKeyType } = require('../config');

// Create proof as VC for the current group
module.exports = async ctx => {
  try {
    if (!ctx.chat || ctx.chat.type !== 'supergroup') {
      throw new Error('Proof can be requested from the group chat only');
    }
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    const isAdmin = admins
      .filter(a => a.user.username === ctx.message.from.username).length === 1;
    if (!isAdmin) {
      throw new Error('Proof can be requested by the group administrator only');
    }
    const orgId = ctx.message.text.split('/proof ')[1];
    await ctx.reply(`Resolving of the ${orgId} is started. Please wait`);
    const didResult = await resolveOrgId(orgId);
    console.log(ctx.chat);

    const issuerDid = vcIssuerDid;
    const holderDid = didResult.didDocument.id;
    const vcType = 'TrustAssertion';
    const verificationMethod = `${issuerDid}#key2`;
    const signatureType = vcKeyType;
    const privateKey = vcKey;
    const proofPurpose = 'assertionMethod';
    const subject = {
      id: holderDid,
      type: 'social',
      claim: `https://t.me/${ctx.chat.username}`
    };
    const vc = createVc(
      subject,
      issuerDid,
      holderDid,
      vcType,
      verificationMethod,
      signatureType,
      privateKey,
      proofPurpose
    );
    const vcBuffer = Buffer.from(JSON.stringify(vc, null, 2), 'utf8');
    await ctx.reply(`Please upload following proof to the org.json of the ${holderDid}`);
    await ctx.replyWithDocument({
      source: vcBuffer,
      filename: 'group_verification_proof.json'
    });
  } catch (error) {
    ctx.reply(error.message);
  }
};
