type RevealMode = 'all' | 'hide-en' | 'initials' | 'recall';
type Theme = 'light' | 'dark';

interface LearningState {
  version: 1;
  favorites: string[];
  completed: string[];
  recent: string[];
  revealMode: RevealMode;
  theme: Theme;
}

const STORAGE_KEY = 'kaoyan-writing:v1';
const EMPTY_STATE: LearningState = {
  version: 1,
  favorites: [],
  completed: [],
  recent: [],
  revealMode: 'all',
  theme: 'light',
};

function uniqueStrings(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : [];
}

function readState(): LearningState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      version: 1,
      favorites: uniqueStrings(parsed.favorites),
      completed: uniqueStrings(parsed.completed),
      recent: uniqueStrings(parsed.recent).slice(0, 8),
      revealMode: ['all', 'hide-en', 'initials', 'recall'].includes(parsed.revealMode) ? parsed.revealMode : 'all',
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { ...EMPTY_STATE };
  }
}

let state = readState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  syncStateUI();
}

function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [id, ...list];
}

function announce(message: string) {
  let toast = document.querySelector<HTMLElement>('[data-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.dataset.toast = '';
    toast.setAttribute('role', 'status');
    Object.assign(toast.style, {
      position: 'fixed', left: '50%', bottom: '24px', zIndex: '100', transform: 'translateX(-50%)',
      padding: '9px 15px', borderRadius: '9px', color: '#fff', background: '#1e3a8a', fontSize: '13px',
      boxShadow: '0 8px 25px rgba(15,23,42,.25)', transition: 'opacity .2s',
    });
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  window.setTimeout(() => { if (toast) toast.style.opacity = '0'; }, 1500);
}

function syncStateUI() {
  document.querySelectorAll<HTMLButtonElement>('[data-action="favorite"]').forEach((button) => {
    const active = state.favorites.includes(button.dataset.id || '');
    button.setAttribute('aria-pressed', String(active));
    const label = button.querySelector('span');
    if (label) label.textContent = active ? '已收藏' : '收藏';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-action="complete"]').forEach((button) => {
    const active = state.completed.includes(button.dataset.id || '');
    button.setAttribute('aria-pressed', String(active));
    const label = button.querySelector('span');
    if (label) label.textContent = active ? '已经学过' : '标为已学';
  });
  document.querySelectorAll<HTMLElement>('[data-stat="favorites"]').forEach((node) => node.textContent = String(state.favorites.length));
  document.querySelectorAll<HTMLElement>('[data-stat="completed"]').forEach((node) => node.textContent = String(state.completed.length));
  renderFavorites();
  renderRecent();
}

function renderFavorites() {
  const grid = document.querySelector('[data-favorites-grid]');
  if (!grid) return;
  let visible = 0;
  grid.querySelectorAll<HTMLElement>('[data-resource-card]').forEach((card) => {
    const show = state.favorites.includes(card.dataset.id || '');
    card.classList.toggle('is-client-hidden', !show);
    if (show) visible += 1;
  });
  const empty = document.querySelector<HTMLElement>('[data-favorites-empty]');
  if (empty) empty.hidden = visible > 0;
}

function renderRecent() {
  const section = document.querySelector<HTMLElement>('[data-recent-section]');
  if (!section) return;
  let visible = 0;
  section.querySelectorAll<HTMLElement>('[data-resource-card]').forEach((card) => {
    const position = state.recent.indexOf(card.dataset.id || '');
    const show = position >= 0 && position < 3;
    card.classList.toggle('is-client-hidden', !show);
    if (show) {
      card.style.order = String(position);
      visible += 1;
    }
  });
  section.hidden = visible === 0;
}

function applyRevealMode(mode: RevealMode) {
  state.revealMode = mode;
  document.querySelectorAll<HTMLElement>('[data-learning-unit]').forEach((unit) => {
    const select = unit.querySelector<HTMLSelectElement>('[data-unit-mode]');
    const selected = select?.value;
    setUnitMode(unit, selected && selected !== 'default' ? selected as RevealMode : mode, true);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-reveal-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.revealMode === mode));
  });
}

function unitSegments(unit: HTMLElement): HTMLElement[] {
  return [...unit.querySelectorAll<HTMLElement>('.memory-segment')];
}

