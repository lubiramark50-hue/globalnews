import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>readFileSync(new URL('../public/'+n,import.meta.url),'utf8');
test('sitemap contains canonical category and policy URLs but not personal routes',()=>{
 const s=read('sitemap.xml');
 for(const path of ['/world','/technology','/business','/sports','/about','/standards','/sources','/privacy'])assert.ok(s.includes('https://globalnews-a0q.pages.dev'+path+'</loc>'));
 assert.ok(!s.includes('/saved'));assert.ok(!s.includes('/search'));
});
test('robots allows Google to read explicit noindex headers',()=>{
 const r=read('robots.txt');
 assert.match(r,/Sitemap: https:\/\/globalnews-a0q\.pages\.dev\/sitemap\.xml/);
 assert.doesNotMatch(r,/Disallow: \/saved|Disallow: \/search/);
});
test('metadata for category URLs is prepared at response time',()=>{
 const m=readFileSync(new URL('../functions/_middleware.js',import.meta.url),'utf8');
 assert.match(m,/HTMLRewriter/);
 assert.match(m,/X-Robots-Tag/);
 assert.match(m,/noindex, follow/);
 assert.match(m,/link\[rel="canonical"\]/);
});
test('mobile app manifest and navigation remain available',()=>{
 const m=JSON.parse(read('manifest.webmanifest'));
 assert.equal(m.display,'standalone');assert.equal(m.scope,'/');
 const h=read('index.html');assert.match(h,/width=device-width/);assert.match(h,/mobile-dock/);
});
