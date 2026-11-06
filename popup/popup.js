const $ = (id) => document.getElementById(id);

const NEW_VALUE = '__new__';
let currentTab = null;
let doc = null;

const ERRORS = {
  NOT_LOGGED_IN: 'NotebookLM에 로그인이 필요해요. NotebookLM을 열어 로그인한 뒤 다시 눌러 주세요.',
  NO_CONTENT: '이 페이지에서 본문을 찾지 못했어요. 글 본문이 보이는 화면에서 다시 시도해 주세요.',
  UNSUPPORTED_PAGE: '지원하는 사이트가 아니에요. 네이버 블로그·카페·포스트, 브런치, 티스토리, velog에서 써 주세요.',
};

function send(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

function setResult(text, kind = '') {
  const el = $('result');
  el.textContent = text;
  el.className = `muted ${kind}`.trim();
}

function friendly(reason) {
  if (!reason) return '알 수 없는 오류가 났어요.';
  if (ERRORS[reason]) return ERRORS[reason];
  if (reason.startsWith('RPC_')) return 'NotebookLM이 요청을 거부했어요. 잠시 후 다시 시도하거나, NotebookLM 페이지를 새로고침해 주세요.';
  return `오류: ${reason}`;
}

const SUPPORTED = /^https:\/\/([a-z0-9-]+\.)?(blog\.naver\.com|cafe\.naver\.com|post\.naver\.com|brunch\.co\.kr|velog\.io)\//i;
const TISTORY = /^https:\/\/[a-z0-9-]+\.tistory\.com\//i;

async function loadPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  if (!tab || !tab.url || !(SUPPORTED.test(tab.url) || TISTORY.test(tab.url))) {
    $('page-status').textContent = ERRORS.UNSUPPORTED_PAGE;
    return;
  }
  const res = await send({ cmd: 'extract', tabId: tab.id });
  if (!res || !res.ok) {
    $('page-status').textContent = friendly(res && res.reason);
    return;
  }
  doc = res;
  $('page-status').hidden = true;
  $('page-info').hidden = false;
  $('page-title').textContent = doc.title;
  const bits = [];
  if (doc.author) bits.push(doc.author);
  if (doc.date) bits.push(doc.date);
  bits.push(`${doc.length.toLocaleString()}자`);
  $('page-meta').textContent = bits.join(' · ');
  updateAddButton();
}

async function loadNotebooks() {
  const sel = $('notebook');
  sel.disabled = true;
  sel.innerHTML = '<option>불러오는 중…</option>';
  const res = await send({ cmd: 'list-notebooks' });
  if (!res || !res.ok) {
    sel.innerHTML = '<option value="">노트북을 불러오지 못했어요</option>';
    setResult(friendly(res && res.reason), 'err');
    return;
  }
  const { lastNotebookId } = await chrome.storage.sync.get('lastNotebookId');
  sel.innerHTML = '';
  for (const nb of res.notebooks) {
    const opt = document.createElement('option');
    opt.value = nb.id;
    opt.textContent = `${nb.emoji} ${nb.name} (${nb.sources})`;
    if (nb.id === lastNotebookId) opt.selected = true;
    sel.appendChild(opt);
  }
  const newOpt = document.createElement('option');
  newOpt.value = NEW_VALUE;
  newOpt.textContent = '＋ 새 노트북 만들기…';
  sel.appendChild(newOpt);
  if (res.notebooks.length === 0) sel.value = NEW_VALUE;
  sel.disabled = false;
  onNotebookChange();
}

function onNotebookChange() {
  const isNew = $('notebook').value === NEW_VALUE;
  $('new-notebook').hidden = !isNew;
  if (isNew && doc) $('new-name').value = $('new-name').value || doc.title.slice(0, 60);
  updateAddButton();
}

function updateAddButton() {
  const sel = $('notebook');
  const ready = doc && !sel.disabled && sel.value && sel.value !== NEW_VALUE;
  $('add').disabled = !ready;
}

async function createNotebook() {
  const name = $('new-name').value.trim();
  if (!name) return;
  $('create').disabled = true;
  const res = await send({ cmd: 'create-notebook', title: name });
  $('create').disabled = false;
  if (!res || !res.ok) return setResult(friendly(res && res.reason), 'err');
  await chrome.storage.sync.set({ lastNotebookId: res.notebook.id });
  await loadNotebooks();
  $('notebook').value = res.notebook.id;
  onNotebookChange();
  setResult(`"${name}" 노트북을 만들었어요.`, 'ok');
}

async function addSource() {
  const notebookId = $('notebook').value;
  if (!doc || !notebookId || notebookId === NEW_VALUE) return;
  $('add').disabled = true;
  setResult('추가하는 중…');
  const res = await send({ cmd: 'add-text', notebookId, doc });
  if (!res || !res.ok) {
    setResult(friendly(res && res.reason), 'err');
    $('add').disabled = false;
    return;
  }
  setResult('추가했어요. NotebookLM에서 처리가 끝나면 소스 목록에 나타나요.', 'ok');
  $('open-nlm').href = res.notebookUrl;
  $('open-nlm').textContent = '노트북 열기';
  loadStats();
}

async function loadStats() {
  const { stats } = await chrome.storage.local.get('stats');
  const n = (stats && stats.added) || 0;
  $('stats').textContent = n ? `지금까지 ${n}개 추가` : '';
}

$('notebook').addEventListener('change', onNotebookChange);
$('refresh').addEventListener('click', loadNotebooks);
$('create').addEventListener('click', createNotebook);
$('new-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') createNotebook(); });
$('add').addEventListener('click', addSource);

loadStats();
loadPage();
loadNotebooks();
