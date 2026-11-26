const STYLE_ID = 'logout-transition-style';
const SHOW_MS = 1700;
const FADE_MS = 500;

const CSS = `
.lo-overlay{position:fixed;inset:0;z-index:99999;display:flex;justify-content:center;align-items:center;color:#fff;
  background:radial-gradient(circle at center,#2b0a3d,#14002b);opacity:0;animation:lo-in .45s ease forwards}
.lo-overlay.lo-out{animation:lo-out ${FADE_MS}ms ease forwards}
.lo-box{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px}
.lo-icon{width:96px;height:96px;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 16px rgba(255,65,108,.55))}
.lo-ring{fill:none;stroke:#ff6b8f;stroke-width:2.5;stroke-dasharray:151;stroke-dashoffset:0;transform-origin:center;
  animation:lo-ring ${SHOW_MS}ms ease forwards}
.lo-door{fill:none;stroke:#fff;stroke-width:3;animation:lo-pop .5s .2s ease both}
.lo-arrow{fill:none;stroke:#fff;stroke-width:3;animation:lo-go ${SHOW_MS - 300}ms .3s ease-in forwards}
.lo-title{margin-top:18px;font-size:22px;font-weight:700;animation:lo-rise .5s .25s ease both}
.lo-sub{font-size:0.875rem;color:rgba(255,255,255,.65);animation:lo-rise .5s .4s ease both}
@keyframes lo-in{to{opacity:1}}
@keyframes lo-out{from{opacity:1}to{opacity:0}}
@keyframes lo-ring{to{stroke-dashoffset:151}}
@keyframes lo-pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
@keyframes lo-go{0%{transform:translateX(0);opacity:1}60%{opacity:1}100%{transform:translateX(14px);opacity:0}}
@keyframes lo-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.lo-overlay,.lo-overlay *{animation-duration:.01s!important;animation-delay:0s!important}}
`;

const HTML = `
<div class="lo-box">
  <svg class="lo-icon" viewBox="0 0 52 52" aria-hidden="true">
    <circle class="lo-ring" cx="26" cy="26" r="24" transform="rotate(-90 26 26)"/>
    <path class="lo-door" d="M20 16 h-5 a2 2 0 0 0 -2 2 v16 a2 2 0 0 0 2 2 h5"/>
    <path class="lo-arrow" d="M24 26 h16 m-6 -6 l6 6 l-6 6"/>
  </svg>
  <div class="lo-title">กำลังออกจากระบบ</div>
  <div class="lo-sub">แล้วพบกันใหม่</div>
</div>`;

/** Full-screen goodbye animation. Resolves when it is time to log out; overlay fades itself away afterwards. */
export function playLogoutTransition(): Promise<() => void> {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.className = 'lo-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = HTML;
  document.body.appendChild(overlay);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(() => {
        overlay.classList.add('lo-out');
        setTimeout(() => overlay.remove(), FADE_MS);
      });
    }, SHOW_MS);
  });
}
