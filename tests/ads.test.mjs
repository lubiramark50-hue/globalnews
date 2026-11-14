import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const c=read('ads-config.js'), l=read('ads.js');
test('borrowed identifiers are never enabled for GlobalNews',()=>{
 const scope={window:{}}; vm.runInNewContext(c,scope);
 assert.equal(scope.window.GlobalNewsAdConfig.enabled,false);
 assert.equal(scope.window.GlobalNewsAdConfig.domainApproved,false);
 assert.equal(scope.window.GlobalNewsAdConfig.approvedHost,'globalnews-a0q.pages.dev');
 assert.doesNotMatch(c,/trootwindow\.rentpay\.site|bauval\.org|319633\d+/);
 for(const k of ['native','banner','rectangle']) assert.equal(scope.window.GlobalNewsAdConfig[k].source,'');
});
test('loader stops before touching DOM for wrong host or unapproved site',()=>{
 for(const [enabled,approved,hostname] of [[false,true,'globalnews-a0q.pages.dev'],[true,false,'globalnews-a0q.pages.dev'],[true,true,'other.example']]){
   assert.doesNotThrow(()=>vm.runInNewContext(l,{window:{GlobalNewsAdConfig:{enabled,domainApproved:approved,approvedHost:'globalnews-a0q.pages.dev'}},location:{hostname}}));
 }
});
test('native ad does not depend on banner being configured',()=>{
 let bound=false;
 const ctx={URL,window:{GlobalNewsAdConfig:{enabled:true,domainApproved:true,approvedHost:'globalnews-a0q.pages.dev',native:{containerId:'native_12345678',source:'https://ads.example.com/native'}},addEventListener(){}},location:{hostname:'globalnews-a0q.pages.dev'},document:{readyState:'loading',addEventListener(){bound=true}},matchMedia(){return {matches:false}}};
 vm.runInNewContext(l,ctx);
 assert.equal(bound,true);
});
test('creative detection, sandbox and sponsored disclosure are present',()=>{
 assert.match(l,/globalnews:ad-filled/);
 assert.match(l,/allow-scripts allow-popups/);
 assert.doesNotMatch(l,/allow-top-navigation|window\.open\(|document\.write\(/);
 const a=read('app.js');
 assert.match(a,/ad-disclosure/);
 assert.match(a,/adSlot\('rectangle'\)/);
 const bridge=read('ad-frame.js');
 assert.match(bridge,/window\.parent\.postMessage/);
});
