(function () {
  const DEBOUNCE_MS = 800;

  const articleId = window.location.pathname.split('/').filter(Boolean).pop();
  const locale = new URLSearchParams(window.location.search).get('locale') || 'en-us';

  const titleEl = document.getElementById('pageTitle');
  const updatedAtEl = document.getElementById('updatedAt');
  const syncPill = document.getElementById('syncPill');
  const syncText = syncPill.querySelector('.sync-text');
  const zendeskLink = document.getElementById('zendeskLink');

  let quill;
  let lastSyncedAt = null;
  let lastSyncRelativeTimer = null;

  let saveTimer = null;
  let inFlight = false;
  let pendingChange = false;
  let suppressChange = true;

  function setStatus(state, text) {
    syncPill.dataset.state = state;
    syncText.textContent = text;
  }

  function relTime(ts) {
    if (!ts) return '';
    const diffSec = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return new Date(ts).toLocaleDateString();
  }

  function refreshSyncedLabel() {
    if (syncPill.dataset.state === 'synced' && lastSyncedAt) {
      setStatus('synced', `Synced \u2713 ${relTime(lastSyncedAt)}`);
    }
    if (lastSyncedAt) {
      updatedAtEl.textContent = `Last updated ${relTime(lastSyncedAt)}`;
    }
  }

  function startRelTimer() {
    if (lastSyncRelativeTimer) clearInterval(lastSyncRelativeTimer);
    lastSyncRelativeTimer = setInterval(refreshSyncedLabel, 15000);
  }

  function scheduleSave() {
    if (suppressChange) return;
    if (saveTimer) clearTimeout(saveTimer);
    setStatus('saving', 'Editing\u2026');
    saveTimer = setTimeout(flushSave, DEBOUNCE_MS);
  }

  async function flushSave() {
    saveTimer = null;
    if (inFlight) {
      pendingChange = true;
      return;
    }
    inFlight = true;
    setStatus('saving', 'Saving\u2026');

    const payload = {
      title: titleEl.textContent.trim(),
      body: quill.root.innerHTML
    };

    try {
      const res = await fetch(
        `/sharepoint/api/article/${encodeURIComponent(articleId)}?locale=${encodeURIComponent(locale)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }

      const data = await res.json();
      lastSyncedAt = data.updatedAt || new Date().toISOString();
      setStatus('synced', `Synced \u2713 ${relTime(lastSyncedAt)}`);
      refreshSyncedLabel();
    } catch (err) {
      console.error('Save failed', err);
      setStatus('error', 'Sync failed \u2014 click to retry');
    } finally {
      inFlight = false;
      if (pendingChange) {
        pendingChange = false;
        flushSave();
      }
    }
  }

  syncPill.addEventListener('click', () => {
    if (syncPill.dataset.state === 'error') {
      flushSave();
    }
  });

  async function loadArticle() {
    setStatus('loading', 'Loading article\u2026');
    try {
      const res = await fetch(
        `/sharepoint/api/article/${encodeURIComponent(articleId)}?locale=${encodeURIComponent(locale)}`
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const data = await res.json();

      document.title = `${data.title} \u2014 SharePoint`;
      titleEl.textContent = data.title || '';

      quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Start writing\u2026',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'blockquote'],
            ['clean']
          ]
        }
      });

      quill.root.innerHTML = data.body || '';

      lastSyncedAt = data.updatedAt;
      refreshSyncedLabel();
      setStatus('synced', `Synced \u2713 ${relTime(lastSyncedAt)}`);
      startRelTimer();

      if (data.subdomain) {
        zendeskLink.href = `https://${data.subdomain}.zendesk.com/hc/${encodeURIComponent(
          data.locale || locale
        )}/articles/${encodeURIComponent(data.articleId || articleId)}`;
      }

      titleEl.addEventListener('input', scheduleSave);
      titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titleEl.blur();
        }
      });
      titleEl.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, text);
      });

      quill.on('text-change', (_delta, _old, source) => {
        if (source !== 'user') return;
        scheduleSave();
      });

      suppressChange = false;
    } catch (err) {
      console.error('Load failed', err);
      setStatus('error', 'Could not load article');
    }
  }

  loadArticle();
})();
