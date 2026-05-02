const { listModels } = require('../api');

function models() {
  listModels();
}

module.exports = { models };
