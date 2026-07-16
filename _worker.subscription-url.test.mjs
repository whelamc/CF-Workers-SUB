import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadWorker(fetchImpl) {
  let code = fs.readFileSync(new URL('./_worker.js', import.meta.url), 'utf8');
  code = code.replace('export default {', 'const __default_export__ = {');
  code += '\n;globalThis.__test__ = { worker: __default_export__ };';

  const context = {
    URL,
    Request,
    Response,
    Headers,
    AbortController,
    setTimeout,
    clearTimeout,
    TextEncoder,
    TextDecoder,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    crypto: {
      subtle: {
        async digest(algorithm, data) {
          assert.equal(algorithm, 'MD5');
          return createHash('md5').update(Buffer.from(data)).digest();
        }
      }
    },
    fetch: fetchImpl,
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.__test__.worker;
}

test('fetched clash subscriptions are materialized instead of passing IP upstream URL to subconverter', async () => {
  let converterRequestUrl;
  const worker = loadWorker(async (request) => {
    const requestUrl = String(request.url || request);
    if (requestUrl === 'https://192.0.2.22/sub') {
      return new Response(`proxies:
- name: upstream
  type: vless
  server: example.com
  port: 443
`, { status: 200 });
    }

    converterRequestUrl = requestUrl;
    return new Response('converter unavailable', { status: 502 });
  });

  await worker.fetch(new Request('https://sub.example.com/auto?clash', {
    headers: { 'User-Agent': 'Clash.Meta' }
  }), {
    TOKEN: 'auto',
    LINK: 'https://192.0.2.22/sub'
  });

  const converterUrl = new URL(converterRequestUrl);
  const converterInput = decodeURIComponent(converterUrl.searchParams.get('url'));

  assert.match(converterInput, /^https:\/\/sub\.example\.com\//);
  assert.doesNotMatch(converterInput, /192\.0\.2\.22/);
});
