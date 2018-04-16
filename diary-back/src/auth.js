const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config');

module.exports = {
  init: () => {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.GITHUB_CLIENT_ID,
          clientSecret: config.GITHUB_CLIENT_SECRET,
          callbackURL:
            'http://deardiary.network:14432/api/oauth/github/callback',
        },
        function(accessToken, refreshToken, profile, cb) {
          delete profile.raw;
          return cb(null, profile);
        }
      )
    );

    passport.use(
      new LocalStrategy(function(username, password, done) {
        // this way we use boyangwang for local dev, and forbid prod access
        if (
          process.env.NODE_ENV === 'production' &&
          username === 'boyangwang'
        ) {
          return done(null, false);
        }

        const user = config.users.find((u) => u.username == username);
        if (user && password == user.password) {
          done(null, { username: user.username });
        } else {
          done(null, false);
        }
      })
    );

    passport.serializeUser(function(user, done) {
      done(null, user);
    });
    passport.deserializeUser(function(user, done) {
      done(null, user);
    });
  },
  authenticateCallback: async (ctx, next) => {
    return await passport.authenticate(
      'local',
      async (err, user, info, status) => {
        if (user) {
          ctx.status = 200;
          ctx.body = { data: { user } };
          return ctx.login(user);
        } else {
          console.mylog('Login failure', ctx.request.body);
          ctx.status = 401;
          return (ctx.body = { err: 'Login failure' });
        }
      }
    )(ctx, next);
  },
  verifyAuthenticated: async (ctx, next) => {
    if (ctx.isAuthenticated()) {
      await next();
    } else {
      ctx.status = 401;
      ctx.body = { err: 'need login' };
    }
  },
  logout: async (ctx) => {
    await ctx.logout();
    ctx.response.status = 200;
    ctx.response.body = { data: { user: null } };
  },
  oauthGithub: async (ctx, next) => {
    return await passport.authenticate('github')(ctx, next);
  },
  oauthGithubCallback: async (ctx, next) => {
    return await passport.authenticate(
      'github',
      async (err, user, info, status) => {
        if (user) {
          ctx.status = 200;
          ctx.body = { data: { user } };
          await ctx.login(user);
          return ctx.redirect('/');
        } else {
          console.mylog('Login failure', ctx.request.body);
          ctx.status = 401;
          return (ctx.body = { err: 'Login failure' });
        }
      }
    )(ctx, next);
  },
};
