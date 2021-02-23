/* istanbul ignore file */
// This file ignored in coverage report because of this file not in usage for now

// Initialize or refresh session object
module.exports.setSession = ctx => {
  ctx.session = ctx.session || {};
  ctx.session.users = ctx.session.users || {};
  ctx.session.unauthorizedUsers = ctx.session.unauthorizedUsers || {};

  // Clean up cache
  ctx.session.users = Object.entries(ctx.session.users)
    .reduce(
      (a, v) => {
        // Exclude expired orgIds
        const orgId = Object.entries(v[1])
          .reduce(
            (s, b) => ({
              ...s,
              ...(
                b[1].expired > (Date.now() / 1000)
                  ? {
                    [b[0]]: b[1]
                  }
                  : {}
              )
            }),
            {}
          );
        return {
          ...a,
          ...(
            Object.keys(orgId) > 0
              ? {
                [v[0]]: orgId
              }
              : {}
          )
        };
      },
      {}
    );

  return ctx.session;
};

// Add verified user to a session
module.exports.addVerifiedUserToSession = (ctx, username, verifiedTokens) => {
  // users { username => { orgId => { accounts, expired } } }
  ctx.session = {
    ...ctx.session,
    users: {
      ...ctx.session.users,
      [username]: {}
    }
  };

  for (const verifiedToken of verifiedTokens) {
    ctx.session.users[username] = {
      ...ctx.session.users[username],
      [verifiedToken.sub.did.split(':')[2]]: {
        accounts: verifiedToken.sub.accounts,
        expired: verifiedToken.exp
      }
    };
  }

  return ctx.session;
};
