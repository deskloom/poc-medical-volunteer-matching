(function () {
  const data = window.POC_DATA;
  const state = { facility: data.facilities[0].id, plan: 'free' };
  const $ = (id) => document.getElementById(id);

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function render() {
    const fac = data.facilities.find((f) => f.id === state.facility);
    const res = window.Match.selectRecommendations(data, state.facility, state.plan);
    $('facility-info').textContent = fac.summary + '。募集職種: ' + fac.needs.roles.join('・') +
      ' ／ 地域: ' + fac.needs.regions.join('・') + ' ／ 希望の時間帯: ' + fac.needs.availability;
    $('summary').textContent = res.plan.label + 'では、条件に合う' + res.total + '名のうち上位' +
      res.shown.length + '名を表示しています。';
    const list = $('results');
    list.textContent = '';
    res.shown.forEach((r) => {
      const li = el('li', 'card');
      const head = el('div', 'card-head');
      head.append(el('span', 'rank', r.rank + '位'), el('strong', 'name', r.volunteer.name),
        el('span', 'score', '適合度 ' + r.score));
      li.append(head,
        el('p', 'meta', r.volunteer.role + ' ／ ' + r.volunteer.region + ' ／ ' + r.volunteer.availability + ' ／ ' + r.volunteer.skills.join('・')));
      const m = el('p', 'ok'); m.append(el('b', null, '合っている点: '), document.createTextNode(r.match));
      const g = el('p', 'ng'); g.append(el('b', null, '足りない点: '), document.createTextNode(r.gap));
      li.append(m, g);
      list.append(li);
    });
    $('locked').textContent = res.hiddenCount > 0
      ? '残り' + res.hiddenCount + '名は、上位の有料プランで表示されます。'
      : '条件に合う' + res.total + '名すべてを表示しています。';
    const ex = $('excluded');
    ex.textContent = '';
    res.excluded.forEach((e) => ex.append(el('li', null, e.volunteer.name + '（' + e.volunteer.role + '・' + e.volunteer.region + '）: ' + e.reason)));
    $('excluded-title').textContent = '推薦から外した' + res.excluded.length + '名';
    document.querySelectorAll('[data-plan]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.plan === state.plan)));
    document.querySelectorAll('[data-facility]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.facility === state.facility)));
  }

  data.facilities.forEach((f) => {
    const b = el('button', 'chip', f.name);
    b.dataset.facility = f.id;
    b.onclick = () => { state.facility = f.id; render(); };
    $('facility-buttons').append(b);
  });
  data.plans.forEach((p) => {
    const b = el('button', 'chip', p.label);
    b.dataset.plan = p.id;
    b.onclick = () => { state.plan = p.id; render(); };
    $('plan-buttons').append(b);
  });
  render();
})();
