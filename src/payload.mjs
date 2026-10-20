import { readFile } from 'node:fs/promises';

import { installSkin } from './renderer.mjs';
export { installSkin } from './renderer.mjs';

export const removeExpression = `(() => { window.__CANDY_JELLY_MACOS__?.remove(); return !document.getElementById('candy-jelly-macos-style'); })()`;

export async function buildPayload() {
  let css = await readFile(new URL('../assets/candy-jelly.css', import.meta.url), 'utf8');
  for (const name of ['candy-chick', 'sprout-helper']) {
    const svg = await readFile(new URL(`../assets/${name}.svg`, import.meta.url));
    css = css.replaceAll(`__${name.toUpperCase().replaceAll('-', '_')}__`, `data:image/svg+xml;base64,${svg.toString('base64')}`);
  }
  return `(() => { if (location.protocol !== 'app:' || location.hostname !== '-' || location.pathname !== '/index.html') return { installed: false }; return (${installSkin.toString()})(${JSON.stringify(css)}); })()`;
}
