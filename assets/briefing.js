/* The public briefing reads versioned, source-linked editions from this repository. */
(function () {
  'use strict';
  const root = document.getElementById('briefing-content');
  const status = document.getElementById('briefing-status');
  const retry = document.getElementById('briefing-retry');
  if (!root || !status || !retry) return;
  const categoryNames = { industry: 'Industry news', research: 'Research highlights', context: 'Wider context' };
  const dateNames = { published: 'Published', issue: 'Journal issue', checked: 'Source checked' };
  const formatDate = value => new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'));
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  let payload;

  function safeURL(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid source URL');
    return url.href;
  }

  function validate(data) {
    if (data.schema_version !== 1 || !Array.isArray(data.issues) || !data.issues.length || !Number.isFinite(Date.parse(data.last_checked_at))) throw new Error('Invalid briefing');
    const ids = new Set();
    const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
    for (const issue of data.issues) {
      if (!isDate(issue.date) || issue.id !== issue.date || ids.has(issue.id) || !isDate(issue.period_start) || !isDate(issue.period_end) || !Array.isArray(issue.items)) throw new Error('Invalid edition');
      ids.add(issue.id);
      for (const key of ['headline', 'intro', 'takeaway']) if (typeof issue[key] !== 'string' || !issue[key].trim()) throw new Error('Missing edition text');
      for (const item of issue.items) {
        if (!Object.hasOwn(categoryNames, item.category) || !item.source || !Object.hasOwn(dateNames, item.source.date_type) || !isDate(item.source.date)) throw new Error('Invalid item');
        for (const key of ['id', 'title', 'topic', 'summary', 'implication']) if (typeof item[key] !== 'string' || !item[key].trim()) throw new Error('Missing item text');
        if (typeof item.source.name !== 'string' || typeof item.source.access_note !== 'string') throw new Error('Missing source');
        safeURL(item.source.url);
      }
    }
    return data;
  }

  function story(item) {
    const card = el('article', 'briefing-card');
    card.append(el('p', 'eyebrow', item.topic), el('h4', '', item.title), el('p', 'briefing-summary', item.summary));
    const relevance = el('div', 'briefing-relevance');
    relevance.append(el('span', '', 'Why it matters · our interpretation'), el('p', '', item.implication));
    card.append(relevance);
    const source = el('div', 'briefing-source');
    const link = el('a', 'text-link', item.source.name + ' ↗');
    link.href = safeURL(item.source.url); link.target = '_blank'; link.rel = 'noopener noreferrer';
    const date = el('p', 'fine');
    date.append(document.createTextNode(dateNames[item.source.date_type] + ' · '));
    const time = el('time', '', formatDate(item.source.date)); time.dateTime = item.source.date; date.append(time);
    source.append(link, date, el('p', 'briefing-source-note', item.source.access_note));
    card.append(source);
    return card;
  }

  function render(id, focus = false) {
    const issues = [...payload.issues].sort((a, b) => b.date.localeCompare(a.date));
    const issue = issues.find(entry => entry.id === id) || issues[0];
    const fragment = document.createDocumentFragment();
    const edition = el('div', 'briefing-edition');
    const meta = el('div', 'badge-line');
    meta.append(el('span', 'status available', issue.id === issues[0].id ? 'Latest edition' : 'Archive edition'));
    const time = el('time', 'briefing-date', formatDate(issue.date)); time.dateTime = issue.date; meta.append(time);
    edition.append(meta, el('h3', '', issue.headline), el('p', '', issue.intro));
    edition.append(el('p', 'briefing-period', 'News window · ' + formatDate(issue.period_start) + ' – ' + formatDate(issue.period_end)));
    fragment.append(edition);
    if (!issue.items.length) fragment.append(el('p', 'briefing-empty', 'No material new developments could be verified for this edition. Previous editions remain available below.'));
    for (const [category, heading] of Object.entries(categoryNames)) {
      const items = issue.items.filter(item => item.category === category);
      if (!items.length) continue;
      const group = el('section', 'briefing-group');
      group.append(el('h3', 'briefing-group-title', heading));
      if (category === 'research') group.append(el('p', 'briefing-group-note', 'Selected reading. Dates distinguish a journal issue from an online publication.'));
      const grid = el('div', 'briefing-grid' + (items.length === 1 ? ' briefing-grid-single' : ''));
      for (const item of items) grid.append(story(item));
      group.append(grid); fragment.append(group);
    }
    const thought = el('aside', 'briefing-takeaway');
    thought.append(el('p', 'eyebrow', 'A question for project teams'), el('p', '', issue.takeaway));
    fragment.append(thought);
    const archive = el('details', 'briefing-archive');
    archive.append(el('summary', '', 'Browse the archive'));
    if (issues.length === 1) archive.append(el('p', '', 'This is our first edition. Future briefings will be saved here.'));
    else {
      const list = el('div', 'briefing-archive-list');
      for (const entry of issues) {
        const button = el('button', 'briefing-archive-button', formatDate(entry.date) + ' — ' + entry.headline);
        button.type = 'button'; button.setAttribute('aria-pressed', String(entry.id === issue.id));
        button.addEventListener('click', () => render(entry.id, true)); list.append(button);
      }
      archive.append(list);
    }
    fragment.append(archive);
    root.replaceChildren(fragment);
    const checked = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' }).format(new Date(payload.last_checked_at));
    const stale = Date.now() - Date.parse(payload.last_checked_at) > 10 * 86400000;
    status.textContent = 'Last source check · ' + checked + (stale ? '. A newer update is pending.' : ' · Melbourne time');
    status.classList.toggle('briefing-stale', stale);
    if (focus) {
      const url = new URL(location.href); url.searchParams.set('edition', issue.id); url.hash = 'briefing';
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      root.focus({ preventScroll: true });
      root.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  async function load() {
    retry.hidden = true;
    status.textContent = 'Loading the latest edition…';
    try {
      const response = await fetch('data/briefings.json', { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Briefing unavailable');
      payload = validate(await response.json());
      render(new URL(location.href).searchParams.get('edition'));
    } catch (_) {
      status.textContent = 'The briefing could not be loaded. Please try again.';
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', load);
  load();
}());
