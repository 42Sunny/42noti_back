const passport = require('passport');
const context = require('express-http-context');
const FortyTwoStrategy = require('passport-42').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const env = require('../config');
const User = require('../models/user');

const fortytwoStrategyCallback = async (
  req,
  accessToken,
  refreshToken,
  profile,
  done,
) => {
  console.log('accessToken ', accessToken);
  console.log('refreshToken ', refreshToken);
  // console.log('profile', profile);
  const {
    intraId,
    intraLogin,
    intraProfilePageUrl,
    email,
    isStaff,
  } = profile;

  try {
    const foundedUser = await User.findOne({
      where: {
        intraId,
      },
    });
    if (foundedUser) {
      foundedUser.accessToken = accessToken;
      foundedUser.refreshToken =
        typeof refreshToken === String
          ? refreshToken
          : refreshToken.access_token;
      foundedUser.email = email;

      await foundedUser.save();
      return done(null, { meetupData: foundedUser });
      // return done(null, foundedUser);
    }
    const newUserData = {
      intraId,
      intraLogin,
      intraProfilePageUrl,
      email,
      role: isStaff ? 'staff' : 'cadet',
      accessToken,
      refreshToken: typeof refreshToken === String
          ? refreshToken
          : refreshToken.access_token,
    };
    return done(null, { meetupData: newUserData });
    // / return done(null, newUserData );
  } catch (err) {
    done(err);
  }
};

const validate = payload => {
  context.set('login', payload?.username ? payload?.username : '');
  console.log("validate context.get('login')", context.get('login'));
  // TODO: logger

  return { _id: payload.sub, name: payload.username };
};

const jwtStrategyCallback = async (jwt_payload, done) => {
  try {
    console.log('jwt_payload', jwt_payload);
    const user = validate(jwt_payload);
    console.log('user', user);
    if (user._id) {
      return done(null, { jwt: user });
    } else {
      return done(null, null);
    }
  } catch (e) {
    logger.error(e);
    return done(null, null);
  }
};

const jwtExtractor = req => {
  // TODO: logger
  console.log(`req.cookies[${env.cookieAuth}]`, req.cookies[env.cookieAuth]);
  return req.cookies[env.cookieAuth];
};

module.exports = app => {
  passport.use(
    new FortyTwoStrategy(
      {
        clientID: env.fortytwoClientId,
        clientSecret: env.fortytwoClientSecret,
        callbackURL: `https://${env.back.host}:${env.back.port}/login/42/return`,
        // passReqToCallback: true,
        profileFields: {
          intraId: obj => String(obj.id),
          intraLogin: 'login',
          displayName: 'displayname',
          intraProfilePageUrl: 'url',
          email: 'email',
          isStaff: 'staff?',
        },
      },
      fortytwoStrategyCallback,
    ),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([jwtExtractor]),
        ignoreExpiration: false,
        secretOrKey: env.jwtSecret,
      },
      jwtStrategyCallback,
    ),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, done) {
    console.log('serializeUser user', user);
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    console.log('deserializeUser obj', obj);
    done(null, obj);
  });
};

