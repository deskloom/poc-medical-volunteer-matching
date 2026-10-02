(function (root) {
  // 事前生成された推薦結果から、プランの上限件数だけを取り出す
  function selectRecommendations(data, facilityId, planId) {
    const plan = data.plans.find((p) => p.id === planId);
    const rec = data.recommendations[facilityId];
    if (!plan || !rec) throw new Error('不明な施設またはプラン');
    const byId = new Map(data.volunteers.map((v) => [v.id, v]));
    const all = rec.ranked.map((r, i) => Object.assign({ rank: i + 1, volunteer: byId.get(r.volunteerId) }, r));
    return {
      plan,
      total: all.length,
      shown: all.slice(0, plan.limit),
      hiddenCount: Math.max(0, all.length - plan.limit),
      excluded: rec.excluded.map((e) => Object.assign({ volunteer: byId.get(e.volunteerId) }, e)),
    };
  }
  const api = { selectRecommendations };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Match = api;
})(typeof window !== 'undefined' ? window : globalThis);
