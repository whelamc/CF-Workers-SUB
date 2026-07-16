import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadWorker() {
  let code = fs.readFileSync(new URL('./_worker.js', import.meta.url), 'utf8');
  code = code.replace('export default {', 'const __default_export__ = {');
  code += '\n;globalThis.__test__ = { worker: __default_export__, clashConfigToNodeLinks };';

  const context = {
    URL,
    Request,
    Response,
    Headers,
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
    fetch: () => {
      throw new Error('fetch should not be called in converter tests');
    },
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.__test__;
}

const clashSample = `
mixed-port: 7890
proxies:
    - { name: '香港01[直连0.2x]', type: tuic, server: hk01.shanhai.click, port: 18888, uuid: 132b1cdd-8250-4b98-b55e-6ecaa90ecaad, password: 132b1cdd-8250-4b98-b55e-6ecaa90ecaad, alpn: [h3], udp-relay-mode: native, congestion-controller: cubic, skip-cert-verify: false, sni: hk01.shanhai.click }
    - { name: 香港01, type: trojan, server: hk01.shcdn.xyz, port: 11101, password: 132b1cdd-8250-4b98-b55e-6ecaa90ecaad, udp: true, sni: hk01.shanhai.sbs, skip-cert-verify: false }
    - { name: 香港02, type: anytls, server: hk02.shcdn.xyz, port: 21101, password: 132b1cdd-8250-4b98-b55e-6ecaa90ecaad, client-fingerprint: chrome, udp: true, alpn: [h2, http/1.1], sni: hk02.shanhai.sbs, skip-cert-verify: false }
    - { name: SS01, type: ss, server: ss.example.com, port: 8388, cipher: aes-128-gcm, password: p@ss word }
    - { name: VLESS01, type: vless, server: vless.example.com, port: 443, uuid: 00000000-0000-0000-0000-000000000001, tls: true, network: ws, servername: cdn.example.com, client-fingerprint: chrome, ws-opts: { path: /ws, headers: { Host: cdn.example.com } } }
    - { name: HY201, type: hysteria2, server: hy2.example.com, port: 8443, password: hy-pass, sni: hy2.example.com, skip-cert-verify: true }
    - name: VMESS01
      type: vmess
      server: vmess.example.com
      port: 443
      uuid: 00000000-0000-0000-0000-000000000002
      alterId: 0
      cipher: auto
      tls: true
      network: ws
      servername: v.example.com
      ws-opts:
        path: /ray
        headers:
          Host: v.example.com
proxy-groups:
    - { name: 自动选择, type: url-test, proxies: [香港01] }
`;

test('clashConfigToNodeLinks converts inline Clash proxies into share links', () => {
  const { clashConfigToNodeLinks } = loadWorker();

  const links = clashConfigToNodeLinks(clashSample);

  assert.equal(links.length, 7);
  assert.match(links[0], /^tuic:\/\/132b1cdd-8250-4b98-b55e-6ecaa90ecaad:/);
  assert.match(links[0], /#%E9%A6%99%E6%B8%AF01%5B%E7%9B%B4%E8%BF%9E0\.2x%5D$/);
  assert.match(links[1], /^trojan:\/\/132b1cdd-8250-4b98-b55e-6ecaa90ecaad@hk01\.shcdn\.xyz:11101\?/);
  assert.match(links[2], /^anytls:\/\/132b1cdd-8250-4b98-b55e-6ecaa90ecaad@hk02\.shcdn\.xyz:21101\?/);
  assert.match(links[3], /^ss:\/\/YWVzLTEyOC1nY206cEBzcyB3b3Jk@ss\.example\.com:8388#SS01$/);
  assert.match(links[4], /^vless:\/\/00000000-0000-0000-0000-000000000001@vless\.example\.com:443\?/);
  assert.match(links[4], /type=ws/);
  assert.match(links[4], /host=cdn\.example\.com/);
  assert.match(links[4], /path=%2Fws/);
  assert.match(links[5], /^hy2:\/\/hy-pass@hy2\.example\.com:8443\?/);
  assert.match(links[6], /^vmess:\/\//);
});

test('authorized convert endpoint returns extracted node links', async () => {
  const { worker } = loadWorker();

  const response = await worker.fetch(new Request('https://sub.example.com/auto?convert=1', {
    method: 'POST',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    body: clashSample
  }), {
    TOKEN: 'auto'
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.count, 7);
  assert.match(body.nodes, /^tuic:\/\//);
  assert.match(body.nodes, /\ntrojan:\/\//);
  assert.match(body.nodes, /\nanytls:\/\//);
  assert.match(body.nodes, /\nss:\/\//);
  assert.match(body.nodes, /\nvless:\/\//);
  assert.match(body.nodes, /\nhy2:\/\//);
  assert.match(body.nodes, /\nvmess:\/\//);
});
