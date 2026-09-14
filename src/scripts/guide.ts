const steps = [
  { selector: '[data-tour-target="library"]', title: '长文先拆成小卡', copy: '每张卡只承担一个语义任务。一次背一小块，认知负担更低。' },
  { selector: '[data-tour-target="page-mode"]', title: '逐步减少提示', copy: '全页模式会统一控制所有卡片。建议从中英对照开始，最后挑战完整回忆。' },
  { selector: '.memory-segment', title: '一句一句主动回忆', copy: '被遮挡的英文可以单击揭示，也可以用卡片底部按钮逐句推进。' },
  { selector: '[data-unit-mode]', title: '难点卡单独加练', copy: '某张卡需要不同难度时，在这里覆盖全页模式，不影响其他卡片。' },
  { selector: '[data-unit-download]', title: '把这一卡带走', copy: '点击会打开完整双语 A4 打印版，可在浏览器中另存为 PDF。' },
];

const coach = document.querySelector<HTMLElement>('[data-tour-coach]');
const overlay = document.querySelector<HTMLElement>('[data-tour-overlay]');
let current = 0;

function finish(completed: boolean) {
  document.querySelector('.is-tour-focus')?.classList.remove('is-tour-focus');
  coach?.setAttribute('hidden', '');
  overlay?.setAttribute('hidden', '');
  localStorage.setItem('kaoyan-writing:guide:v1', JSON.stringify({ version: 1, status: completed ? 'completed' : 'dismissed', updatedAt: Date.now() }));
  if (completed) location.href = '/library/';
}

function showStep(index: number) {
  current = Math.max(0, Math.min(index, steps.length - 1));
  document.querySelector('.is-tour-focus')?.classList.remove('is-tour-focus');
  const step = steps[current];
  const target = document.querySelector<HTMLElement>(step.selector);
  target?.classList.add('is-tour-focus');
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const title = coach?.querySelector<HTMLElement>('[data-tour-title]');
  const copy = coach?.querySelector<HTMLElement>('[data-tour-copy]');
  const count = coach?.querySelector<HTMLElement>('[data-tour-count]');
  const previous = coach?.querySelector<HTMLButtonElement>('[data-tour-previous]');
  const next = coach?.querySelector<HTMLButtonElement>('[data-tour-next]');
  if (title) title.textContent = step.title;
  if (copy) copy.textContent = step.copy;
  if (count) count.textContent = `${current + 1} / ${steps.length}`;
  if (previous) previous.disabled = current === 0;
  if (next) next.textContent = current === steps.length - 1 ? '完成，去资料库' : '下一步';
}

if (coach && overlay) {
  coach.hidden = false;
  overlay.hidden = false;
  showStep(0);
  coach.querySelector('[data-tour-previous]')?.addEventListener('click', () => showStep(current - 1));
  coach.querySelector('[data-tour-next]')?.addEventListener('click', () => current === steps.length - 1 ? finish(true) : showStep(current + 1));
  coach.querySelector('[data-tour-skip]')?.addEventListener('click', () => finish(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') current === steps.length - 1 ? finish(true) : showStep(current + 1);
    if (event.key === 'ArrowLeft') showStep(current - 1);
    if (event.key === 'Escape') finish(false);
  });
}
