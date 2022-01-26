const passport = require('passport');
const context = require('express-http-context');
const FortyTwoStrategy = require('passport-42').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const env = require('../config');
const User = require('../models/user.model');

const fortytwoStrategyCallback = async (
  accessToken,
  refreshToken,
  profile,
  done,
) => {
  console.log('fortytwoStrategyCallback');
  console.log('accessToken ', accessToken);
  console.log('refreshToken ', refreshToken);
  const {
    intraId,
    intraUsername,
    intraProfilePageUrl,
    displayName,
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
      return done(null, { ft: foundedUser });
    }
    const newUserData = {
      intraId,
      intraUsername,
      intraProfilePageUrl,
      displayName,
      email,
      role: isStaff ? 'staff' : 'cadet',
      accessToken,
      refreshToken:
        typeof refreshToken === String
          ? refreshToken
          : refreshToken.access_token,
    };
    return done(null, { ft: newUserData });
  } catch (err) {
    done(err);
  }
};

const validate = payload => {
  context.set('login', payload?.username ? payload?.username : '');
  // TODO: logger

  return { _id: payload.sub, name: payload.username };
};

const jwtStrategyCallback = async (jwt_payload, done) => {
  try {
    const user = validate(jwt_payload);
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
  return req.cookies[env.cookie.auth];
};

module.exports = app => {
  passport.use(
    new FortyTwoStrategy(
      {
        clientID: env.fortytwoApi.clientId,
        clientSecret: env.fortytwoApi.clientSecret,
        callbackURL: env.fortytwoApi.redirectUri,
        // passReqToCallback: true,
        profileFields: {
          intraId: obj => String(obj.id),
          intraUsername: 'login',
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
        secretOrKey: env.cookie.secret,
      },
      jwtStrategyCallback,
    ),
  );

  app.use(passport.initialize());
};

