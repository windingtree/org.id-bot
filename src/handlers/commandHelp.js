// Command `/help` handler
module.exports = ctx => ctx.replyWithMarkdown(`
You can

1. Send a Telegram username in the format of @username to the Bot and the Bot will search if it’s associated with any *ORGiD*

2. Forward any message from any Telegram user to the Bot, and the Bot will extract the username and also search for evidence about that user

3. Send an ORGiD address to the Bot and the Bot will return a complete resolution report about given *ORGiD*

Try sending me @TheoCrypt to see how it works
`);
