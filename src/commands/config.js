const { loadConfig, setConfig } = require('../store');

function config(key, value) {
  if (!key) {
    // Show all config
    const cfg = loadConfig();
    if (Object.keys(cfg).length === 0) {
      console.log('暂无配置。使用 tabbit config <key> <value> 设置。');
      console.log('\n可用配置:');
      console.log('  model    默认搜索模型');
      return;
    }
    console.log('当前配置:\n');
    for (const [k, v] of Object.entries(cfg)) {
      console.log(`  ${k} = ${v}`);
    }
    return;
  }

  if (!value) {
    // Show specific key
    const val = loadConfig()[key];
    if (val !== undefined) {
      console.log(`${key} = ${val}`);
    } else {
      console.log(`${key} 未设置`);
    }
    return;
  }

  // Set key=value
  setConfig(key, value);
  console.log(`已设置 ${key} = ${value}`);
}

module.exports = { config };
