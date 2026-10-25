// Talento micro-interactions: click ripple, spring bounces, and confetti particle burst

const BURST_COLORS = ['#1fc2ff', '#1677ff', '#f6a623', '#1fa971', '#ff7a3d', '#f8e36a'];

export function burst(x: number, y: number, count = 18): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    const s = 6 + Math.random() * 7;
    p.style.cssText = `position:fixed;z-index:9999;pointer-events:none;left:${x}px;top:${y}px;width:${s}px;height:${
      Math.random() < 0.5 ? s : s * 0.45
    }px;background:${BURST_COLORS[i % BURST_COLORS.length]};border-radius:${
      Math.random() < 0.4 ? '50%' : '2px'
    };will-change:transform,opacity;`;
    document.body.appendChild(p);

    const a = Math.random() * Math.PI * 2;
    const d = 50 + Math.random() * 90;
    const anim = p.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - 40}px) rotate(${
            Math.random() * 540 - 270
          }deg)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(${Math.cos(a) * d * 1.1}px, ${Math.sin(a) * d + 60}px) rotate(${
            Math.random() * 720 - 360
          }deg)`,
          opacity: 0,
        },
      ],
      { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' },
    );
    anim.onfinish = () => p.remove();
  }
}

function handleGlobalClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  if (!target || !target.closest) return;

  // 1. Button ripple
  const button = target.closest<HTMLElement>('.btn, .side-create, .nv');
  if (button && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const rect = button.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    const rip = document.createElement('span');
    rip.className = 'rip';
    rip.style.left = `${x}px`;
    rip.style.top = `${y}px`;
    button.appendChild(rip);
    setTimeout(() => rip.remove(), 700);
  }

  // 2. Tile click bounce
  const tile = target.closest<HTMLElement>('.tile');
  if (tile && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    tile.animate(
      [
        { transform: 'rotate(0) scale(1)' },
        { transform: 'rotate(-20deg) scale(1.18)' },
        { transform: 'rotate(16deg) scale(1.12)' },
        { transform: 'rotate(-8deg) scale(1.06)' },
        { transform: 'rotate(0) scale(1)' },
      ],
      { duration: 650, easing: 'ease-out' },
    );
    const r = tile.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 14);
  }
}

export function initTheme(): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('talento.theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch {
    // Ignore storage issues
  }
}

export function toggleTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const current = document.documentElement.getAttribute('data-theme');
  const isDark =
    current === 'dark' ||
    (!current && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem('talento.theme', next);
  } catch {
    // Ignore storage issues
  }
  return next;
}

export function getTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'dark' || current === 'light') return current;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let initialized = false;
export function setupTalentoEffects(): () => void {
  if (typeof window === 'undefined' || initialized) return () => {};
  initialized = true;
  initTheme();
  document.addEventListener('click', handleGlobalClick, true);
  return () => {
    document.removeEventListener('click', handleGlobalClick, true);
    initialized = false;
  };
}
