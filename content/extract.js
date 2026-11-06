// Runs inside every frame of the active tab via chrome.scripting.executeScript.
// Returns {ok, site, title, author, date, url, text, length} or {ok:false, reason}.
// Must be self-contained: no imports, last expression is the return value.
(() => {
  const host = location.hostname;
  const MIN_LENGTH = 80;

  const pick = (selectors, root = document) => {
    for (const s of selectors) {
      const el = root.querySelector(s);
      if (el) return el;
    }
    return null;
  };

  const textOf = (el) => (el ? (el.innerText || el.textContent || '') : '');

  const clean = (s) =>
    s
      .replace(/ /g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

  // Site-specific rules. Order matters: first match wins.
  const RULES = [
    {
      site: 'naver-blog',
      test: () => /(^|\.)blog\.naver\.com$/.test(host),
      title: ['.se-title-text', '.pcol1 .itemSubjectBoldfont', '.htitle', 'h3.se_textarea', '.tit_h3', 'meta[property="og:title"]'],
      body: ['.se-main-container', '#postViewArea', '.se_component_wrap', '#post-view', '.post-view'],
      author: ['.nick', '.blog_author .nick', '.writer', 'meta[property="naverblog:nickname"]'],
      date: ['.se_publishDate', '.blog_date', '.date', '.se_date'],
    },
    {
      site: 'naver-cafe',
      test: () => /(^|\.)cafe\.naver\.com$/.test(host),
      title: ['.title_text', '.ArticleTitle .title_text', '.tit', 'h3.title', 'meta[property="og:title"]'],
      body: ['.se-main-container', '.ContentRenderer', '#tbody', '.article_viewer', '#content-area', '.NHN_Writeform_Main'],
      author: ['.nickname', '.nick_box .nickname', '.WriterInfo .nickname'],
      date: ['.date', '.article_info .date'],
    },
    {
      site: 'naver-post',
      test: () => /(^|\.)post\.naver\.com$/.test(host),
      title: ['.se_textarea', 'h3.se_textarea', '.tit_view', 'meta[property="og:title"]'],
      body: ['#__clipContent', '.se_component_wrap', '#viewer', '.__viewer_container'],
      author: ['.se_author', '.author_name', '.name'],
      date: ['.se_publishDate', '.date'],
    },
    {
      site: 'brunch',
      test: () => host === 'brunch.co.kr',
      title: ['.cover_title', 'h1.cover_title', 'meta[property="og:title"]'],
      body: ['.wrap_body', '.wrap_body_frame', 'article'],
      author: ['.wrap_cover .by_author .txt_author', '.by_author', 'meta[name="author"]'],
      date: ['.date', '.f_l.date'],
    },
    {
      site: 'tistory',
      test: () => /\.tistory\.com$/.test(host),
      title: ['h1.title-article', '.tit_post', '.title_post', 'h1.entry-title', 'article h1', 'h2.title', 'meta[property="og:title"]'],
      body: ['.tt_article_useless_p_margin', '.entry-content', '.article_view', '.article-view', '.contents_style', 'article', '#content'],
      author: ['.author', '.txt_author', 'meta[name="author"]'],
      date: ['.date', '.txt_date', 'time', '.entry-date'],
    },
    {
      site: 'velog',
      test: () => host === 'velog.io',
      title: ['h1', 'meta[property="og:title"]'],
      body: ['.atom-one', 'div[class*="atom-one"]', 'article', 'main'],
      author: ['.username', 'a[href^="/@"]', 'meta[name="author"]'],
      date: ['time', 'span[class*="date"]'],
    },
  ];

  const metaOrText = (el) => {
    if (!el) return '';
    if (el.tagName === 'META') return el.getAttribute('content') || '';
    return textOf(el);
  };

  // Generic fallback: the block with the most text.
  const largestBlock = () => {
    const candidates = document.querySelectorAll('article, main, [role="main"], .content, .post, .entry, body');
    let best = null;
    let bestLen = 0;
    candidates.forEach((el) => {
      const len = textOf(el).length;
      if (len > bestLen) { best = el; bestLen = len; }
    });
    return best;
  };

  const rule = RULES.find((r) => r.test());
  let site = rule ? rule.site : 'generic';

  let bodyEl = rule ? pick(rule.body) : null;
  if (!bodyEl) {
    bodyEl = largestBlock();
    if (rule) site = `${rule.site}-fallback`;
  }

  const body = clean(textOf(bodyEl));
  if (body.length < MIN_LENGTH) {
    return { ok: false, reason: 'NO_CONTENT', site, frame: location.href };
  }

  const title = clean(
    (rule && metaOrText(pick(rule.title))) ||
      metaOrText(document.querySelector('meta[property="og:title"]')) ||
      document.title ||
      '제목 없음'
  ).split('\n')[0].slice(0, 200);

  const author = rule ? clean(metaOrText(pick(rule.author))).split('\n')[0].slice(0, 80) : '';
  const date = rule ? clean(metaOrText(pick(rule.date))).split('\n')[0].slice(0, 60) : '';

  // Prefer the top-level page URL when we are inside an iframe.
  let pageUrl = location.href;
  try {
    if (window.top !== window && document.referrer) pageUrl = document.referrer;
  } catch {}

  return {
    ok: true,
    site,
    title,
    author,
    date,
    url: pageUrl,
    text: body,
    length: body.length,
    isFrame: (() => { try { return window.top !== window; } catch { return true; } })(),
  };
})();
