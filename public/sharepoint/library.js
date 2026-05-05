(function () {
  const rowsEl = document.getElementById('libRows');
  const emptyEl = document.getElementById('libEmpty');
  const errorEl = document.getElementById('libError');

  function relTime(ts) {
    if (!ts) return '\u2014';
    const diffSec = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function pageIconSvg() {
    return [
      '<svg class="page-icon" viewBox="0 0 24 24" aria-hidden="true">',
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#2b88d8"/>',
      '<path d="M14 2v6h6" fill="#106ebe"/>',
      '<path d="M8 12h8M8 15h8M8 18h5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>',
      '</svg>'
    ].join('');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderRow(article) {
    const href = `/sharepoint/${encodeURIComponent(article.articleId)}`;
    const title = escapeHtml(article.title || '(untitled)');
    const section = escapeHtml(article.section || '\u2014');
    const modified = escapeHtml(relTime(article.updatedAt));
    const excerpt = escapeHtml(article.excerpt || '');

    return [
      `<a class="lib-row lib-row-link" role="row" href="${href}">`,
      '<div class="lib-cell lib-cell-name" role="cell">',
      '<span class="lib-checkbox" aria-hidden="true"></span>',
      pageIconSvg(),
      '<div class="lib-name-block">',
      `<div class="lib-name">${title}</div>`,
      excerpt ? `<div class="lib-excerpt">${excerpt}</div>` : '',
      '</div>',
      '</div>',
      `<div class="lib-cell lib-cell-section" role="cell"><span class="lib-section-pill">${section}</span></div>`,
      `<div class="lib-cell lib-cell-modified" role="cell">${modified}</div>`,
      '<div class="lib-cell lib-cell-modifier" role="cell">',
      '<span class="author-chip">',
      '<span class="author-avatar">K</span>',
      '<span class="author-name">Kat</span>',
      '</span>',
      '</div>',
      '</a>'
    ].join('');
  }

  async function load() {
    try {
      const res = await fetch('/sharepoint/api/articles');
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const data = await res.json();
      const articles = (data && data.articles) || [];

      if (!articles.length) {
        rowsEl.innerHTML = '';
        emptyEl.hidden = false;
        return;
      }

      rowsEl.innerHTML = articles.map(renderRow).join('');
      emptyEl.hidden = true;
      errorEl.hidden = true;
    } catch (err) {
      console.error('Library load failed', err);
      rowsEl.innerHTML = '';
      errorEl.textContent = `Could not load pages: ${err.message}`;
      errorEl.hidden = false;
    }
  }

  load();
})();
