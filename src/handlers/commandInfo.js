// Command `/info` handler
module.exports = ctx => ctx.replyWithMarkdown(`
Primarily, I can search decentralized cryptographically powered network for evidence about an internet user and help you with finding out can you trust that user or not

The mechanics are simple:

1. Organizations create their digital identity records — ORGiD and store them in the decentralized web

2. There they write information about which telegram users are legit representatives ot this organization

3. The Bot resolves this ORGiD records, sees its contents and checks if a user you asked is mentioned in any of those ORGiD’s in the network

Try sending me @TheoCrypt to see how it works
`);
