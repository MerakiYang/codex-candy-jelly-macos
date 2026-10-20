// The renderer changes only a scoped attribute and one stylesheet. No app state,
// message text, event handlers, fonts, account settings, or DOM layout is replaced.
export function installSkin(css) {
  const root = document.documentElement;
  const key = '__CANDY_JELLY_MACOS__';
  window[key]?.remove();
  const previous = root.getAttribute('data-candy-jelly');
  const style = document.createElement('style');
  style.id = 'candy-jelly-macos-style';
  style.textContent = css;
  document.head.appendChild(style);
  root.setAttribute('data-candy-jelly', 'macos');
  window[key] = {
    version: '0.1.0',
    remove() {
      style.remove();
      if (previous === null) root.removeAttribute('data-candy-jelly');
      else root.setAttribute('data-candy-jelly', previous);
      delete window[key];
    },
  };
  return { installed: true, version: '0.1.0' };
}

