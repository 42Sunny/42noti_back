const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 * 7 }); // 1 week

const set = (key, value, ttl) => {
  console.log('cache set: ', key, ' ', value);
  cache.set(key, value, ttl);
};

const get = key => {
  return cache.get(key);
};

const has = key => {
  return cache.has(key);
};

module.exports = {
  set,
  get,
  has,
};
