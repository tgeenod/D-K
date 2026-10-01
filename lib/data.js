// Unified data-layer exports. The former data/ directory has been merged into lib/.
const antiDelete = require('./antidel');
const store = require('./store');

module.exports = {
  ...antiDelete,
  ...store,
  UpdateDB: require('./updateDB').UpdateDB,
  setCommitHash: require('./updateDB').setCommitHash,
  getCommitHash: require('./updateDB').getCommitHash,
  audioConverter: require('./converter'),
  stickerConverter: require('./sticker-converter'),
};
