import test from "node:test";
import assert from "node:assert/strict";
import {enrichGemini} from "../worker/ingest.js";
const mk=(id)=>({id,title:"Council opens local clinic "+id,description:"The council has opened a new clinic serving residents in the town centre, according to its published statement.",source:"Example",url:"https://example.org/"+id});
function env(articles,log,extra={}){return {GEMINI_API_KEY:"fixture-not-real",...extra,DB:{prepare:sql=>({first:async()=>({calls:0}),bind:(...a)=>({all:async()=>{log.push({sql,a,all:true});return{results:articles}},run:async()=>{log.push({sql,a});return{meta:{last_row_id:7,changes:1}}}})})}}}
const ok=text=>({ok:true,status:200,json:async()=>({candidates:[{finishReason:"STOP",content:{parts:[{text}]}}]})});
const good=JSON.stringify({supported:true,summary:"The council has opened a new clinic for residents in the town centre, according to its own statement."});
async function withFetch(fn,run){const old=globalThis.fetch;globalThis.fetch=fn;try{return await run()}finally{globalThis.fetch=old}}
test("markdown-fenced JSON from Gemini is accepted and stored",async()=>{
 const log=[];const r=await withFetch(async()=>ok("```json\n"+good+"\n```"),()=>enrichGemini(env([mk("a")],log)));
 assert.equal(r.processed,1);assert.ok(log.some(l=>l.sql.includes("INSERT OR IGNORE INTO article_summaries")));
});
test("a rejected key (HTTP 400) stops the batch after one call and records the code",async()=>{
 const log=[];let calls=0;
 const r=await withFetch(async()=>{calls++;return{ok:false,status:400}},()=>enrichGemini(env([mk("a"),mk("b")],log)));
 assert.equal(calls,1);assert.equal(r.processed,0);assert.equal(r.stopped,"failed_http_400");
 assert.ok(log.some(l=>l.sql.includes("SET status=?")&&l.a[0]==="failed_http_400"));
});
test("truncated output (MAX_TOKENS) is discarded, never stored",async()=>{
 const log=[];const r=await withFetch(async()=>({ok:true,status:200,json:async()=>({candidates:[{finishReason:"MAX_TOKENS",content:{parts:[{text:good}]}}]})}),()=>enrichGemini(env([mk("a")],log)));
 assert.equal(r.processed,0);assert.ok(!log.some(l=>l.sql.includes("INSERT OR IGNORE INTO article_summaries")));
});
test("model and output budget come from config with safe defaults",async()=>{
 let url="",body=null;const log=[];
 await withFetch(async(u,o)=>{url=u;body=JSON.parse(o.body);return ok(good)},()=>enrichGemini(env([mk("a")],log,{GEMINI_MODEL:"gemini-3.5-flash-lite"})));
 assert.match(url,/models\/gemini-3\.5-flash-lite:generateContent/);assert.ok(body.generationConfig.maxOutputTokens>=1024);
});
test("the SQL row limit bound per run never exceeds the configured cap",async()=>{
 const log=[];await withFetch(async()=>ok(good),()=>enrichGemini(env([mk("a")],log)));
 const q=log.find(l=>l.all);assert.equal(q.a[0],2);
 const log2=[];await withFetch(async()=>ok(good),()=>enrichGemini(env([mk("a")],log2,{GEMINI_PER_RUN:"99"})));
 assert.equal(log2.find(l=>l.all).a[0],6);
});
