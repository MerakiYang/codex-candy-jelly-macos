import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { access, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
const execFile = promisify(execFileCallback);

export async function plist(app, key) {
  const { stdout } = await execFile('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, path.join(app, 'Contents/Info.plist')]);
  return stdout.trim();
}

export async function discoverApp(explicit = process.env.CODEX_APP_PATH) {
  const candidates = explicit ? [explicit] : [
    '/Applications/Codex.app', '/Applications/ChatGPT.app',
    path.join(homedir(), 'Applications/Codex.app'), path.join(homedir(), 'Applications/ChatGPT.app'),
  ];
  for (const candidate of candidates) {
    try {
      const app = await realpath(candidate);
      if (await plist(app, 'CFBundleIdentifier') !== 'com.openai.codex') continue;
      const name = await plist(app, 'CFBundleExecutable');
      if (!/^[\w .-]+$/.test(name)) throw new Error('Unexpected executable name');
      const executable = path.join(app, 'Contents/MacOS', name);
      await access(executable);
      return { app, executable, version: await plist(app, 'CFBundleShortVersionString') };
    } catch { /* Try the next bundle, but never substitute a different bundle ID. */ }
  }
  throw new Error('Codex was not found. Set CODEX_APP_PATH to the full .app path. The bundle ID must be com.openai.codex.');
}

export async function isRunning(executable) {
  const { stdout } = await execFile('/bin/ps', ['-axo', 'comm=']);
  return stdout.split('\n').some(line => line.trim() === executable);
}

export async function unusedPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

export function parseListener(output, port) {
  const lines = output.trim().split('\n');
  const pids = lines.filter(x => /^p\d+$/.test(x)).map(x => Number(x.slice(1)));
  const addresses = lines.filter(x => x.startsWith('n')).map(x => x.slice(1));
  if (new Set(pids).size !== 1 || !addresses.length || addresses.some(x => x !== `127.0.0.1:${port}`)) {
    throw new Error('Debug port must belong to one process listening only on 127.0.0.1');
  }
  return pids[0];
}

export async function assertListener(port, executable, expectedPid) {
  const { stdout } = await execFile('/usr/sbin/lsof', ['-nP', '-a', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpn']);
  const pid = parseListener(stdout, port);
  if (expectedPid && pid !== expectedPid) throw new Error('Debug process changed');
  const { stdout: command } = await execFile('/bin/ps', ['-p', String(pid), '-o', 'comm=']);
  if (command.trim() !== executable) throw new Error('Debug port belongs to another application');
  return pid;
}

export async function openApp(app, port) {
  await execFile('/usr/bin/open', ['-a', app, '--args', '--remote-debugging-address=127.0.0.1', `--remote-debugging-port=${port}`]);
}