function updateUnitProgress(unit: HTMLElement) {
  const segments = unitSegments(unit);
  const revealed = segments.filter((segment) => segment.classList.contains('is-revealed')).length;
  const progress = unit.querySelector<HTMLElement>('[data-unit-progress]');
  if (progress) progress.textContent = `${revealed} / ${segments.length}`;
}

function setActiveSegment(unit: HTMLElement, index: number) {
  const segments = unitSegments(unit);
  segments.forEach((segment) => segment.classList.remove('is-active'));
  if (!segments.length) return;
  const next = Math.max(0, Math.min(index, segments.length - 1));
  unit.dataset.activeSegment = String(next);
  segments[next].classList.add('is-active');
  segments[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function resetUnit(unit: HTMLElement) {
  unit.querySelectorAll('.is-revealed, .is-active').forEach((node) => node.classList.remove('is-revealed', 'is-active'));
  unit.dataset.activeSegment = '0';
  const segments = unitSegments(unit);
  if (segments.length && unit.dataset.mode !== 'all') segments[0].classList.add('is-active');
  updateUnitProgress(unit);
}

function setUnitMode(unit: HTMLElement, mode: RevealMode, reset = false) {
  unit.dataset.mode = mode;
  unit.classList.remove('mode-all', 'mode-hide-en', 'mode-initials', 'mode-recall');
  unit.classList.add(`mode-${mode}`);
  if (reset) resetUnit(unit);
}

function revealNext(unit: HTMLElement) {
  const mode = unit.dataset.mode as RevealMode;
  const segments = unitSegments(unit);
  const nextIndex = segments.findIndex((segment) => !segment.classList.contains('is-revealed'));
  if (nextIndex < 0) {
    announce('这一卡已经全部揭示');
    return;
  }
  if (mode === 'recall') {
    const pair = segments[nextIndex].closest('.bilingual-pair');
    const chineseHint = pair?.querySelector<HTMLElement>('.lang-zh:not(.is-revealed)');
    if (chineseHint) {
      chineseHint.classList.add('is-revealed');
      announce('已显示中文提示，再点一次揭示英文');
      return;
    }
  }
  segments[nextIndex].classList.add('is-revealed');
  setActiveSegment(unit, Math.min(nextIndex + 1, segments.length - 1));
  updateUnitProgress(unit);
}

function initLearningUnits() {
  document.querySelectorAll<HTMLElement>('[data-learning-unit]').forEach((unit) => {
    const segments = unitSegments(unit);
    segments.forEach((segment, index) => {
      segment.tabIndex = 0;
      segment.setAttribute('role', 'button');
      segment.setAttribute('aria-label', `第 ${index + 1} 句，点击揭示`);
    });
    updateUnitProgress(unit);
  });

  const links = [...document.querySelectorAll<HTMLAnchorElement>('.article-toc a[href^="#"]')];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-learning-unit]')];
  if ('IntersectionObserver' in window && links.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.classList.toggle('is-current', link.hash === `#${visible.target.id}`));
    }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .15, .5] });
    sections.forEach((section) => observer.observe(section));
  }
}

function writeGuideState(status: 'dismissed' | 'completed') {
  localStorage.setItem('kaoyan-writing:guide:v1', JSON.stringify({ version: 1, status, updatedAt: Date.now() }));
}

function initGuideWelcome() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-guide-welcome]');
  if (!dialog || location.pathname.startsWith('/guide/')) return;
  if (!localStorage.getItem('kaoyan-writing:guide:v1')) dialog.showModal();
  dialog.querySelectorAll<HTMLElement>('[data-guide-dismiss]').forEach((control) => control.addEventListener('click', () => {
    writeGuideState('dismissed');
    dialog.close();
  }));
}

