const { search: apiSearch } = require('../api');

async function search(query, opts) {
  await apiSearch(query, opts);
}

module.exports = { search };
