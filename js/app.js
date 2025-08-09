// ======= Simple state (localStorage) =======
const LS_KEYS = { links: 'portal.links.v1', news: 'portal.news.v1', theme: 'portal.theme' };

const DEFAULT_LINKS = [
  { title: 'Пошта', url: 'https://mail.google.com', icon: '✉' },
  { title: 'Календар', url: 'https://calendar.google.com', icon: '📅' },
  { title: 'Диск', url: 'https://drive.google.com', icon: '▶' },
  { title: 'Jira', url: 'https://jira.example.com', icon: 'J' },
  { title: 'Confluence', url: 'https://confluence.example.com', icon: 'C' },
  { title: 'Helpdesk', url: 'https://helpdesk.example.com', icon: 'H' }
];

const DEFAULT_NEWS = [
  { text: 'Планові роботи в мережі у п’ятницю 22:00–23:00.', ts: Date.now() - 1000*60*60*2 },
  { text: 'Нова інструкція з безпеки — у розділі Документи.', ts: Date.now() - 1000*60*60*24 }
];

const state = {
  links: JSON.parse(localStorage.getItem(LS_KEYS.links) || 'null') || DEFAULT_LINKS,
  news: JSON.parse(localStorage.getItem(LS_KEYS.news)  || 'null') || DEFAULT_NEWS,
  editMode: false,
  adminNews: false
};

// ======= Elements =======
const el = {
  year: document.getElementById('year'),
  links: document.getElementById('links'),
  news: document.getElementById('news'),
  editBtn: document.getElementById('editBtn'),
  editPanel: document.getElementById('editPanel'),
  addLinkBtn: document.getElementById('addLinkBtn'),
  resetLinksBtn: document.getElementById('resetLinksBtn'),
  linkDlg: document.getElementById('linkDlg'),
  linkTitle: document.getElementById('linkTitle'),
  linkUrl: document.getElementById('linkUrl'),
  linkIcon: document.getElementById('linkIcon'),
  saveLinkBtn: document.getElementById('saveLinkBtn'),

  newsPanel: document.getElementById('newsPanel'),
  addNewsBtn: document.getElementById('addNewsBtn'),
  resetNewsBtn: document.getElementById('resetNewsBtn'),
  newsDlg: document.getElementById('newsDlg'),
  newsText: document.getElementById('newsText'),
  saveNewsBtn: document.getElementById('saveNewsBtn'),

  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  themeBtn: document.getElementById('themeBtn')
};

el.year.textContent = new Date().getFullYear();

// ======= Theme =======
const savedTheme = localStorage.getItem(LS_KEYS.theme);
if (savedTheme === 'dark') document.documentElement.classList.add('dark');
el.themeBtn.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem(LS_KEYS.theme, document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

// ======= Search =======
el.searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = el.searchInput.value.trim();
  if (!q) return;
  const url = 'https://www.google.com/search?q=' + encodeURIComponent(q);
  window.open(url, '_blank', 'noopener');
});

// ======= Render helpers =======
function renderLinks() {
  el.links.innerHTML = '';
  state.links.forEach((item, idx) => {
    const a = document.createElement('a');
    a.className = 'linkItem';
    a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');
    a.innerHTML = `<span class="linkIcon" aria-hidden="true">${(item.icon||item.title[0]||'·').toString().slice(0,2)}</span>
                   <span>${escapeHtml(item.title)}</span>`;
    if (state.editMode) {
      a.addEventListener('click', (ev) => { ev.preventDefault(); openLinkEditor(idx); });
      a.title = 'Клікніть, щоб редагувати';
    }
    el.links.appendChild(a);
  });
}

function renderNews() {
  const list = [...state.news].sort((a,b) => b.ts - a.ts);
  el.news.innerHTML = '';
  list.forEach((n, idx) => {
    const div = document.createElement('div');
    div.className = 'newsItem';
    const d = new Date(n.ts);
    div.innerHTML = `<div>${escapeHtml(n.text)}</div><time datetime="${d.toISOString()}">${d.toLocaleString()}</time>`;
    if (state.adminNews) {
      div.style.cursor = 'pointer';
      div.title = 'Клікніть, щоб видалити';
      div.addEventListener('click', () => {
        if (confirm('Видалити оголошення?')) {
          state.news.splice(idx,1);
          saveNews();
          renderNews();
        }
      });
    }
    el.news.appendChild(div);
  });
}

function saveLinks() { localStorage.setItem(LS_KEYS.links, JSON.stringify(state.links)); }
function saveNews()  { localStorage.setItem(LS_KEYS.news,  JSON.stringify(state.news)); }

// ======= Edit mode =======
el.editBtn.addEventListener('click', () => {
  state.editMode = !state.editMode;
  el.editPanel.hidden = !state.editMode;
  el.newsPanel.hidden = !state.editMode;
  state.adminNews = state.editMode;
  el.editBtn.textContent = state.editMode ? '✅ Готово' : '✏️ Редагувати';
  renderLinks(); renderNews();
});

el.addLinkBtn?.addEventListener('click', () => openLinkEditor());
el.resetLinksBtn?.addEventListener('click', () => {
  if (confirm('Скинути посилання до стандартних?')) {
    state.links = DEFAULT_LINKS.slice();
    saveLinks();
    renderLinks();
  }
});

function openLinkEditor(index = null) {
  el.linkTitle.value = index!=null ? state.links[index].title : '';
  el.linkUrl.value   = index!=null ? state.links[index].url   : '';
  el.linkIcon.value  = index!=null ? (state.links[index].icon||'') : '';
  el.linkDlg.returnValue = '';
  el.linkDlg.showModal();

  const onSave = (ev) => {
    ev?.preventDefault?.();
    const item = { title: el.linkTitle.value.trim(), url: el.linkUrl.value.trim(), icon: el.linkIcon.value.trim() };
    if (!item.title || !item.url) return;
    if (index!=null) state.links[index] = item; else state.links.push(item);
    saveLinks(); renderLinks(); el.linkDlg.close();
    el.saveLinkBtn.removeEventListener('click', onSave);
  };
  el.saveLinkBtn.addEventListener('click', onSave);
  el.linkDlg.addEventListener('close', () => el.saveLinkBtn.removeEventListener('click', onSave), { once: true });
}

// ======= News editing =======
el.addNewsBtn?.addEventListener('click', () => {
  el.newsText.value = '';
  el.newsDlg.returnValue = '';
  el.newsDlg.showModal();
  const onSave = (ev) => {
    ev?.preventDefault?.();
    const text = el.newsText.value.trim();
    if (!text) return;
    state.news.push({ text, ts: Date.now() });
    saveNews(); renderNews(); el.newsDlg.close();
    el.saveNewsBtn.removeEventListener('click', onSave);
  };
  el.saveNewsBtn.addEventListener('click', onSave);
  el.newsDlg.addEventListener('close', () => el.saveNewsBtn.removeEventListener('click', onSave), { once: true });
});

el.resetNewsBtn?.addEventListener('click', () => {
  if (confirm('Скинути оголошення до стандартних?')) {
    state.news = DEFAULT_NEWS.slice();
    saveNews();
    renderNews();
  }
});

// ======= Utilities =======
function escapeHtml(str) {
  return str.replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ======= Initial render =======
renderLinks();
renderNews();