function initLibrary() {
  const input = document.querySelector<HTMLInputElement>('[data-library-search]');
  if (!input) return;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-category-filter]')];
  const cards = [...document.querySelectorAll<HTMLElement>('[data-library-grid] [data-resource-card]')];
  const count = document.querySelector<HTMLElement>('[data-result-count]');
  const empty = document.querySelector<HTMLElement>('[data-library-empty]');
  const params = new URLSearchParams(location.search);
  let category = params.get('category') || 'all';
  let index = new Map<string, string>();
  input.value = params.get('q') || '';

  if (!buttons.some((button) => button.dataset.categoryFilter === category)) category = 'all';
  buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category)));

  const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/g, ' ').trim();
  const filter = () => {
    const query = normalize(input.value);
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatches = category === 'all' || card.dataset.category === category;
      const textMatches = !query || (index.get(card.dataset.id || '') || '').includes(query);
      const show = categoryMatches && textMatches;
      card.classList.toggle('is-client-hidden', !show);
      if (show) visible += 1;
    });
    if (count) count.textContent = `${visible} 项内容`;
    if (empty) empty.hidden = visible > 0;
    const next = new URLSearchParams();
    if (input.value.trim()) next.set('q', input.value.trim());
    if (category !== 'all') next.set('category', category);
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
  };

  input.addEventListener('input', filter);
  buttons.forEach((button) => button.addEventListener('click', () => {
    category = button.dataset.categoryFilter || 'all';
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    filter();
  }));

  fetch('/search-index.json')
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('search index unavailable')))
    .then((items: Array<{ id: string; text: string }>) => {
      index = new Map(items.map((item) => [item.id, item.text]));
      filter();
    })
    .catch(() => {
      index = new Map(cards.map((card) => [card.dataset.id || '', normalize(card.textContent || '')]));
      filter();
    });
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const action = target.closest<HTMLButtonElement>('[data-action]');
  if (action?.dataset.id) {
    const id = action.dataset.id;
    if (action.dataset.action === 'favorite') {
      state.favorites = toggleInList(state.favorites, id);
      announce(state.favorites.includes(id) ? '已加入收藏' : '已取消收藏');
    }
    if (action.dataset.action === 'complete') {
      state.completed = toggleInList(state.completed, id);
      announce(state.completed.includes(id) ? '已标记为学过' : '已取消学习标记');
    }
    saveState();
  }

  const reveal = target.closest<HTMLButtonElement>('[data-reveal-mode]');
  if (reveal) {
    applyRevealMode(reveal.dataset.revealMode as RevealMode);
    saveState();
  }

  const unitMode = target.closest<HTMLSelectElement>('[data-unit-mode]');
  if (unitMode) return;

  const control = target.closest<HTMLButtonElement>('[data-unit-action]');
  if (control) {
    const unit = control.closest<HTMLElement>('[data-learning-unit]');
    if (!unit) return;
    const current = Number(unit.dataset.activeSegment || 0);
    if (control.dataset.unitAction === 'previous') setActiveSegment(unit, current - 1);
    if (control.dataset.unitAction === 'next') setActiveSegment(unit, current + 1);
    if (control.dataset.unitAction === 'reveal') revealNext(unit);
    if (control.dataset.unitAction === 'reset') resetUnit(unit);
    return;
  }

  const concealed = target.closest<HTMLElement>('.memory-segment:not(.is-revealed), .mode-recall .lang-zh:not(.is-question, .is-revealed)');
  if (concealed) {
    concealed.classList.add('is-revealed');
    const unit = concealed.closest<HTMLElement>('[data-learning-unit]');
    if (unit) updateUnitProgress(unit);
  }
});

document.addEventListener('change', (event) => {
  const select = (event.target as HTMLElement).closest<HTMLSelectElement>('[data-unit-mode]');
  if (!select) return;
  const unit = select.closest<HTMLElement>('[data-learning-unit]');
  if (!unit) return;
  setUnitMode(unit, select.value === 'default' ? state.revealMode : select.value as RevealMode, true);
});

document.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const segment = (event.target as HTMLElement).closest<HTMLElement>('.memory-segment');
  if (!segment) return;
  event.preventDefault();
  segment.classList.add('is-revealed');
  const unit = segment.closest<HTMLElement>('[data-learning-unit]');
  if (unit) updateUnitProgress(unit);
});

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  state.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  if (state.theme === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  saveState();
});

const navToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const nav = document.querySelector<HTMLElement>('[data-site-nav]');
navToggle?.addEventListener('click', () => {
  const open = nav?.classList.toggle('is-open') || false;
  navToggle.setAttribute('aria-expanded', String(open));
});

const contentId = document.body.dataset.contentId;
if (contentId) {
  state.recent = [contentId, ...state.recent.filter((id) => id !== contentId)].slice(0, 8);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

if (state.theme === 'dark') document.documentElement.dataset.theme = 'dark';
applyRevealMode(state.revealMode);
syncStateUI();
initLibrary();
initLearningUnits();
initGuideWelcome();
