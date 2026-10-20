import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { CDP, readJSON } from '../src/cdp.mjs';

// A small protocol peer tests the real Node WebSocket client without a browser,
// external dependencies, a Codex login, or access to any user's messages.
function frame(value) {
  const data = Buffer.from(JSON.stringify(value));
  if (data.length < 126) return Buffer.concat([Buffer.from([0x81, data.length]), data]);
  const header = Buffer.alloc(4); header[0] = 0x81; header[1] = 126; header.writeUInt16BE(data.length, 2);
  return Buffer.concat([header, data]);
}
async function peer(t, handler) {
  const sockets = new Set();
  const server = createServer((req, res) => {
    if (req.url === '/redirect') { res.writeHead(302, { Location: '/ok' }); res.end(); return; }
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ready: true }));
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  server.on('upgrade', (req, socket) => {
    const accept = createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    let buffer = Buffer.alloc(0);
    socket.on('data', data => {
      buffer = Buffer.concat([buffer, data]);
      while (buffer.length >= 2) {
        const opcode = buffer[0] & 15;
        const masked = !!(buffer[1] & 128);
        let size = buffer[1] & 127, offset = 2;
        if (size === 126) { if (buffer.length < 4) return; size = buffer.readUInt16BE(2); offset = 4; }
        if (size === 127) { socket.destroy(); return; }
        const payloadOffset = offset + (masked ? 4 : 0);
        if (buffer.length < payloadOffset + size) return;
        const payload = Buffer.from(buffer.subarray(payloadOffset, payloadOffset + size));
        if (masked) for (let i = 0; i < size; i++) payload[i] ^= buffer[offset + i % 4];
        buffer = buffer.subarray(payloadOffset + size);
        if (opcode === 8) { socket.end(Buffer.from([0x88, 0])); return; }
        if (opcode === 1) handler(JSON.parse(payload.toString()), socket);
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); });
  return server.address().port;
}

test('CDP correlates out-of-order replies and propagates errors', async t => {
  const port = await peer(t, (message, socket) => {
    if (message.method === 'bad') socket.write(frame({ id: message.id, error: { message: 'Protocol failure' } }));
    else setTimeout(() => socket.write(frame({ id: message.id, result: { method: message.method } })), message.method === 'first' ? 30 : 1);
  });
  const client = await new CDP(`ws://127.0.0.1:${port}/devtools/page/a`).open();
  t.after(() => client.close());
  const [first, second] = await Promise.all([client.send('first'), client.send('second')]);
  assert.equal(first.method, 'first'); assert.equal(second.method, 'second');
  await assert.rejects(client.send('bad'), /Protocol failure/);
});

test('CDP reports evaluation exceptions and closes pending requests', async t => {
  const port = await peer(t, (message, socket) => {
    if (message.method === 'Runtime.evaluate') socket.write(frame({ id: message.id, result: { exceptionDetails: { text: 'error' } } }));
  });
  const client = await new CDP(`ws://127.0.0.1:${port}/devtools/page/a`, { timeout: 150 }).open();
  t.after(() => client.close());
  await assert.rejects(client.evaluate('throw 1'), /could not be evaluated/);
  await assert.rejects(client.send('silent'), /timed out/);
  const pending = client.send('pending'); client.close();
  await assert.rejects(pending, /closed/);
  assert.equal(client.pending.size, 0);
});

test('HTTP debugging discovery refuses redirects', async t => {
  const port = await peer(t, () => {});
  assert.deepEqual(await readJSON(port, '/ok'), { ready: true });
  await assert.rejects(readJSON(port, '/redirect'));
});
