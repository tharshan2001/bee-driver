const path = require('path');

// Local native modules, linked into android/ every time it is built.
module.exports = {
  dependencies: {
    'ebee-location': { root: path.join(__dirname, 'modules', 'ebee-location') },
  },
};
