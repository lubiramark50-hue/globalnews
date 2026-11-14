import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = path => readFileSync(new URL('../public/' + path, import.meta.url), 'utf8');
const configCode = read('ads-config.js');
const loaderCode = read('ads.js');

test('only GlobalNews-specific approved ad codes may be activated', () => {
  const context = { window: {} };
  vm.runInNewContext(configCode, context);
  const config = context.window.GlobalNewsAdConfig;
  assert.equal(config.enabled, false);
  assert.equal(config.approvedHost, 'globalnews-a0q.pages.dev');
  assert.equal(config.banner.key, '');
  assert.equal(config.banner.source, '');
  assert.equal(config.native.containerId, '');
  assert.equal(config.native.source, '');
  assert.doesNotMatch(configCode, /trootwindow\.rentpay\.site|bauval\.org|319633\d+/);
});

test('script does not access the DOM when disabled or on an unapproved host', () => {
  for (const [enabled, hostname] of [[false, 'globalnews-a0q.pages.dev'], [true, 'elsewhere.example']]) {
    const context = {
      window: {GlobalNewsAdConfig: {enabled, approvedHost: 'globalnews-a0q.pages.dev'}},
      location: { hostname }
    };
    assert.doesNotThrow(() => vm.runInNewContext(loaderCode, context));
  }
});

test('news pages provide clearly marked advertising slots and no automatic ad redirects', () => {
  const app = read('app.js');
  const index = read('index.html');
  assert.match(app, /data-ad-unit/);
  assert.match(app, /ad-disclosure/);
  assert.ok(index.indexOf('/ads-config.js') < index.indexOf('/ads.js'));
  assert.doesNotMatch(loaderCode, /window\.open\(|location\.(?:assign|replace)|document\.write\(/);
});
