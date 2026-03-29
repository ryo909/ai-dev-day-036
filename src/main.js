import './style.css';
const PROFILE = {"day":"Day036","title":"Choice Radar View 1","display_name_ja":"比較レーダー","one_sentence":"2つの案の違いを見やすくするためのツールです。","purpose_line_ja":"2つの案の違いを見やすくするためのツールです。","use_case_line_ja":"どちらにするか迷った時に使います。","how_it_works_line_ja":"2つの案を入れると、違いと決めやすいポイントが出ます。","core_action":"score","family":"compare_choice","mechanic":"compare","input_style":"slider_mix","output_style":"radar","audience_promise":"confidence","publish_hook":"重み付き評価で候補案の順位変化を比較できる計算ツール。（話題:GitHub Trending (A） を visual_demo 角度で見せる","engine":"weighted_compare","interaction_archetype":"compare","page_archetype":"radar_panel","output_shape":"radar_panel","state_model":"compare_state","core_loop":"slider_mix -> compare -> radar","component_pack":"radar_panel+radar","scaffold_id":"weighted_calculator","single_shot_text_generator":false};
const byId = (id) => document.getElementById(id);
const state = {
  tokens: ['買う', '待つ', '比べる', '今週中'],
  lock: false,
  history: [],
  wizardStep: 0,
  wizardAnswers: {},
  matrix: { HH: [], HL: [], LH: [], LL: [] },
  options: [],
  slots: { morning: [], afternoon: [], evening: [] },
  board: { todo: [], doing: [], done: [] },
  missions: ['5分で試す', '2案比較する', '短文で説明する'],
  score: 0,
  round: 0,
  helpers: {}
};

boot();

function boot() {
  switch (PROFILE.scaffold_id) {
    case 'card_deck_board': setupCardDeck(); break;
    case 'wizard_stepper': setupWizard(); break;
    case 'matrix_mapper': setupMatrix(); break;
    case 'weighted_calculator': setupWeightedCalc(); break;
    case 'slot_checklist_planner': setupSlotPlanner(); break;
    case 'flow_board': setupFlowBoard(); break;
    case 'roulette_game': setupRoulette(); break;
    default: setupFallback(); break;
  }
  setupCommonUi();
}

function setupCommonUi() {
  const btn = byId('sampleFillBtn');
  if (btn) {
    btn.addEventListener('click', runSample);
  }
}

function runSample() {
  switch (PROFILE.scaffold_id) {
    case 'card_deck_board':
      state.tokens = ['買う', '待つ', '比べる', '今週中'];
      renderTokenPool(byId('tokenList'));
      byId('drawBtn')?.click();
      break;
    case 'wizard_stepper':
      state.wizardAnswers = { speed: '速度', risk: '中くらい', ownership: '自分' };
      state.wizardStep = 2;
      state.helpers.renderStep?.();
      break;
    case 'matrix_mapper':
      state.matrix = {
        HH: ['請求トラブル'],
        HL: ['FAQ更新'],
        LH: ['通知チェック'],
        LL: ['色の微調整']
      };
      renderMatrix();
      break;
    case 'weighted_calculator':
      state.options = [
        { name: 'A案', speed: 5, quality: 3, cost: 4 },
        { name: 'B案', speed: 3, quality: 5, cost: 2 }
      ];
      state.helpers.recalc?.();
      break;
    case 'slot_checklist_planner':
      state.slots = {
        morning: [{ text: '請求APIを直す', done: false }],
        afternoon: [{ text: '動作確認をする', done: false }],
        evening: [{ text: '共有メモを書く', done: false }]
      };
      renderSlots();
      break;
    case 'flow_board':
      state.board = {
        todo: [{ id: 1, title: '仕様を確認する' }],
        doing: [{ id: 2, title: '画面を直す' }],
        done: [{ id: 3, title: '不具合を再現した' }]
      };
      renderBoard();
      break;
    case 'roulette_game':
      state.missions = ['5分だけ片づける', '今の案を1つ比べる', '短く言い換える'];
      state.helpers.renderPool?.();
      byId('spinBtn')?.click();
      break;
    default:
      byId('toolInput').value = 'サンプル入力です';
      byId('actionBtn')?.click();
      break;
  }
}

function setupCardDeck() {
  const tokenInput = byId('tokenInput');
  const tokenList = byId('tokenList');
  const cardStack = byId('cardStack');
  const historyList = byId('historyList');
  byId('addTokenBtn').addEventListener('click', () => {
    const v = (tokenInput.value || '').trim();
    if (!v) return;
    state.tokens.push(v);
    tokenInput.value = '';
    renderTokenPool(tokenList);
  });
  byId('drawBtn').addEventListener('click', () => {
    if (state.lock) return;
    const picks = shuffle([...state.tokens]).slice(0, Math.min(3, state.tokens.length));
    cardStack.innerHTML = picks.map((x) => `<div class="card">${escapeHtml(x)}</div>`).join('');
    state.history.unshift(picks.join(' × '));
    state.history = state.history.slice(0, 12);
    historyList.innerHTML = state.history.map((x) => `<li>${escapeHtml(x)}</li>`).join('');
  });
  byId('lockBtn').addEventListener('click', () => { state.lock = !state.lock; });
  renderTokenPool(tokenList);
}

