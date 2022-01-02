const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 * 7 }); // 1 week

module.exports = {
  set: (key, value) => {
    console.log('set: ', key, ' ', value);
    cache.set(key, value);
  },
  get: key => {
    return cache.get(key);
  },
  has: key => {
    return cache.has(key);
  },
};
