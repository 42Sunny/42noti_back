const passport = require('passport');
const FortyTwoStrategy = require('passport-42').Strategy;
const env = require('../config');
// const User = require('../models/user');

module.exports = app => {
  passport.use(
    new FortyTwoStrategy(
      {
        clientID: env.fortytwoClientId,
        clientSecret: env.fortytwoClientSecret,
        callbackURL: `http://${env.back.host}:${env.back.port}/login/42/return`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        console.log('accessToken', accessToken);
        console.log('refreshToken', refreshToken);
        console.log('profile', profile);
        try {
//          const user = await User.findOne({
//            where: {
//              intraDataId: profile.id,
//            }
//          });
//          if (user) {
//            return done(null, user);
//          }
//          const newUser = await User.create({
//            intraDataId: profile.id,
//            intraDataLogin: profile.username,
//             email: profile.emails[0].value,
//             profile: profile._json,
//             role: profile._json.staff ? 'staff' : 'cadet',
//             accessToken,
//             refreshToken,
//           });
//           return done(null, newUser);
          return;
        } catch (err) {
          done(err);
        }
      },
    ),
  );

  passport.serializeUser(function (user, callback) {
    callback(null, user);
  });

  passport.deserializeUser(function (obj, callback) {
    callback(null, obj);
  });

  app.use(passport.initialize());
  app.use(passport.session());
};