function renderTokenPool(el) {
  el.innerHTML = state.tokens.map((x) => `<span class="chip">${escapeHtml(x)}</span>`).join('');
}

function setupWizard() {
  const questions = [
    { key: 'speed', q: '最優先はどれ?', c: ['速度', '品質', 'コスト'] },
    { key: 'risk', q: '許容できるリスクは?', c: ['低い', '中くらい', '高い'] },
    { key: 'ownership', q: '主導者は?', c: ['自分', 'チーム', '外部'] }
  ];
  const stepBadge = byId('stepBadge');
  const questionText = byId('questionText');
  const choiceGroup = byId('choiceGroup');
  const summary = byId('wizardSummary');
  byId('prevStepBtn').addEventListener('click', () => { state.wizardStep = Math.max(0, state.wizardStep - 1); renderStep(); });
  byId('nextStepBtn').addEventListener('click', () => {
    const cur = questions[state.wizardStep];
    const selected = document.querySelector('input[name="wizardChoice"]:checked');
    if (selected) state.wizardAnswers[cur.key] = selected.value;
    state.wizardStep = Math.min(questions.length - 1, state.wizardStep + 1);
    renderStep();
  });
  function renderStep() {
    const cur = questions[state.wizardStep];
    stepBadge.textContent = `Step ${state.wizardStep + 1}/${questions.length}`;
    questionText.textContent = cur.q;
    choiceGroup.innerHTML = cur.c.map((x) => `<label class="choice"><input type="radio" name="wizardChoice" value="${escapeHtml(x)}" ${state.wizardAnswers[cur.key]===x?'checked':''}>${escapeHtml(x)}</label>`).join('');
    summary.textContent = Object.entries(state.wizardAnswers).map(([k,v]) => `${k}: ${v}`).join('\n') || 'まだ回答がありません';
  }
  state.helpers.renderStep = renderStep;
  renderStep();
}

function setupMatrix() {
  const inputName = byId('matrixItemName');
  const impact = byId('impactRange');
  const urgency = byId('urgencyRange');
  byId('addMatrixItemBtn').addEventListener('click', () => {
    const name = (inputName.value || '').trim();
    if (!name) return;
    const i = Number(impact.value);
    const u = Number(urgency.value);
    const key = i >= 3 && u >= 3 ? 'HH' : i >= 3 ? 'HL' : u >= 3 ? 'LH' : 'LL';
    state.matrix[key].push(name);
    inputName.value = '';
    renderMatrix();
  });
  renderMatrix();
}

function renderMatrix() {
  byId('qHH').innerHTML = state.matrix.HH.length ? state.matrix.HH.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
  byId('qHL').innerHTML = state.matrix.HL.length ? state.matrix.HL.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
  byId('qLH').innerHTML = state.matrix.LH.length ? state.matrix.LH.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
  byId('qLL').innerHTML = state.matrix.LL.length ? state.matrix.LL.map((x) => `<li>${escapeHtml(x)}</li>`).join('') : '<li class="empty-state">まだ項目がありません</li>';
}

