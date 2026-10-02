// data/*.json を、ブラウザで直接開ける docs/data.js にまとめる
const fs = require('fs');
const path = require('path');
const read = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', n), 'utf8'));
const data = {
  volunteers: read('volunteers.json'),
  facilities: read('facilities.json'),
  plans: read('plans.json'),
  recommendations: read('recommendations.json'),
};
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'data.js'), 'window.POC_DATA = ' + JSON.stringify(data, null, 1) + ';\n');
console.log('docs/data.js を生成しました');
