const botInfoText = `HOW IT WORKS

Send me a Telegram username and I'll check if they are listed in an ORGiD.

If I find the username is, in fact, associated with an ORGiD, I respond with a report telling you which organization(s) they represent and a list of their social accounts.

However, if the username you sent is not connected with an ORGiD, you will receive a WARNING message. You can try it out now by sending me a random username.

This helps you weed out the scammers and keeps you talking with real people.

[Here is a step-by-step guide](https://blog.windingtree.com/setting-up-an-orgid-in-the-winding-tree-ddcfa086cfb5) about how to set up your very own ORGiD.`

// Command `/info` handler
module.exports = ctx => ctx.replyWithMarkdown(botInfoText);
