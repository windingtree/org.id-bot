# org.id-bot
An interactive ORGiD resolver for social networks and web

## Setup

```bash
yarn install
```

## Configuration

To run a bot the following configuration should be available as environment variables.
For the local development please create `.env` file in the the root of the `./packages/telegram` directory:

```
BOT_TOKEN=<BOT_SECURE_TOKEN>
INFURA_KEY=<INFURA_PROJECT_ID>
ETHEREUM_NETWORK=<ETHEREUM_NETWORK_NAME:(mainnet|ropsten)>
MARKETPLACE_API_PATH=<MARKETPLACE_API_BASE_PATH:(eq: https://staging-api.marketplace.windingtree.com)>
MARKETPLACE_IPFS=<STAGING_IPFS_SERVER_URI:(eq: https://staging-ipfs.marketplace.windingtree.com)>
UNAUTHORIZED_USER_MESSAGES_LIMIT=5
MESSAGES_HANDLER_MODE=direct
WEBHOOK_ENABLED=yes
WEBHOOK_PATH=/
REDIS_HOST=<REDIS_HOST>
REDIS_PORT=<REDIS_PORT>
REDIS_PSWD=<REDIS_PASSWORD>
TWITTER_API_KEY=<TWITTER_API_KEY>
```

## Start the Bot

```bash
./scripts/servers/start.sh
yarn start
```

## License

This project is licensed under GPL v3. See [LICENSE](./LICENSE) for more details.
