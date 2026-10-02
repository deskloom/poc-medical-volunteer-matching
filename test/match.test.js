const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { selectRecommendations } = require('../docs/match.js');

const read = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', n), 'utf8'));
const data = {
  volunteers: read('volunteers.json'),
  facilities: read('facilities.json'),
  plans: read('plans.json'),
  recommendations: read('recommendations.json'),
};

test('無料プランでは上位5件だけを返す', () => {
  const r = selectRecommendations(data, 'fa', 'free');
  assert.strictEqual(r.shown.length, 5);
  assert.deepStrictEqual(r.shown.map((x) => x.rank), [1, 2, 3, 4, 5]);
});

test('無料プランでは表示しない残り件数を数えて返す', () => {
  const r = selectRecommendations(data, 'fa', 'free');
  assert.strictEqual(r.hiddenCount, r.total - 5);
});

test('有料20件プランでは該当者が20人未満なら該当者全員を返す', () => {
  const r = selectRecommendations(data, 'fa', 'standard');
  assert.strictEqual(r.shown.length, Math.min(20, r.total));
  assert.strictEqual(r.hiddenCount, 0);
});

test('有料50件プランでも該当者の人数を超えて返さない', () => {
  const r = selectRecommendations(data, 'fb', 'premium');
  assert.strictEqual(r.shown.length, r.total);
});

test('プランの上限件数は5件・20件・50件である', () => {
  assert.deepStrictEqual(data.plans.map((p) => p.limit), [5, 20, 50]);
});

test('存在しない施設を指定するとエラーにする', () => {
  assert.throws(() => selectRecommendations(data, 'zz', 'free'));
});

test('どの施設でも推薦はスコアの高い順に並んでいる', () => {
  for (const f of data.facilities) {
    const s = data.recommendations[f.id].ranked.map((r) => r.score);
    for (let i = 1; i < s.length; i++) assert.ok(s[i - 1] >= s[i], f.id + ' の ' + i + ' 番目');
  }
});

test('推薦と除外を合わせると全ボランティアを過不足なく含む', () => {
  const all = data.volunteers.map((v) => v.id).sort();
  for (const f of data.facilities) {
    const rec = data.recommendations[f.id];
    const ids = rec.ranked.map((r) => r.volunteerId).concat(rec.excluded.map((e) => e.volunteerId)).sort();
    assert.deepStrictEqual(ids, all, f.id);
  }
});

test('合っている点と足りない点の理由がすべての推薦で空でない', () => {
  for (const f of data.facilities) {
    for (const r of data.recommendations[f.id].ranked) {
      assert.ok(r.match.length > 0 && r.gap.length > 0, f.id + ' ' + r.volunteerId);
    }
  }
});

test('除外された人には理由が書かれている', () => {
  for (const f of data.facilities) {
    for (const e of data.recommendations[f.id].excluded) assert.ok(e.reason.length > 0);
  }
});

test('推薦された人は募集する職種と地域の条件を満たしている', () => {
  const byId = new Map(data.volunteers.map((v) => [v.id, v]));
  for (const f of data.facilities) {
    for (const r of data.recommendations[f.id].ranked) {
      const v = byId.get(r.volunteerId);
      assert.ok(f.needs.roles.includes(v.role), f.id + ' ' + v.id + ' 職種');
      assert.ok(f.needs.regions.includes(v.region), f.id + ' ' + v.id + ' 地域');
    }
  }
});

test('除外された人は職種または地域の条件を満たしていない', () => {
  const byId = new Map(data.volunteers.map((v) => [v.id, v]));
  for (const f of data.facilities) {
    for (const e of data.recommendations[f.id].excluded) {
      const v = byId.get(e.volunteerId);
      assert.ok(!f.needs.roles.includes(v.role) || !f.needs.regions.includes(v.region), f.id + ' ' + v.id);
    }
  }
});

test('画面用の docs/data.js が data/ のJSONと一致している', () => {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'docs', 'data.js'), 'utf8'), ctx);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.window.POC_DATA)), data);
});
