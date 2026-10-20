import { mkdir, readFile, writeFile, rm, open, lstat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { CDP, readJSON, loopbackURL, isAppPage } from './cdp.mjs';
import { buildPayload, removeExpression } from './payload.mjs';
import { discoverApp, isRunning, unusedPort, assertListener, openApp } from './macos.mjs';

const stateDir = path.join(homedir(), 'Library/Application Support/Codex Candy Jelly/runtime');
const statePath = path.join(stateDir, 'session.json');
const stopPath = path.join(stateDir, 'stop.json');
const lockPath = path.join(stateDir, 'launcher.lock');

async function secureDirectory() {
  await mkdir(stateDir, { recursive: true, mode: 0o700 });
  const stat = await lstat(stateDir);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid() || (stat.mode & 0o077)) {
    throw new Error('Runtime directory must be a private directory owned by the current user');
  }
}
async function readState(file = statePath) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function run() {
  const action = process.argv[2] ?? 'help';
  if (['help', '--help'].includes(action)) {
    console.log('Candy Jelly macOS\n  node src/cli.mjs doctor\n  node src/cli.mjs start\n  node src/cli.mjs restore\nNative themes in themes/ do not require this launcher.');
    return;
  }
  if (process.platform !== 'darwin') throw new Error('The launcher requires macOS. Native theme files are platform independent.');
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Install Node.js 22 or newer from nodejs.org.');
  if (action === 'doctor') {
    const app = await discoverApp();
    console.log(`Application: ${app.app}\nVersion: ${app.version}\nNode: ${process.versions.node}\nRunning: ${await isRunning(app.executable)}\nThe enhanced skin uses an unsupported runtime interface. Native theme import is recommended.`);
    return;
  }
  if (!['start', 'restore'].includes(action)) throw new Error('Unknown command. Use start, restore, or doctor.');
  await secureDirectory();
  if (action === 'restore') {
    const state = await readState();
    if (!state) { console.log('No active skin session. Quit Codex and reopen it normally to close any debug port.'); return; }
    await writeFile(stopPath, JSON.stringify({ nonce: state.nonce }), { mode: 0o600 });
    for (let count = 0; count < 30; count++) {
      if (!await readState()) {
        console.log('Launcher session ended. Quit Codex and reopen it normally to ensure its skin and debugging port are removed. Native imported colors are managed separately in Settings > Appearance.');
        return;
      }
      await delay(300);
    }
    throw new Error('The launcher is not responding. Quit Codex with Command-Q and reopen it normally. This removes the runtime skin and closes the debug port.');
  }

  // A retained lock deliberately requires manual diagnosis after a crash. Never
  // overwrite another live session or kill a process found only by its PID.
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('A launcher lock exists. Run Restore first. After a crash, quit Codex and remove only the runtime directory described in README.');
    throw error;
  }
  const sessions = new Map();
  let browser, stopped = false, started = false, cleaned = false;
  let ownerPid, endpoint, port;
  const nonce = randomUUID();
  const app = await discoverApp().catch(async error => { await lock.close(); await rm(lockPath); throw error; });
  const onSignal = () => { stopped = true; };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  try {
    if (await readState()) throw new Error('A previous session exists. Run Restore or follow crash recovery in README.');
    if (await isRunning(app.executable)) throw new Error('Save drafts, then quit Codex with Command-Q and run Start again. The launcher never quits your active app.');
    port = await unusedPort();
    console.log('Starting Codex with a local-only debug port. Keep this Terminal open; Control-C restores the skin.');
    await openApp(app.app, port);
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (stopped) return;
      try {
        ownerPid = await assertListener(port, app.executable);
        const version = await readJSON(port, '/json/version');
        endpoint = loopbackURL(version.webSocketDebuggerUrl, port, 'browser');
        break;
      } catch { await delay(500); }
    }
    if (!endpoint) throw new Error('Codex did not expose a loopback debug port within 30 seconds. Use native theme import for this build. Quit and reopen Codex normally before trying again.');
    browser = await new CDP(endpoint).open();
    await writeFile(statePath, JSON.stringify({ nonce, port, ownerPid, endpoint, version: app.version }), { mode: 0o600, flag: 'wx' });
    started = true;
    const payload = await buildPayload();
    let shown = false, waitingShown = false;
    while (!stopped && !browser.closed) {
      if ((await readState(stopPath))?.nonce === nonce) break;
      await assertListener(port, app.executable, ownerPid);
      const version = await readJSON(port, '/json/version');
      if (loopbackURL(version.webSocketDebuggerUrl, port, 'browser') !== endpoint) throw new Error('Debug browser identity changed');
      const targets = await readJSON(port, '/json/list');
      if (!Array.isArray(targets)) throw new Error('Unexpected target list');
      const live = new Set();
      for (const target of targets.filter(item => isAppPage(item, port))) {
        live.add(target.id);
        let session = sessions.get(target.id);
        if (session?.cdp.closed) { sessions.delete(target.id); session = null; }
        if (!session) {
          const cdp = await new CDP(loopbackURL(target.webSocketDebuggerUrl, port, 'page', target.id)).open();
          session = { cdp, script: null };
          sessions.set(target.id, session);
          try {
            await cdp.send('Page.enable');
            const registered = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `document.addEventListener('DOMContentLoaded', () => { ${payload}; }, { once: true });` });
            session.script = registered.identifier;
            await cdp.evaluate(payload);
            if (!shown) { console.log('Candy Jelly applied. New app windows and reloads are handled automatically.'); shown = true; }
          } catch (error) { throw error; }
        } else {
          // A redirect into a website is excluded on the next target poll. Never
          // evaluate anything outside the strictly allowed app URL above.
          const active = await session.cdp.evaluate('Boolean(window.__CANDY_JELLY_MACOS__ && document.getElementById("candy-jelly-macos-style"))');
          if (!active) await session.cdp.evaluate(payload);
        }
      }
      for (const [id, session] of sessions) {
        if (!live.has(id)) { session.cdp.close(); sessions.delete(id); }
      }
      if (!shown && !waitingShown && !stopped) { console.log('Waiting for the Codex app window…'); waitingShown = true; }
      await delay(1500);
    }
  } finally {
    // Remove reload scripts first; verify app identity and current page URL before
    // evaluating the undo. An unreachable app requires a normal quit/reopen.
    let verified = false;
    try { if (started) { await assertListener(port, app.executable, ownerPid); verified = (await readJSON(port, '/json/version')).webSocketDebuggerUrl === endpoint; } } catch { /* app may be closed */ }
    let targets = [];
    if (verified) { try { targets = await readJSON(port, '/json/list'); } catch { /* disconnected */ } }
    cleaned = verified;
    for (const [id, session] of sessions) {
      try {
        if (session.script) await session.cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: session.script });
        if (verified && targets.some(t => t.id === id && isAppPage(t, port))) await session.cdp.evaluate(removeExpression);
      } catch { cleaned = false; }
      session.cdp.close();
    }
    browser?.close();
    if (started && (await readState())?.nonce === nonce) await rm(statePath, { force: true });
    if ((await readState(stopPath))?.nonce === nonce) await rm(stopPath, { force: true });
    await lock.close();
    await rm(lockPath, { force: true });
    process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
    if (started) console.log(cleaned ? 'Runtime styling removed. Quit and reopen Codex normally to close the debug port.' : 'Session ended. Quit and reopen Codex normally to ensure the skin and debug port are removed.');
  }
}

run().catch(error => { console.error(error.message); process.exitCode = 1; });
