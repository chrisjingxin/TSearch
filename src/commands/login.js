const readline = require('readline');
const { waitForActivePortFile } = require('../discovery');
const { connectCDP, getTargets, attachToTarget, sendCommandToSession, getCookies, createTarget, close } = require('../cdp');
const { saveCookies } = require('../store');

const TABBIT_URL = 'https://web.tabbitbrowser.com/newtab';

async function login() {
  console.log('Connecting to Tabbit browser...');
  let discovery;
  try {
    discovery = waitForActivePortFile(5);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  console.log(`Found Tabbit at port ${discovery.port}`);

  let ws;
  try {
    ws = await connectCDP(discovery.wsEndpoint);
  } catch (err) {
    console.error(`Failed to connect to Tabbit CDP: ${err.message}`);
    process.exit(1);
  }

  console.log(`Opening ${TABBIT_URL} ...`);
  try {
    await createTarget(ws, TABBIT_URL);
  } catch (err) {
    console.error(`Failed to open tab: ${err.message}`);
    close(ws);
    process.exit(1);
  }

  console.log('\nA new tab has been opened in Tabbit.');
  console.log('Please complete login in the browser, then press Enter here...');

  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });

  console.log('Reading cookies from Tabbit...');

  // Find the tabbitweb page target
  let targets;
  try {
    targets = await getTargets(ws);
  } catch (err) {
    console.error(`Failed to get targets: ${err.message}`);
    close(ws);
    process.exit(1);
  }

  const pageTarget = targets.find(t =>
    t.type === 'page' && t.url && t.url.includes('web.tabbitbrowser.com')
  );

  if (!pageTarget) {
    console.error('Could not find a tabbitbrowser.com page tab.');
    close(ws);
    process.exit(1);
  }

  // Attach to the page target to get a session
  let sessionId;
  try {
    sessionId = await attachToTarget(ws, pageTarget.targetId);
  } catch (err) {
    console.error(`Failed to attach to target: ${err.message}`);
    close(ws);
    process.exit(1);
  }

  // Enable Network domain on the session
  try {
    await sendCommandToSession(ws, sessionId, 'Network.enable');
  } catch (err) {
    console.error(`Failed to enable Network: ${err.message}`);
    close(ws);
    process.exit(1);
  }

  // Get cookies via the session
  let cookies;
  try {
    cookies = await getCookies(ws, ['https://web.tabbitbrowser.com'], sessionId);
  } catch (err) {
    console.error(`Failed to read cookies: ${err.message}`);
    close(ws);
    process.exit(1);
  }

  close(ws);

  if (!cookies || cookies.length === 0) {
    console.error('No cookies found for web.tabbitbrowser.com. Login may not have completed.');
    process.exit(1);
  }

  saveCookies(cookies);
  console.log(`Saved ${cookies.length} cookies to ~/.tabbit/credentials`);
  console.log('Login successful!');
}

module.exports = { login };
