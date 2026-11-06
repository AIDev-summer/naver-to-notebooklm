// NotebookLM internal RPC client (batchexecute).
// The RPC ids and payload shapes follow the public MIT-licensed
// "Add to NotebookLM" project by AndyShaman (github.com/AndyShaman/add_to_NotebookLM).
// NotebookLM has no public API; these may break when Google changes the app.

const BASE_URL = 'https://notebooklm.google.com';

async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function extractToken(key, html) {
  const m = new RegExp(`"${key}":"([^"]+)"`).exec(html);
  return m ? m[1] : null;
}

function findDataLine(text) {
  return text.split('\n').find((line) => line.includes('wrb.fr'));
}

export class NotebookLMApi {
  constructor() {
    this.tokens = null;
  }

  async getTokens() {
    let response;
    try {
      response = await fetchWithTimeout(BASE_URL, { credentials: 'include', redirect: 'follow' });
    } catch (e) {
      // A fetch that cannot reach NotebookLM (network down, or a redirect to a host
      // we lack permission for) surfaces as TypeError: Failed to fetch.
      throw new Error(e && e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK');
    }
    if (!response.ok) throw new Error('NOT_LOGGED_IN');
    if (response.url.includes('accounts.google.com') || response.url.includes('/login')) {
      throw new Error('NOT_LOGGED_IN');
    }
    const html = await response.text();
    const bl = extractToken('cfb2h', html);
    const at = extractToken('SNlM0e', html);
    if (!bl || !at) throw new Error('NOT_LOGGED_IN');
    this.tokens = { bl, at };
    return this.tokens;
  }

  async rpc(rpcId, params, sourcePath = '/') {
    if (!this.tokens) await this.getTokens();

    const url = new URL(`${BASE_URL}/_/LabsTailwindUi/data/batchexecute`);
    url.searchParams.set('rpcids', rpcId);
    url.searchParams.set('source-path', sourcePath);
    url.searchParams.set('bl', this.tokens.bl);
    url.searchParams.set('_reqid', String(Math.floor(Math.random() * 900000 + 100000)));
    url.searchParams.set('rt', 'c');

    const body = new URLSearchParams({
      'f.req': JSON.stringify([[[rpcId, JSON.stringify(params), null, 'generic']]]),
      at: this.tokens.at,
    });

    let response;
    try {
      response = await fetchWithTimeout(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: body.toString(),
      });
    } catch (e) {
      throw new Error(e && e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK');
    }

    if (response.status === 401 || response.status === 403) {
      this.tokens = null;
      throw new Error('NOT_LOGGED_IN');
    }
    if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`);

    const text = await response.text();
    const err = this.findRpcError(rpcId, text);
    if (err) throw new Error(err);
    return text;
  }

  findRpcError(rpcId, text) {
    try {
      let errorFrame = null;
      let responseFrame = null;
      for (const line of text.split('\n')) {
        if (!line.startsWith('[[')) continue;
        let frames;
        try { frames = JSON.parse(line); } catch { continue; }
        const first = frames[0];
        if (!Array.isArray(first)) continue;
        if (typeof first[0] === 'string' && first[0].startsWith('er')) errorFrame = line.trim();
        const match = frames.find((f) => Array.isArray(f) && f[0] === 'wrb.fr' && f[1] === rpcId);
        if (match) responseFrame = match;
      }
      if (errorFrame) return `RPC_ERROR:${rpcId}`;
      if (!responseFrame) return `RPC_NO_RESPONSE:${rpcId}`;
      if (responseFrame[2] == null) return `RPC_EMPTY:${rpcId}`;
      return null;
    } catch {
      return null;
    }
  }

  async listNotebooks() {
    const text = await this.rpc('wXbhsf', [null, 1, null, [2]]);
    try {
      const dataLine = findDataLine(text);
      if (!dataLine) return [];
      const parsed = JSON.parse(dataLine);
      const inner = JSON.parse(parsed[0][2]);
      if (!inner || !inner[0]) return [];
      return inner[0]
        .filter((item) => item && item.length >= 3)
        .filter((item) => {
          const meta = item[5];
          return !(Array.isArray(meta) && meta.length > 0 && meta[0] === 3); // shared notebooks
        })
        .map((item) => ({
          id: item[2],
          name: (item[0] || '').trim() || '제목 없는 노트북',
          sources: Array.isArray(item[1]) ? item[1].length : 0,
          emoji: item[3] || '📔',
        }));
    } catch (e) {
      console.error('listNotebooks parse error', e);
      return [];
    }
  }

  async createNotebook(title) {
    const text = await this.rpc('CCqFvf', [title]);
    const m = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (!m) throw new Error('CREATE_FAILED');
    return { id: m[0], name: title };
  }

  async addTextSource(notebookId, title, text) {
    const source = [[null, [title, text], null, null, null, null, null, null]];
    return this.rpc('izAoDd', [source, notebookId, [2], null, null], `/notebook/${notebookId}`);
  }

  async addUrlSource(notebookId, url) {
    const isYouTube = /youtube\.com|youtu\.be/.test(url);
    const source = isYouTube
      ? [null, null, null, null, null, null, null, [url]]
      : [null, null, [url]];
    return this.rpc('izAoDd', [[source], notebookId], `/notebook/${notebookId}`);
  }

  notebookUrl(notebookId) {
    return `${BASE_URL}/notebook/${notebookId}`;
  }
}
