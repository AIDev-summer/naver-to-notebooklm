import { NotebookLMApi } from './lib/nlm-api.js';

const api = new NotebookLMApi();
const MENU_ID = 'ksrc-add-to-notebooklm';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: '이 글을 NotebookLM에 추가',
      contexts: ['page'],
      documentUrlPatterns: [
        'https://blog.naver.com/*', 'https://m.blog.naver.com/*',
        'https://cafe.naver.com/*', 'https://m.cafe.naver.com/*',
        'https://post.naver.com/*', 'https://m.post.naver.com/*',
        'https://brunch.co.kr/*', 'https://*.tistory.com/*', 'https://velog.io/*',
      ],
    });
  });
});

// ---- extraction ----------------------------------------------------------

async function extractFromTab(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ['content/extract.js'],
  });
  const found = results
    .map((r) => r && r.result)
    .filter((r) => r && r.ok)
    .sort((a, b) => b.length - a.length);
  if (found.length === 0) {
    const reasons = results.map((r) => r && r.result && r.result.reason).filter(Boolean);
    return { ok: false, reason: reasons[0] || 'NO_CONTENT' };
  }
  const best = found[0];
  // Top-frame URL is more useful than an iframe URL for the "출처" line.
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url) best.url = tab.url;
  } catch {}
  return best;
}

function buildSourceText(doc) {
  const header = [
    `제목: ${doc.title}`,
    doc.author ? `작성자: ${doc.author}` : null,
    doc.date ? `작성일: ${doc.date}` : null,
    `출처: ${doc.url}`,
  ].filter(Boolean).join('\n');
  return `${header}\n\n${doc.text}`;
}

// ---- notebook helpers -----------------------------------------------------

async function getDefaultNotebookId() {
  const { lastNotebookId } = await chrome.storage.sync.get('lastNotebookId');
  return lastNotebookId || null;
}

async function addDocToNotebook(notebookId, doc) {
  const text = buildSourceText(doc);
  await api.addTextSource(notebookId, doc.title, text);
  await chrome.storage.sync.set({ lastNotebookId: notebookId });
  await bumpStats();
  return { ok: true, notebookUrl: api.notebookUrl(notebookId) };
}

async function bumpStats() {
  const { stats = { added: 0 } } = await chrome.storage.local.get('stats');
  stats.added = (stats.added || 0) + 1;
  await chrome.storage.local.set({ stats });
}

// ---- messaging -------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.cmd) {
        case 'extract':
          return sendResponse(await extractFromTab(msg.tabId));
        case 'list-notebooks':
          return sendResponse({ ok: true, notebooks: await api.listNotebooks() });
        case 'create-notebook': {
          const nb = await api.createNotebook(msg.title);
          return sendResponse({ ok: true, notebook: nb });
        }
        case 'add-text': {
          return sendResponse(await addDocToNotebook(msg.notebookId, msg.doc));
        }
        case 'add-url': {
          await api.addUrlSource(msg.notebookId, msg.url);
          await chrome.storage.sync.set({ lastNotebookId: msg.notebookId });
          await bumpStats();
          return sendResponse({ ok: true, notebookUrl: api.notebookUrl(msg.notebookId) });
        }
        default:
          return sendResponse({ ok: false, reason: 'UNKNOWN_CMD' });
      }
    } catch (e) {
      console.error(msg.cmd, e);
      sendResponse({ ok: false, reason: e.message || 'ERROR' });
    }
  })();
  return true; // async sendResponse
});

// ---- context menu ----------------------------------------------------------

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab || !tab.id) return;
  const notebookId = await getDefaultNotebookId();
  if (!notebookId) {
    chrome.action.openPopup?.().catch(() => {});
    return;
  }
  try {
    const doc = await extractFromTab(tab.id);
    if (!doc.ok) throw new Error(doc.reason);
    await addDocToNotebook(notebookId, doc);
    await chrome.action.setBadgeText({ tabId: tab.id, text: '✓' });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#1a7f37' });
  } catch (e) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#cf222e' });
  }
  setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }).catch(() => {}), 4000);
});
