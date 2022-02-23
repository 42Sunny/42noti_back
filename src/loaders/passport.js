const passport = require('passport');
const context = require('express-http-context');
const FortyTwoStrategy = require('passport-42').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const env = require('../config');
const { User } = require('../models');
const logger = require('../utils/winston');

const fortytwoStrategyCallback = async (accessToken, refreshToken, profile, done) => {
  logger.info(`accessToken: ${accessToken}`);
  logger.info(`refreshToken: ${refreshToken}`);
  const {
    intraId,
    intraUsername,
    intraProfilePageUrl,
    displayName,
    email,
    isStaff,
  } = profile;

  try {
    const existingUser = await User.findOne({
      where: {
        intraId,
      },
    });
    if (existingUser) {
      existingUser.accessToken = accessToken;
      existingUser.refreshToken =
        typeof refreshToken === String
          ? refreshToken
          : refreshToken.access_token;
      existingUser.email = email;

      await existingUser.save();
      return done(null, { ft: existingUser });
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
  } catch (error) {
    logger.error(error);
    done(error);
  }
};

const validate = payload => {
  context.set('login', payload?.username ? payload?.username : '');
  logger.info(`payload: ${JSON.stringify(payload)}`);

  return { _id: payload.sub, name: payload.username, role: payload.role };
};

const jwtStrategyCallback = async (jwt_payload, done) => {
  try {
    const user = validate(jwt_payload);
    if (user._id) {
      return done(null, { jwt: user });
    } else {
      return done(null, null);
    }
  } catch (error) {
    logger.error(error);
    return done(null, null);
  }
};

const jwtExtractor = req => {
  logger.info(`env.cookie.auth: ${env.cookie.auth} , req.cookies: ${JSON.stringify(req.cookies)}, ret:  ${req.cookies[env.cookie.auth]}`);
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

