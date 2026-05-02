const { clearCookies } = require('../store');

function logout() {
  clearCookies();
  console.log('Logged out. Credentials cleared.');
}

module.exports = { logout };
