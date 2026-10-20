import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { loopbackURL, isAppPage } from '../src/cdp.mjs';
import { parseListener } from '../src/macos.mjs';
import { buildPayload, installSkin, removeExpression } from '../src/payload.mjs';

test('debug endpoints reject remote hosts, alternate ports, credentials, redirects, and wrong IDs', () => {
  const port = 19234;
  assert.equal(loopbackURL(`ws://127.0.0.1:${port}/devtools/page/a`, port, 'page', 'a'), `ws://127.0.0.1:${port}/devtools/page/a`);
  for (const url of [
    `ws://example.com:${port}/devtools/page/a`, `ws://localhost:${port}/devtools/page/a`,
    'ws://127.0.0.1:19235/devtools/page/a', `ws://user@127.0.0.1:${port}/devtools/page/a`,
    `ws://127.0.0.1:${port}/devtools/page/a?remote=1`, `ws://127.0.0.1:${port}/devtools/page/a#x`,
    `http://127.0.0.1:${port}/devtools/page/a`, `ws://127.0.0.1:${port}/devtools/browser/a`,
    `ws://127.0.0.1:${port}/devtools/page/b`,
  ]) assert.throws(() => loopbackURL(url, port, 'page', 'a'));
});

test('only the exact application shell is eligible, never embedded websites', () => {
  const target = { type: 'page', id: 'a', url: 'app://-/index.html#/thread/example', webSocketDebuggerUrl: 'ws://127.0.0.1:19234/devtools/page/a' };
  assert.equal(isAppPage(target, 19234), true);
  for (const url of ['https://chatgpt.com/', 'https://github.com/', 'app://other/index.html', 'app://-/browser.html', 'file:///index.html', 'devtools://devtools/']) {
    assert.equal(isAppPage({ ...target, url }, 19234), false);
  }
  assert.equal(isAppPage({ ...target, type: 'webview' }, 19234), false);
});

test('listener ownership check rejects wildcard, IPv6, multiple owners, and missing listeners', () => {
  assert.equal(parseListener('p123\nn127.0.0.1:19234\n', 19234), 123);
  for (const value of ['', 'p123\nn*:19234', 'p123\nn[::1]:19234', 'p123\nn127.0.0.1:19234\np456\nn127.0.0.1:19234']) {
    assert.throws(() => parseListener(value, 19234));
  }
});

function renderer() {
  const attrs = new Map([['class', 'dark existing-app-class']]);
  const styles = [];
  const root = {
    getAttribute: k => attrs.get(k) ?? null,
    setAttribute: (k, v) => attrs.set(k, v),
    removeAttribute: k => attrs.delete(k),
  };
  const document = {
    documentElement: root,
    head: { appendChild: element => styles.push(element) },
    createElement: () => ({ remove() { const i = styles.indexOf(this); if (i >= 0) styles.splice(i, 1); } }),
    getElementById: id => styles.find(x => x.id === id),
  };
  const context = vm.createContext({ document, window: {}, location: { protocol: 'app:', hostname: '-', pathname: '/index.html' } });
  return { context, attrs, styles };
}

test('install, repeated install, and restore preserve existing app attributes', () => {
  const { context, attrs, styles } = renderer();
  attrs.set('data-candy-jelly', 'previous-value');
  const source = `(${installSkin.toString()})('body { color: pink; }')`;
  vm.runInContext(source, context);
  vm.runInContext(source, context);
  assert.equal(styles.length, 1);
  assert.equal(attrs.get('data-candy-jelly'), 'macos');
  assert.equal(vm.runInContext(removeExpression, context), true);
  assert.equal(styles.length, 0);
  assert.equal(attrs.get('data-candy-jelly'), 'previous-value');
  assert.equal(attrs.get('class'), 'dark existing-app-class');
  assert.equal(context.window.__CANDY_JELLY_MACOS__, undefined);
});

test('built payload embeds local artwork and refuses navigation into a website', async () => {
  const source = await buildPayload();
  assert.ok(source.includes('data:image/svg+xml;base64,'));
  assert.ok(!source.includes('__CANDY_CHICK__'));
  const { context, styles } = renderer();
  context.location.protocol = 'https:';
  context.location.hostname = 'github.com';
  vm.runInContext(source, context);
  assert.equal(styles.length, 0);
  context.location = { protocol: 'app:', hostname: '-', pathname: '/index.html' };
  vm.runInContext(source, context);
  assert.equal(styles.length, 1);
  vm.runInContext(removeExpression, context);
  assert.equal(styles.length, 0);
});

test('theme share strings round-trip and contain all required import fields', async () => {
  for (const variant of ['light', 'dark']) {
    const json = JSON.parse(await readFile(new URL(`../themes/candy-jelly-${variant}.json`, import.meta.url)));
    const text = (await readFile(new URL(`../themes/candy-jelly-${variant}.txt`, import.meta.url), 'utf8')).trim();
    assert.ok(text.startsWith('codex-theme-v1:'));
    assert.deepEqual(JSON.parse(text.slice(15)), json);
    assert.equal(json.variant, variant);
    assert.equal(json.codeThemeId, 'codex');
    assert.equal(json.theme.accentSource, 'custom');
    for (const value of [json.theme.accent, json.theme.surface, json.theme.ink, ...Object.values(json.theme.semanticColors)]) assert.match(value, /^#[a-f\d]{6}$/i);
    assert.ok(json.theme.contrast >= 0 && json.theme.contrast <= 100);
    assert.deepEqual(json.theme.fonts, { code: null, ui: null });
    assert.equal(typeof json.theme.opaqueWindows, 'boolean');
  }
});
