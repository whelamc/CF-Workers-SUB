import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClashFix() {
  let code = fs.readFileSync(new URL('./_worker.js', import.meta.url), 'utf8');
  code = code.replace('export default {', 'const __default_export__ = {');
  code += '\n;globalThis.__test__ = { clashFix };';

  const context = {
    URL,
    TextEncoder,
    TextDecoder,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    crypto: globalThis.crypto,
    fetch: () => {
      throw new Error('fetch should not be called in tests');
    },
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.__test__.clashFix;
}

function assertAnytlsRequiredFields(output) {
  assert.match(output, /^\s*client-fingerprint:\s*chrome\s*$/m);
  assert.match(output, /^\s*udp:\s*true\s*$/m);
  assert.match(output, /^\s*alpn:\s*$/m);
  assert.match(output, /^\s*-\s*h2\s*$/m);
  assert.match(output, /^\s*-\s*http\/1\.1\s*$/m);
  assert.match(output, /^\s*skip-cert-verify:\s*false\s*$/m);
}

test('clashFix adds anytls required fields for block style proxy', () => {
  const clashFix = loadClashFix();
  const input = `proxies:
- name: "n1"
  type: anytls
  server: s.example.com
  port: 443
  password: "p"
  fingerprint: chrome
  sni: s.example.com
`;

  const output = clashFix(input);
  assertAnytlsRequiredFields(output);
});

test('clashFix adds anytls required fields for inline map proxy', () => {
  const clashFix = loadClashFix();
  const input = `proxies:
  - {name: "n1", type: anytls, server: s.example.com, port: 443, password: "p", fingerprint: chrome, sni: s.example.com}
`;

  const output = clashFix(input);
  assertAnytlsRequiredFields(output);
});