function setupWeightedCalc() {
  const meter = byId('weightMeter');
  const scoreTable = byId('scoreTable');
  const recalc = () => {
    const ws = Number(byId('wSpeed').value), wq = Number(byId('wQuality').value), wc = Number(byId('wCost').value);
    const sum = ws + wq + wc || 1;
    meter.textContent = `重みの比率 => 速さ:${ws} 品質:${wq} コスト:${wc}`;
    const rows = state.options.map((o) => {
      const score = (o.speed * ws + o.quality * wq + (6 - o.cost) * wc) / sum;
      return { name: o.name, score: score.toFixed(2) };
    }).sort((a,b) => Number(b.score) - Number(a.score));
    scoreTable.innerHTML = rows.length
      ? rows.map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${r.score}</td></tr>`).join('')
      : '<tr><td colspan="2" class="empty-state">まだ候補がありません。サンプルで試せます。</td></tr>';
  };
  ['wSpeed','wQuality','wCost'].forEach((id) => byId(id).addEventListener('input', recalc));
  byId('addOptionBtn').addEventListener('click', () => {
    const name = (byId('optionName').value || '').trim();
    const speed = Number(byId('optionSpeed').value || 0);
    const quality = Number(byId('optionQuality').value || 0);
    const cost = Number(byId('optionCost').value || 0);
    if (!name || !speed || !quality || !cost) return;
    state.options.push({ name, speed, quality, cost });
    byId('optionName').value = '';
    byId('optionSpeed').value = '';
    byId('optionQuality').value = '';
    byId('optionCost').value = '';
    recalc();
  });
  byId('recalcBtn').addEventListener('click', recalc);
  state.helpers.recalc = recalc;
  recalc();
}

function setupSlotPlanner() {
  byId('addTaskBtn').addEventListener('click', () => {
    const task = (byId('taskInput').value || '').trim();
    const slot = byId('slotSelect').value;
    if (!task) return;
    state.slots[slot].push({ text: task, done: false });
    byId('taskInput').value = '';
    renderSlots();
  });
  byId('carryBtn').addEventListener('click', () => {
    carry('morning', 'afternoon');
    carry('afternoon', 'evening');
    renderSlots();
  });
  renderSlots();
}

function carry(from, to) {
  const stay = [];
  state.slots[from].forEach((t) => {
    if (t.done) stay.push(t);
    else state.slots[to].push({ text: t.text, done: false });
  });
  state.slots[from] = stay;
}

function renderSlots() {
  renderSlot('morning', byId('slotMorning'));
  renderSlot('afternoon', byId('slotAfternoon'));
  renderSlot('evening', byId('slotEvening'));
}

function renderSlot(key, el) {
  el.innerHTML = state.slots[key].length
    ? state.slots[key].map((t, i) => `<label class="task"><input type="checkbox" ${t.done?'checked':''} data-slot="${key}" data-idx="${i}">${escapeHtml(t.text)}</label>`).join('')
    : '<div class="empty-state">まだ予定がありません。サンプルで試せます。</div>';
  el.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.addEventListener('change', (e) => {
      const slot = e.target.dataset.slot;
      const idx = Number(e.target.dataset.idx);
      state.slots[slot][idx].done = e.target.checked;
    });
  });
}

function setupFlowBoard() {
  byId('addFlowCardBtn').addEventListener('click', () => {
    const title = (byId('cardTitleInput').value || '').trim();
    if (!title) return;
    state.board.todo.push({ id: Date.now(), title });
    byId('cardTitleInput').value = '';
    renderBoard();
  });
  renderBoard();
}

function renderBoard() {
  renderLane('todo', byId('laneTodo'), 'doing');
  renderLane('doing', byId('laneDoing'), 'done');
  renderLane('done', byId('laneDone'), null);
}

function renderLane(key, el, next) {
  const laneLabel = (name) => ({ doing: '進行中へ', done: '終わりへ' }[name] || name);
  el.innerHTML = state.board[key].length
    ? state.board[key].map((c, i) => `<div class="card"><div>${escapeHtml(c.title)}</div>${next ? `<button data-lane="${key}" data-idx="${i}" data-next="${next}">→ ${laneLabel(next)}</button>` : ''}</div>`).join('')
    : '<div class="empty-state">まだカードがありません。サンプルで試せます。</div>';
  el.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lane = btn.dataset.lane;
      const idx = Number(btn.dataset.idx);
      const to = btn.dataset.next;
      const [card] = state.board[lane].splice(idx, 1);
      state.board[to].push(card);
      renderBoard();
    });
  });
}

function setupRoulette() {
  const wheel = byId('wheelFace');
  const score = byId('scoreValue');
  const round = byId('roundValue');
  const missionPool = byId('missionPool');
  const history = byId('roundHistory');

  byId('addMissionBtn').addEventListener('click', () => {
    const m = (byId('missionInput').value || '').trim();
    if (!m) return;
    state.missions.push(m);
    byId('missionInput').value = '';
    renderPool();
  });
  byId('spinBtn').addEventListener('click', () => {
    if (state.missions.length === 0) return;
    const picked = state.missions[Math.floor(Math.random() * state.missions.length)];
    wheel.textContent = picked;
    state.round += 1;
    state.score += 10;
    state.history.unshift(`R${state.round}: ${picked}`);
    state.history = state.history.slice(0, 12);
    round.textContent = String(state.round);
    score.textContent = String(state.score);
    history.innerHTML = state.history.map((x) => `<li>${escapeHtml(x)}</li>`).join('');
  });
  byId('clearRoundBtn').addEventListener('click', () => {
    state.round = 0; state.score = 0; state.history = []; wheel.textContent = 'まだ回していません';
    round.textContent = '0'; score.textContent = '0'; history.innerHTML = '<li>まだ履歴がありません</li>';
  });
  function renderPool() {
    missionPool.innerHTML = state.missions.length
      ? state.missions.map((x) => `<li>${escapeHtml(x)}</li>`).join('')
      : '<li class="empty-state">まだお題がありません。サンプルで試せます。</li>';
  }
  state.helpers.renderPool = renderPool;
  renderPool();
}

function setupFallback() {
  const input = byId('toolInput');
  const output = byId('toolOutput');
  const btn = byId('actionBtn');
  if (!input || !output || !btn) return;
  btn.addEventListener('click', () => {
    const txt = (input.value || '').trim();
    output.textContent = txt ? `入れた内容は ${txt.length} 文字です。` : 'まだ入力がありません。サンプルで試せます。';
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
