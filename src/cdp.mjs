export function loopbackURL(raw, port, kind, id) {
  const url = new URL(raw);
  const match = /^\/devtools\/(page|browser)\/([\w.-]{1,200})$/.exec(url.pathname);
  if (url.protocol !== 'ws:' || url.hostname !== '127.0.0.1' || Number(url.port) !== port ||
      url.username || url.password || url.search || url.hash || !match ||
      (kind && match[1] !== kind) || (id && match[2] !== id)) {
    throw new Error('Rejected an unexpected debugging endpoint');
  }
  return url.href;
}

export function isAppPage(target, port) {
  if (target?.type !== 'page' || !/^[\w.-]{1,200}$/.test(target.id ?? '')) return false;
  try {
    const url = new URL(target.url);
    // Never inject into the in-app browser, remote websites, or extension views.
    if (url.protocol !== 'app:' || url.hostname !== '-' || url.pathname !== '/index.html') return false;
    loopbackURL(target.webSocketDebuggerUrl, port, 'page', target.id);
    return true;
  } catch { return false; }
}

export async function readJSON(port, route) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
    redirect: 'error', signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error(`Debugging endpoint returned ${response.status}`);
  const body = await response.text();
  if (body.length > 2_000_000) throw new Error('Debugging response is too large');
  return JSON.parse(body);
}

export class CDP {
  constructor(url, { timeout = 5000 } = {}) {
    this.url = url;
    this.timeout = timeout;
    this.pending = new Map();
    this.nextId = 0;
    this.closed = false;
  }
  async open() {
    const ws = this.ws = new WebSocket(this.url);
    ws.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch { this.close(); return; }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    ws.addEventListener('close', () => this.close());
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.close(); reject(new Error('Debug connection timed out')); }, this.timeout);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener('error', () => { clearTimeout(timer); this.close(); reject(new Error('Debug connection failed')); }, { once: true });
    });
    ws.addEventListener('error', () => this.close());
    return this;
  }
  send(method, params = {}) {
    if (this.closed || this.ws?.readyState !== WebSocket.OPEN) return Promise.reject(new Error('Debug connection closed'));
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Debug command timed out (${method})`));
      }, this.timeout);
      this.pending.set(id, { resolve, reject, timer });
      try { this.ws.send(JSON.stringify({ id, method, params })); }
      catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error('The theme could not be evaluated in this window');
    return result.result?.value;
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(new Error('Debug connection closed')); }
    this.pending.clear();
    try { this.ws?.close(); } catch { /* already closed */ }
  }
}
