import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet as story} from '../functions/api/story/[id].js';
import {onRequestGet as news} from '../functions/api/news.js';
import {onRequestGet as status} from '../functions/api/status.js';

test('archive rejects malformed identifiers without database access',async()=>{
 const r=await story({params:{id:'../../danger'},env:{DB:{prepare:()=>{throw Error('unreachable')}}}});
 assert.equal(r.status,400);
});
test('archive returns 404 when an item was not stored',async()=>{
 const env={DB:{prepare:()=>({bind:()=>({first:async()=>null})})}};
 assert.equal((await story({params:{id:'abc123'},env})).status,404);
});
test('archive returns accurate source attribution',async()=>{
 const row={id:'abc123',title:'Sample article',description:'Source excerpt',source:'Example source',url:'https://example.org/story',image:null,category:'World',country:'UG',regional:1,published_at:'2026-10-30T08:00:00Z'};
 const env={DB:{prepare:()=>({bind:()=>({first:async()=>row})})}};
 const r=await story({params:{id:'abc123'},env});const data=await r.json();
 assert.equal(r.status,200);assert.equal(data.article.source,'Example source');assert.equal(data.article.regional,true);
});
test('news endpoint rejects unknown country',async()=>{
 const r=await news({request:new Request('https://example.com/api/news?country=XX'),env:{}});
 assert.equal(r.status,400);
});
test('status fails closed without database',async()=>{
 assert.equal((await status({env:{}})).status,503);
});
test('status returns archive counts without revealing database internals',async()=>{
 const env={DB:{prepare:s=>({first:async()=>s.includes('count(*)')?{total:293}:s.includes('max(checked_at)')?{last_success:'2026-10-30 12:50:30'}:{total:14}})}};
 const r=await status({env});const d=await r.json();
 assert.equal(r.status,200);assert.equal(d.archivedArticles,293);assert.equal(d.collectionScheduleMinutes,10);assert.equal('databaseId' in d,false);
});

test('archive-backed country feed avoids upstream RSS fetches for a fresh D1 snapshot',async()=>{
 const oldCache=globalThis.caches,oldFetch=globalThis.fetch;
 let called=0;
 globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
 globalThis.fetch=async()=>{called++;throw Error('Origin must not be fetched when D1 is fresh')};
 const env={DB:{prepare:q=>({bind:()=>({
  first:async()=>({checked:new Date().toISOString().replace('T',' ').replace('Z','')}),
  all:async()=>({results:[{id:'story123',title:'Verified source headline',description:'Source excerpt',source:'Example',url:'https://example.com/s',image:null,category:'World',country:null,regional:0,published_at:'2026-10-30T10:00:00Z'}]})
 })})}};
 try{const r=await news({request:new Request('https://example.org/api/news?country=UG'),env});const d=await r.json();assert.equal(r.status,200);assert.equal(d.articles.length,1);assert.equal(d.fromArchive,true);assert.equal(called,0)}
 finally{globalThis.caches=oldCache;globalThis.fetch=oldFetch}
});
