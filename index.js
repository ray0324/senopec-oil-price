const path = require('path');
const fs = require('fs');
const provinces = require('./provinces.json');

// 接口地址
const HOST = 'https://cx.sinopecsales.com';

// 文件存储路径
const DIST = './data';

/**
 * 请求入口获取会话
 * @returns {Promise<string>} cookie
 */
async function getCookie() {
  const res = await fetch(`${HOST}/yjkqiantai/core/main`, {
    method: 'GET',
  });
  return res.headers.get('Set-Cookie');
}

/**
 * 设置省份
 * @param {string} cookie
 * @param {provinceId} provinceId
 */
function setProvince(cookie, provinceId = '44') {
  return fetch(`${HOST}/yjkqiantai/data/switchProvince`, {
    headers: { cookie },
    body: `{"provinceId":"${provinceId}"}`,
    method: 'POST',
  });
}

/**
 * 今日油价
 * @param {string} cookie
 * @returns {Promise<object>} 返回数据
 */
async function getPriceData(cookie) {
  const res = await fetch(`${HOST}/yjkqiantai/data/initMainData`, {
    headers: { cookie },
    method: 'GET',
  });
  const json = await res.json();
  return json;
}

/**
 * 历史油价
 * @param {string} cookie
 * @returns {Promise<object>} 返回数据
 */
async function getHistoryPriceData(cookie) {
  const res = await fetch(`${HOST}/yjkqiantai/data/initOilPrice`, {
    headers: { cookie },
    method: 'GET',
  });
  const json = await res.json();
  return json;
}

/**
 * 生成jsong文件
 * @param {string} dist 文件存储路径
 * @param {object} data JSON对象
 */
function saveJson(filename, data) {
  // 生成时间
  data.createdAt = new Date();
  const filepath = path.resolve(DIST, `${filename}.json`);
  // ENOENT: no such file or directory, open
  // https://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist
  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST);
  }
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

async function run() {
  // 获取会话
  const cookie = await getCookie();
  console.log(`\x1b[32m%s\x1b[0m%s`, '✔', cookie);
  // 遍历省份
  for (let province of provinces) {
    // 在console.log中添加颜色
    // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    console.log(
      `\x1b[32m%s\x1b[0m%s`,
      '▸',
      ` 开始获取[${province.provinceId}-${province.name}]数据`
    );

    // 设置省份
    await setProvince(cookie, province.provinceId);

    // 获取数据
    const data = await getPriceData(cookie);
    // 保存数据
    saveJson(province.provinceId, data);

    // 获取历史数据
    const historyData = await getHistoryPriceData(cookie);
    // 保存历史数据
    saveJson(`history-${province.provinceId}`, historyData);

    console.log(`\x1b[32m%s\x1b[0m%s`, '✔', ` 获取${province.name}数据完成`);
  }
}

run().catch(err => {
  console.log(err.message);
});
